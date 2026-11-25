/**
 * Runnable RFC 0000 edge-controls verification probe covering:
 * - Blocker 1: credential trust (bearer & internal credential on synthetic
 *   in-process vs cleartext non-loopback HTTP refusal) and non-followed 3xx
 *   redirects (including rejecting redirect-body cancel);
 * - Blocker 5 (New-1): SDK-private per-epoch binding with explicit cleanup on
 *   normal completion, preparation failure, and abort; retained-descriptor
 *   control (holding snapshot.transport strongly never retains replaced app);
 *   and real shared-link unary retry pinning + async-iterator reconnect
 *   re-resolution across { replace: true };
 * - Blocker 2 (R1-B3): concurrent identical-header two-partition POST
 *   non-sharing parity across BOTH HTTP and in-process (2 handler entries,
 *   distinct generated results) plus baseline GET dedup observation recording
 *   the unmet shared-SDK DedupeRequestsPlugin prerequisite;
 * - Blocker 3 (R1-B4): near-2083 URL-length boundary for both method-insensitive
 *   and method-sensitive authorizers (proving method-sensitive policies diverge
 *   across the overflow edge and restore exact parity with fixed method), plus
 *   socket peer-metadata rate-limit boundary vs logical-key rate-limit parity.
 *
 * Run with:
 *   deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/edge-controls-probe.ts
 */

import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { eventIterator, oc } from 'npm:@orpc/contract@^1.15.5';
import { implement, withEventMeta } from 'npm:@orpc/server@^1.15.5';
import { createORPCClient } from 'npm:@orpc/client@^1.15.5';
import { z } from 'npm:zod@^4.6.5';
import { createService } from '@netscript/service';
import { createStaticCredentialAuthenticator } from '@netscript/service/auth';
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
  echoPost: oc
    .route({ method: 'POST' })
    .meta({ access: { authentication: 'required' } })
    .input(z.object({ text: z.string() }))
    .output(z.object({ text: z.string(), sequence: z.number(), method: z.string() })),
  feed: oc
    .route({ method: 'POST' })
    .input(z.object({ topic: z.string() }))
    .output(eventIterator(z.object({ appId: z.string(), seq: z.number(), lastEventId: z.string().nullable() }))),
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
let echoPostSeq = 0;
const trustedRouter = os.router({
  echo: os.echo.handler(({ input, context }) => {
    const req = (context as { request: Request }).request;
    observedAuthorizationHeader = req.headers.get('authorization');
    return { text: input.text, method: req.method, appId: 'trusted-app' };
  }),
  echoPost: os.echoPost.handler(({ input, context }) => {
    const req = (context as { request: Request }).request;
    return { text: input.text, sequence: ++echoPostSeq, method: req.method };
  }),
  feed: os.feed.handler(async function* () {
    yield withEventMeta({ appId: 'trusted-app', seq: 1, lastEventId: null }, { id: 't-1' });
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

// 2. Blocker 5 (New-1): SDK-private per-epoch binding (no WeakMap keyed by public descriptor!),
//    retained-descriptor control across success/prep-error/abort, AND real shared-link
//    unary retry pinning + async-iterator reconnect re-resolution across { replace: true }.
const app1Seen: string[] = [];
const app2Seen: string[] = [];
let app1UnaryAttempts = 0;
const app1FeedBase = createService(
  os.router({
    echo: os.echo.handler(({ input, context }) => {
      const req = (context as { request: Request }).request;
      app1Seen.push(req.headers.get('authorization') ?? '');
      return { text: input.text, method: req.method, appId: 'app-1' };
    }),
    echoPost: os.echoPost.handler(({ input, context }) => {
      const req = (context as { request: Request }).request;
      app1Seen.push(`post:${req.headers.get('authorization') ?? ''}`);
      return { text: input.text, sequence: ++echoPostSeq, method: req.method };
    }),
    feed: os.feed.handler(async function* ({ context }) {
      const req = (context as { request: Request }).request;
      app1Seen.push(`feed:${req.headers.get('authorization') ?? ''}`);
      yield withEventMeta(
        { appId: 'app-1', seq: 1, lastEventId: req.headers.get('last-event-id') },
        { id: 'ev-1', retry: 1 },
      );
      // Replace registry before dropping the stream so reconnect switches to app2!
      registry.set('echo', app2);
      throw new Error('app-1 stream dropped');
    }),
  }),
  { name: 'echo' },
).withContext((c) => ({ request: c.req.raw })).withRPC({ rpcPath }).build();

const app1: InProcessServiceAppLike = {
  fetch(request) {
    if (request.url.endsWith('/echoPost')) {
      app1UnaryAttempts += 1;
      if (app1UnaryAttempts === 1) {
        // Trigger replacement BEFORE retry attempt 2 runs!
        registry.set('echo', app2);
        return new Response(JSON.stringify({ message: 'transient-503' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        });
      }
    }
    return app1FeedBase.fetch(request);
  },
};

const app2 = createService(
  os.router({
    echo: os.echo.handler(({ input, context }) => {
      const req = (context as { request: Request }).request;
      app2Seen.push(req.headers.get('authorization') ?? '');
      return { text: input.text, method: req.method, appId: 'app-2' };
    }),
    echoPost: os.echoPost.handler(({ input, context }) => {
      const req = (context as { request: Request }).request;
      app2Seen.push(`post:${req.headers.get('authorization') ?? ''}`);
      return { text: input.text, sequence: ++echoPostSeq, method: req.method };
    }),
    feed: os.feed.handler(async function* ({ context }) {
      const req = (context as { request: Request }).request;
      app2Seen.push(`feed:${req.headers.get('authorization') ?? ''}`);
      yield withEventMeta(
        { appId: 'app-2', seq: 2, lastEventId: req.headers.get('last-event-id') },
        { id: 'ev-2' },
      );
    }),
  }),
  { name: 'echo' },
).withContext((c) => ({ request: c.req.raw })).withRPC({ rpcPath }).build();

const registry = new Map<string, InProcessServiceAppLike>([['echo', app1]]);

// Contribution intentionally retains EVERY public SdkClientTransportDescriptor strongly!
const retainedDescriptors: SdkClientTransportDescriptor[] = [];
const prepEntered = deferred<void>();
const prepRelease = deferred<void>();
let prepareCallCount = 0;

const retainingContribution = defineSdkClientContribution<{
  tag: string;
  pause?: boolean;
  failPrepare?: boolean;
}>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'probe:retaining-auth',
  context: { tag: 'required', pause: 'optional', failPrepare: 'optional' },
  headerKeys: ['authorization'],
  responseCache: { mode: 'direct-only' },
  async prepare({ context, transport }) {
    prepareCallCount += 1;
    // Retain the public descriptor strongly forever to prove it cannot keep a replaced app alive.
    retainedDescriptors.push(transport);
    if (context.failPrepare) {
      throw new Error('intentional-prepare-failure');
    }
    if (context.pause) {
      prepEntered.resolve();
      await prepRelease.promise;
    }
    return { headers: { authorization: `Bearer ${context.tag}#p${prepareCallCount}` } };
  },
});

const rawPreparation = createPreparedOutboundHeadersPort([retainingContribution]);

// Clean shared-link wrapper that forwards prepared headers on a single per-app RPCLink
// (zero second stable-v1 wrapper!) AND deletes the SDK-private epoch token in `finally`
// on EVERY epoch exit (normal completion, preparation failure, abort, or iterator close).
// Public SdkClientTransportDescriptor is NEVER used as a WeakMap/Map key!
function buildEpochPinnedSharedLink() {
  const perAppFetchLinks = new WeakMap<
    InProcessServiceAppLike,
    ClientLinkPort
  >();
  // Track prepared headers per in-flight attempt via a private local helper link.
  const makeAppLink = (app: InProcessServiceAppLike) => {
    let cached = perAppFetchLinks.get(app);
    if (!cached) {
      const baseFetch = createInProcessFetch(app);
      cached = createHttpClientLink({
        transportPolicy,
        serviceName: 'echo',
        rpcPath,
        protocol: 'https',
        propagateTraceContext: false,
        getTraceHeaders: () => ({}),
        resolveServiceUrl: () => 'https://in-process.localhost',
        fetch: (req, init) => {
          const headers = new Headers(init?.headers ?? (req instanceof Request ? req.headers : undefined));
          if (currentAttemptHeaders) {
            for (const [k, v] of Object.entries(currentAttemptHeaders)) {
              headers.set(k, v);
            }
          }
          return baseFetch(req, { ...init, headers });
        },
      });
      perAppFetchLinks.set(app, cached);
    }
    return cached;
  };
  let currentAttemptHeaders: Readonly<Record<string, string>> | undefined;
  const epochMap = new Map<symbol, InProcessServiceAppLike>();
  const EPOCH_SYM = Symbol('sdk.epoch');

  // Wrap dispatch around createStableV1ClientLink with a single stable-v1 layer!
  const link = createStableV1ClientLink<{
    tag: string;
    pause?: boolean;
    failPrepare?: boolean;
  }>({
    link: {
      async call(path, input, options) {
        const token = (options.preparedCall?.call.context as Record<symbol, symbol | undefined>)?.[
          EPOCH_SYM
        ];
        const pinnedApp = token ? epochMap.get(token) : undefined;
        if (!pinnedApp || !options.preparedCall) throw new Error('Missing epoch app');
        const prev = currentAttemptHeaders;
        currentAttemptHeaders = options.preparedCall.contributedHeaders.values;
        try {
          return await makeAppLink(pinnedApp).call(path, input, options);
        } finally {
          currentAttemptHeaders = prev;
        }
      },
    },
    preparation: {
      async prepare(call) {
        const token = pendingEpochTokens.shift()!;
        try {
          const prepared = await rawPreparation.prepare(call);
          return Object.freeze({
            ...prepared,
            call: Object.freeze({
              ...prepared.call,
              context: Object.freeze({
                ...prepared.call.context,
                [EPOCH_SYM]: token,
              }),
            }),
          });
        } catch (err) {
          epochMap.delete(token);
          throw err;
        }
      },
    },
    transportPolicy,
    resolveTransport: () => {
      const app = registry.get('echo');
      if (!app) throw new Error('NOT_FOUND');
      const token = Symbol('sdk.epoch.id');
      pendingEpochTokens.push(token);
      epochMap.set(token, app);
      return Object.freeze({
        kind: 'http' as const,
        origin: new URL('https://in-process.localhost'),
        rpcPath,
        secure: true,
      });
    },
    hasContributions: true,
  });

  const pendingEpochTokens: symbol[] = [];
  // Wrap outer call to release the epoch token once the logical call / iterator terminates!
  const wrapped: ClientLinkPort = {
    async call(path, input, options) {
      const beforeTokens = new Set(epochMap.keys());
      try {
        const out = await link.call(path, input, options);
        // If streaming async iterator, clean up all newly created epoch tokens on iterator exit.
        if (out && typeof out === 'object' && Symbol.asyncIterator in out) {
          const iter = out as AsyncIterator<unknown> & AsyncIterable<unknown>;
          return {
            [Symbol.asyncIterator]() {
              return this;
            },
            async next() {
              try {
                const res = await iter.next();
                if (res.done) {
                  for (const k of epochMap.keys()) {
                    if (!beforeTokens.has(k)) epochMap.delete(k);
                  }
                }
                return res;
              } catch (e) {
                for (const k of epochMap.keys()) {
                  if (!beforeTokens.has(k)) epochMap.delete(k);
                }
                throw e;
              }
            },
            async return() {
              try {
                return await (iter.return?.() ?? Promise.resolve({ done: true, value: undefined }));
              } finally {
                for (const k of epochMap.keys()) {
                  if (!beforeTokens.has(k)) epochMap.delete(k);
                }
              }
            },
          };
        }
        // Unary call finished (including all retries): release epoch token immediately.
        for (const k of epochMap.keys()) {
          if (!beforeTokens.has(k)) epochMap.delete(k);
        }
        return out;
      } catch (err) {
        for (const k of epochMap.keys()) {
          if (!beforeTokens.has(k)) epochMap.delete(k);
        }
        throw err;
      }
    },
  };
  return { link: wrapped, epochMap };
}

const { link: sharedPinnedLink, epochMap } = buildEpochPinnedSharedLink();
// deno-lint-ignore no-explicit-any
const sharedPinnedClient = createORPCClient(sharedPinnedLink as any) as any;

// (2a) Mid-epoch replacement race during async prepare():
registry.set('echo', app1);
const epoch1Promise = sharedPinnedClient.echo(
  { text: 'same' },
  { context: { tag: 'epoch-1-app1-cred', pause: true } },
);
await prepEntered.promise;
registry.set('echo', app2);
const epoch2Promise = sharedPinnedClient.echo(
  { text: 'same' },
  { context: { tag: 'epoch-2-app2-cred' } },
);
prepRelease.resolve();
const [epoch1Out, epoch2Out] = await Promise.all([epoch1Promise, epoch2Promise]);
assertEquals(epoch1Out.appId, 'app-1');
assertEquals(epoch2Out.appId, 'app-2');
assertEquals(epochMap.size, 0);

// (2b) Retained-descriptor controls across prepare() failure and abort:
registry.set('echo', app1);
const prepFailRes = await safe(
  sharedPinnedClient.echo({ text: 'fail' }, { context: { tag: 'fail-prep', failPrepare: true } }),
);
assertEquals(prepFailRes.isSuccess, false);
assertEquals(epochMap.size, 0);

const abortPrepCtrl = new AbortController();
abortPrepCtrl.abort(new Error('abort-before-prep'));
const prepAbortRes = await safe(
  sharedPinnedClient.echo(
    { text: 'aborted' },
    { context: { tag: 'abort-prep', signal: abortPrepCtrl.signal } },
  ),
);
assertEquals(prepAbortRes.isSuccess, false);
assertEquals(epochMap.size, 0);

// All retained public descriptors carry zero hidden symbols and keep zero epochMap entries alive.
assert(retainedDescriptors.length >= 3);
for (const d of retainedDescriptors) {
  assertEquals(Object.getOwnPropertySymbols(d).length, 0);
}

// (2c) Real shared-link UNARY RETRY stays pinned to app1 across mid-retry { replace: true }:
registry.set('echo', app1);
app1UnaryAttempts = 0;
const app2PostCountBefore = app2Seen.filter((s) => s.startsWith('post:')).length;
const retryOut = await sharedPinnedClient.echoPost(
  { text: 'retry-me' },
  { context: { tag: 'retry-epoch', retry: 1 } },
);
assertEquals(retryOut.text, 'retry-me');
assertEquals(app1UnaryAttempts, 2); // Attempt 1 (503 + replace) + Attempt 2 (still pinned to app1!)
assertEquals(registry.get('echo'), app2);
assertEquals(app2Seen.filter((s) => s.startsWith('post:')).length, app2PostCountBefore);
assertEquals(epochMap.size, 0);

// (2d) Real shared-link ASYNC-ITERATOR RECONNECT re-resolves app2 and re-prepares headers:
registry.set('echo', app1);
const feedIter = await sharedPinnedClient.feed(
  { topic: 'orders' },
  { context: { tag: 'stream-cred', retry: 1 } },
);
const feedEvents: Array<{ appId: string; seq: number; lastEventId: string | null }> = [];
for await (const ev of feedIter) {
  feedEvents.push(ev);
}
assertEquals(feedEvents.length, 2);
assertEquals(feedEvents[0].appId, 'app-1');
assertEquals(feedEvents[0].lastEventId, null);
assertEquals(feedEvents[1].appId, 'app-2');
assertEquals(feedEvents[1].lastEventId, 'ev-1');
assertEquals(epochMap.size, 0);
const app1FeedHeader = app1Seen.find((s) => s.startsWith('feed:'));
const app2FeedHeader = app2Seen.find((s) => s.startsWith('feed:'));
assertNotEquals(app1FeedHeader, app2FeedHeader); // Proves fresh prepare() on reconnect epoch!

// 3. Blocker 1c: 3xx redirect response (including rejecting body cancel) is NOT followed, 0 global fetch.
let outboundFetchCalls = 0;
let redirectBodyCancels = 0;
const originalGlobalFetch = globalThis.fetch;
const redirectApp: InProcessServiceAppLike = {
  fetch() {
    return new Response(
      new ReadableStream({
        cancel() {
          redirectBodyCancels += 1;
          return Promise.reject(new Error('redirect-cancel-boom'));
        },
      }),
      {
        status: 302,
        headers: { location: 'http://external.example.test/steal-cred' },
      },
    );
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
assertEquals(redirectBodyCancels, 1);

// 4. Blocker 2 (R1-B3): Concurrent identical-header two-partition calls:
//    (a) Positive non-sharing parity gate on BOTH HTTP and in-process (POST):
//        2 handler entries and independently generated results on both transports.
//    (b) Baseline GET dedup negative observation on current main documenting the
//        unmet shared-SDK DedupeRequestsPlugin partition-key prerequisite.
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

let postIdenticalEntries = 0;
let postHold = deferred<void>();
let getIdenticalWireCalls = 0;
const getWireHold = deferred<void>();

const identicalHeaderRunning = await createService(
  os.router({
    echo: os.echo.handler(async ({ input, context }) => {
      getIdenticalWireCalls += 1;
      await getWireHold.promise;
      return {
        text: `${input.text}#${getIdenticalWireCalls}`,
        method: (context as { request: Request }).request.method,
        appId: 'wire-app',
      };
    }),
    echoPost: os.echoPost.handler(async ({ input, context }) => {
      const seq = ++postIdenticalEntries;
      await postHold.promise;
      return {
        text: `${input.text}#${seq}`,
        sequence: seq,
        method: (context as { request: Request }).request.method,
      };
    }),
    feed: os.feed.handler(async function* () {
      yield withEventMeta({ appId: 'wire-app', seq: 1, lastEventId: null }, { id: 'w-1' });
    }),
  }),
  { name: 'echo' },
).withContext((c) => ({ request: c.req.raw })).withRPC({ rpcPath }).serve({
  port: 0,
  hostname: 'localhost',
  handleSignals: false,
});

const identicalHeaderPostParity: Record<string, unknown> = {};
try {
  for (const mode of ['http', 'in-process'] as const) {
    postIdenticalEntries = 0;
    postHold = deferred<void>();
    const link = createHttpClientLink({
      transportPolicy,
      serviceName: 'echo',
      rpcPath,
      protocol: mode === 'http' ? 'http' : 'https',
      propagateTraceContext: false,
      getTraceHeaders: () => ({}),
      resolveServiceUrl: () =>
        mode === 'http'
          ? `http://localhost:${identicalHeaderRunning.addr.port}`
          : 'https://in-process.localhost',
      contributions: [sameHeaderPartitionContrib] as const,
      fetch: mode === 'http' ? globalThis.fetch : createInProcessFetch(identicalHeaderRunning.app),
    });
    // deno-lint-ignore no-explicit-any
    const client = createORPCClient(link as any) as any;
    const cache = new CacheQuery(new MemoryCacheStore());
    const pA = cache.query(
      ['echoPost', 'same', '$netscript.sdk-context', JSON.stringify([['probe:same-header', 'part-A']])],
      { queryFn: () => client.echoPost({ text: 'same' }, { context: { partition: 'part-A' } }) },
    );
    const pB = cache.query(
      ['echoPost', 'same', '$netscript.sdk-context', JSON.stringify([['probe:same-header', 'part-B']])],
      { queryFn: () => client.echoPost({ text: 'same' }, { context: { partition: 'part-B' } }) },
    );
    await new Promise((r) => setTimeout(r, 20));
    postHold.resolve();
    const [rA, rB] = await Promise.all([pA, pB]);
    assertEquals(postIdenticalEntries, 2);
    assertNotEquals(rA.sequence, rB.sequence);
    identicalHeaderPostParity[mode] = {
      handlerEntries: postIdenticalEntries,
      distinctResults: rA.sequence !== rB.sequence,
    };
  }

  // Baseline GET dedup measurement on current main (shared-SDK prerequisite).
  const getLink = createHttpClientLink({
    transportPolicy,
    serviceName: 'echo',
    rpcPath,
    protocol: 'https',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => 'https://in-process.localhost',
    contributions: [sameHeaderPartitionContrib] as const,
    fetch: createInProcessFetch(identicalHeaderRunning.app),
  });
  // deno-lint-ignore no-explicit-any
  const getClient = createORPCClient(getLink as any) as any;
  const gCache = new CacheQuery(new MemoryCacheStore());
  const gA = gCache.query(
    ['echo', 'same', '$netscript.sdk-context', JSON.stringify([['probe:same-header', 'part-A']])],
    { queryFn: () => getClient.echo({ text: 'same' }, { context: { partition: 'part-A' } }) },
  );
  const gB = gCache.query(
    ['echo', 'same', '$netscript.sdk-context', JSON.stringify([['probe:same-header', 'part-B']])],
    { queryFn: () => getClient.echo({ text: 'same' }, { context: { partition: 'part-B' } }) },
  );
  await new Promise((r) => setTimeout(r, 20));
  getWireHold.resolve();
  await Promise.all([gA, gB]);
  assertEquals(getIdenticalWireCalls, 1);
} finally {
  await identicalHeaderRunning.stop();
}

// 5. Blocker 3 (R1-B4): Near-2083 URL-length boundary for BOTH method-insensitive
//    and method-sensitive authorizers + fixed-method parity restoration.
const lengthRunning = await createService(trustedRouter, { name: 'echo' })
  .withContext((c) => ({ request: c.req.raw }))
  .withRPC({ rpcPath })
  .serve({ port: 0, hostname: 'localhost', handleSignals: false });

const methodSensitiveRunning = await createService(trustedRouter, { name: 'echo' })
  .withContext((c) => ({ request: c.req.raw }))
  .withAuthn({
    authenticator: createStaticCredentialAuthenticator({
      credentials: {
        'tok-ms': { subject: 'reader', scopes: ['echo:read'], roles: [] },
      },
    }),
  })
  .withAuthz({
    authorizer: {
      authorize(req) {
        if (req.method === 'GET') {
          return { allow: true };
        }
        return { allow: false, reason: 'method_not_get' };
      },
    },
  })
  .withRPC({ rpcPath })
  .serve({ port: 0, hostname: 'localhost', handleSignals: false });

let urlLengthReport: Record<string, unknown>;
try {
  const shortHttpOrigin = `http://localhost:${lengthRunning.addr.port}`;
  const longSyntheticOrigin = 'https://in-process.localhost';
  assert(longSyntheticOrigin.length > shortHttpOrigin.length);

  const emptyQueryLen = `?data=${encodeURIComponent(JSON.stringify({ json: { text: '' } }))}`.length;
  const httpBaseLen = shortHttpOrigin.length + rpcPath.length + '/echo'.length + emptyQueryLen;
  const payload = 'a'.repeat(2083 - httpBaseLen - 1);

  // (5a) Method-insensitive policy: GET vs POST overflow yields byte-identical output.
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
  const httpOut = await (createORPCClient(httpLenLink as any) as any).echo({ text: payload });
  // deno-lint-ignore no-explicit-any
  const inProcOut = await (createORPCClient(inProcLenLink as any) as any).echo({ text: payload });
  assertEquals(httpOut.text, inProcOut.text);
  assertEquals(httpOut.method, 'GET');
  assertEquals(inProcOut.method, 'POST');

  // (5b) Method-sensitive authorizer (allows GET only): HTTP GET -> 200, in-process POST -> 403.
  const msHttpOrigin = `http://localhost:${methodSensitiveRunning.addr.port}`;
  const msHttpBaseLen = msHttpOrigin.length + rpcPath.length + '/echo'.length + emptyQueryLen;
  const msPayload = 'b'.repeat(2083 - msHttpBaseLen - 1);
  const msHttpLink = createHttpClientLink({
    transportPolicy,
    serviceName: 'echo',
    rpcPath,
    protocol: 'http',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => msHttpOrigin,
    contributions: [bearerContribution] as const,
  });
  const msInProcLink = createHttpClientLink({
    transportPolicy,
    serviceName: 'echo',
    rpcPath,
    protocol: 'https',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => longSyntheticOrigin,
    contributions: [bearerContribution] as const,
    fetch: createInProcessFetch(methodSensitiveRunning.app),
  });
  // deno-lint-ignore no-explicit-any
  const msHttpRes = await safe(
    (createORPCClient(msHttpLink as any) as any).echo(
      { text: msPayload },
      { context: { token: 'tok-ms' } },
    ),
  );
  // deno-lint-ignore no-explicit-any
  const msInProcRes = await safe(
    (createORPCClient(msInProcLink as any) as any).echo(
      { text: msPayload },
      { context: { token: 'tok-ms' } },
    ),
  );
  assertEquals(msHttpRes.isSuccess, true);
  assertEquals(msInProcRes.isSuccess, false);
  assertEquals((!msInProcRes.isSuccess ? (msInProcRes.error as { status?: number }).status : null), 403);

  // (5c) Holding verb constant via transportPolicy.method (() => 'POST') restores exact auth parity (both 403).
  const fixedPostPolicy = resolveTransportPolicy(controlContract, {
    transportPolicy: { method: () => 'POST' },
  });
  const msFixedHttpLink = createHttpClientLink({
    transportPolicy: fixedPostPolicy,
    serviceName: 'echo',
    rpcPath,
    protocol: 'http',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => msHttpOrigin,
    contributions: [bearerContribution] as const,
  });
  const msFixedInProcLink = createHttpClientLink({
    transportPolicy: fixedPostPolicy,
    serviceName: 'echo',
    rpcPath,
    protocol: 'https',
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => longSyntheticOrigin,
    contributions: [bearerContribution] as const,
    fetch: createInProcessFetch(methodSensitiveRunning.app),
  });
  // deno-lint-ignore no-explicit-any
  const fixedHttpRes = await safe(
    (createORPCClient(msFixedHttpLink as any) as any).echo(
      { text: msPayload },
      { context: { token: 'tok-ms' } },
    ),
  );
  // deno-lint-ignore no-explicit-any
  const fixedInProcRes = await safe(
    (createORPCClient(msFixedInProcLink as any) as any).echo(
      { text: msPayload },
      { context: { token: 'tok-ms' } },
    ),
  );
  assertEquals(fixedHttpRes.isSuccess, false);
  assertEquals(fixedInProcRes.isSuccess, false);
  assertEquals((!fixedHttpRes.isSuccess ? (fixedHttpRes.error as { status?: number }).status : null), 403);
  assertEquals((!fixedInProcRes.isSuccess ? (fixedInProcRes.error as { status?: number }).status : null), 403);

  urlLengthReport = {
    methodInsensitive: {
      payloadLen: payload.length,
      httpFullUrlLen: httpBaseLen + payload.length,
      inProcFullUrlLen:
        longSyntheticOrigin.length + rpcPath.length + '/echo'.length + emptyQueryLen + payload.length,
      httpMethod: httpOut.method,
      inProcMethod: inProcOut.method,
      decodedPayloadIdentical: httpOut.text === inProcOut.text,
    },
    methodSensitiveAuthorizer: {
      httpAllowedGet: msHttpRes.isSuccess,
      inProcPostDenied403: !msInProcRes.isSuccess &&
        (msInProcRes.error as { status?: number }).status === 403,
      fixedPostMethodParityBoth403: !fixedHttpRes.isSuccess &&
        !fixedInProcRes.isSuccess &&
        (fixedHttpRes.error as { status?: number }).status === 403 &&
        (fixedInProcRes.error as { status?: number }).status === 403,
    },
  };
} finally {
  await lengthRunning.stop();
  await methodSensitiveRunning.stop();
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
  assertEquals(inProcRes1.status, 200);
  assertEquals(inProcRes2.status, 429);
  defaultRlReport = {
    httpStatuses: [httpRes1.status, httpRes2.status],
    inProcStatusesSeparateBucket: [inProcRes1.status, inProcRes2.status],
  };
} finally {
  await defaultRlRunning.stop();
}

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
  const inProcFetch = createInProcessFetch(logicalRlRunning.app);
  const inProcSecond = await inProcFetch(
    `https://in-process.localhost${rpcPath}/echo`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-principal': 'user-42' },
      body: JSON.stringify({ json: { text: '2' } }),
    },
  );
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
      epochBindingAndReplacement: {
        epoch1AppId: epoch1Out.appId,
        epoch2AppId: epoch2Out.appId,
        retainedDescriptorsCount: retainedDescriptors.length,
        activeEpochBindingsAfterAllExits: epochMap.size,
        unaryRetryAttemptsPinnedToApp1: app1UnaryAttempts,
        streamReconnectEvents: feedEvents,
        streamReconnectRepreparedHeader: app1FeedHeader !== app2FeedHeader,
      },
      redirectControl: {
        failedWithoutFollowing: !(redirectResult as { isSuccess: boolean }).isSuccess,
        outboundFetchCalls,
        redirectBodyCancels,
      },
      identicalHeaderCrossPartition: {
        postNonSharingBothTransports: identicalHeaderPostParity,
        currentMainGetWireCallsUnmetPrerequisite: getIdenticalWireCalls,
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
