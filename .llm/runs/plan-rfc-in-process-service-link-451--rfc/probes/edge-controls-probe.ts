/**
 * Runnable RFC 0000 edge-controls verification probe covering:
 * - Blocker 1: credential trust (bearer & internal credential on synthetic
 *   in-process vs cleartext non-loopback HTTP refusal), mid-epoch registry
 *   replacement isolation, and non-followed 3xx redirects;
 * - Blocker 3: concurrent identical-wire GET calls with two distinct valid
 *   RFC 0001 partitions (cache isolation vs DedupeRequestsPlugin coalescing);
 * - Blocker 4: near-2083 URL-length GET->POST fallback parity and socket
 *   peer-metadata rate-limit boundary vs logical-key rate-limit parity.
 *
 * Run with:
 *   deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/edge-controls-probe.ts
 */

import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { oc } from 'npm:@orpc/contract@^1.15.5';
import { implement } from 'npm:@orpc/server@^1.15.5';
import { createORPCClient } from 'npm:@orpc/client@^1.15.5';
import { z } from 'npm:zod@^4.6.5';
import { createService } from '@netscript/service';
import { createInstallationSecret } from '@netscript/service/internal-credential';
import { buildServiceRpcPath } from '@netscript/service/rpc-path';
import { createMemoryRateLimitStore } from '@netscript/service/rate-limit';
import { CacheQuery } from '@netscript/sdk/cache';
import {
  createInternalCredentialSdkClientContribution,
  defineSdkClientContribution,
  safe,
  SdkClientContributionError,
} from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from '../../../../packages/plugin-auth-core/src/sdk/bearer-contribution.ts';
import { createHttpClientLink } from '../../../../packages/sdk/src/client/http-client-link.ts';
import { createStableV1ClientLink } from '../../../../packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts';
import { createPreparedOutboundHeadersPort } from '../../../../packages/sdk/src/internal/client-contributions/prepared-call.ts';
import { resolveTransportPolicy } from '../../../../packages/sdk/src/internal/transport-policy.ts';
import type { ClientLinkPort } from '../../../../packages/sdk/src/ports/client-link-factory.ts';
import type { SdkClientTransportDescriptor } from '../../../../packages/sdk/src/ports/sdk-client-contribution.ts';
import { MemoryCacheStore } from '../../../../packages/sdk/tests/test-helpers.ts';
import {
  createInProcessFetch,
  type InProcessServiceAppLike,
} from './in-process-fetch-adapter.ts';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const controlContract = {
  echo: oc
    .route({ method: 'GET' })
    .meta({ access: { authentication: 'required' } })
    .input(z.object({ text: z.string() }))
    .output(z.object({ text: z.string(), method: z.string(), appId: z.string() })),
};

const os = implement(controlContract);
const rpcPath = buildServiceRpcPath({ routerName: 'echo' });
const transportPolicy = resolveTransportPolicy(controlContract);

// 1. Blocker 1a: Bearer & Internal Credential trust + cleartext non-loopback HTTP refusal.
const bearerContribution = createBearerSdkClientContribution<{ token: string }>({
  context: { token: 'required' },
  resolveCredential: ({ context }) => context.token,
  responseCache: { mode: 'direct-only' },
});
const internalContribution = createInternalCredentialSdkClientContribution({
  service: 'echo',
  secret: await createInstallationSecret('p'.repeat(32)),
});

let cleartextBearerDispatched = 0;
const cleartextBearerLink = createHttpClientLink({
  transportPolicy,
  serviceName: 'echo',
  rpcPath,
  protocol: 'http',
  propagateTraceContext: false,
  getTraceHeaders: () => ({}),
  resolveServiceUrl: () => 'http://api.example.test',
  contributions: [bearerContribution] as const,
  fetch: () => {
    cleartextBearerDispatched += 1;
    return Promise.resolve(new Response('unexpected'));
  },
});
// deno-lint-ignore no-explicit-any
const cleartextBearerClient = createORPCClient(cleartextBearerLink as any) as any;
const cleartextBearerRes = await safe(
  cleartextBearerClient.echo({ text: 'hi' }, { context: { token: 'secret-tok' } }),
);
assertEquals(cleartextBearerRes.isSuccess, false);
assertEquals(cleartextBearerDispatched, 0);
if (!cleartextBearerRes.isSuccess) {
  assert(cleartextBearerRes.error instanceof SdkClientContributionError);
}

let cleartextInternalDispatched = 0;
const cleartextInternalLink = createHttpClientLink({
  transportPolicy,
  serviceName: 'echo',
  rpcPath,
  protocol: 'http',
  propagateTraceContext: false,
  getTraceHeaders: () => ({}),
  resolveServiceUrl: () => 'http://api.example.test',
  contributions: [internalContribution] as const,
  fetch: () => {
    cleartextInternalDispatched += 1;
    return Promise.resolve(new Response('unexpected'));
  },
});
// deno-lint-ignore no-explicit-any
const cleartextInternalClient = createORPCClient(cleartextInternalLink as any) as any;
const cleartextInternalRes = await safe(
  cleartextInternalClient.echo({ text: 'hi' }, { context: {} }),
);
assertEquals(cleartextInternalRes.isSuccess, false);
assertEquals(cleartextInternalDispatched, 0);
if (!cleartextInternalRes.isSuccess) {
  assert(cleartextInternalRes.error instanceof SdkClientContributionError);
}

let observedAuthorizationHeader: string | null = null;
const trustedRouter = os.router({
  echo: os.echo.handler(({ input, context }) => {
    const req = (context as { request: Request }).request;
    observedAuthorizationHeader = req.headers.get('authorization');
    return { text: input.text, method: req.method, appId: 'trusted-app' };
  }),
});
const trustedApp = createService(trustedRouter, { name: 'echo' })
  .withContext((c) => ({ request: c.req.raw }))
  .withRPC({ rpcPath })
  .build();

const trustedBearerLink = createHttpClientLink({
  transportPolicy,
  serviceName: 'echo',
  rpcPath,
  protocol: 'https',
  propagateTraceContext: false,
  getTraceHeaders: () => ({}),
  resolveServiceUrl: () => 'https://in-process.localhost',
  contributions: [bearerContribution] as const,
  fetch: createInProcessFetch(trustedApp),
});
// deno-lint-ignore no-explicit-any
const trustedBearerOut = await (createORPCClient(trustedBearerLink as any) as any).echo(
  { text: 'ok' },
  { context: { token: 'trusted-tok' } },
);
assertEquals(trustedBearerOut.appId, 'trusted-app');
assertEquals(observedAuthorizationHeader, 'Bearer trusted-tok');

observedAuthorizationHeader = null;
const trustedInternalLink = createHttpClientLink({
  transportPolicy,
  serviceName: 'echo',
  rpcPath,
  protocol: 'https',
  propagateTraceContext: false,
  getTraceHeaders: () => ({}),
  resolveServiceUrl: () => 'https://in-process.localhost',
  contributions: [internalContribution] as const,
  fetch: createInProcessFetch(trustedApp),
});
// deno-lint-ignore no-explicit-any
const trustedInternalOut = await (createORPCClient(trustedInternalLink as any) as any).echo(
  { text: 'ok' },
  { context: {} },
);
assertEquals(trustedInternalOut.appId, 'trusted-app');
assert(
  typeof observedAuthorizationHeader === 'string' &&
    observedAuthorizationHeader.startsWith('Bearer ') &&
    observedAuthorizationHeader.length > 20,
);

// 2. Blocker 1b: Mid-epoch registry replacement race (WeakMap<InProcessServiceApp, Link>).
const app1Seen: string[] = [];
const app2Seen: string[] = [];
const app1 = createService(
  os.router({
    echo: os.echo.handler(({ input, context }) => {
      const req = (context as { request: Request }).request;
      app1Seen.push(req.headers.get('authorization') ?? '');
      return { text: input.text, method: req.method, appId: 'app-1' };
    }),
  }),
  { name: 'echo' },
).withContext((c) => ({ request: c.req.raw })).withRPC({ rpcPath }).build();

const app2 = createService(
  os.router({
    echo: os.echo.handler(({ input, context }) => {
      const req = (context as { request: Request }).request;
      app2Seen.push(req.headers.get('authorization') ?? '');
      return { text: input.text, method: req.method, appId: 'app-2' };
    }),
  }),
  { name: 'echo' },
).withContext((c) => ({ request: c.req.raw })).withRPC({ rpcPath }).build();

const registry = new Map<string, InProcessServiceAppLike>([['echo', app1]]);
const epochAppByTransport = new WeakMap<SdkClientTransportDescriptor, InProcessServiceAppLike>();
const linksByApp = new WeakMap<InProcessServiceAppLike, ClientLinkPort>();

const prepEntered = deferred<void>();
const prepRelease = deferred<void>();
const pausedContribution = defineSdkClientContribution<{ tag: string; pause?: boolean }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'probe:paused-auth',
  context: { tag: 'required', pause: 'optional' },
  headerKeys: ['authorization'],
  responseCache: { mode: 'direct-only' },
  async prepare({ context }) {
    if (context.pause) {
      prepEntered.resolve();
      await prepRelease.promise;
    }
    return { headers: { authorization: `Bearer ${context.tag}` } };
  },
});

const getOrCreateLinkForApp = (app: InProcessServiceAppLike): ClientLinkPort => {
  let existing = linksByApp.get(app);
  if (!existing) {
    existing = createHttpClientLink({
      transportPolicy,
      serviceName: 'echo',
      rpcPath,
      protocol: 'https',
      propagateTraceContext: false,
      getTraceHeaders: () => ({}),
      resolveServiceUrl: () => 'https://in-process.localhost',
      contributions: [pausedContribution] as const,
      fetch: createInProcessFetch(app),
    });
    linksByApp.set(app, existing);
  }
  return existing;
};

// Outer epoch-pinned router matching RFC 0000 WeakMap<InProcessServiceApp, Link> design.
const pinnedLink = createStableV1ClientLink<{ tag: string; pause?: boolean }>({
  link: {
    call(path, input, options) {
      const prepared = options.preparedCall;
      const pinnedApp = prepared ? epochAppByTransport.get(prepared.call.transport) : undefined;
      if (!pinnedApp) throw new Error('Missing epoch-pinned app');
      return getOrCreateLinkForApp(pinnedApp).call(path, input, {
        ...options,
        context: { ...options.context, tag: (options.context as { tag: string }).tag, pause: false },
      });
    },
  },
  preparation: createPreparedOutboundHeadersPort([pausedContribution]),
  transportPolicy,
  resolveTransport: () => {
    const app = registry.get('echo');
    if (!app) throw new Error('NOT_FOUND');
    const descriptor: SdkClientTransportDescriptor = Object.freeze({
      kind: 'http' as const,
      origin: new URL('https://in-process.localhost'),
      rpcPath,
      secure: true,
    });
    epochAppByTransport.set(descriptor, app);
    return descriptor;
  },
  hasContributions: true,
});

// deno-lint-ignore no-explicit-any
const pinnedClient = createORPCClient(pinnedLink as any) as any;
const epoch1Promise = pinnedClient.echo(
  { text: 'same' },
  { context: { tag: 'epoch-1-app1-cred', pause: true } },
);
await prepEntered.promise;
// Replace registration while epoch 1 is still preparing credentials for app1.
registry.set('echo', app2);
const epoch2Promise = pinnedClient.echo(
  { text: 'same' },
  { context: { tag: 'epoch-2-app2-cred' } },
);
prepRelease.resolve();
const [epoch1Out, epoch2Out] = await Promise.all([epoch1Promise, epoch2Promise]);
assertEquals(epoch1Out.appId, 'app-1');
assertEquals(epoch2Out.appId, 'app-2');
assertEquals(app1Seen, ['Bearer epoch-1-app1-cred']);
assertEquals(app2Seen, ['Bearer epoch-2-app2-cred']);

// 3. Blocker 1c: 3xx redirect response is NOT followed and triggers zero global fetch.
let outboundFetchCalls = 0;
const originalGlobalFetch = globalThis.fetch;
const redirectApp: InProcessServiceAppLike = {
  fetch() {
    return new Response(null, {
      status: 302,
      headers: { location: 'http://external.example.test/steal-cred' },
    });
  },
};
const redirectLink = createHttpClientLink({
  transportPolicy,
  serviceName: 'echo',
  rpcPath,
  protocol: 'https',
  propagateTraceContext: false,
  getTraceHeaders: () => ({}),
  resolveServiceUrl: () => 'https://in-process.localhost',
  contributions: [bearerContribution] as const,
  fetch: createInProcessFetch(redirectApp),
});
globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
  outboundFetchCalls += 1;
  return originalGlobalFetch(...args);
}) as typeof fetch;
let redirectResult: unknown;
try {
  // deno-lint-ignore no-explicit-any
  redirectResult = await safe((createORPCClient(redirectLink as any) as any).echo(
    { text: 'redir' },
    { context: { token: 'do-not-forward' } },
  ));
} finally {
  globalThis.fetch = originalGlobalFetch;
}
assertEquals((redirectResult as { isSuccess: boolean }).isSuccess, false);
assertEquals(
  ((redirectResult as { error?: { code?: string } }).error)?.code,
  'IN_PROCESS_REDIRECT_UNSUPPORTED',
);
assertEquals(outboundFetchCalls, 0);

// 4. Blocker 3: Concurrent identical-wire GET calls with two valid partitions & identical prepared headers.
let identicalHeaderWireCalls = 0;
const wireHold = deferred<void>();
const identicalHeaderApp = createService(
  os.router({
    echo: os.echo.handler(async ({ input, context }) => {
      identicalHeaderWireCalls += 1;
      await wireHold.promise;
      return {
        text: `${input.text}#${identicalHeaderWireCalls}`,
        method: (context as { request: Request }).request.method,
        appId: 'wire-app',
      };
    }),
  }),
  { name: 'echo' },
).withContext((c) => ({ request: c.req.raw })).withRPC({ rpcPath }).build();

const sameHeaderPartitionContrib = defineSdkClientContribution<{ partition: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'probe:same-header',
  context: { partition: 'required' },
  headerKeys: ['x-tenant-mode'],
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.partition,
  },
  // Deliberately emits identical prepared headers across two distinct partitions.
  prepare: () => ({ headers: { 'x-tenant-mode': 'standard' } }),
});

const sameHeaderLink = createHttpClientLink({
  transportPolicy,
  serviceName: 'echo',
  rpcPath,
  protocol: 'https',
  propagateTraceContext: false,
  getTraceHeaders: () => ({}),
  resolveServiceUrl: () => 'https://in-process.localhost',
  contributions: [sameHeaderPartitionContrib] as const,
  fetch: createInProcessFetch(identicalHeaderApp),
});
// deno-lint-ignore no-explicit-any
const sameHeaderClient = createORPCClient(sameHeaderLink as any) as any;
const partitionCache = new CacheQuery(new MemoryCacheStore());
const concurrentP1 = partitionCache.query(
  ['echo', 'same', '$netscript.sdk-context', JSON.stringify([['probe:same-header', 'part-A']])],
  {
    queryFn: () => sameHeaderClient.echo({ text: 'same' }, { context: { partition: 'part-A' } }),
  },
);
const concurrentP2 = partitionCache.query(
  ['echo', 'same', '$netscript.sdk-context', JSON.stringify([['probe:same-header', 'part-B']])],
  {
    queryFn: () => sameHeaderClient.echo({ text: 'same' }, { context: { partition: 'part-B' } }),
  },
);
await new Promise((r) => setTimeout(r, 20));
wireHold.resolve();
const [c1, c2] = await Promise.all([concurrentP1, concurrentP2]);
// Confirm cache keys remain distinct while current shared DedupeRequestsPlugin coalesces unsignalled GET.
assertEquals(identicalHeaderWireCalls, 1);
assertEquals(c1.text, c2.text);

// 5. Blocker 4a: Near-2083 URL-length GET->POST fallback parity control.
const lengthRunning = await createService(trustedRouter, { name: 'echo' })
  .withContext((c) => ({ request: c.req.raw }))
  .withRPC({ rpcPath })
  .serve({ port: 0, hostname: 'localhost', handleSignals: false });
let urlLengthReport: Record<string, unknown>;
try {
  const shortHttpOrigin = `http://localhost:${lengthRunning.addr.port}`;
  const longSyntheticOrigin = 'https://in-process.localhost';
  assert(longSyntheticOrigin.length > shortHttpOrigin.length);
  const httpLenLink = createHttpClientLink({
    transportPolicy,
    serviceName: 'echo',
    rpcPath,
    protocol: 'http',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => shortHttpOrigin,
  });
  const inProcLenLink = createHttpClientLink({
    transportPolicy,
    serviceName: 'echo',
    rpcPath,
    protocol: 'https',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => longSyntheticOrigin,
    fetch: createInProcessFetch(lengthRunning.app),
  });
  // deno-lint-ignore no-explicit-any
  const httpLenClient = createORPCClient(httpLenLink as any) as any;
  // deno-lint-ignore no-explicit-any
  const inProcLenClient = createORPCClient(inProcLenLink as any) as any;

  // Choose payload length so full URL is <= 2083 on shorter HTTP origin and > 2083 on synthetic origin.
  const emptyQueryLen = `?data=${encodeURIComponent(JSON.stringify({ json: { text: '' } }))}`.length;
  const httpBaseLen = shortHttpOrigin.length + rpcPath.length + '/echo'.length + emptyQueryLen;
  const payload = 'a'.repeat(2083 - httpBaseLen - 1);
  const httpOut = await httpLenClient.echo({ text: payload });
  const inProcOut = await inProcLenClient.echo({ text: payload });
  assertEquals(httpOut.text, inProcOut.text);
  assertEquals(httpOut.method, 'GET');
  assertEquals(inProcOut.method, 'POST');
  assertNotEquals(httpOut.method, inProcOut.method);
  urlLengthReport = {
    payloadLen: payload.length,
    httpFullUrlLen: httpBaseLen + payload.length,
    inProcFullUrlLen:
      longSyntheticOrigin.length + rpcPath.length + '/echo'.length + emptyQueryLen + payload.length,
    httpMethod: httpOut.method,
    inProcMethod: inProcOut.method,
    decodedPayloadIdentical: httpOut.text === inProcOut.text,
  };
} finally {
  await lengthRunning.stop();
}

// 6. Blocker 4b: Socket peer-metadata rate-limit boundary vs custom logical-key rate-limit parity.
const defaultRlRunning = await createService(trustedRouter, { name: 'echo' })
  .withContext((c) => ({ request: c.req.raw }))
  .withRateLimit({
    routes: [`${rpcPath}/*`],
    limit: 1,
    windowMs: 60_000,
    store: createMemoryRateLimitStore(),
  })
  .withRPC({ rpcPath })
  .serve({ port: 0, hostname: 'localhost', handleSignals: false });

let defaultRlReport: Record<string, unknown>;
try {
  const httpRes1 = await fetch(
    `http://localhost:${defaultRlRunning.addr.port}${rpcPath}/echo`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: { text: '1' } }) },
  );
  const httpRes2 = await fetch(
    `http://localhost:${defaultRlRunning.addr.port}${rpcPath}/echo`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: { text: '2' } }) },
  );
  // In-process call without env.remoteAddr falls back to bucket 'unknown' (separate from HTTP's peer IP bucket).
  const inProcFetch = createInProcessFetch(defaultRlRunning.app);
  const inProcRes1 = await inProcFetch(
    `https://in-process.localhost${rpcPath}/echo`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: { text: '3' } }) },
  );
  const inProcRes2 = await inProcFetch(
    `https://in-process.localhost${rpcPath}/echo`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: { text: '4' } }) },
  );
  await httpRes1.body?.cancel();
  await httpRes2.body?.cancel();
  await inProcRes1.body?.cancel();
  await inProcRes2.body?.cancel();
  assertEquals(httpRes1.status, 200);
  assertEquals(httpRes2.status, 429);
  // Proves in-process used a separate fallback bucket ('unknown') rather than sharing HTTP's socket IP bucket:
  assertEquals(inProcRes1.status, 200);
  assertEquals(inProcRes2.status, 429);
  defaultRlReport = {
    httpStatuses: [httpRes1.status, httpRes2.status],
    inProcStatusesSeparateBucket: [inProcRes1.status, inProcRes2.status],
  };
} finally {
  await defaultRlRunning.stop();
}
// Custom logical-key rate limit enforces exact shared quota parity across HTTP and in-process.
const logicalRlRunning = await createService(trustedRouter, { name: 'echo' })
  .withContext((c) => ({ request: c.req.raw }))
  .withRateLimit({
    routes: [`${rpcPath}/*`],
    limit: 1,
    windowMs: 60_000,
    store: createMemoryRateLimitStore(),
    key: (c) => c.req.header('x-principal') ?? 'anon',
  })
  .withRPC({ rpcPath })
  .serve({ port: 0, hostname: 'localhost', handleSignals: false });

let logicalRlReport: Record<string, unknown>;
try {
  const httpFirst = await fetch(
    `http://localhost:${logicalRlRunning.addr.port}${rpcPath}/echo`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-principal': 'user-42' },
      body: JSON.stringify({ json: { text: '1' } }),
    },
  );
  // Second call for the same logical principal over in-process hits the exact same quota bucket -> 429!
  const inProcFetch = createInProcessFetch(logicalRlRunning.app);
  const inProcSecond = await inProcFetch(
    `https://in-process.localhost${rpcPath}/echo`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-principal': 'user-42' },
      body: JSON.stringify({ json: { text: '2' } }),
    },
  );
  // Distinct principal over in-process still succeeds -> 200!
  const inProcOther = await inProcFetch(
    `https://in-process.localhost${rpcPath}/echo`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-principal': 'user-99' },
      body: JSON.stringify({ json: { text: '3' } }),
    },
  );
  const retryAfter = inProcSecond.headers.get('retry-after');
  await httpFirst.body?.cancel();
  await inProcSecond.body?.cancel();
  await inProcOther.body?.cancel();
  assertEquals(httpFirst.status, 200);
  assertEquals(inProcSecond.status, 429);
  assert(retryAfter !== null && Number(retryAfter) > 0);
  assertEquals(inProcOther.status, 200);
  logicalRlReport = {
    httpUser42: httpFirst.status,
    inProcUser42SharedQuota: inProcSecond.status,
    inProcUser42HasRetryAfter: retryAfter !== null,
    inProcUser99: inProcOther.status,
  };
} finally {
  await logicalRlRunning.stop();
}

console.log(
  JSON.stringify(
    {
      credentialTrust: {
        cleartextBearerRefusedBeforeDispatch: !cleartextBearerRes.isSuccess && cleartextBearerDispatched === 0,
        cleartextInternalRefusedBeforeDispatch: !cleartextInternalRes.isSuccess && cleartextInternalDispatched === 0,
        trustedBearerSucceeded: trustedBearerOut.appId === 'trusted-app',
        trustedInternalSucceeded: trustedInternalOut.appId === 'trusted-app',
      },
      replacementRace: {
        epoch1AppId: epoch1Out.appId,
        epoch2AppId: epoch2Out.appId,
        app1Seen,
        app2Seen,
      },
      redirectControl: {
        failedWithoutFollowing: !(redirectResult as { isSuccess: boolean }).isSuccess,
        outboundFetchCalls,
      },
      identicalHeaderGetDedup: {
        wireCallsObserved: identicalHeaderWireCalls,
        coalescedUnderCurrentMain: identicalHeaderWireCalls === 1,
      },
      urlLengthBoundary: urlLengthReport,
      rateLimitBoundary: {
        defaultSocketBucket: defaultRlReport,
        logicalPrincipalKey: logicalRlReport,
      },
    },
    null,
    2,
  ),
);
