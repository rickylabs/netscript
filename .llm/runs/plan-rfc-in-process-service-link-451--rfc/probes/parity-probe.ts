/**
 * Runnable RFC 0000 parity, both-transport abort-barrier, and full-body-lifecycle
 * OpenTelemetry boundary verification probe.
 *
 * Run with:
 *   deno run --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/parity-probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
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
import {
  configure as configureLogger,
  getLogger,
  withContext as withLogContext,
} from '@netscript/logger';
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
import {
  createInProcessFetch,
  resolveInProcessOrigin,
} from './in-process-fetch-adapter.ts';

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
const vaultInProcessOrigin = resolveInProcessOrigin('vault').origin;

function buildLink(mode: 'http' | 'in-process', propagateTraceContext: boolean, app: ServiceApp) {
  return createHttpClientLink({
    transportPolicy,
    serviceName: 'vault',
    rpcPath,
    protocol: mode === 'http' ? 'http' : 'https',
    propagateTraceContext,
    getTraceHeaders: () => ({}),
    resolveServiceUrl: () => mode === 'http' ? httpOrigin : vaultInProcessOrigin,
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

  // 2. Trace propagation (true) and OTel ROOT_CONTEXT detachment (false) across unary + full body lifecycle.
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
        tracestate: 'ns=round3',
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
        assertEquals(response.tracestate, 'ns=round3');
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

  // 2b. Full body-lifecycle telemetry boundary (deferred pull, post-headers abort cancel,
  //     consumer cancel, and late-body cancel after caller rejection) under both propagation modes.
  const bodyLifecycleTelemetry: Record<string, unknown> = {};
  for (const propagate of [false, true]) {
    let observedFetchSpanId: string | null = null;
    let observedPullSpanId: string | null = null;
    let observedPostHeadersAbortCancelSpanId: string | null = null;
    let observedConsumerCancelSpanId: string | null = null;
    let observedLateBodyCancelSpanId: string | null = null;
    let observedPullSawTraceHeader = false;

    const lateFetchRelease = deferred<void>();

    const streamingApp = {
      fetch(req: Request) {
        observedFetchSpanId = trace.getSpan(otelContext.active())?.spanContext().spanId ?? null;
        const url = new URL(req.url);
        const kind = url.searchParams.get('kind');
        const hasTraceparent = req.headers.has('traceparent');
        if (kind === 'late') {
          return lateFetchRelease.promise.then(() =>
            new Response(
              new ReadableStream<Uint8Array>({
                cancel() {
                  observedLateBodyCancelSpanId =
                    trace.getSpan(otelContext.active())?.spanContext().spanId ?? null;
                },
              }),
            )
          );
        }
        let sentFirst = false;
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            observedPullSpanId = trace.getSpan(otelContext.active())?.spanContext().spanId ?? null;
            observedPullSawTraceHeader = hasTraceparent;
            if (!sentFirst) {
              sentFirst = true;
              controller.enqueue(new TextEncoder().encode('chunk-1'));
              return;
            }
            return new Promise(() => {});
          },
          cancel() {
            const activeSpanId = trace.getSpan(otelContext.active())?.spanContext().spanId ?? null;
            if (kind === 'abort') {
              observedPostHeadersAbortCancelSpanId = activeSpanId;
            } else {
              observedConsumerCancelSpanId = activeSpanId;
            }
          },
        });
        return new Response(body, { status: 200 });
      },
    };

    const inProcFetch = createInProcessFetch(streamingApp);
    const parentCtx = propagation.extract(otelContext.active(), {
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      tracestate: 'ns=body',
    });

    await otelContext.with(parentCtx, async () =>
      await tracer.startActiveSpan('caller.body.op', async (span) => {
        try {
          const baseHeaders = propagate
            ? { traceparent: `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01` }
            : {};

          // (i) Post-headers pull + abort cancel inside active caller span.
          const abortCtrl = new AbortController();
          const res1 = await inProcFetch(`${vaultInProcessOrigin}/stream?kind=abort`, {
            headers: baseHeaders,
            signal: abortCtrl.signal,
          });
          const reader1 = res1.body!.getReader();
          const first = await reader1.read();
          assertEquals(new TextDecoder().decode(first.value), 'chunk-1');
          const pendingSecond = reader1.read();
          abortCtrl.abort(new Error('body-otel-abort'));
          try {
            await pendingSecond;
          } catch {
            // Expected abort rejection.
          }

          // (ii) Unsignalled stream pull + consumer cancel inside active caller span.
          const res2 = await inProcFetch(`${vaultInProcessOrigin}/stream?kind=consumer`, {
            headers: baseHeaders,
          });
          const reader2 = res2.body!.getReader();
          await reader2.read();
          await reader2.cancel('done');

          // (iii) Late-body cancel after caller rejection inside active caller span.
          const lateCtrl = new AbortController();
          const lateReq = inProcFetch(`${vaultInProcessOrigin}/stream?kind=late`, {
            headers: baseHeaders,
            signal: lateCtrl.signal,
          });
          lateCtrl.abort(new Error('late-otel-abort'));
          try {
            await lateReq;
          } catch {
            // Expected abort rejection.
          }
          lateFetchRelease.resolve();
          await new Promise((r) => setTimeout(r, 15));
        } finally {
          span.end();
        }
      })
    );

    assertEquals(observedFetchSpanId, null);
    assertEquals(observedPullSpanId, null);
    assertEquals(observedPostHeadersAbortCancelSpanId, null);
    assertEquals(observedConsumerCancelSpanId, null);
    assertEquals(observedLateBodyCancelSpanId, null);
    assertEquals(observedPullSawTraceHeader, propagate);

    bodyLifecycleTelemetry[`propagate_${propagate}`] = {
      observedFetchSpanId,
      observedPullSpanId,
      observedPostHeadersAbortCancelSpanId,
      observedConsumerCancelSpanId,
      observedLateBodyCancelSpanId,
      observedPullSawTraceHeader,
    };
  }

  // 2c. Non-OTel AsyncLocalStorage & @netscript/logger detachment, withBodyLimit 413
  //     streaming-path parity, and measured authority / implicit Fetch header boundary.
  const calleeLogRecords: Record<string, Record<string, unknown>[]> = {
    http: [],
    'in-process': [],
  };
  const callerLogControlRecords: Record<string, unknown>[] = [];
  let activeBoundaryMode: 'http' | 'in-process' = 'http';
  await configureLogger({
    reset: true,
    contextLocalStorage: new AsyncLocalStorage(),
    sinks: {
      boundaryMem: (record) => {
        calleeLogRecords[activeBoundaryMode].push({ ...record.properties });
      },
      callerCtrlMem: (record) => {
        callerLogControlRecords.push({ ...record.properties });
      },
    },
    loggers: [
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'fatal' },
      { category: ['probe', 'parity-boundary'], sinks: ['boundaryMem'], lowestLevel: 'info' },
      { category: ['probe', 'parity-caller-ctrl'], sinks: ['callerCtrlMem'], lowestLevel: 'info' },
    ],
  });
  const callerUserAls = new AsyncLocalStorage<string>();
  const boundaryLogger = getLogger(['probe', 'parity-boundary']);
  const callerCtrlLogger = getLogger(['probe', 'parity-caller-ctrl']);
  const boundaryContract = {
    echoBounded: oc
      .route({ method: 'POST' })
      .input(z.object({ text: z.string() }))
      .output(
        z.object({
          text: z.string(),
          alsStore: z.string().nullable(),
          origin: z.string(),
          headerKeys: z.array(z.string()),
        }),
      ),
  };
  const bOs = implement(boundaryContract);
  const boundaryRpcPath = buildServiceRpcPath({ routerName: 'bounded' });
  const boundaryRunning = await createService(
    bOs.router({
      echoBounded: bOs.echoBounded.handler(({ input, context }) => {
        const req = (context as { request: Request }).request;
        boundaryLogger.info('bounded-handler');
        return {
          text: input.text,
          alsStore: callerUserAls.getStore() ?? null,
          origin: new URL(req.url).origin,
          headerKeys: [...req.headers.keys()].sort(),
        };
      }),
    }),
    { name: 'bounded' },
  )
    .withContext((c) => ({ request: c.req.raw }))
    .withBodyLimit({ maxBytes: 64 })
    .withRPC({ rpcPath: boundaryRpcPath })
    .serve({ port: 0, hostname: 'localhost', handleSignals: false });

  const alsAndBodyLimitReport: Record<string, unknown> = {};
  try {
    const boundaryPolicy = resolveTransportPolicy(boundaryContract);
    const boundaryHttpOrigin = `http://localhost:${boundaryRunning.addr.port}`;
    const boundaryInProcOrigin = resolveInProcessOrigin('bounded').origin;
    for (const mode of ['http', 'in-process'] as const) {
      activeBoundaryMode = mode;
      const bLink = createHttpClientLink({
        transportPolicy: boundaryPolicy,
        serviceName: 'bounded',
        rpcPath: boundaryRpcPath,
        protocol: mode === 'http' ? 'http' : 'https',
        propagateTraceContext: false,
        getTraceHeaders: () => ({}),
        resolveServiceUrl: () => mode === 'http' ? boundaryHttpOrigin : boundaryInProcOrigin,
        fetch: mode === 'http' ? globalThis.fetch : createInProcessFetch(boundaryRunning.app),
      });
      // deno-lint-ignore no-explicit-any
      const bClient = createORPCClient(bLink as any) as any;

      const smallOut = await withLogContext(
        { callerOnlyField: 'caller-log-ctx', callerTenant: 'tenant-secret' },
        () =>
          callerUserAls.run('caller-tx-ctx', () => {
            callerCtrlLogger.info(`caller-before-${mode}`);
            assertEquals(callerUserAls.getStore(), 'caller-tx-ctx');
            return bClient.echoBounded({ text: 'ok' });
          }),
      );
      const oversizeRaw = await (mode === 'http'
        ? globalThis.fetch(`${boundaryHttpOrigin}${boundaryRpcPath}/echoBounded`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ json: { text: 'x'.repeat(200) } }),
        })
        : createInProcessFetch(boundaryRunning.app)(
          `${boundaryInProcOrigin}${boundaryRpcPath}/echoBounded`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ json: { text: 'x'.repeat(200) } }),
          },
        ));
      const oversizeBody = await oversizeRaw.json();
      const oversizeRpc = await safe(bClient.echoBounded({ text: 'x'.repeat(200) }));

      assertEquals(smallOut.alsStore, null);
      assertEquals(calleeLogRecords[mode].length, 1);
      assertEquals(calleeLogRecords[mode][0], {});
      assertEquals(callerLogControlRecords.at(-1), {
        callerOnlyField: 'caller-log-ctx',
        callerTenant: 'tenant-secret',
      });
      assertEquals(oversizeRaw.status, 413);
      assertEquals(oversizeBody, {
        error: 'PAYLOAD_TOO_LARGE',
        message: 'Request body exceeds 64 bytes',
        maxBytes: 64,
      });
      assertEquals(oversizeRpc.isSuccess, false);
      if (!oversizeRpc.isSuccess) {
        assertEquals((oversizeRpc.error as { status?: number }).status, 413);
      }

      alsAndBodyLimitReport[mode] = {
        alsStore: smallOut.alsStore,
        calleeLogProperties: calleeLogRecords[mode][0],
        origin: smallOut.origin,
        headerKeys: smallOut.headerKeys,
        oversizeStatus: oversizeRaw.status,
        oversizeBody,
        oversizeRpcStatus: !oversizeRpc.isSuccess
          ? (oversizeRpc.error as { status?: number }).status
          : null,
      };
    }
  } finally {
    await boundaryRunning.stop();
  }

  // 3. Blocker 1/2 barrier suite across BOTH HTTP and in-process transports:
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
    await preAbortFetch(`${vaultInProcessOrigin}/api/rpc/v1/vault/x`, {
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
    await syncAbortFetch(`${vaultInProcessOrigin}/api/rpc/v1/vault/x`, {
      signal: syncCtrl.signal,
    });
  } catch (err) {
    syncAbortErr = err;
  }
  await new Promise((r) => setTimeout(r, 15));
  assertEquals((syncAbortErr as Error).message, 'sync-setup-abort');
  assertEquals(syncAbortBodyCancels, 1);

  // (c) Explicit entry / abort-observed / release barriers with fresh same-key
  //     dispatch BEFORE release and zero abandoned cache write across BOTH HTTP and in-process.
  const bothTransportBarriers: Record<string, unknown> = {};
  for (const mode of ['http', 'in-process'] as const) {
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

    const link = buildLink(mode, false, mode === 'in-process' ? trackedApp : running.app);
    // deno-lint-ignore no-explicit-any
    const client = createORPCClient(link as any) as any;
    const abortCacheStore = new MemoryCacheStore();
    const abortCacheQuery = new CacheQuery(abortCacheStore);
    const abortCtrl = new AbortController();

    const cacheKey = ['vault', 'gatedPost', `${mode}-same-key`] as const;
    const abandonedResult = abortCacheQuery.query(cacheKey, {
      queryFn: () =>
        client.gatedPost(
          { key: `${mode}-same-key`, hold: true },
          { context: { token: 'tok-alice', partition: 'ctx-alice', signal: abortCtrl.signal } },
        ),
    }).then(
      (value) => ({ ok: true as const, value }),
      (error) => ({ ok: false as const, error }),
    );

    // Wait for handler entry barrier, then abort.
    await holdEntry.promise;
    abortCtrl.abort(new Error(`barrier-abort-${mode}`));

    // Assert handler observed abort AND caller rejected BEFORE releasing holdRelease.
    await holdAbortObserved.promise;
    const settledAbandoned = await abandonedResult;
    assertEquals(settledAbandoned.ok, false);
    const abandonedErr = settledAbandoned.ok ? undefined : settledAbandoned.error;
    assertEquals((abandonedErr as Error).message, `barrier-abort-${mode}`);
    assertEquals(await abortCacheQuery.getCachedData(cacheKey), null);

    // Fresh same-key dispatch succeeds BEFORE releasing the abandoned handler.
    const freshRes = await abortCacheQuery.query(cacheKey, {
      queryFn: () =>
        client.gatedPost(
          { key: `${mode}-same-key`, hold: false },
          { context: { token: 'tok-alice', partition: 'ctx-alice' } },
        ),
    });
    assertEquals(freshRes.key, `${mode}-same-key`);
    assertEquals(freshRes.owner, 'alice');
    const freshSequence = freshRes.sequence;

    // Now release the abandoned handler; verify zero cache overwrite (+ 1 late cancel on in-process).
    holdRelease.resolve();
    await new Promise((r) => setTimeout(r, 30));
    const cachedAfterRelease = await abortCacheQuery.getCachedData<{ sequence: number }>(cacheKey);
    assertEquals(cachedAfterRelease?.sequence, freshSequence);
    if (mode === 'in-process') {
      assertEquals(lateTrackedBodyCancels, 1);
    }

    bothTransportBarriers[mode] = {
      abandonedMessage: (abandonedErr as Error).message,
      handlerObservedAbortBeforeRelease: true,
      freshSucceededBeforeRelease: freshRes.sequence === freshSequence,
      cachePreservedAfterAbandonedRelease: cachedAfterRelease?.sequence === freshSequence,
      ...(mode === 'in-process' ? { lateTrackedBodyCancels } : {}),
    };
  }

  // (d) Post-headers non-cooperative streaming Response.body abort + immediate unlock check.
  let streamCancelCount = 0;
  let sourceStream!: ReadableStream<Uint8Array>;
  const hungStreamFetch = createInProcessFetch({
    fetch() {
      sourceStream = new ReadableStream<Uint8Array>({
        pull() {
          return new Promise(() => {});
        },
        cancel() {
          streamCancelCount += 1;
        },
      });
      return new Response(sourceStream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });
    },
  });
  const bodyCtrl = new AbortController();
  const streamResponse = await hungStreamFetch(`${vaultInProcessOrigin}/api/rpc/v1/vault/stream`, {
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
  assertEquals(sourceStream.locked, false);

  console.log(
    JSON.stringify(
      {
        parity: results,
        tracing: traceReport,
        bodyLifecycleTelemetry,
        alsAndBodyLimitParity: alsAndBodyLimitReport,
        abortBarriers: {
          preAbortedEntered,
          syncAbortMessage: (syncAbortErr as Error).message,
          syncAbortBodyCancels,
          bothTransports: bothTransportBarriers,
          postHeadersStreamAbortMessage: (streamReadErr as Error).message,
          postHeadersStreamCancelCount: streamCancelCount,
          postHeadersSourceUnlocked: !sourceStream.locked,
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
