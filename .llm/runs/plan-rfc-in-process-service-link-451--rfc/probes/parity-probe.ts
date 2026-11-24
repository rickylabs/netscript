/**
 * Runnable RFC 0000 parity and abort-lifecycle verification probe.
 *
 * Run with:
 *   deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/parity-probe.ts
 */

import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { oc } from 'npm:@orpc/contract@^1.15.5';
import { implement } from 'npm:@orpc/server@^1.15.5';
import { createORPCClient } from 'npm:@orpc/client@^1.15.5';
import { z } from 'npm:zod@^4.6.5';
import { context as otelContext, propagation, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.7.1';
import { W3CTraceContextPropagator } from 'npm:@opentelemetry/core@^2.7.1';
import { createService, type ServiceApp } from '@netscript/service';
import {
  createScopeAuthorizer,
  createStaticCredentialAuthenticator,
} from '@netscript/service/auth';
import { buildServiceRpcPath } from '@netscript/service/rpc-path';
import { CacheQuery } from '@netscript/sdk/cache';
import {
  defineSdkClientContribution,
  isDefinedError,
  safe,
} from '@netscript/sdk/client';
import { createHttpClientLink } from '../../../../packages/sdk/src/client/http-client-link.ts';
import { resolveTransportPolicy } from '../../../../packages/sdk/src/internal/transport-policy.ts';
import { MemoryCacheStore } from '../../../../packages/sdk/tests/test-helpers.ts';
import { createInProcessFetch } from './in-process-fetch-adapter.ts';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Configure OTel ALS context manager, W3C propagator, and in-memory exporter.
const contextManager = new AsyncLocalStorageContextManager().enable();
otelContext.setGlobalContextManager(contextManager);
propagation.setGlobalPropagator(new W3CTraceContextPropagator());
const spanExporter = new InMemorySpanExporter();
const tracerProvider = new BasicTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(spanExporter)],
});
trace.setGlobalTracerProvider(tracerProvider);

const vaultContract = {
  readSecret: oc
    .route({ method: 'GET' })
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        id: z.string(),
        owner: z.string(),
        path: z.string(),
        traceparent: z.string().nullable(),
        tracestate: z.string().nullable(),
      }),
    )
    .errors({
      VAULT_LOCKED: {
        status: 409,
        data: z.object({ vaultId: z.string(), reason: z.string() }),
      },
    }),
  gatedPost: oc
    .route({ method: 'POST' })
    .input(z.object({ key: z.string(), hold: z.boolean() }))
    .output(z.object({ key: z.string(), sequence: z.number(), owner: z.string() })),
};

let holdEntry = deferred<void>();
let holdAbortObserved = deferred<void>();
let holdRelease = deferred<void>();
let postSequence = 0;

const os = implement(vaultContract);
const vaultRouter = os.router({
  readSecret: os.readSecret.handler(({ input, context, errors }) => {
    const svc = context as {
      request: Request;
      principal?: { subject: string };
      traceHeaders?: { traceparent?: string; tracestate?: string };
    };
    if (input.id === 'locked') {
      throw errors.VAULT_LOCKED({
        message: 'Vault is sealed',
        data: { vaultId: input.id, reason: 'maintenance' },
      });
    }
    return {
      id: input.id,
      owner: svc.principal?.subject ?? 'anonymous',
      path: new URL(svc.request.url).pathname,
      traceparent: svc.traceHeaders?.traceparent ?? null,
      tracestate: svc.traceHeaders?.tracestate ?? null,
    };
  }),
  gatedPost: os.gatedPost.handler(async ({ input, context, signal }) => {
    const svc = context as { principal?: { subject: string } };
    const seq = ++postSequence;
    if (input.hold) {
      if (signal?.aborted) {
        holdAbortObserved.resolve();
      } else {
        signal?.addEventListener('abort', () => holdAbortObserved.resolve(), { once: true });
      }
      holdEntry.resolve();
      await holdRelease.promise;
    }
    return {
      key: input.key,
      sequence: seq,
      owner: svc.principal?.subject ?? 'anonymous',
    };
  }),
});

const rpcPath = buildServiceRpcPath({ routerName: 'vault' });
const running = await createService(vaultRouter, { name: 'vault' })
  .withContext((c) => ({ request: c.req.raw }))
  .withAuthn({
    authenticator: createStaticCredentialAuthenticator({
      credentials: {
        'tok-alice': { subject: 'alice', scopes: ['vault:read'], roles: ['reader'] },
        'tok-bob': { subject: 'bob', scopes: ['vault:read'], roles: ['reader'] },
        'tok-mallory': { subject: 'mallory', scopes: [], roles: [] },
      },
    }),
  })
  .withAuthz({
    authorizer: createScopeAuthorizer({
      rules: [{
        match: (req) => req.path.startsWith(rpcPath),
        requireScopes: ['vault:read'],
      }],
    }),
  })
  .withRPC({ rpcPath, traceContext: true })
  .serve({ port: 0, hostname: 'localhost', handleSignals: false });

const authContribution = defineSdkClientContribution<{
  token: string;
  partition: string;
}>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'probe:vault-auth',
  context: { token: 'required', partition: 'required' },
  headerKeys: ['authorization'],
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.partition,
  },
  prepare: ({ context }) => ({
    headers: { authorization: `Bearer ${context.token}` },
  }),
});

const transportPolicy = resolveTransportPolicy(vaultContract);
const httpOrigin = `http://localhost:${running.addr.port}`;

function buildLink(mode: 'http' | 'in-process', propagateTraceContext: boolean, app: ServiceApp) {
  return createHttpClientLink({
    transportPolicy,
    serviceName: 'vault',
    rpcPath,
    protocol: mode === 'http' ? 'http' : 'https',
    propagateTraceContext,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => mode === 'http' ? httpOrigin : 'https://in-process.localhost',
    contributions: [authContribution] as const,
    fetch: mode === 'http' ? globalThis.fetch : createInProcessFetch(app),
  });
}

try {
  // 1. Single-app parity: path, 2 authorized partitions, 401/403 denials, contract-defined error, cache isolation.
  const results: Record<string, unknown> = {};
  for (const mode of ['http', 'in-process'] as const) {
    const link = buildLink(mode, true, running.app);
    // deno-lint-ignore no-explicit-any
    const client = createORPCClient(link as any) as any;
    const store = new MemoryCacheStore();
    const cacheQuery = new CacheQuery(store);

    const ctxA = { token: 'tok-alice', partition: 'ctx-alice' };
    const ctxB = { token: 'tok-bob', partition: 'ctx-bob' };
    const ctx403 = { token: 'tok-mallory', partition: 'ctx-403' };
    const ctx401 = { token: 'tok-invalid', partition: 'ctx-401' };

    const keyA = [
      'vault',
      'readSecret',
      '{"id":"s-1"}',
      '$netscript.sdk-context',
      JSON.stringify([['probe:vault-auth', 'ctx-alice']]),
    ] as const;
    const keyB = [
      'vault',
      'readSecret',
      '{"id":"s-1"}',
      '$netscript.sdk-context',
      JSON.stringify([['probe:vault-auth', 'ctx-bob']]),
    ] as const;
    const key403 = [
      'vault',
      'readSecret',
      '{"id":"s-1"}',
      '$netscript.sdk-context',
      JSON.stringify([['probe:vault-auth', 'ctx-403']]),
    ] as const;

    const resA = await cacheQuery.query(keyA, {
      queryFn: () => client.readSecret({ id: 's-1' }, { context: ctxA }),
    });
    const resB = await cacheQuery.query(keyB, {
      queryFn: () => client.readSecret({ id: 's-1' }, { context: ctxB }),
    });
    const deny401 = await safe(client.readSecret({ id: 's-1' }, { context: ctx401 }));
    const deny403 = await safe(
      cacheQuery.query(key403, {
        queryFn: () => client.readSecret({ id: 's-1' }, { context: ctx403 }),
      }),
    );
    const definedErr = await safe(client.readSecret({ id: 'locked' }, { context: ctxA }));
    const cached403 = await cacheQuery.getCachedData(key403);

    assertEquals(resA.owner, 'alice');
    assertEquals(resB.owner, 'bob');
    assertEquals(resA.path, '/api/rpc/v1/vault/readSecret');
    assertEquals(deny401.isSuccess, false);
    assertEquals(deny403.isSuccess, false);
    assertEquals(cached403, null);
    assertEquals(definedErr.isSuccess, false);
    if (!definedErr.isSuccess) {
      assertEquals(isDefinedError(definedErr.error), true);
      assertEquals((definedErr.error as { code?: string }).code, 'VAULT_LOCKED');
      assertEquals((definedErr.error as { status?: number }).status, 409);
      assertEquals((definedErr.error as { data?: unknown }).data, {
        vaultId: 'locked',
        reason: 'maintenance',
      });
    }

    results[mode] = {
      path: resA.path,
      ownerA: resA.owner,
      ownerB: resB.owner,
      deny401: !deny401.isSuccess
        ? {
          isDefined: deny401.isDefined,
          code: (deny401.error as { code?: string }).code,
          status: (deny401.error as { status?: number }).status,
        }
        : null,
      deny403: !deny403.isSuccess
        ? {
          isDefined: deny403.isDefined,
          code: (deny403.error as { code?: string }).code,
          status: (deny403.error as { status?: number }).status,
        }
        : null,
      definedError: !definedErr.isSuccess
        ? {
          isDefined: definedErr.isDefined,
          code: (definedErr.error as { code?: string }).code,
          status: (definedErr.error as { status?: number }).status,
          data: (definedErr.error as { data?: unknown }).data,
        }
        : null,
      cached403IsNull: cached403 === null,
    };
  }
  assertEquals(results['http'], results['in-process']);

  // 2. Trace propagation (true) and OTel ROOT_CONTEXT detachment (false).
  const traceReport: Record<string, unknown> = {};
  const tracer = trace.getTracer('probe-caller');
  for (const propagate of [true, false]) {
    for (const mode of ['http', 'in-process'] as const) {
      spanExporter.reset();
      const link = buildLink(mode, propagate, running.app);
      // deno-lint-ignore no-explicit-any
      const client = createORPCClient(link as any) as any;
      const parentCtx = propagation.extract(otelContext.active(), {
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        tracestate: 'ns=round2',
      });
      const response = await otelContext.with(parentCtx, async () =>
        await tracer.startActiveSpan('caller.op', async (span) => {
          try {
            return await client.readSecret(
              { id: 't-1' },
              { context: { token: 'tok-alice', partition: 'ctx-alice' } },
            );
          } finally {
            span.end();
          }
        })
      );
      const spans = spanExporter.getFinishedSpans();
      const callerSpan = spans.find((s) => s.name === 'caller.op')!;
      const clientSpan = spans.find((s) => s.name === 'rpc.client')!;
      const serverSpan = spans.find((s) => s.kind === 1)!;
      if (propagate) {
        assertEquals(serverSpan.spanContext().traceId, callerSpan.spanContext().traceId);
        assertEquals(serverSpan.parentSpanContext?.spanId, clientSpan.spanContext().spanId);
        assertEquals(response.tracestate, 'ns=round2');
      } else {
        assertNotEquals(serverSpan.spanContext().traceId, callerSpan.spanContext().traceId);
        assertEquals(serverSpan.parentSpanContext?.spanId ?? null, null);
        assertEquals(response.traceparent, null);
        assertEquals(response.tracestate, null);
      }
      traceReport[`${mode}_propagate_${propagate}`] = {
        sameTrace: serverSpan.spanContext().traceId === callerSpan.spanContext().traceId,
        serverParentEqualsClient:
          serverSpan.parentSpanContext?.spanId === clientSpan.spanContext().spanId,
        serverParentIsNull: (serverSpan.parentSpanContext?.spanId ?? null) === null,
        tracestate: response.tracestate,
      };
    }
  }

  // 3. Blocker 2 barrier suite:
  // (a) Pre-aborted zero-dispatch
  let preAbortedEntered = false;
  const preAbortFetch = createInProcessFetch({
    fetch() {
      preAbortedEntered = true;
      return new Response('should-not-run');
    },
  });
  const preCtrl = new AbortController();
  preCtrl.abort(new Error('already-aborted'));
  let preAbortErr: unknown;
  try {
    await preAbortFetch('https://in-process.localhost/api/rpc/v1/vault/x', {
      signal: preCtrl.signal,
    });
  } catch (err) {
    preAbortErr = err;
  }
  assertEquals(preAbortedEntered, false);
  assertEquals((preAbortErr as Error).message, 'already-aborted');

  // (b) Synchronous abort inside app.fetch setup + single late-body cancel
  let syncAbortBodyCancels = 0;
  const syncCtrl = new AbortController();
  const syncAbortFetch = createInProcessFetch({
    fetch() {
      syncCtrl.abort(new Error('sync-setup-abort'));
      return new Response(
        new ReadableStream({
          cancel() {
            syncAbortBodyCancels += 1;
          },
        }),
      );
    },
  });
  let syncAbortErr: unknown;
  try {
    await syncAbortFetch('https://in-process.localhost/api/rpc/v1/vault/x', {
      signal: syncCtrl.signal,
    });
  } catch (err) {
    syncAbortErr = err;
  }
  await new Promise((r) => setTimeout(r, 15));
  assertEquals((syncAbortErr as Error).message, 'sync-setup-abort');
  assertEquals(syncAbortBodyCancels, 1);

  // (c) Explicit entry / abort-observed / release barriers with fresh same-key
  //     dispatch BEFORE release, zero abandoned cache write, and single late-body cancel.
  holdEntry = deferred<void>();
  holdAbortObserved = deferred<void>();
  holdRelease = deferred<void>();
  let lateTrackedBodyCancels = 0;
  const trackedApp: ServiceApp = {
    async fetch(request, env) {
      const response = await running.app.fetch(request, env);
      const cloneBytes = new Uint8Array(await response.arrayBuffer());
      let sent = false;
      const trackedBody = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (!sent) {
            sent = true;
            controller.enqueue(cloneBytes);
          }
          controller.close();
        },
        cancel() {
          lateTrackedBodyCancels += 1;
        },
      });
      return new Response(trackedBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    },
    request: running.app.request,
  };

  const inProcLink = buildLink('in-process', false, trackedApp);
  // deno-lint-ignore no-explicit-any
  const inProcClient = createORPCClient(inProcLink as any) as any;
  const abortCacheStore = new MemoryCacheStore();
  const abortCacheQuery = new CacheQuery(abortCacheStore);
  const abortCtrl = new AbortController();

  const abandonedPromise = abortCacheQuery.query(['vault', 'gatedPost', 'same-key'], {
    queryFn: () =>
      inProcClient.gatedPost(
        { key: 'same-key', hold: true },
        { context: { token: 'tok-alice', partition: 'ctx-alice', signal: abortCtrl.signal } },
      ),
  });

  // Wait for handler entry barrier, then abort.
  await holdEntry.promise;
  abortCtrl.abort(new Error('barrier-abort'));

  // Assert handler observed abort AND caller rejected BEFORE releasing holdRelease.
  await holdAbortObserved.promise;
  let abandonedErr: unknown;
  try {
    await abandonedPromise;
  } catch (err) {
    abandonedErr = err;
  }
  assertEquals((abandonedErr as Error).message, 'barrier-abort');
  assertEquals(
    await abortCacheQuery.getCachedData(['vault', 'gatedPost', 'same-key']),
    null,
  );

  // Fresh same-key dispatch succeeds BEFORE releasing the abandoned handler.
  const freshRes = await abortCacheQuery.query(['vault', 'gatedPost', 'same-key'], {
    queryFn: () =>
      inProcClient.gatedPost(
        { key: 'same-key', hold: false },
        { context: { token: 'tok-alice', partition: 'ctx-alice' } },
      ),
  });
  assertEquals(freshRes.key, 'same-key');
  assertEquals(freshRes.owner, 'alice');
  const freshSequence = freshRes.sequence;

  // Now release the abandoned handler; verify zero cache overwrite and exactly 1 late-body cancel.
  holdRelease.resolve();
  await new Promise((r) => setTimeout(r, 25));
  const cachedAfterRelease = await abortCacheQuery.getCachedData<{ sequence: number }>([
    'vault',
    'gatedPost',
    'same-key',
  ]);
  assertEquals(cachedAfterRelease?.sequence, freshSequence);
  assertEquals(lateTrackedBodyCancels, 1);

  // (d) Post-headers non-cooperative streaming Response.body abort.
  let streamCancelCount = 0;
  const hungStreamFetch = createInProcessFetch({
    fetch() {
      const hungBody = new ReadableStream<Uint8Array>({
        pull() {
          // Intentionally never resolves and ignores request.signal.
          return new Promise(() => {});
        },
        cancel() {
          streamCancelCount += 1;
        },
      });
      return new Response(hungBody, { status: 200, headers: { 'content-type': 'text/event-stream' } });
    },
  });
  const bodyCtrl = new AbortController();
  const streamResponse = await hungStreamFetch('https://in-process.localhost/api/rpc/v1/vault/stream', {
    signal: bodyCtrl.signal,
  });
  const reader = streamResponse.body!.getReader();
  const pendingRead = reader.read();
  bodyCtrl.abort(new Error('mid-stream-abort'));
  let streamReadErr: unknown;
  try {
    await pendingRead;
  } catch (err) {
    streamReadErr = err;
  }
  await new Promise((r) => setTimeout(r, 15));
  assertEquals((streamReadErr as Error).message, 'mid-stream-abort');
  assertEquals(streamCancelCount, 1);

  console.log(
    JSON.stringify(
      {
        parity: results,
        tracing: traceReport,
        abortBarriers: {
          preAbortedEntered,
          syncAbortMessage: (syncAbortErr as Error).message,
          syncAbortBodyCancels,
          abandonedMessage: (abandonedErr as Error).message,
          freshSucceededBeforeRelease: freshRes.sequence === freshSequence,
          cachePreservedAfterAbandonedRelease: cachedAfterRelease?.sequence === freshSequence,
          lateTrackedBodyCancels,
          postHeadersStreamAbortMessage: (streamReadErr as Error).message,
          postHeadersStreamCancelCount: streamCancelCount,
        },
      },
      null,
      2,
    ),
  );
  assert(true);
} finally {
  await running.stop();
  await tracerProvider.shutdown();
  contextManager.disable();
}
