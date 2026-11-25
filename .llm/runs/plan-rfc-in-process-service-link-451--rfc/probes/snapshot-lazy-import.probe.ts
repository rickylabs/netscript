/**
 * Lazy-import AsyncLocalStorage.snapshot() hazard probe and oRPC v2 custom-fetch
 * compatibility probe for RFC 0000 (`rfcs/0000-in-process-service-link.md`).
 *
 * Proves:
 * 1. WITHOUT the rule (top-level module-load snapshot): a lazy dynamic import
 *    inside Request 1 captures Request 1's active ALS stores (user ALS, LogTape
 *    context, OTel span) and leaks them into Request 2's callee!
 * 2. WITH the rule (no module-load capture; capture once at composition root):
 *    a fresh lazy dynamic import inside Request 1 reuses the clean root snapshot
 *    and leaks zero stores into Request 1, Request 2, or unauthenticated calls.
 * 3. WITH the fail-closed capture guard: attempting first-time snapshot capture
 *    inside an active OTel span or active registered framework ALS store fails
 *    closed with `IN_PROCESS_ROOT_CONTEXT_ACTIVE` without caching a poisoned
 *    snapshot.
 * 4. oRPC v2 link compatibility: custom `fetch(urlString, init)` works without a
 *    `Request` first argument and refuses `302` redirects explicitly without
 *    relying on `redirect: 'manual'`.
 *
 * Run with Deno's built-in resource & ops sanitizers enabled:
 *   deno test --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/snapshot-lazy-import.probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { context as otelContext, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { BasicTracerProvider } from 'npm:@opentelemetry/sdk-trace-base@^2.7.1';
import {
  configure,
  getLogger,
  withContext as withLogContext,
} from '@netscript/logger';
import {
  captureInProcessRootSnapshot,
  createInProcessFetch,
  ProbeInProcessServiceError,
  registerActiveAsyncStoreProbe,
  resetInProcessRootSnapshotForTest,
} from './in-process-fetch-adapter.ts';

Deno.test('WITHOUT rule: module-load AsyncLocalStorage.snapshot() during lazy import leaks Request 1 stores into Request 2', async () => {
  const ctxMgr = new AsyncLocalStorageContextManager().enable();
  otelContext.setGlobalContextManager(ctxMgr);
  const provider = new BasicTracerProvider();
  trace.setGlobalTracerProvider(provider);
  const tracer = trace.getTracer('lazy-import-hazard');

  const logRecords: Array<Record<string, unknown>> = [];
  await configure({
    reset: true,
    contextLocalStorage: new AsyncLocalStorage(),
    sinks: {
      mem: (record) => {
        logRecords.push({ ...record.properties });
      },
    },
    loggers: [
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'fatal' },
      { category: ['probe', 'lazy-hazard'], sinks: ['mem'], lowestLevel: 'info' },
    ],
  });
  const logger = getLogger(['probe', 'lazy-hazard']);
  const userAls = new AsyncLocalStorage<string>();

  try {
    let runWithModuleLoadSnapshot!: <T>(fn: () => T) => T;
    let req1SpanId = '';

    // Request 1 triggers a lazy dynamic import while its ALS stores are active.
    await tracer.startActiveSpan('req-1', async (span) => {
      req1SpanId = span.spanContext().spanId;
      try {
        await withLogContext({ tenant: 'tenant-A', requestId: 'req-1' }, async () => {
          await userAls.run('tenant-A-session', async () => {
            const mod = await import('./lazy-module-load-snapshot.fixture.ts?case=negative-control');
            runWithModuleLoadSnapshot = mod.runWithModuleLoadSnapshot;
          });
        });
      } finally {
        span.end();
      }
    });

    // Request 2 (different tenant, distinct span) calls through the module-load snapshot.
    let leakedUserStoreInReq2: string | undefined;
    let leakedSpanIdInReq2: string | undefined;
    await tracer.startActiveSpan('req-2', async (span) => {
      try {
        await withLogContext({ tenant: 'tenant-B', requestId: 'req-2' }, async () => {
          await userAls.run('tenant-B-session', async () => {
            await runWithModuleLoadSnapshot(() => {
              leakedUserStoreInReq2 = userAls.getStore();
              leakedSpanIdInReq2 = trace.getSpan(otelContext.active())?.spanContext().spanId;
              logger.info('callee-in-req-2');
            });
          });
        });
      } finally {
        span.end();
      }
    });

    // Even a third call outside ANY request observes Request 1's poisoned stores.
    let leakedOutsideRequest: string | undefined;
    runWithModuleLoadSnapshot(() => {
      leakedOutsideRequest = userAls.getStore();
    });

    // Proves the isolation invariant FAILS without the rule: Request 1's stores leaked!
    assertEquals(leakedUserStoreInReq2, 'tenant-A-session');
    assertEquals(leakedOutsideRequest, 'tenant-A-session');
    assertEquals(leakedSpanIdInReq2, req1SpanId);
    assertEquals(logRecords, [{ tenant: 'tenant-A', requestId: 'req-1' }]);
  } finally {
    await provider.shutdown();
    ctxMgr.disable();
    otelContext.disable();
    trace.disable();
  }
});

Deno.test('WITH rule: composition-root capture prevents cross-request leak even when adapter module is lazily imported inside Request 1', async () => {
  resetInProcessRootSnapshotForTest();

  const ctxMgr = new AsyncLocalStorageContextManager().enable();
  assert(otelContext.setGlobalContextManager(ctxMgr));
  const provider = new BasicTracerProvider();
  assert(trace.setGlobalTracerProvider(provider));
  const tracer = trace.getTracer('lazy-import-fixed');

  const logRecords: Array<Record<string, unknown>> = [];
  await configure({
    reset: true,
    contextLocalStorage: new AsyncLocalStorage(),
    sinks: {
      mem: (record) => {
        logRecords.push({ ...record.properties });
      },
    },
    loggers: [
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'fatal' },
      { category: ['probe', 'lazy-fixed'], sinks: ['mem'], lowestLevel: 'info' },
    ],
  });
  const logger = getLogger(['probe', 'lazy-fixed']);
  const userAls = new AsyncLocalStorage<string>();

  try {
    // Step 1: Composition root captures the clean snapshot BEFORE any request runs.
    captureInProcessRootSnapshot();

    const observed: Array<{
      call: string;
      userStore: string | undefined;
      otelSpan: unknown;
    }> = [];

    let lazyInProcFetch!: typeof globalThis.fetch;

    // Step 2: Request 1 lazily evaluates a fresh instance of the adapter module
    // while unregistered user ALS, LogTape context, and an OTel span are ALL active.
    await tracer.startActiveSpan('req-1', async (span) => {
      try {
        await withLogContext({ tenant: 'tenant-A', requestId: 'req-1' }, async () => {
          await userAls.run('tenant-A-session', async () => {
            const lazyMod = await import('./in-process-fetch-adapter.ts?case=lazy-after-root');
            lazyInProcFetch = lazyMod.createInProcessFetch({
              fetch(req) {
                observed.push({
                  call: new URL(req.url).pathname,
                  userStore: userAls.getStore(),
                  otelSpan: trace.getSpan(otelContext.active()),
                });
                logger.info('callee-handled');
                return new Response(JSON.stringify({ ok: true }), {
                  headers: { 'content-type': 'application/json' },
                });
              },
            });
            const res1 = await lazyInProcFetch('https://orders.in-process.localhost/req-1');
            await res1.text();
          });
        });
      } finally {
        span.end();
      }
    });

    // Step 3: Request 2 (tenant B) and Request 3 (no active stores) call through the adapter.
    await tracer.startActiveSpan('req-2', async (span) => {
      try {
        await withLogContext({ tenant: 'tenant-B', requestId: 'req-2' }, async () => {
          await userAls.run('tenant-B-session', async () => {
            const res2 = await lazyInProcFetch('https://orders.in-process.localhost/req-2');
            await res2.text();
          });
        });
      } finally {
        span.end();
      }
    });

    const res3 = await lazyInProcFetch('https://orders.in-process.localhost/req-3');
    await res3.text();

    // Proves isolation PASSES with the rule: zero leakage across all 3 calls.
    assertEquals(observed, [
      { call: '/req-1', userStore: undefined, otelSpan: undefined },
      { call: '/req-2', userStore: undefined, otelSpan: undefined },
      { call: '/req-3', userStore: undefined, otelSpan: undefined },
    ]);
    assertEquals(logRecords, [{}, {}, {}]);
  } finally {
    await provider.shutdown();
    ctxMgr.disable();
    otelContext.disable();
    trace.disable();
    resetInProcessRootSnapshotForTest();
  }
});

Deno.test('WITH rule: fail-closed capture guard rejects uninitialized capture inside active OTel span or registered framework ALS store', async () => {
  resetInProcessRootSnapshotForTest();

  const ctxMgr = new AsyncLocalStorageContextManager().enable();
  assert(otelContext.setGlobalContextManager(ctxMgr));
  const provider = new BasicTracerProvider();
  assert(trace.setGlobalTracerProvider(provider));
  const tracer = trace.getTracer('fail-closed-guard');

  const authStorage = new AsyncLocalStorage<{ subject: string }>();
  const unregisterProbe = registerActiveAsyncStoreProbe({
    name: 'auth.requestContext',
    isActive: () => authStorage.getStore() !== undefined,
  });

  try {
    // Case A: Active OTel span blocks uninitialized capture & transport construction.
    tracer.startActiveSpan('active-http-request', (span) => {
      try {
        const err1 = assertThrows(
          () => captureInProcessRootSnapshot(),
          ProbeInProcessServiceError,
        );
        assertEquals(err1.code, 'IN_PROCESS_ROOT_CONTEXT_ACTIVE');
        assert(err1.message.includes('otel.activeSpan'));

        const err2 = assertThrows(
          () => createInProcessFetch({ fetch: () => new Response('ok') }),
          ProbeInProcessServiceError,
        );
        assertEquals(err2.code, 'IN_PROCESS_ROOT_CONTEXT_ACTIVE');
      } finally {
        span.end();
      }
    });

    // Case B: Active registered framework ALS store blocks capture even without an OTel span.
    authStorage.run({ subject: 'user-a' }, () => {
      const err3 = assertThrows(
        () => captureInProcessRootSnapshot(),
        ProbeInProcessServiceError,
      );
      assertEquals(err3.code, 'IN_PROCESS_ROOT_CONTEXT_ACTIVE');
      assert(err3.message.includes('auth.requestContext'));
    });

    // Case C: Once back at clean root (no active stores), capture succeeds cleanly
    // and detaches subsequent calls made inside authStorage.
    captureInProcessRootSnapshot();
    let seenAuthInCallee: { subject: string } | undefined = { subject: 'unset' };
    const inProcFetch = createInProcessFetch({
      fetch() {
        seenAuthInCallee = authStorage.getStore();
        return new Response('ok');
      },
    });
    await authStorage.run({ subject: 'user-a' }, async () => {
      const res = await inProcFetch('https://orders.in-process.localhost/clean');
      await res.text();
    });
    assertEquals(seenAuthInCallee, undefined);
  } finally {
    unregisterProbe();
    await provider.shutdown();
    ctxMgr.disable();
    otelContext.disable();
    trace.disable();
    resetInProcessRootSnapshotForTest();
  }
});

Deno.test('oRPC v2 custom fetch(urlString, init) works without Request input and refuses 302 without redirect:manual', async () => {
  resetInProcessRootSnapshotForTest();
  captureInProcessRootSnapshot();

  let seenMethod = '';
  let seenAuth = '';
  let seenTrace = '';
  let seenBody = '';
  const echoFetch = createInProcessFetch({
    async fetch(req) {
      seenMethod = req.method;
      seenAuth = req.headers.get('authorization') ?? '';
      seenTrace = req.headers.get('traceparent') ?? '';
      seenBody = await req.text();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  // oRPC v2 passes (url: string, init: RequestInit) with headers on init and no redirect:'manual'.
  const res = await echoFetch('https://orders.in-process.localhost/api/rpc/v1/orders/get', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer v2-token',
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
    },
    body: JSON.stringify({ json: { id: 'ord_1' } }),
  });
  assertEquals(await res.json(), { ok: true });
  assertEquals(seenMethod, 'POST');
  assertEquals(seenAuth, 'Bearer v2-token');
  assertEquals(seenTrace, '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01');
  assertEquals(seenBody, JSON.stringify({ json: { id: 'ord_1' } }));

  const redirectFetch = createInProcessFetch({
    fetch() {
      return new Response(null, {
        status: 302,
        headers: { location: 'https://evil.example.test/steal' },
      });
    },
  });

  // No redirect option in init (oRPC v2 no longer sets redirect:'manual'); adapter still refuses explicitly.
  const err = await assertRejects(
    () => redirectFetch('https://orders.in-process.localhost/api/rpc/v1/orders/get', { method: 'POST' }),
    ProbeInProcessServiceError,
  );
  assertEquals(err.code, 'IN_PROCESS_REDIRECT_UNSUPPORTED');

  resetInProcessRootSnapshotForTest();
});
