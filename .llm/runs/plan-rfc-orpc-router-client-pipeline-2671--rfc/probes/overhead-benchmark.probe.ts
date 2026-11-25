/**
 * RFC A Empirical Probe 1 — Call overhead comparison:
 *   1. HTTP loopback (`Deno.serve` + `RPCLink` via `createServiceClient`)
 *   2. Fetch-link in-process (`RPCLink` custom `fetch` into `ServiceApp.fetch` with ALS/ROOT_CONTEXT detachment, per #2659)
 *   3. `createRouterClient` (oRPC-native procedure pipeline: authn + contract authz + logical rate limit + tracing + logging)
 *
 * Runs against locked `@orpc/*@1.15.5` packages with `--frozen` and zero edits to framework source.
 *
 * Usage:
 *   mise exec -- deno run --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/overhead-benchmark.probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { createORPCClient, ORPCError } from 'npm:@orpc/client@^1.15.5';
import { RPCLink } from 'npm:@orpc/client@^1.15.5/fetch';
import { createRouterClient, implement, os } from 'npm:@orpc/server@^1.15.5';
import { baseContract } from '@netscript/contracts';
import { createService } from '@netscript/service';
import {
  createContractAuthorizer,
  createStaticCredentialAuthenticator,
  type AuthnRequest,
  type Principal,
} from '@netscript/service/auth';
import {
  createMemoryRateLimitStore,
} from '@netscript/service/rate-limit';
import { createServiceClient } from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { extractContext, withContext } from '@netscript/telemetry/context';
import { z } from 'npm:zod@^4.6.5';

const cleanAlsSnapshot = AsyncLocalStorage.snapshot();

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

const rateLimitStore = createMemoryRateLimitStore();
const HUGE_LIMIT = 1_000_000;

// Silent logger injected into BOTH Hono apps AND the router-client pipeline so terminal stderr I/O
// never distorts transport latency, while preserving identical SHA-256 subject hashing & audit work.
const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
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
    method: 'POST',
    path: `/api/rpc/v1/bench/${procedurePath.join('/')}`,
    header: (name) => normalized.get(name) ?? undefined,
    headers: () => new Headers(normalized),
    cookie: () => undefined,
  };
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
    store: rateLimitStore,
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
    store: rateLimitStore,
    key: (c) => c.req.header('authorization') ?? 'anon',
  })
  .withAuthn({ authenticator })
  .withAuthz({ authorizer: createContractAuthorizer(mountedContract) })
  .withRPC({ rpcPath: '/api/rpc', traceContext: true })
  .serve({ hostname: '127.0.0.1', port: 0, handleSignals: false });

// 2. Build HTTP client (using NetScript SDK + RFC 0001 bearer contribution)
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

// 3. Build Fetch-link in-process client (modeling #2659's RPCLink + detached app.fetch)
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
const fetchLinkClient = createORPCClient(inProcessFetchLink) as typeof httpClient;

// 4. Build oRPC-native procedure pipeline router + createRouterClient (RFC A prototype)
const procedurePipelineRouter = os
  .$context<BenchContext>()
  .use(async ({ context, path, procedure, next }) => {
    // (a) Procedure-level authn
    const access = (procedure['~orpc'].meta as {
      readonly access?: {
        readonly authentication?: 'none' | 'required';
        readonly authorization?: { readonly scopes?: readonly string[]; readonly roles?: readonly string[] };
      };
    })?.access;
    let principal = context.principal;
    if (access?.authentication !== 'none' && !principal) {
      const authResult = await authenticator.authenticate(
        headersToAuthnRequest(context.headers ?? {}, path),
      );
      if (!authResult.ok) {
        throw new ORPCError('UNAUTHORIZED', { status: 401, message: authResult.reason });
      }
      principal = authResult.principal;
    }

    // (b) Procedure-level contract authorization (no path matching)
    if (access?.authentication !== 'none') {
      if (!principal) {
        throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'missing-principal' });
      }
      for (const scope of access?.authorization?.scopes ?? []) {
        if (!principal.scopes.includes(scope)) {
          throw new ORPCError('FORBIDDEN', { status: 403, message: `authz.missing-scope:${scope}` });
        }
      }
      for (const role of access?.authorization?.roles ?? []) {
        if (!principal.roles.includes(role)) {
          throw new ORPCError('FORBIDDEN', { status: 403, message: `authz.missing-role:${role}` });
        }
      }
      // Match Hono auth middleware's SHA-256 subject-hash audit work so transport overhead is apples-to-apples
      const subjectHash = await hashSubject(principal.subject);
      silentLogger.info('auth decision allow', { stage: 'authz', subjectHash, path });
    }

    // (c) Post-auth logical rate limit using the exact same MemoryRateLimitStore
    const decision = await rateLimitStore.consume({
      key: principal ? `${principal.subject}:${path.join('.')}` : `anon:${path.join('.')}`,
      limit: HUGE_LIMIT,
      windowMs: 60_000,
      now: Date.now(),
    });
    if (!decision.allowed) {
      throw new ORPCError('RATE_LIMITED', {
        status: 429,
        message: 'Too many requests',
        data: { retryAfter: Math.max(1, Math.ceil((decision.resetAt - Date.now()) / 1000)) },
      });
    }

    return await next({ context: { principal } });
  })
  .router(baseRouter);

const routerClient = createRouterClient(procedurePipelineRouter, {
  context: (clientCtx: { readonly token: string }): BenchContext => ({
    headers: { authorization: `Bearer ${clientCtx.token}` },
    requestId: 'req-bench',
  }),
});

// Pre-authenticated variant (when caller already holds a verified Principal in-process)
const verifiedPrincipal: Principal = Object.freeze({
  subject: 'user:bench-1',
  scopes: ['bench:read'],
  roles: ['reader'],
  scheme: 'bearer',
  claims: { tenantId: 'tenant-bench' },
});
const routerClientVerified = createRouterClient(procedurePipelineRouter, {
  context: (): BenchContext => ({
    principal: verifiedPrincipal,
    requestId: 'req-bench',
  }),
});

interface Stats {
  readonly mode: string;
  readonly scenario: string;
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
    samples[i] = (performance.now() - t0) * 1000; // microseconds
  }
  const totalMs = performance.now() - startTotal;
  const sorted = Float64Array.from(samples).sort();
  const q = (p: number) => sorted[Math.min(iterations - 1, Math.floor(iterations * p))];
  const meanUs = (totalMs * 1000) / iterations;
  return {
    mode,
    scenario,
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
  await Promise.all(Array.from({ length: concurrency }, () => fn())); // warmup
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
  const WARMUP = 50;
  const ITERS = 500;
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
    await bench('router-client-with-authn', 'small-unary', WARMUP, ITERS, () =>
      routerClient.getSmall({ id: 'ord_1' }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-verified-principal', 'small-unary', WARMUP, ITERS, () =>
      routerClientVerified.getSmall({ id: 'ord_1' })),
  );

  // Medium list payload (~16 KiB JSON, 100 items)
  results.push(
    await bench('http-loopback', 'medium-100-items', WARMUP, ITERS, () =>
      httpClient.listMedium({ count: 100 }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('fetch-link-in-process', 'medium-100-items', WARMUP, ITERS, () =>
      fetchLinkClient.listMedium({ count: 100 }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-with-authn', 'medium-100-items', WARMUP, ITERS, () =>
      routerClient.listMedium({ count: 100 }, { context: { token: 'bench-token' } })),
  );
  results.push(
    await bench('router-client-verified-principal', 'medium-100-items', WARMUP, ITERS, () =>
      routerClientVerified.listMedium({ count: 100 })),
  );

  // Concurrent burst (20 concurrent calls x 25 rounds = 500 calls)
  const concurrentResults = [
    await benchConcurrent('http-loopback', 'small-20x25-concurrent', 20, 25, () =>
      httpClient.getSmall({ id: 'ord_c' }, { context: { token: 'bench-token' } })),
    await benchConcurrent('fetch-link-in-process', 'small-20x25-concurrent', 20, 25, () =>
      fetchLinkClient.getSmall({ id: 'ord_c' }, { context: { token: 'bench-token' } })),
    await benchConcurrent('router-client-with-authn', 'small-20x25-concurrent', 20, 25, () =>
      routerClient.getSmall({ id: 'ord_c' }, { context: { token: 'bench-token' } })),
    await benchConcurrent('router-client-verified-principal', 'small-20x25-concurrent', 20, 25, () =>
      routerClientVerified.getSmall({ id: 'ord_c' })),
  ];

  // Payload byte size check
  const sampleMediumBytes = new TextEncoder().encode(
    JSON.stringify({ json: { items: MEDIUM_ITEMS, total: 100 } }),
  ).byteLength;

  console.log(
    JSON.stringify(
      {
        runtime: `Deno ${Deno.version.deno}`,
        orpcVersion: '1.15.5 (locked)',
        mediumPayloadJsonBytes: sampleMediumBytes,
        sequential: results,
        concurrent: concurrentResults,
      },
      null,
      2,
    ),
  );
} finally {
  await running.stop();
}
