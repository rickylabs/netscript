import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import {
  createNetScriptStreamProxy,
  type StreamProxyCloseEvent,
  type StreamProxyRecheckDecision,
  type StreamProxyRevocationSignal,
} from '../../proxy.ts';
import { scheduleChunkedDelay } from '../../src/adapters/system-stream-proxy-clock.ts';
import {
  createControlledUpstream,
  createDeferred,
  createSharedRevocationHub,
  FakeClock,
  flushMicrotasks,
  makeStateChange,
  readAllText,
  readOneChunkText,
  sseControlBlock,
  sseDataBlock,
  type TestGrant,
} from './_test_helpers.ts';

const BEARER = { authorization: 'Bearer tok-lifecycle' };

Deno.test('Gate 2 idle expiry: closes idle reader at expiresAtMs, supports valid sliding extension, and rejects invalid extensions', async () => {
  const clock = new FakeClock(10_000);
  const upstream = createControlledUpstream();
  const closed: StreamProxyCloseEvent[] = [];
  let mode: 'deny' | 'extend' | 'omit' | 'past' | 'nan' | 'infinity' = 'deny';
  let extendedOnce = false;
  let active = true;

  const proxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    clock,
    recheckEveryMs: null,
    upstreamAuth: () => ({}),
    authorize: () =>
      active
        ? { allow: true, grant: { sessionId: 'exp-1' }, expiresAtMs: clock.nowMs() + 60_000 }
        : { allow: false, status: 401, reason: 'session_expired' },
    recheck: ({ reason }): StreamProxyRecheckDecision => {
      if (reason !== 'expiry') return { allow: true };
      if (mode === 'deny') {
        active = false;
        return { allow: false, reason: 'expired' };
      }
      if (mode === 'extend') {
        if (!extendedOnce) {
          extendedOnce = true;
          return { allow: true, expiresAtMs: clock.nowMs() + 60_000 };
        }
        return { allow: false, reason: 'expired' };
      }
      if (mode === 'omit') return { allow: true };
      if (mode === 'past') return { allow: true, expiresAtMs: clock.nowMs() };
      if (mode === 'nan') return { allow: true, expiresAtMs: Number.NaN };
      return { allow: true, expiresAtMs: Number.POSITIVE_INFINITY };
    },
    resolvePath: () => '/projects/exp/events',
    onClose: (e) => closed.push(e),
  });

  // 1. Idle expiry closes cleanly at T0 + 60_000 and fails fresh admission 401
  const res1 = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
  assertEquals(res1.status, 200);
  const r1 = res1.body!.getReader();
  const read1 = readOneChunkText(r1);
  await clock.advance(60_000);
  assertEquals((await read1).done, true);
  r1.releaseLock();
  assertEquals(clock.pendingCount, 0);
  assertEquals(
    (await proxy(new Request('https://app.example.test/stream', { headers: BEARER }))).status,
    401,
  );

  // 2. Valid sliding extension keeps open until T + 120_000
  active = true;
  mode = 'extend';
  const res2 = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
  const r2 = res2.body!.getReader();
  await clock.advance(60_000);
  assertEquals(upstream.activeCount, 1); // Still open after extension!
  const read2 = readOneChunkText(r2);
  await clock.advance(60_000);
  assertEquals((await read2).done, true);
  r2.releaseLock();

  // 3. Negative extension controls: omit, past, NaN, Infinity all fail closed immediately
  for (const negMode of ['omit', 'past', 'nan', 'infinity'] as const) {
    mode = negMode;
    const resN = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    assertEquals(resN.status, 200);
    const rN = resN.body!.getReader();
    const readN = readOneChunkText(rN);
    await clock.advance(60_000);
    assertEquals((await readN).done, true, `mode=${negMode} must close expired`);
    rN.releaseLock();
  }

  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
  assertEquals(clock.pendingCount, 0);
  assert(closed.every((e) => e.reason === 'expired'));
});

Deno.test('Gate 2 expiry contention: single expiresAtMs + policyTimeoutMs hard budget across cooperative, hung, and post-await expiry', async () => {
  // (a) Cooperative hook observing aborted signal within single remaining budget
  {
    const clock = new FakeClock(1_000);
    const upstream = createControlledUpstream();
    const closed: StreamProxyCloseEvent[] = [];
    const pausedBeforeDelivery = createDeferred<void>();
    const expiryRecheckStarted = createDeferred<void>();
    const expiryRecheckDecision = createDeferred<StreamProxyRecheckDecision>();
    let observedBeforeDeliverySignalAborted = false;
    let expiryCheckCount = 0;

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      clock,
      recheckEveryMs: null,
      policyTimeoutMs: 5_000,
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: { sessionId: 'coop' }, expiresAtMs: 11_000 }),
      recheck: ({ reason, signal }) => {
        if (reason === 'before-delivery') {
          pausedBeforeDelivery.resolve();
          return new Promise<StreamProxyRecheckDecision>((resolve) => {
            signal.addEventListener('abort', () => {
              observedBeforeDeliverySignalAborted = true;
              // Spend 1_000ms winding down cooperatively; the subsequent 'expiry' check
              // MUST share the single remaining budget to 16_000ms (4_000ms left, not 5_000ms).
              clock.schedule(1_000, () => resolve({ allow: true }));
            }, { once: true });
          });
        }
        expiryCheckCount += 1;
        expiryRecheckStarted.resolve();
        return expiryRecheckDecision.promise;
      },
      resolvePath: () => '/projects/coop/events',
      onClose: (e) => closed.push(e),
    });

    const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    const reader = res.body!.getReader();
    await clock.advance(9_000); // T = 10_000 (within policyTimeoutMs of expiresAtMs = 11_000)
    upstream.readers[0]!.push(
      sseDataBlock(makeStateChange('k1', { v: 1 })) + sseControlBlock({ streamNextOffset: 'o1' }),
    );
    const readP = readOneChunkText(reader);
    await pausedBeforeDelivery.promise;

    // Advance to expiresAtMs (11_000): aborts cooperative before-delivery check
    await clock.advance(1_000);
    assertEquals(observedBeforeDeliverySignalAborted, true);
    assertEquals(expiryCheckCount, 0);

    // Advance 1_000ms (T = 12_000): cooperative hook resolves stale allow -> fenced -> starts ONE expiry check
    await clock.advance(1_000);
    await expiryRecheckStarted.promise;
    assertEquals(expiryCheckCount, 1);

    // Remaining budget is 4_000ms (to exact expiresAtMs + policyTimeoutMs = 16_000), NOT a fresh 5_000ms
    await clock.advance(3_999); // T = 15_999
    assertEquals(closed.length, 0);
    await clock.advance(1); // T = 16_000
    const out = await readP;
    assertEquals(out.done, true);
    assertEquals(out.text, '');
    assertEquals(closed[0]!.reason, 'expired');
    // Late resolution causes zero unhandled rejections
    expiryRecheckDecision.resolve({ allow: true, expiresAtMs: 99_999 });
    reader.releaseLock();
    await flushMicrotasks();
    assertEquals(clock.pendingCount, 0);
  }

  // (b) Non-cooperative hung hook ignoring signal -> abandoned strictly at expiresAtMs + policyTimeoutMs
  {
    const clock = new FakeClock(1_000);
    const upstream = createControlledUpstream();
    const closed: StreamProxyCloseEvent[] = [];
    const hungDeferred = createDeferred<StreamProxyRecheckDecision>();
    const paused = createDeferred<void>();
    let recheckCalls = 0;

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      clock,
      recheckEveryMs: null,
      policyTimeoutMs: 5_000,
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: { sessionId: 'hung' }, expiresAtMs: 11_000 }),
      recheck: () => {
        recheckCalls += 1;
        paused.resolve();
        return hungDeferred.promise;
      },
      resolvePath: () => '/projects/hung/events',
      onClose: (e) => closed.push(e),
    });

    const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    const reader = res.body!.getReader();
    await clock.advance(9_000); // T = 10_000
    upstream.readers[0]!.push(
      sseDataBlock(makeStateChange('k1', { v: 1 })) + sseControlBlock({ streamNextOffset: 'o1' }),
    );
    const readP = readOneChunkText(reader);
    await paused.promise;

    await clock.advance(1_000); // T = 11_000 (expiresAtMs fires)
    assertEquals(recheckCalls, 1); // Must NOT launch a second concurrent recheck!
    await clock.advance(4_999); // T = 15_999 (just before hard deadline)
    assertEquals(closed.length, 0);
    await clock.advance(1); // T = 16_000 (exact expiresAtMs + policyTimeoutMs)
    const out = await readP;
    assertEquals(out.done, true);
    assertEquals(out.text, '');
    assertEquals(closed[0]!.reason, 'expired');
    assertEquals(recheckCalls, 1);
    hungDeferred.reject(new Error('late hung rejection'));
    reader.releaseLock();
    await flushMicrotasks();
    assertEquals(clock.pendingCount, 0);
  }

  // (c) Post-await expiry without timer firing first -> zero bytes emitted, closes expired
  {
    const clock = new FakeClock(1_000);
    const upstream = createControlledUpstream();
    const closed: StreamProxyCloseEvent[] = [];
    const deferred = createDeferred<StreamProxyRecheckDecision>();
    const paused = createDeferred<void>();

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      clock,
      recheckEveryMs: null,
      policyTimeoutMs: 5_000,
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: { sessionId: 'post-await' }, expiresAtMs: 5_000 }),
      recheck: ({ reason }) => {
        if (reason === 'before-delivery') {
          paused.resolve();
          return deferred.promise;
        }
        return { allow: true }; // No sliding extension -> fails closed expired
      },
      resolvePath: () => '/projects/pa/events',
      onClose: (e) => closed.push(e),
    });

    const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    const reader = res.body!.getReader();
    upstream.readers[0]!.push(
      sseDataBlock(makeStateChange('k1', { v: 1 })) + sseControlBlock({ streamNextOffset: 'o1' }),
    );
    const readP = readOneChunkText(reader);
    await paused.promise;

    // Move clock past expiresAtMs WITHOUT firing the scheduled timer callback
    clock.setNowWithoutFiring(5_050);
    deferred.resolve({ allow: true });

    const out = await readP;
    assertEquals(out.done, true);
    assertEquals(out.text, '');
    assertEquals(closed[0]!.reason, 'expired');
    reader.releaseLock();
    await flushMicrotasks();
    assertEquals(clock.pendingCount, 0);
  }
});

Deno.test('Gate 2 subscription catch-up, pre-200 fetch epoch fence, setup abort late-disposal, and decoupled slow upstream cancel', async () => {
  // 1. Revocation between authorize and subscribe caught by 'post-subscribe' catch-up
  {
    const hub = createSharedRevocationHub();
    const subDeferred = createDeferred<() => void>();
    const subStarted = createDeferred<void>();
    let upstreamOpened = 0;

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      upstreamAuth: () => ({}),
      fetch: () => {
        upstreamOpened += 1;
        return Promise.resolve(new Response(null, { status: 200 }));
      },
      revocationSource: {
        subscribe(grant, notify) {
          subStarted.resolve();
          return subDeferred.promise.then(() => hub.revocationSource.subscribe(grant, notify));
        },
      },
      authorize: () => ({ allow: true, grant: { sessionId: 'race-1' } }),
      recheck: ({ grant }) =>
        hub.isActive(grant.sessionId)
          ? { allow: true }
          : { allow: false, reason: 'session_revoked' },
      resolvePath: () => '/projects/race/events',
    });

    const resP = proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    await subStarted.promise;
    // Revoke BEFORE subscribe finishes registering (push broadcast is missed!)
    hub.revoke('race-1', 'recheck');
    subDeferred.resolve(() => {});
    const res = await resP;
    assertEquals(res.status, 401);
    assertEquals(upstreamOpened, 0);
    assertEquals(hub.unsubscribeCount('race-1'), 1);
  }

  // 2. 'recheck' wake arriving after 'post-subscribe' while upstream fetch is pending -> pre-200 fence cancels late body
  {
    const hub = createSharedRevocationHub();
    const fetchStarted = createDeferred<void>();
    const fetchDeferred = createDeferred<Response>();
    let bodyCanceled = false;

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      upstreamAuth: () => ({}),
      revocationSource: hub.revocationSource,
      fetch: () => {
        fetchStarted.resolve();
        return fetchDeferred.promise;
      },
      authorize: () => ({ allow: true, grant: { sessionId: 'pre200-1' } }),
      recheck: ({ grant }) =>
        hub.isActive(grant.sessionId)
          ? { allow: true }
          : { allow: false, reason: 'session_revoked' },
      resolvePath: () => '/projects/pre200/events',
    });

    const resP = proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    await fetchStarted.promise;
    hub.revoke('pre200-1', 'recheck');
    fetchDeferred.resolve(
      new Response(
        new ReadableStream({
          cancel() {
            bodyCanceled = true;
          },
        }),
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      ),
    );
    const res = await resP;
    assertEquals(res.status, 401);
    assertEquals(bodyCanceled, true);
    assertEquals(hub.unsubscribeCount('pre200-1'), 1);
  }

  // 3. Shutdown / client abort during setup disposes late subscribe and late fetch cleanly
  for (const stage of ['resolvePath', 'subscribe', 'upstreamAuth', 'fetch'] as const) {
    const clock = new FakeClock();
    const shutdown = new AbortController();
    const stageStarted = createDeferred<void>();
    const stageDeferred = createDeferred<void>();
    let lateUnsubCalled = false;
    let lateBodyCanceled = false;

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      clock,
      authorize: () => ({ allow: true, grant: { sessionId: `abort-${stage}` } }),
      recheck: () => ({ allow: true }),
      resolvePath: async () => {
        if (stage === 'resolvePath') {
          stageStarted.resolve();
          await stageDeferred.promise;
        }
        return '/projects/abort/events';
      },
      revocationSource: {
        async subscribe() {
          if (stage === 'subscribe') {
            stageStarted.resolve();
            await stageDeferred.promise;
          }
          return () => {
            lateUnsubCalled = true;
          };
        },
      },
      upstreamAuth: async () => {
        if (stage === 'upstreamAuth') {
          stageStarted.resolve();
          await stageDeferred.promise;
        }
        return {};
      },
      fetch: async () => {
        if (stage === 'fetch') {
          stageStarted.resolve();
          await stageDeferred.promise;
        }
        return new Response(
          new ReadableStream({
            cancel() {
              lateBodyCanceled = true;
            },
          }),
          { status: 200, headers: { 'content-type': 'text/event-stream' } },
        );
      },
    });

    const resP = proxy(
      new Request('https://app.example.test/stream', { headers: BEARER }),
      { shutdownSignal: shutdown.signal },
    );
    await stageStarted.promise;
    shutdown.abort('stop');
    const res = await resP;
    assertEquals(res.status, 503);
    stageDeferred.resolve();
    await flushMicrotasks();
    if (stage === 'subscribe') assertEquals(lateUnsubCalled, true);
    if (stage === 'fetch') assertEquals(lateBodyCanceled, true);
    assertEquals(clock.pendingCount, 0);
  }

  // 4. Downstream EOF decoupled from slow upstream cancel()
  {
    const slowCancel = createDeferred<void>();
    const upstream = createControlledUpstream({ slowCancelDeferred: slowCancel });
    const hub = createSharedRevocationHub();

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      revocationSource: hub.revocationSource,
      recheckEveryMs: null,
      upstreamAuth: () => ({}),
      authorize: () => ({ allow: true, grant: { sessionId: 'slow-cancel' } }),
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/slow/events',
    });

    const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    const reader = res.body!.getReader();
    const readP = readOneChunkText(reader);

    // Revoke while upstream cancel() is blocked on slowCancel
    hub.revoke('slow-cancel', 'revoked');
    const eof = await readP;
    assertEquals(eof.done, true); // Reached EOF BEFORE slowCancel resolved!
    assertEquals(upstream.activeCount, 1);

    slowCancel.resolve();
    await flushMicrotasks();
    assertEquals(upstream.activeCount, 0);
    reader.releaseLock();
  }
});

Deno.test('Gate 8 backpressure (highWaterMark: 0) and fail-closed policy errors', async () => {
  // Backpressure: slow consumer prevents unbounded upstream pulls; revoking while backpressured closes immediately
  const upstream = createControlledUpstream();
  const hub = createSharedRevocationHub();
  let recheckCount = 0;

  const proxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    revocationSource: hub.revocationSource,
    recheckEveryMs: null,
    upstreamAuth: () => ({}),
    authorize: () => ({ allow: true, grant: { sessionId: 'bp-1' } }),
    recheck: ({ reason }) => {
      if (reason === 'before-delivery') recheckCount += 1;
      return hub.isActive('bp-1') ? { allow: true } : { allow: false, reason: 'revoked' };
    },
    resolvePath: () => '/projects/bp/events',
  });

  const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
  // Push 5 delivery units without calling reader.read() -> zero speculative rechecks with highWaterMark: 0!
  for (let i = 1; i <= 5; i += 1) {
    upstream.readers[0]!.push(
      sseDataBlock(makeStateChange(`k${i}`, { i })) +
        sseControlBlock({ streamNextOffset: `o${i}` }),
    );
  }
  await flushMicrotasks();
  assertEquals(recheckCount, 0);

  // Pull exactly 1 unit -> exactly 1 before-delivery recheck!
  const reader = res.body!.getReader();
  const first = await readOneChunkText(reader);
  assertFalse(first.done);
  assertStringIncludes(first.text, 'o1');
  assertEquals(recheckCount, 1);

  // Revoke while remaining 4 units are queued upstream (backpressured) -> EOF immediately with zero extra units
  hub.revoke('bp-1', 'revoked');
  const next = await readOneChunkText(reader);
  assertEquals(next.done, true);
  assertEquals(next.text, '');
  assertEquals(recheckCount, 1);
  reader.releaseLock();
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);

  // Throwing authorize -> redacted 503; throwing recheck -> zero bytes emitted
  const throwingAuthProxy = createNetScriptStreamProxy({
    baseUrl: 'http://streams.internal',
    upstreamAuth: () => ({}),
    authorize: () => {
      throw new Error('SECRET_DB_PASSWORD_LEAK');
    },
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/err/events',
  });
  const errAuthRes = await throwingAuthProxy(
    new Request('https://app.example.test/stream', { headers: BEARER }),
  );
  assertEquals(errAuthRes.status, 503);
  const errBody = await errAuthRes.text();
  assertFalse(errBody.includes('SECRET_DB_PASSWORD_LEAK'));

  const upstream2 = createControlledUpstream();
  const throwingRecheckProxy = createNetScriptStreamProxy({
    baseUrl: 'http://streams.internal',
    fetch: upstream2.fetch,
    recheckEveryMs: null,
    upstreamAuth: () => ({}),
    authorize: () => ({ allow: true, grant: { sessionId: 'err-r' } }),
    recheck: () => {
      throw new Error('SECRET_RECHECK_ERR');
    },
    resolvePath: () => '/projects/err/events',
  });
  const resR = await throwingRecheckProxy(
    new Request('https://app.example.test/stream', { headers: BEARER }),
  );
  upstream2.readers[0]!.push(
    sseDataBlock(makeStateChange('secret', { v: 1 })) + sseControlBlock({ streamNextOffset: 'o1' }),
  );
  assertEquals(await readAllText(resR.body), '');
  await flushMicrotasks();
  assertEquals(upstream2.activeCount, 0);
});

Deno.test('Finding 3c: scheduleChunkedDelay chunks delays > maxChunkMs, handles early wakeups, and supports mid-chain cancel', () => {
  interface FakeTimer {
    readonly id: number;
    readonly delayMs: number;
    readonly callback: () => void;
    canceled: boolean;
  }

  let now = 1_000;
  let nextId = 1;
  const timers: FakeTimer[] = [];
  const scheduledDelays: number[] = [];
  const clearedIds: number[] = [];

  const deps = {
    nowMs: () => now,
    setTimer: (callback: () => void, ms: number): ReturnType<typeof setTimeout> => {
      const entry: FakeTimer = { id: nextId++, delayMs: ms, callback, canceled: false };
      timers.push(entry);
      scheduledDelays.push(ms);
      return entry.id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimer: (id: ReturnType<typeof setTimeout>): void => {
      const numericId = id as unknown as number;
      clearedIds.push(numericId);
      const entry = timers.find((t) => t.id === numericId);
      if (entry) entry.canceled = true;
    },
    maxChunkMs: 10_000,
  };

  // 1. 25_000ms delay splits into [10_000, 10_000, 5_000] and never fires early
  let fired = 0;
  scheduleChunkedDelay(25_000, () => {
    fired += 1;
  }, deps);
  assertEquals(scheduledDelays, [10_000]);
  assertEquals(fired, 0);

  // Simulate early wakeup at +8_000ms (still 17_000ms left -> re-arms 10_000ms)
  now += 8_000;
  timers[0]!.callback();
  assertEquals(fired, 0);
  assertEquals(scheduledDelays, [10_000, 10_000]);

  // Advance +10_000ms (still 7_000ms left -> re-arms 7_000ms)
  now += 10_000;
  timers[1]!.callback();
  assertEquals(fired, 0);
  assertEquals(scheduledDelays, [10_000, 10_000, 7_000]);

  // Final chunk reaches deadline -> fires exactly once
  now += 7_000;
  timers[2]!.callback();
  assertEquals(fired, 1);

  // 2. Mid-chain cancellation clears active chunk timer and never invokes onFire
  let canceledFired = 0;
  const cancel = scheduleChunkedDelay(25_000, () => {
    canceledFired += 1;
  }, deps);
  now += 10_000;
  timers[3]!.callback(); // Arms chunk 2 (timers[4])
  assertEquals(canceledFired, 0);
  cancel();
  assertEquals(clearedIds, [timers[4]!.id]);
  now += 20_000;
  // Even if host invokes stale callback after clearTimer, guard prevents firing
  timers[4]!.callback();
  assertEquals(canceledFired, 0);
});

Deno.test('Finding 3a: pre-200 microtask-window revocation, expiry, and abort fail closed without emitting 200 or Set-Cookie', async () => {
  // (a) Second 'recheck' wake arriving during first pre-200 refence re-loops and fails closed 401 with zero Set-Cookie
  {
    const hub = createSharedRevocationHub();
    const fetchStarted = createDeferred<void>();
    const fetchDeferred = createDeferred<Response>();
    let bodyCanceled = false;
    let notifyRef: ((s?: StreamProxyRevocationSignal) => void) | undefined;
    let revSignalCalls = 0;

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      upstreamAuth: () => ({}),
      maxActiveReaders: 1,
      revocationSource: {
        subscribe(grant, notify) {
          notifyRef = notify;
          return hub.revocationSource.subscribe(grant, notify);
        },
      },
      fetch: () => {
        fetchStarted.resolve();
        return fetchDeferred.promise;
      },
      authorize: () => ({
        allow: true,
        grant: { sessionId: 'pre200-micro' },
        setCookies: ['__Host-session=rotated; Path=/; HttpOnly'],
      }),
      recheck: ({ grant, reason }) => {
        if (reason === 'revocation-signal') {
          revSignalCalls += 1;
          if (revSignalCalls === 1) {
            // Simulate revocation + wake landing on the resume microtask of refence #1
            queueMicrotask(() => {
              hub.revoke('pre200-micro', 'recheck');
              notifyRef?.({ action: 'recheck' });
            });
            return { allow: true };
          }
        }
        return hub.isActive(grant.sessionId)
          ? { allow: true }
          : { allow: false, reason: 'session_revoked' };
      },
      resolvePath: () => '/projects/pre200-micro/events',
    });

    const resP = proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    await fetchStarted.promise;
    // Trigger initial pre-200 epoch bump without revoking yet so refence #1 runs
    notifyRef?.({ action: 'recheck' });
    fetchDeferred.resolve(
      new Response(
        new ReadableStream({
          cancel() {
            bodyCanceled = true;
          },
        }),
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      ),
    );

    const res = await resP;
    assertEquals(res.status, 401);
    assertEquals(res.headers.getSetCookie(), []);
    assertEquals(bodyCanceled, true);
    assert(revSignalCalls >= 2, `expected microtask re-fence loop, got ${revSignalCalls}`);
    assertEquals(hub.unsubscribeCount('pre200-micro'), 1);
  }

  // (b) Clock expiry occurring before handoff without timer firing -> 401, zero Set-Cookie, upstream canceled, slot freed
  {
    const clock = new FakeClock(10_000);
    const fetchStarted = createDeferred<void>();
    const fetchDeferred = createDeferred<Response>();
    let bodyCanceled = false;

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      clock,
      upstreamAuth: () => ({}),
      maxActiveReaders: 1,
      fetch: () => {
        fetchStarted.resolve();
        return fetchDeferred.promise;
      },
      authorize: () => ({
        allow: true,
        grant: { sessionId: 'pre200-exp' },
        expiresAtMs: 15_000,
        setCookies: ['__Host-session=rotated; Path=/; HttpOnly'],
      }),
      recheck: () => ({ allow: true }),
      resolvePath: () => '/projects/pre200-exp/events',
    });

    const resP = proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    await fetchStarted.promise;
    clock.setNowWithoutFiring(15_000);
    fetchDeferred.resolve(
      new Response(
        new ReadableStream({
          cancel() {
            bodyCanceled = true;
          },
        }),
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      ),
    );
    const res = await resP;
    assertEquals(res.status, 401);
    assertEquals(res.headers.getSetCookie(), []);
    assertEquals(bodyCanceled, true);
    assertEquals(clock.pendingCount, 0);
  }
});

Deno.test('Finding 4: 500-unit streaming session cleans up per-iteration close listeners and closes cleanly', async () => {
  const upstream = createControlledUpstream();
  const hub = createSharedRevocationHub();
  const closed: StreamProxyCloseEvent[] = [];

  const proxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    revocationSource: hub.revocationSource,
    recheckEveryMs: null,
    upstreamAuth: () => ({}),
    authorize: () => ({ allow: true, grant: { sessionId: 'long-500' } }),
    recheck: ({ grant }) =>
      hub.isActive(grant.sessionId) ? { allow: true } : { allow: false, reason: 'revoked' },
    resolvePath: () => '/projects/long/events',
    onClose: (e) => closed.push(e),
  });

  const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
  assertEquals(res.status, 200);
  const reader = res.body!.getReader();

  for (let i = 1; i <= 500; i += 1) {
    upstream.readers[0]!.push(
      sseDataBlock(makeStateChange(`u${i}`, { i })) +
        sseControlBlock({ streamNextOffset: `off_${i}` }),
    );
    const chunk = await readOneChunkText(reader);
    assertFalse(chunk.done);
    assertStringIncludes(chunk.text, `off_${i}`);
  }

  const idleRead = readOneChunkText(reader);
  hub.revoke('long-500', 'revoked');
  const eof = await idleRead;
  assertEquals(eof.done, true);
  assertEquals(eof.text, '');
  reader.releaseLock();
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
  assertEquals(hub.unsubscribeCount('long-500'), 1);
  assertEquals(closed.length, 1);
  assertEquals(closed[0]!.reason, 'revoked');
  assertEquals(closed[0]!.deliveredUnits, 500);
});
