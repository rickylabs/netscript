/**
 * Sanitizer-enabled terminal-path & telemetry-boundary verification tests for
 * the RFC 0000 in-process fetch adapter.
 *
 * Run with Deno's built-in resource & ops sanitizers enabled:
 *   deno test --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/adapter-sanitizers.probe.ts
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { context as otelContext, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { BasicTracerProvider } from 'npm:@opentelemetry/sdk-trace-base@^2.7.1';
import {
  configure,
  getLogger,
  withContext as withLogContext,
} from '@netscript/logger';
import {
  createInProcessFetch,
  ProbeInProcessServiceError,
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

Deno.test('EOF unlocks underlying source stream cleanly', async () => {
  let src!: ReadableStream<Uint8Array>;
  const inProcFetch = createInProcessFetch({
    fetch() {
      let sent = false;
      src = new ReadableStream<Uint8Array>({
        pull(c) {
          if (!sent) {
            sent = true;
            c.enqueue(new TextEncoder().encode('hello'));
          } else {
            c.close();
          }
        },
      });
      return new Response(src);
    },
  });
  const ctrl = new AbortController();
  const res = await inProcFetch('https://in-process.localhost/eof', { signal: ctrl.signal });
  assertEquals(await res.text(), 'hello');
  assertEquals(src.locked, false);
});

Deno.test('abort unlocks source immediately even when source cancel() stalls', async () => {
  const cancelGate = deferred<void>();
  let cancelCalls = 0;
  let src!: ReadableStream<Uint8Array>;
  const inProcFetch = createInProcessFetch({
    fetch() {
      src = new ReadableStream<Uint8Array>({
        pull() {
          return new Promise(() => {});
        },
        cancel() {
          cancelCalls += 1;
          return cancelGate.promise;
        },
      });
      return new Response(src);
    },
  });
  const ctrl = new AbortController();
  const res = await inProcFetch('https://in-process.localhost/stalled-abort', {
    signal: ctrl.signal,
  });
  const reader = res.body!.getReader();
  const pendingRead = reader.read();
  ctrl.abort(new Error('stalled-abort'));
  await assertRejects(() => pendingRead, Error, 'stalled-abort');
  // Source MUST be unlocked BEFORE cancelGate resolves.
  assertEquals(src.locked, false);
  assertEquals(cancelCalls, 1);
  cancelGate.resolve();
  await new Promise((r) => setTimeout(r, 10));
});

Deno.test('abort unlocks source immediately even when source cancel() rejects', async () => {
  let cancelCalls = 0;
  let src!: ReadableStream<Uint8Array>;
  const inProcFetch = createInProcessFetch({
    fetch() {
      src = new ReadableStream<Uint8Array>({
        pull() {
          return new Promise(() => {});
        },
        cancel() {
          cancelCalls += 1;
          return Promise.reject(new Error('cancel-explosion'));
        },
      });
      return new Response(src);
    },
  });
  const ctrl = new AbortController();
  const res = await inProcFetch('https://in-process.localhost/rejecting-abort', {
    signal: ctrl.signal,
  });
  const reader = res.body!.getReader();
  const pendingRead = reader.read();
  ctrl.abort(new Error('rejecting-abort'));
  await assertRejects(() => pendingRead, Error, 'rejecting-abort');
  assertEquals(src.locked, false);
  assertEquals(cancelCalls, 1);
  await new Promise((r) => setTimeout(r, 10));
});

Deno.test('consumer cancel unlocks source immediately even when source cancel() stalls or rejects', async () => {
  for (const mode of ['stalled', 'rejecting'] as const) {
    const gate = deferred<void>();
    let cancelCalls = 0;
    let src!: ReadableStream<Uint8Array>;
    const inProcFetch = createInProcessFetch({
      fetch() {
        src = new ReadableStream<Uint8Array>({
          pull(c) {
            c.enqueue(new Uint8Array([1, 2, 3]));
          },
          cancel() {
            cancelCalls += 1;
            return mode === 'stalled' ? gate.promise : Promise.reject(new Error('cancel-err'));
          },
        });
        return new Response(src);
      },
    });
    const ctrl = new AbortController();
    const res = await inProcFetch(`https://in-process.localhost/consumer-${mode}`, {
      signal: ctrl.signal,
    });
    const reader = res.body!.getReader();
    const cancelPromise = reader.cancel('consumer-done');
    assertEquals(src.locked, false);
    assertEquals(cancelCalls, 1);
    if (mode === 'stalled') {
      gate.resolve();
    }
    await cancelPromise;
  }
});

Deno.test('source error unlocks underlying stream cleanly', async () => {
  let src!: ReadableStream<Uint8Array>;
  const inProcFetch = createInProcessFetch({
    fetch() {
      src = new ReadableStream<Uint8Array>({
        pull(c) {
          c.error(new Error('source-read-boom'));
        },
      });
      return new Response(src);
    },
  });
  const ctrl = new AbortController();
  const res = await inProcFetch('https://in-process.localhost/source-err', { signal: ctrl.signal });
  await assertRejects(() => res.text(), Error, 'source-read-boom');
  assertEquals(src.locked, false);
});

Deno.test('locked and disturbed Response.body fail closed with IN_PROCESS_BODY_UNUSABLE', async () => {
  let foreignCancelCalls = 0;
  let heldReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const lockedApp = createInProcessFetch({
    fetch() {
      const body = new ReadableStream<Uint8Array>({
        pull() {},
        cancel() {
          foreignCancelCalls += 1;
        },
      });
      const res = new Response(body);
      heldReader = res.body!.getReader();
      return res;
    },
  });
  for (const withSignal of [false, true]) {
    const init = withSignal ? { signal: new AbortController().signal } : undefined;
    const err = await assertRejects(
      () => lockedApp('https://in-process.localhost/locked', init),
      ProbeInProcessServiceError,
    );
    assertEquals(err.code, 'IN_PROCESS_BODY_UNUSABLE');
    heldReader?.releaseLock();
    heldReader = undefined;
  }
  assertEquals(foreignCancelCalls, 0);

  const disturbedApp = createInProcessFetch({
    async fetch() {
      const res = new Response('consumed');
      await res.text();
      return res;
    },
  });
  for (const withSignal of [false, true]) {
    const init = withSignal ? { signal: new AbortController().signal } : undefined;
    const err = await assertRejects(
      () => disturbedApp('https://in-process.localhost/disturbed', init),
      ProbeInProcessServiceError,
    );
    assertEquals(err.code, 'IN_PROCESS_BODY_UNUSABLE');
  }
});

Deno.test('late app.fetch rejection after abort is absorbed with zero unhandled rejections', async () => {
  const gate = deferred<Response>();
  const inProcFetch = createInProcessFetch({
    fetch() {
      return gate.promise;
    },
  });
  const ctrl = new AbortController();
  const pending = inProcFetch('https://in-process.localhost/late-reject', { signal: ctrl.signal });
  ctrl.abort(new Error('caller-gave-up'));
  await assertRejects(() => pending, Error, 'caller-gave-up');
  gate.reject(new Error('late-handler-crash'));
  await new Promise((r) => setTimeout(r, 15));
});

Deno.test('caller OTel context never leaks into deferred pull, abort cancel, or late-body cancel', async () => {
  const ctxMgr = new AsyncLocalStorageContextManager().enable();
  otelContext.setGlobalContextManager(ctxMgr);
  const provider = new BasicTracerProvider();
  trace.setGlobalTracerProvider(provider);
  const tracer = trace.getTracer('sanitizer-test');

  try {
    let pullSpan: unknown = 'unset';
    let abortCancelSpan: unknown = 'unset';
    let lateCancelSpan: unknown = 'unset';
    const lateGate = deferred<void>();

    const inProcFetch = createInProcessFetch({
      fetch(req) {
        if (req.url.endsWith('/late')) {
          return lateGate.promise.then(() =>
            new Response(
              new ReadableStream<Uint8Array>({
                cancel() {
                  lateCancelSpan = trace.getSpan(otelContext.active());
                },
              }),
            )
          );
        }
        let sent = false;
        return new Response(
          new ReadableStream<Uint8Array>({
            pull(c) {
              pullSpan = trace.getSpan(otelContext.active());
              if (!sent) {
                sent = true;
                c.enqueue(new Uint8Array([42]));
                return;
              }
              return new Promise(() => {});
            },
            cancel() {
              abortCancelSpan = trace.getSpan(otelContext.active());
            },
          }),
        );
      },
    });

    await tracer.startActiveSpan('caller.outer', async (span) => {
      try {
        const ctrl = new AbortController();
        const res = await inProcFetch('https://in-process.localhost/stream', {
          signal: ctrl.signal,
        });
        const reader = res.body!.getReader();
        await reader.read();
        const second = reader.read();
        ctrl.abort(new Error('stop'));
        await assertRejects(() => second, Error, 'stop');

        const lateCtrl = new AbortController();
        const lateReq = inProcFetch('https://in-process.localhost/late', {
          signal: lateCtrl.signal,
        });
        lateCtrl.abort(new Error('stop-late'));
        await assertRejects(() => lateReq, Error, 'stop-late');
        lateGate.resolve();
        await new Promise((r) => setTimeout(r, 15));
      } finally {
        span.end();
      }
    });

    assertEquals(pullSpan, undefined);
    assertEquals(abortCancelSpan, undefined);
    assertEquals(lateCancelSpan, undefined);
  } finally {
    await provider.shutdown();
    ctxMgr.disable();
  }
});

Deno.test('non-OTel AsyncLocalStorage and @netscript/logger contexts detach across fetch, pull, abort cancel, and late-body cancel', async () => {
  const capturedRecords: Array<{ message: readonly unknown[]; properties: Record<string, unknown> }> =
    [];
  const callerControlRecords: Array<Record<string, unknown>> = [];
  await configure({
    reset: true,
    contextLocalStorage: new AsyncLocalStorage(),
    sinks: {
      mem: (record) => {
        capturedRecords.push({
          message: record.message,
          properties: { ...record.properties },
        });
      },
      callerCtrl: (record) => {
        callerControlRecords.push({ ...record.properties });
      },
    },
    loggers: [
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'fatal' },
      { category: ['probe', 'als-callee'], sinks: ['mem'], lowestLevel: 'info' },
      { category: ['probe', 'als-caller-ctrl'], sinks: ['callerCtrl'], lowestLevel: 'info' },
    ],
  });

  // Created AFTER in-process-fetch-adapter.ts captured AsyncLocalStorage.snapshot()
  // to prove snapshot() detaches even subsequently constructed AsyncLocalStorage instances.
  const postLoadAls = new AsyncLocalStorage<string>();
  const calleeLogger = getLogger(['probe', 'als-callee']);
  const callerCtrlLogger = getLogger(['probe', 'als-caller-ctrl']);

  let fetchAls: string | undefined = 'unset';
  let pullAls: string | undefined = 'unset';
  let abortCancelAls: string | undefined = 'unset';
  let lateCancelAls: string | undefined = 'unset';
  const lateGate = deferred<void>();

  const inProcFetch = createInProcessFetch({
    fetch(req) {
      fetchAls = postLoadAls.getStore();
      calleeLogger.info('callee-fetch');
      if (req.url.endsWith('/late')) {
        return lateGate.promise.then(() =>
          new Response(
            new ReadableStream<Uint8Array>({
              cancel() {
                lateCancelAls = postLoadAls.getStore();
                calleeLogger.info('callee-late-cancel');
              },
            }),
          )
        );
      }
      let sent = false;
      return new Response(
        new ReadableStream<Uint8Array>({
          pull(c) {
            pullAls = postLoadAls.getStore();
            calleeLogger.info('callee-pull');
            if (!sent) {
              sent = true;
              c.enqueue(new Uint8Array([7]));
              return;
            }
            return new Promise(() => {});
          },
          cancel() {
            abortCancelAls = postLoadAls.getStore();
            calleeLogger.info('callee-abort-cancel');
          },
        }),
      );
    },
  });

  await withLogContext({ callerRequestId: 'caller-req-1', callerTenant: 'tenant-A' }, async () => {
    await postLoadAls.run('caller-tx-scope', async () => {
      // Positive control: prove BOTH caller log context and postLoadAls are live on caller side.
      callerCtrlLogger.info('caller-active');
      assertEquals(postLoadAls.getStore(), 'caller-tx-scope');

      const origin = resolveInProcessOrigin('orders').origin;
      const ctrl = new AbortController();
      const res = await inProcFetch(`${origin}/stream`, { signal: ctrl.signal });
      const reader = res.body!.getReader();
      await reader.read();
      const second = reader.read();
      ctrl.abort(new Error('stop-als'));
      await assertRejects(() => second, Error, 'stop-als');

      const lateCtrl = new AbortController();
      const lateReq = inProcFetch(`${origin}/late`, { signal: lateCtrl.signal });
      lateCtrl.abort(new Error('stop-als-late'));
      await assertRejects(() => lateReq, Error, 'stop-als-late');
      lateGate.resolve();
      await new Promise((r) => setTimeout(r, 15));
    });
  });

  assertEquals(callerControlRecords, [{ callerRequestId: 'caller-req-1', callerTenant: 'tenant-A' }]);
  assertEquals(fetchAls, undefined);
  assertEquals(pullAls, undefined);
  assertEquals(abortCancelAls, undefined);
  assertEquals(lateCancelAls, undefined);
  assert(capturedRecords.length >= 4);
  for (const record of capturedRecords) {
    assertEquals(record.properties, {});
  }
});

Deno.test('resolveInProcessOrigin maps distinct serviceNames (including xn-- Punycode) to collision-free .in-process.localhost origins', () => {
  const orders = resolveInProcessOrigin('orders');
  const billing = resolveInProcessOrigin('billing');
  const upperOrders = resolveInProcessOrigin('Orders');
  const underscored = resolveInProcessOrigin('orders_v2');
  const reservedPrefix = resolveInProcessOrigin('x-orders');
  const invalidPunycode = resolveInProcessOrigin('xn--zzzz');
  const punycodePrefix = resolveInProcessOrigin('xn--bcher-kva');
  const longName = resolveInProcessOrigin('a'.repeat(80));

  assertEquals(orders.origin, 'https://orders.in-process.localhost');
  assertEquals(billing.origin, 'https://billing.in-process.localhost');
  assert(upperOrders.hostname.startsWith('x-'));
  assert(underscored.hostname.startsWith('x-'));
  assert(reservedPrefix.hostname.startsWith('x-'));
  assert(invalidPunycode.hostname.startsWith('x-'));
  assert(punycodePrefix.hostname.startsWith('x-'));
  assert(longName.hostname.startsWith('x-'));

  const all = [
    orders,
    billing,
    upperOrders,
    underscored,
    reservedPrefix,
    invalidPunycode,
    punycodePrefix,
    longName,
  ];
  const uniqueOrigins = new Set(all.map((u) => u.origin));
  assertEquals(uniqueOrigins.size, all.length);
  for (const u of all) {
    assertEquals(u.protocol, 'https:');
    assert(u.hostname.endsWith('.in-process.localhost'));
    const label = u.hostname.slice(0, -'.in-process.localhost'.length);
    assert(label.length >= 1 && label.length <= 63);
  }
  assertNotEquals(orders.origin, billing.origin);
});
