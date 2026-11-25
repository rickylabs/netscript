/**
 * Sanitizer-enabled terminal-path & telemetry-boundary verification tests for
 * the RFC 0000 in-process fetch adapter.
 *
 * Run with Deno's built-in resource & ops sanitizers enabled:
 *   deno test --frozen -A .llm/runs/plan-rfc-in-process-service-link-451--rfc/probes/adapter-sanitizers.probe.ts
 */

import { assertEquals, assertRejects } from '@std/assert';
import { context as otelContext, trace } from 'npm:@opentelemetry/api@^1.9.1';
import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
import { BasicTracerProvider } from 'npm:@opentelemetry/sdk-trace-base@^2.7.1';
import {
  createInProcessFetch,
  ProbeInProcessServiceError,
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
