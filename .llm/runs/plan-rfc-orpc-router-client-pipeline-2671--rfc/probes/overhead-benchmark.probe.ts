/**
 * RFC A Empirical Probe 1 — Warm, apples-to-apples call overhead comparison:
 *   1. HTTP loopback (`Deno.serve` + `RPCLink` via `createServiceClient`)
 *   2. Fetch-link in-process (`RPCLink` custom `fetch` into `ServiceApp.fetch` with ALS/ROOT_CONTEXT detachment, per #2659)
 *   3. `createRouterClient` (default authenticating path — minimal pipeline)
 *   4. `createRouterClient` (default authenticating path — design-complete: root-detached ALS snapshot,
 *      OTel context interceptor, tracing/error/logging procedure interceptors, per-call requestId,
 *      scoped VerifiedPrincipalRecord minting, contract authz, SHA-256 audit, MemoryRateLimitStore)
 *   5. `createRouterClient` (off-by-default trusted-principal delegation mode, with full scoped brand check)
 *
 * Uses 2,000 warm-up iterations and 5,000 measured iterations to eliminate JIT warm-up artefacts.
 * Note: Uses an in-memory static credential authenticator; real cryptographic JWT/OIDC verification
 * or network session lookups add fixed work to all authenticating modes and shrink relative ratios toward 1x.
 *
 * Runs against locked `@orpc/*@1.15.5` packages with `--frozen` and zero edits to framework source.
 *
 * Usage:
 *   mise exec -- deno run --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/overhead-benchmark.probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { context as otelContext, ROOT_CONTEXT, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { createORPCClient, ORPCError } from 'npm:@orpc/client@^1.15.5';
import { RPCLink } from 'npm:@orpc/client@^1.15.5/fetch';
import { createRouterClient, implement, os } from 'npm:@orpc/server@^1.15.5';
import { baseContract } from '@netscript/contracts';
import { createService } from '@netscript/service';
import {
  createContractAuthorizer,
  createStaticCredentialAuthenticator,
  type AuthenticatorPort,
  type AuthnRequest,
  type Principal,
} from '@netscript/service/auth';
import { createMemoryRateLimitStore, type RateLimitDecision } from '@netscript/service/rate-limit';
import { createServiceClient } from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { extractContext, withContext } from '@netscript/telemetry/context';
import { z } from 'npm:zod@^4.6.5';

// N5: Shared composition-root capture guard (aligned with PR #2659's global probe symbol).
const ACTIVE_STORE_PROBES_SYMBOL = Symbol.for('@netscript/async-context/active-store-probes');
interface ActiveAsyncStoreProbe {
  readonly name: string;
  readonly isActive: () => boolean;
}
function captureCleanAsyncRootOrThrow(): <T>(fn: () => T) => T {
  const probes = (globalThis as Record<symbol, Set<ActiveAsyncStoreProbe> | undefined>)[
    ACTIVE_STORE_PROBES_SYMBOL
  ];
  if (probes) {
    for (const probe of probes) {
      if (probe.isActive()) {
        throw new Error(`[netscript.service] Active ALS store (${probe.name}) during root snapshot capture.`);
      }
    }
  }
  if (trace.getActiveSpan() !== undefined || otelContext.active() !== ROOT_CONTEXT) {
    throw new Error('[netscript.service] Active OpenTelemetry context during root snapshot capture.');
  }
  return AsyncLocalStorage.snapshot();
}

// Captured via guarded composition-root helper before any request executes.
const cleanAlsSnapshot = captureCleanAsyncRootOrThrow();

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'archived']),
  amountMinor: z.number().int(),
  tags: z.array(z.string()),
});

const BenchContract = {
  getSmall: baseContract
    .route({ method: 'POST', path: '/bench/get-small' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['bench:read'] },
      },
    })
    .input(z.object({ id: z.string() }))
    .output(ItemSchema),
  listMedium: baseContract
    .route({ method: 'POST', path: '/bench/list-medium' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['bench:read'] },
      },
    })
    .input(z.object({ count: z.number().int().min(1).max(200) }))
    .output(z.object({ items: z.array(ItemSchema), total: z.number().int() })),
};

const MEDIUM_ITEMS = Array.from({ length: 100 }, (_, i) => ({
  id: `item_${String(i).padStart(4, '0')}`,
  name: `Diagnostic Service Record #${i}`,
  status: (i % 2 === 0 ? 'active' : 'archived') as 'active' | 'archived',
  amountMinor: 1000 + i * 25,
  tags: ['bench', 'v1', `group-${i % 5}`],
}));

interface VerifiedPrincipalRecord {
  readonly serviceId: symbol;
  readonly serviceName: string;
  readonly authenticator: AuthenticatorPort;
  readonly expiresAtMs: number;
  readonly active: () => boolean;
}

const VERIFIED_PRINCIPALS = new WeakMap<Principal, VerifiedPrincipalRecord>();
const BENCH_SERVICE_ID = Symbol('service:bench');

interface BenchContext {
  readonly principal?: Principal;
  readonly headers?: Readonly<Record<string, string>>;
  readonly requestId?: string;
}

const impl = implement(BenchContract).$context<BenchContext>();

const baseRouter = impl.router({
  getSmall: impl.getSmall.handler(({ input, context }) => ({
    id: input.id,
    name: `Item for ${context.principal?.subject ?? 'anon'}`,
    status: 'active' as const,
    amountMinor: 4200,
    tags: ['bench', 'small'],
  })),
  listMedium: impl.listMedium.handler(({ input }) => ({
    items: MEDIUM_ITEMS.slice(0, input.count),
    total: input.count,
  })),
});

const authenticator = createStaticCredentialAuthenticator({
  scheme: 'bearer',
  credentials: {
    'bench-token': {
      subject: 'user:bench-1',
      scopes: ['bench:read'],
      roles: ['reader'],
      claims: { tenantId: 'tenant-bench' },
    },
  },
});

// N2: Disjoint rate-limit stores for HTTP edge vs procedure pipeline (RFC 0008 single-policy invariant).
const httpRateLimitStore = createMemoryRateLimitStore();
const procedureRateLimitStore = createMemoryRateLimitStore();
const HUGE_LIMIT = 10_000_000;
(procedureRateLimitStore as { validate?: (cfg: { limit: number; windowMs: number }) => void }).validate?.({
  limit: HUGE_LIMIT,
  windowMs: 60_000,
});

// Silent logger injected into BOTH Hono apps AND router-client pipelines so terminal I/O
// never skews latency while preserving identical SHA-256 subject hashing & audit work.
const silentLogger = {
  debug: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
  fatal: (..._args: unknown[]) => {},
  getChild: () => silentLogger,
  with: () => silentLogger,
};

async function hashSubject(subject: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(subject));
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function headersToAuthnRequest(
  headers: Readonly<Record<string, string>>,
  procedurePath: readonly string[],
): AuthnRequest {
  const normalized = new Headers();
  for (const [k, v] of Object.entries(headers)) normalized.set(k, v);
  return {
    method: 'IN_PROCESS',
    path: `orpc://bench/${procedurePath.join('.')}`,
    header: (name) => normalized.get(name) ?? undefined,
    headers: () => new Headers(normalized),
    cookie: () => undefined,
  };
}

function isTrustedForBench(principal: Principal | undefined): boolean {
  if (!principal) return false;
  const rec = VERIFIED_PRINCIPALS.get(principal);
  if (!rec) return false;
  return rec.serviceId === BENCH_SERVICE_ID && rec.active() && Date.now() < rec.expiresAtMs;
}

// 1. Mount HTTP + Fetch-link ServiceApp (exact current NetScript Hono stack, console sink silenced)
const mountedRouter = { v1: { bench: baseRouter } };
const mountedContract = { v1: { bench: BenchContract } };

const injectSilentLogger = async (
  c: { set: (k: string, v: unknown) => void },
  next: () => Promise<void>,
) => {
  c.set('logger', silentLogger);
  await next();
};

const serviceApp = createService(mountedRouter, { name: 'bench' })
  .use(injectSilentLogger as never)
  .withRateLimit({
    routes: ['/api/*'],
    limit: HUGE_LIMIT,
    windowMs: 60_000,
    store: httpRateLimitStore,
    key: (c) => c.req.header('authorization') ?? 'anon',
  })
  .withAuthn({ authenticator })
  .withAuthz({ authorizer: createContractAuthorizer(mountedContract) })
  .withRPC({ rpcPath: '/api/rpc', traceContext: true })
  .build();

const running = await createService(mountedRouter, { name: 'bench-http' })
  .use(injectSilentLogger as never)
  .withRateLimit({
    routes: ['/api/*'],
    limit: HUGE_LIMIT,
    windowMs: 60_000,
    store: httpRateLimitStore,
    key: (c) => c.req.header('authorization') ?? 'anon',
  })
  .withAuthn({ authenticator })
  .withAuthz({ authorizer: createContractAuthorizer(mountedContract) })
  .withRPC({ rpcPath: '/api/rpc', traceContext: true })
  .serve({ hostname: '127.0.0.1', port: 0, handleSignals: false });

// 2. Build HTTP client (NetScript SDK + RFC 0001 bearer contribution)
const bearer = createBearerSdkClientContribution<{ readonly token: string }>({
  context: { token: 'required' },
  resolveCredential: ({ context }) => context.token,
  responseCache: { mode: 'partitioned', partition: ({ context }) => context.token },
});

const httpClient = createServiceClient({
  contract: BenchContract,
  serviceName: 'bench-http',
  routerName: 'bench',
  resolveServiceUrl: () => `http://127.0.0.1:${running.addr.port}`,
  contributions: [bearer] as const,
});

// 3. Build Fetch-link in-process client (#2659 model: RPCLink + detached app.fetch)
const inProcessFetchLink = new RPCLink<{ readonly token: string }>({
  url: 'https://bench.in-process.localhost/api/rpc/v1/bench',
  headers: ({ context }) => ({
    authorization: `Bearer ${context.token}`,
    'content-type': 'application/json',
  }),
  fetch: (request, init) => {
    const req = new Request(request, init);
    return cleanAlsSnapshot(() =>
      withContext(extractContext({}), () => Promise.resolve(serviceApp.fetch(req)))
    );
  },
});
const fetchLinkClient = createORPCClient(inProcessFetchLink) as unknown as typeof httpClient;

// 4. Build oRPC-native procedure pipeline router (with scoped brand verification + deny-by-default)
const procedurePipelineRouter = os
  .$context<BenchContext>()
  .use(async ({ context, path, procedure, next }) => {
    const access = (procedure['~orpc'].meta as {
      readonly access?: {
        readonly authentication?: 'none' | 'required';
        readonly authorization?: { readonly scopes?: readonly string[]; readonly roles?: readonly string[] };
      };
    })?.access;

    if (!access) {
      throw new ORPCError('FORBIDDEN', { status: 403, message: 'authz.no-matching-rule' });
    }

    let principal: Principal | undefined;
    if (access.authentication !== 'none') {
      if (isTrustedForBench(context.principal) && context.principal) {
        principal = context.principal;
      } else {
        const authResult = await authenticator.authenticate(
          headersToAuthnRequest(context.headers ?? {}, path),
        );
        if (!authResult.ok) {
          throw new ORPCError('UNAUTHORIZED', { status: 401, message: authResult.reason });
        }
        principal = authResult.principal;
      }

      for (const scope of access.authorization?.scopes ?? []) {
        if (!principal.scopes.includes(scope)) {
          throw new ORPCError('FORBIDDEN', { status: 403, message: `authz.missing-scope:${scope}` });
        }
      }
      for (const role of access.authorization?.roles ?? []) {
        if (!principal.roles.includes(role)) {
          throw new ORPCError('FORBIDDEN', { status: 403, message: `authz.missing-role:${role}` });
        }
      }
      // Match Hono auth middleware's SHA-256 subject-hash audit work
      const subjectHash = await hashSubject(principal.subject);
      silentLogger.info('auth decision allow', { stage: 'authz', subjectHash, procedure: path.join('.') });
    }

    const decision = await procedureRateLimitStore.consume({
      key: principal ? `${principal.subject}:${path.join('.')}` : `anon:${path.join('.')}`,
      limit: HUGE_LIMIT,
      windowMs: 60_000,
      now: Date.now(),
    }) as RateLimitDecision & { readonly retryAt?: number };
    if (!decision.allowed) {
      const retryTarget = decision.retryAt ?? decision.resetAt;
      throw new ORPCError('RATE_LIMITED', {
        status: 429,
        message: 'Too many requests',
        data: { retryAfter: Math.max(1, Math.ceil((retryTarget - Date.now()) / 1000)), limit: HUGE_LIMIT },
      });
    }

    return await next({ context: { principal } });
  })
  .router(baseRouter);

// 4a. Default authenticating router client (baseline)
const routerClientAuth = createRouterClient(procedurePipelineRouter, {
  context: (clientCtx: { readonly token: string }): BenchContext => ({
    headers: { authorization: `Bearer ${clientCtx.token}` },
    requestId: 'req-bench',
  }),
});

// 4b. Design-complete authenticating router client (includes every RFC A interceptor:
//     root ALS snapshot + OTel context detachment + per-call requestId + logging + error + tracing interceptors)
const routerClientDesignComplete = createRouterClient(procedurePipelineRouter, {
  context: (clientCtx: { readonly token: string }): BenchContext => ({
    headers: { authorization: `Bearer ${clientCtx.token}` },
    requestId: crypto.randomUUID().slice(0, 8),
  }),
  interceptors: [
    // Root ALS snapshot + OTel context detachment
    (options) =>
      cleanAlsSnapshot(() => withContext(extractContext({}), () => options.next())),
    // Procedure logging interceptor (unified requestId)
    async (options) => {
      const t0 = performance.now();
      const proc = options.path.join('.');
      silentLogger.debug('RPC procedure started', { proc, requestId: options.context.requestId });
      const res = await options.next();
      silentLogger.debug('RPC procedure completed', { proc, duration: Math.round(performance.now() - t0) });
      return res;
    },
    // Procedure error-boundary / tracing interceptor
    async (options) => {
      try {
        return await options.next();
      } catch (err) {
        silentLogger.warn('RPC procedure failed', { err });
        throw err;
      }
    },
  ],
});

// 4c. Off-by-default trusted-principal delegation mode (with full scoped WeakMap brand check)
const verifiedPrincipal: Principal = Object.freeze({
  subject: 'user:bench-1',
  scopes: ['bench:read'],
  roles: ['reader'],
  scheme: 'bearer',
  claims: { tenantId: 'tenant-bench' },
});
VERIFIED_PRINCIPALS.set(verifiedPrincipal, {
  serviceId: BENCH_SERVICE_ID,
  serviceName: 'bench',
  authenticator,
  expiresAtMs: Date.now() + 60_000,
  active: () => true,
});
const routerClientTrustedPrincipal = createRouterClient(procedurePipelineRouter, {
  context: (): BenchContext => ({
    principal: verifiedPrincipal,
    requestId: crypto.randomUUID().slice(0, 8),
  }),
  interceptors: [
    (options) =>
      cleanAlsSnapshot(() => withContext(extractContext({}), () => options.next())),
  ],
});

interface Stats {
  readonly mode: string;
  readonly scenario: string;
  readonly warmup: number;
  readonly iterations: number;
  readonly totalMs: number;
  readonly meanUs: number;
  readonly p50Us: number;
  readonly p95Us: number;
  readonly p99Us: number;
  readonly opsPerSec: number;
}

async function bench(
  mode: string,
  scenario: string,
  warmup: number,
  iterations: number,
  fn: () => Promise<unknown>,
): Promise<Stats> {
  for (let i = 0; i < warmup; i++) await fn();
  const samples = new Float64Array(iterations);
  const startTotal = performance.now();
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await fn();
    samples[i] = (performance.now() - t0) * 1000;
  }
  const totalMs = performance.now() - startTotal;
  const sorted = Float64Array.from(samples).sort();
  const q = (p: number) => sorted[Math.min(iterations - 1, Math.floor(iterations * p))];
  const meanUs = (totalMs * 1000) / iterations;
  return {
    mode,
    scenario,
    warmup,
    iterations,
    totalMs: Number(totalMs.toFixed(2)),
    meanUs: Number(meanUs.toFixed(1)),
    p50Us: Number(q(0.50).toFixed(1)),
    p95Us: Number(q(0.95).toFixed(1)),
    p99Us: Number(q(0.99).toFixed(1)),
    opsPerSec: Math.round((iterations / totalMs) * 1000),
  };
}

async function benchConcurrent(
  mode: string,
  scenario: string,
  concurrency: number,
  rounds: number,
  fn: () => Promise<unknown>,
): Promise<{ readonly mode: string; readonly scenario: string; readonly totalCalls: number; readonly totalMs: number; readonly opsPerSec: number }> {
  for (let w = 0; w < 5; w++) {
    await Promise.all(Array.from({ length: concurrency }, () => fn()));
  }
  const t0 = performance.now();
  for (let r = 0; r < rounds; r++) {
    await Promise.all(Array.from({ length: concurrency }, () => fn()));
  }
  const totalMs = performance.now() - t0;
  const totalCalls = concurrency * rounds;
  return {
    mode,
    scenario,
    totalCalls,
    totalMs: Number(totalMs.toFixed(2)),
    opsPerSec: Math.round((totalCalls / totalMs) * 1000),
  };
}

try {
  // Warm benchmark parameters: 2,000 warmup / 5,000 measured (eliminates cold-JIT artefacts)
  const WARMUP = 2_000;
  const ITERS = 5_000;
  const results: Stats[] = [];

  // Small unary payload (~100 B)
  results.push(
    await bench('http-loopback', 'small-unary', WARMUP, ITERS, () =>
      httpClient.getSmall({ id: 'ord_1' }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('fetch-link-in-process', 'small-unary', WARMUP, ITERS, () =>
      fetchLinkClient.getSmall({ id: 'ord_1' }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-authenticating', 'small-unary', WARMUP, ITERS, () =>
      routerClientAuth.getSmall({ id: 'ord_1' }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-design-complete', 'small-unary', WARMUP, ITERS, () =>
      routerClientDesignComplete.getSmall({ id: 'ord_1' }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-trusted-principal-opt-in', 'small-unary', WARMUP, ITERS, () =>
      routerClientTrustedPrincipal.getSmall({ id: 'ord_1' })),
  );

  // Medium list payload (~12.8 KiB JSON, 100 items)
  results.push(
    await bench('http-loopback', 'medium-100-items', WARMUP, ITERS, () =>
      httpClient.listMedium({ count: 100 }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('fetch-link-in-process', 'medium-100-items', WARMUP, ITERS, () =>
      fetchLinkClient.listMedium({ count: 100 }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-authenticating', 'medium-100-items', WARMUP, ITERS, () =>
      routerClientAuth.listMedium({ count: 100 }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-design-complete', 'medium-100-items', WARMUP, ITERS, () =>
      routerClientDesignComplete.listMedium({ count: 100 }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-trusted-principal-opt-in', 'medium-100-items', WARMUP, ITERS, () =>
      routerClientTrustedPrincipal.listMedium({ count: 100 })),
  );

  // Concurrent burst (20 concurrent calls x 50 rounds = 1,000 calls)
  const concurrentResults = [
    await benchConcurrent('http-loopback', 'small-20x50-concurrent', 20, 50, () =>
      httpClient.getSmall({ id: 'ord_c' }, { context: { token: 'bench-token' } })),
    await benchConcurrent('fetch-link-in-process', 'small-20x50-concurrent', 20, 50, () =>
      fetchLinkClient.getSmall({ id: 'ord_c' }, { context: { token: 'bench-token' } })),
    await benchConcurrent('router-client-authenticating', 'small-20x50-concurrent', 20, 50, () =>
      routerClientAuth.getSmall({ id: 'ord_c' }, { context: { token: 'bench-token' } })),
    await benchConcurrent('router-client-design-complete', 'small-20x50-concurrent', 20, 50, () =>
      routerClientDesignComplete.getSmall({ id: 'ord_c' }, { context: { token: 'bench-token' } })),
    await benchConcurrent('router-client-trusted-principal-opt-in', 'small-20x50-concurrent', 20, 50, () =>
      routerClientTrustedPrincipal.getSmall({ id: 'ord_c' })),
  ];

  const sampleMediumBytes = new TextEncoder().encode(
    JSON.stringify({ json: { items: MEDIUM_ITEMS, total: 100 } }),
  ).byteLength;

  // Write JSON cleanly to stdout via Deno.stdout so it separates from any stderr diagnostics.
  const payload = JSON.stringify(
    {
      runtime: `Deno ${Deno.version.deno}`,
      orpcVersion: '1.15.5 (locked)',
      warmupIterations: WARMUP,
      measuredIterations: ITERS,
      mediumPayloadJsonBytes: sampleMediumBytes,
      qualification: 'In-memory static authenticator; real cryptographic/network authenticators add fixed cost to all authenticating modes and shrink relative speedup ratios toward 1x.',
      sequential: results,
      concurrent: concurrentResults,
    },
    null,
    2,
  );
  await Deno.stdout.write(new TextEncoder().encode(`${payload}\n`));
} finally {
  await running.stop();
}
