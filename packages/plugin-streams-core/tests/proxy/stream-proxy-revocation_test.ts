import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';
import {
  createNetScriptStreamProxy,
  DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS,
  type StreamProxyCloseEvent,
  type StreamProxyRevocationSignal,
} from '../../proxy.ts';
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
  stopDurableStreamTestServerCleanly,
  type TestGrant,
} from './_test_helpers.ts';

const BEARER_A = { authorization: 'Bearer token-session-A' };
const BEARER_B = { authorization: 'Bearer token-session-B' };

Deno.test('Gate 1 Barrier 1: pre-read revocation withholds batch 2 and control from revoked session while delivering to authorized session', async () => {
  const upstream = createControlledUpstream();
  const hub = createSharedRevocationHub();
  const barrier = createDeferred<void>();
  let barrierEnabled = false;
  let pausedCount = 0;
  const bothPaused = createDeferred<void>();
  const closedEvents: StreamProxyCloseEvent[] = [];

  const proxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({ authorization: 'Bearer upstream-secret' }),
    recheckEveryMs: null,
    authorize: ({ request }) => {
      const auth = request.headers.get('authorization') ?? '';
      const sessionId = auth.endsWith('session-A') ? 'session-A' : 'session-B';
      return hub.isActive(sessionId)
        ? { allow: true, grant: { sessionId } }
        : { allow: false, status: 401, reason: 'session_revoked' };
    },
    recheck: async ({ grant, reason }) => {
      if (reason === 'before-delivery' && barrierEnabled) {
        pausedCount += 1;
        if (pausedCount === 2) bothPaused.resolve();
        await barrier.promise;
      }
      return hub.isActive(grant.sessionId)
        ? { allow: true }
        : { allow: false, reason: 'session_revoked' };
    },
    resolvePath: () => '/projects/p1/events',
    onClose: (event) => closedEvents.push(event),
  });

  const resA = await proxy(new Request('https://app.example.test/stream', { headers: BEARER_A }));
  const resB = await proxy(new Request('https://app.example.test/stream', { headers: BEARER_B }));
  assertEquals(resA.status, 200);
  assertEquals(resB.status, 200);
  assertEquals(upstream.activeCount, 2);

  const readerA = resA.body!.getReader();
  const readerB = resB.body!.getReader();

  // Batch 1 delivered to both sessions
  const batch1 = sseDataBlock(makeStateChange('k1', { v: 1 })) +
    sseControlBlock({ streamNextOffset: 'off_1', upToDate: true });
  upstream.readers[0]!.push(batch1);
  upstream.readers[1]!.push(batch1);

  const unit1A = await readOneChunkText(readerA);
  const unit1B = await readOneChunkText(readerB);
  assertStringIncludes(unit1A.text, 'off_1');
  assertStringIncludes(unit1B.text, 'off_1');

  // Enable Barrier 1 (pause before shared-state read) and push Batch 2
  barrierEnabled = true;
  const batch2 = sseDataBlock(makeStateChange('k2', { v: 2 })) +
    sseControlBlock({ streamNextOffset: 'off_2', upToDate: true });
  upstream.readers[0]!.push(batch2);
  upstream.readers[1]!.push(batch2);

  const nextAPromise = readOneChunkText(readerA);
  const nextBPromise = readOneChunkText(readerB);
  await bothPaused.promise;

  // Revoke session-B before releasing Barrier 1
  hub.revoke('session-B');
  barrier.resolve();

  const unit2A = await nextAPromise;
  const unit2B = await nextBPromise;
  assertFalse(unit2A.done);
  assertStringIncludes(unit2A.text, '"k2"');
  assertStringIncludes(unit2A.text, 'off_2');

  // Revoked session-B receives neither batch 2 nor off_2, reaches clean EOF with zero fabricated frames
  assertEquals(unit2B.done, true);
  assertEquals(unit2B.text, '');
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 1);
  assertEquals(upstream.readers[1]!.canceled, true);

  // Fresh admission for session-B fails 401 and opens zero upstream connections
  const openedBefore = upstream.totalOpened;
  const freshB = await proxy(new Request('https://app.example.test/stream', { headers: BEARER_B }));
  assertEquals(freshB.status, 401);
  assertEquals(upstream.totalOpened, openedBefore);

  // Cleanup session-A cleanly
  await readerA.cancel('done');
  readerA.releaseLock();
  readerB.releaseLock();
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
  assert(closedEvents.some((e) => e.reason === 'revoked' && e.deliveredUnits === 1));
});

Deno.test('Gate 1 Barrier 1 (real DurableStreamTestServer): revoking session-B withholds live batch 2 and closes cleanly', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const baseUrl = await server.start();
  const streamPath = '/projects/live-revocation/events';
  const fullUpstreamUrl = `${baseUrl}/v1/stream/netscript${streamPath}`;

  try {
    // Seed stream with batch 1
    const createRes = await fetch(fullUpstreamUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('seed-1', { step: 1 })),
    });
    assert(createRes.ok, `PUT failed: ${createRes.status}`);
    await createRes.body?.cancel();

    const hub = createSharedRevocationHub();
    const barrier = createDeferred<void>();
    let barrierArmed = false;
    let paused = 0;
    const bothPaused = createDeferred<void>();

    const proxy = createNetScriptStreamProxy<TestGrant>({
      baseUrl,
      upstreamAuth: () => ({}),
      recheckEveryMs: null,
      authorize: ({ request }) => {
        const auth = request.headers.get('authorization') ?? '';
        const sessionId = auth.endsWith('session-A') ? 'session-A' : 'session-B';
        return hub.isActive(sessionId)
          ? { allow: true, grant: { sessionId } }
          : { allow: false, status: 401, reason: 'session_revoked' };
      },
      recheck: async ({ grant, reason }) => {
        if (reason === 'before-delivery' && barrierArmed) {
          paused += 1;
          if (paused === 2) bothPaused.resolve();
          await barrier.promise;
        }
        return hub.isActive(grant.sessionId)
          ? { allow: true }
          : { allow: false, reason: 'session_revoked' };
      },
      resolvePath: () => streamPath,
    });

    const resA = await proxy(new Request('https://app.example.test/stream', { headers: BEARER_A }));
    const resB = await proxy(new Request('https://app.example.test/stream', { headers: BEARER_B }));
    assertEquals(resA.status, 200);
    assertEquals(resB.status, 200);

    const readerA = resA.body!.getReader();
    const readerB = resB.body!.getReader();

    // Drain initial seed delivery unit on both readers
    const initA = await readOneChunkText(readerA);
    const initB = await readOneChunkText(readerB);
    assertStringIncludes(initA.text, 'seed-1');
    assertStringIncludes(initB.text, 'seed-1');
    assertStringIncludes(initA.text, 'event: control');

    // Arm barrier, then append live batch 2
    barrierArmed = true;
    const nextAPromise = readOneChunkText(readerA);
    const nextBPromise = readOneChunkText(readerB);

    const appendRes = await fetch(fullUpstreamUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('live-2', { step: 2 })),
    });
    assert(appendRes.ok, `POST failed: ${appendRes.status}`);
    await appendRes.body?.cancel();

    await bothPaused.promise;
    hub.revoke('session-B');
    barrier.resolve();

    const liveA = await nextAPromise;
    const liveB = await nextBPromise;
    assertFalse(liveA.done);
    assertStringIncludes(liveA.text, 'live-2');
    assertStringIncludes(liveA.text, 'event: control');
    assertEquals(liveB.done, true);
    assertEquals(liveB.text, '');

    const retryB = await proxy(
      new Request('https://app.example.test/stream', { headers: BEARER_B }),
    );
    assertEquals(retryB.status, 401);

    await readerA.cancel('done');
    readerA.releaseLock();
    readerB.releaseLock();
  } finally {
    await stopDurableStreamTestServerCleanly(server);
  }
});

Deno.test('Gate 1 Barrier 2 (real DurableStreamTestServer): Gateway 1 + Gateway 2 post-allow-snapshot stale allow fenced by push recheck wake', async () => {
  const server = new DurableStreamTestServer({ port: 0 });
  const baseUrl = await server.start();
  const streamPath = '/projects/live-barrier-2/events';
  const fullUpstreamUrl = `${baseUrl}/v1/stream/netscript${streamPath}`;

  try {
    const createRes = await fetch(fullUpstreamUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('seed-b2', { step: 1 })),
    });
    assert(createRes.ok, `PUT failed: ${createRes.status}`);
    await createRes.body?.cancel();

    const hub = createSharedRevocationHub();
    const barrier = createDeferred<void>();
    let barrierArmed = false;
    let paused = 0;
    const bothPaused = createDeferred<void>();
    const wakeObserved = createDeferred<void>();
    let recheckCallsB = 0;

    const instrumentedSource = {
      subscribe(
        grant: TestGrant,
        notify: (signal?: StreamProxyRevocationSignal) => void,
      ) {
        return hub.revocationSource.subscribe(grant, (sig) => {
          notify(sig);
          if (grant.sessionId === 'session-B' && sig?.action === 'recheck') {
            wakeObserved.resolve();
          }
        });
      },
    };

    const makeGateway = (source: typeof instrumentedSource | undefined) =>
      createNetScriptStreamProxy<TestGrant>({
        baseUrl,
        recheckEveryMs: null,
        revocationSource: source,
        upstreamAuth: () => ({}),
        authorize: ({ request }) => {
          const auth = request.headers.get('authorization') ?? '';
          const sessionId = auth.endsWith('session-A') ? 'session-A' : 'session-B';
          return hub.isActive(sessionId)
            ? { allow: true, grant: { sessionId }, expiresAtMs: Date.now() + 60_000 }
            : { allow: false, status: 401, reason: 'session_revoked' };
        },
        recheck: async ({ grant, reason }) => {
          if (grant.sessionId === 'session-B' && reason !== 'post-subscribe') {
            recheckCallsB += 1;
          }
          // Snapshot shared revocation state BEFORE blocking at Barrier 2
          const activeSnapshot = hub.isActive(grant.sessionId);
          if (reason === 'before-delivery' && barrierArmed) {
            paused += 1;
            if (paused === 2) bothPaused.resolve();
            await barrier.promise;
            return activeSnapshot
              ? { allow: true, expiresAtMs: Date.now() + 999_999 }
              : { allow: false, reason: 'session_revoked' };
          }
          return activeSnapshot ? { allow: true } : { allow: false, reason: 'session_revoked' };
        },
        resolvePath: () => streamPath,
      });

    const gateway1 = makeGateway(instrumentedSource);
    const gateway2 = makeGateway(undefined);

    const resA = await gateway1(
      new Request('https://app.example.test/stream', { headers: BEARER_A }),
    );
    const resB = await gateway1(
      new Request('https://app.example.test/stream', { headers: BEARER_B }),
    );
    assertEquals(resA.status, 200);
    assertEquals(resB.status, 200);

    const readerA = resA.body!.getReader();
    const readerB = resB.body!.getReader();
    const initA = await readOneChunkText(readerA);
    const initB = await readOneChunkText(readerB);
    assertStringIncludes(initA.text, 'seed-b2');
    assertStringIncludes(initB.text, 'seed-b2');

    // Arm Barrier 2 and append live batch 2 to real DurableStreamTestServer
    barrierArmed = true;
    const nextAPromise = readOneChunkText(readerA);
    const nextBPromise = readOneChunkText(readerB);

    const appendRes = await fetch(fullUpstreamUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeStateChange('live-b2-secret', { step: 2 })),
    });
    assert(appendRes.ok, `POST failed: ${appendRes.status}`);
    await appendRes.body?.cancel();

    await bothPaused.promise;
    // Gateway 2 revokes session-B with push 'recheck' wake (NOT 'revoked')
    hub.revoke('session-B', 'recheck');
    await wakeObserved.promise;
    barrier.resolve();

    const liveA = await nextAPromise;
    const liveB = await nextBPromise;
    assertFalse(liveA.done);
    assertStringIncludes(liveA.text, 'live-b2-secret');
    assertStringIncludes(liveA.text, 'event: control');

    assertEquals(liveB.done, true);
    assertEquals(liveB.text, '');
    assert(recheckCallsB >= 2, `expected fenced recheck after stale allow, got ${recheckCallsB}`);
    assertEquals(hub.unsubscribeCount('session-B'), 1);

    assertEquals(
      (await gateway1(new Request('https://app.example.test/stream', { headers: BEARER_B })))
        .status,
      401,
    );
    assertEquals(
      (await gateway2(new Request('https://app.example.test/stream', { headers: BEARER_B })))
        .status,
      401,
    );

    await readerA.cancel('done');
    readerA.releaseLock();
    readerB.releaseLock();
  } finally {
    await stopDurableStreamTestServerCleanly(server);
  }
});

Deno.test('Gate 1 Barrier 2: post-allow-snapshot fence across Gateway 1 and Gateway 2 with push recheck wake', async () => {
  const clock = new FakeClock(1_000_000);
  const upstream = createControlledUpstream();
  const hub = createSharedRevocationHub();
  const barrier = createDeferred<void>();
  let barrierArmed = false;
  let paused = 0;
  const bothPaused = createDeferred<void>();
  const wakeObserved = createDeferred<void>();
  let recheckCallsB = 0;

  // Instrument revocationSource to observe exact wake delivery into Gateway 1.
  const instrumentedSource = {
    subscribe(
      grant: TestGrant,
      notify: (signal?: StreamProxyRevocationSignal) => void,
    ) {
      return hub.revocationSource.subscribe(grant, (sig) => {
        notify(sig);
        if (grant.sessionId === 'session-B' && sig?.action === 'recheck') {
          wakeObserved.resolve();
        }
      });
    },
  };

  const makeGateway = (source: typeof instrumentedSource | undefined) =>
    createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      clock,
      recheckEveryMs: null,
      revocationSource: source,
      upstreamAuth: () => ({ authorization: 'Bearer upstream-secret' }),
      authorize: ({ request }) => {
        const auth = request.headers.get('authorization') ?? '';
        const sessionId = auth.endsWith('session-A') ? 'session-A' : 'session-B';
        return hub.isActive(sessionId)
          ? { allow: true, grant: { sessionId }, expiresAtMs: clock.nowMs() + 60_000 }
          : { allow: false, status: 401, reason: 'session_revoked' };
      },
      recheck: async ({ grant, reason }) => {
        if (grant.sessionId === 'session-B' && reason !== 'post-subscribe') {
          recheckCallsB += 1;
        }
        // Snapshot shared state BEFORE pausing at Barrier 2!
        const activeSnapshot = hub.isActive(grant.sessionId);
        if (reason === 'before-delivery' && barrierArmed) {
          paused += 1;
          if (paused === 2) bothPaused.resolve();
          await barrier.promise;
          // Return stale allow snapshot (including a bogus sliding expiresAtMs that MUST be fenced!)
          return activeSnapshot
            ? { allow: true, expiresAtMs: clock.nowMs() + 999_999 }
            : { allow: false, reason: 'session_revoked' };
        }
        return activeSnapshot ? { allow: true } : { allow: false, reason: 'session_revoked' };
      },
      resolvePath: () => '/projects/p1/events',
    });

  const gateway1 = makeGateway(instrumentedSource);
  const gateway2 = makeGateway(undefined);

  const resA = await gateway1(
    new Request('https://app.example.test/stream', { headers: BEARER_A }),
  );
  const resB = await gateway1(
    new Request('https://app.example.test/stream', { headers: BEARER_B }),
  );
  const readerA = resA.body!.getReader();
  const readerB = resB.body!.getReader();

  const batch1 = sseDataBlock(makeStateChange('k1', { v: 1 })) +
    sseControlBlock({ streamNextOffset: 'off_1' });
  upstream.readers[0]!.push(batch1);
  upstream.readers[1]!.push(batch1);
  assertStringIncludes((await readOneChunkText(readerA)).text, 'off_1');
  assertStringIncludes((await readOneChunkText(readerB)).text, 'off_1');

  // Arm Barrier 2 (snapshot taken BEFORE revocation)
  barrierArmed = true;
  const batch2 = sseDataBlock(makeStateChange('k2', { v: 2 })) +
    sseControlBlock({ streamNextOffset: 'off_2' });
  upstream.readers[0]!.push(batch2);
  upstream.readers[1]!.push(batch2);

  const nextAPromise = readOneChunkText(readerA);
  const nextBPromise = readOneChunkText(readerB);
  await bothPaused.promise;

  // Gateway 2 initiates revocation with push 'recheck' wake (NOT 'revoked')
  hub.revoke('session-B', 'recheck');
  await wakeObserved.promise;
  barrier.resolve();

  const unit2A = await nextAPromise;
  const unit2B = await nextBPromise;
  assertFalse(unit2A.done);
  assertStringIncludes(unit2A.text, 'off_2');

  // Gateway 1 fenced the stale allow snapshot, re-checked shared state, emitted zero bytes, closed cleanly
  assertEquals(unit2B.done, true);
  assertEquals(unit2B.text, '');
  assert(recheckCallsB >= 2, `expected fenced re-check after stale allow, got ${recheckCallsB}`);
  assertEquals(hub.unsubscribeCount('session-B'), 1);

  // Fresh admission fails on BOTH gateways
  assertEquals(
    (await gateway1(new Request('https://app.example.test/stream', { headers: BEARER_B }))).status,
    401,
  );
  assertEquals(
    (await gateway2(new Request('https://app.example.test/stream', { headers: BEARER_B }))).status,
    401,
  );

  await readerA.cancel('done');
  readerA.releaseLock();
  readerB.releaseLock();
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
  assertEquals(clock.pendingCount, 0);
});

Deno.test('Gate 1 confirmed push revoked: executes full closeOnce cleanup promptly on real clock and abortSetupOnce during setup', async () => {
  // (a) Streaming reader: real-clock push latency check well below 1s
  const upstream = createControlledUpstream();
  const hub = createSharedRevocationHub();
  const closed: StreamProxyCloseEvent[] = [];

  const proxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    revocationSource: hub.revocationSource,
    upstreamAuth: () => ({ authorization: 'Bearer secret' }),
    recheckEveryMs: 30_000,
    authorize: () => ({ allow: true, grant: { sessionId: 'session-C' } }),
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/c/events',
    onClose: (e) => closed.push(e),
  });

  const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER_A }));
  assertEquals(res.status, 200);
  const reader = res.body!.getReader();
  upstream.readers[0]!.push(
    sseDataBlock(makeStateChange('c1', { ok: true })) +
      sseControlBlock({ streamNextOffset: 'c_1' }),
  );
  assertStringIncludes((await readOneChunkText(reader)).text, 'c_1');

  // Reader is now idle awaiting next chunk; emit confirmed push 'revoked'
  const readNext = readOneChunkText(reader);
  const t0 = performance.now();
  hub.revoke('session-C', 'revoked');
  const eof = await readNext;
  const elapsedMs = performance.now() - t0;

  assertEquals(eof.done, true);
  assertEquals(eof.text, '');
  assert(elapsedMs < 1_000, `push revoked took ${elapsedMs}ms (expected << 1000ms)`);
  assertEquals(hub.unsubscribeCount('session-C'), 1);
  assertEquals(closed.length, 1);
  assertEquals(closed[0]!.reason, 'revoked');
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
  reader.releaseLock();

  // (b) Setup-phase reader: paused upstream fetch, emit 'revoked', dispose late upstream body
  const hubSetup = createSharedRevocationHub();
  const fetchDeferred = createDeferred<Response>();
  const fetchStarted = createDeferred<void>();
  let lateBodyCanceled = false;

  const setupProxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    revocationSource: hubSetup.revocationSource,
    upstreamAuth: () => ({ authorization: 'Bearer secret' }),
    fetch: () => {
      fetchStarted.resolve();
      return fetchDeferred.promise;
    },
    authorize: () => ({ allow: true, grant: { sessionId: 'session-setup' } }),
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/setup/events',
  });

  const setupResPromise = setupProxy(
    new Request('https://app.example.test/stream', { headers: BEARER_A }),
  );
  await fetchStarted.promise;
  hubSetup.revoke('session-setup', 'revoked');
  const setupRes = await setupResPromise;
  assertEquals(setupRes.status, 401);
  assertEquals(hubSetup.unsubscribeCount('session-setup'), 1);

  // Resolve late upstream fetch and assert its body is cancelled cleanly
  const lateBody = new ReadableStream<Uint8Array>({
    cancel() {
      lateBodyCanceled = true;
    },
  });
  fetchDeferred.resolve(
    new Response(lateBody, { status: 200, headers: { 'content-type': 'text/event-stream' } }),
  );
  await flushMicrotasks();
  assertEquals(lateBodyCanceled, true);
});

Deno.test('Gate 1 maxRefenceAttempts exhaustion fails closed in both setup and delivery', async () => {
  // (a) Setup catch-up exhaustion -> 503, zero 200 emitted, unsubscribe once, zero upstream calls
  const hubSetup = createSharedRevocationHub();
  let setupUpstreamCalls = 0;
  let setupRechecks = 0;
  let notifySetup: ((s?: StreamProxyRevocationSignal) => void) | undefined;

  const setupProxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    upstreamAuth: () => ({}),
    fetch: () => {
      setupUpstreamCalls += 1;
      return Promise.resolve(new Response(null, { status: 200 }));
    },
    revocationSource: {
      subscribe(grant, notify) {
        notifySetup = notify;
        return hubSetup.revocationSource.subscribe(grant, notify);
      },
    },
    authorize: () => ({ allow: true, grant: { sessionId: 's-storm' } }),
    recheck: () => {
      setupRechecks += 1;
      notifySetup?.({ action: 'recheck' });
      return { allow: true };
    },
    resolvePath: () => '/projects/storm/events',
  });

  const resSetup = await setupProxy(
    new Request('https://app.example.test/stream', { headers: BEARER_A }),
  );
  assertEquals(resSetup.status, 503);
  assertEquals(setupUpstreamCalls, 0);
  assertEquals(setupRechecks, DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS + 1);
  assertEquals(hubSetup.unsubscribeCount('s-storm'), 1);

  // (b) Active delivery exhaustion -> closeOnce('policy-error') with zero bytes emitted
  const upstream = createControlledUpstream();
  const hubDelivery = createSharedRevocationHub();
  const closed: StreamProxyCloseEvent[] = [];
  let notifyDelivery: ((s?: StreamProxyRevocationSignal) => void) | undefined;

  const deliveryProxy = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    upstreamAuth: () => ({}),
    recheckEveryMs: null,
    revocationSource: {
      subscribe(grant, notify) {
        notifyDelivery = notify;
        return hubDelivery.revocationSource.subscribe(grant, notify);
      },
    },
    authorize: () => ({ allow: true, grant: { sessionId: 'd-storm' } }),
    recheck: ({ reason }) => {
      if (reason !== 'post-subscribe') {
        notifyDelivery?.({ action: 'recheck' });
      }
      return { allow: true };
    },
    resolvePath: () => '/projects/storm/events',
    onClose: (e) => closed.push(e),
  });

  const resDelivery = await deliveryProxy(
    new Request('https://app.example.test/stream', { headers: BEARER_A }),
  );
  assertEquals(resDelivery.status, 200);
  upstream.readers[0]!.push(
    sseDataBlock(makeStateChange('k1', { v: 1 })) + sseControlBlock({ streamNextOffset: 'o1' }),
  );
  const text = await readAllText(resDelivery.body);
  assertEquals(text, '');
  assertEquals(closed.length, 1);
  assertEquals(closed[0]!.reason, 'policy-error');
  assertEquals(hubDelivery.unsubscribeCount('d-storm'), 1);
  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
});

Deno.test('Gate 1 pull-only observation-limit control & Gate 3 multi-gateway revocation', async () => {
  const clock = new FakeClock(2_000_000);
  const upstream = createControlledUpstream();
  const hub = createSharedRevocationHub();

  // Pull-only Gateway 1 + Gateway 2 sharing zero proxy state
  const makePullGateway = () =>
    createNetScriptStreamProxy<TestGrant>({
      baseUrl: 'http://streams.internal',
      fetch: upstream.fetch,
      clock,
      recheckEveryMs: 10_000,
      policyTimeoutMs: 2_000,
      upstreamAuth: () => ({}),
      authorize: ({ request }) => {
        const sessionId = (request.headers.get('authorization') ?? '').slice('Bearer '.length);
        return hub.isActive(sessionId)
          ? { allow: true, grant: { sessionId } }
          : { allow: false, status: 401, reason: 'session_revoked' };
      },
      recheck: ({ grant }) =>
        hub.isActive(grant.sessionId)
          ? { allow: true }
          : { allow: false, reason: 'session_revoked' },
      resolvePath: () => '/projects/mg/events',
    });

  const gw1 = makePullGateway();
  const gw2 = makePullGateway();

  // (a) Pull-only observation-limit control: batch 2 admitted before revocation drains; batch 3 withheld
  const res = await gw1(
    new Request('https://app.example.test/stream', {
      headers: { authorization: 'Bearer sess-pull' },
    }),
  );
  assertEquals(res.status, 200);
  const reader = res.body!.getReader();
  const u2 = sseDataBlock(makeStateChange('b2', { v: 2 })) +
    sseControlBlock({ streamNextOffset: 'o2' });
  upstream.readers[0]!.push(u2);
  assertStringIncludes((await readOneChunkText(reader)).text, 'o2');

  // Revoke on Gateway 2 before batch 3
  hub.revoke('sess-pull');
  const u3 = sseDataBlock(makeStateChange('b3', { v: 3 })) +
    sseControlBlock({ streamNextOffset: 'o3' });
  upstream.readers[0]!.push(u3);
  const res3 = await readOneChunkText(reader);
  assertEquals(res3.done, true);
  assertEquals(res3.text, '');
  reader.releaseLock();

  // (b) Pull-only idle reader closes within recheckEveryMs + policyTimeoutMs on fake clock
  const resIdle = await gw1(
    new Request('https://app.example.test/stream', {
      headers: { authorization: 'Bearer sess-idle' },
    }),
  );
  assertEquals(resIdle.status, 200);
  const idleReader = resIdle.body!.getReader();
  const idleReadPromise = readOneChunkText(idleReader);
  hub.revoke('sess-idle');
  await clock.advance(10_000);
  const idleResult = await idleReadPromise;
  assertEquals(idleResult.done, true);
  idleReader.releaseLock();

  // (c) Push-wired idle reader on Gateway 1 closes immediately when revoked on Gateway 2
  const gw1Push = createNetScriptStreamProxy<TestGrant>({
    baseUrl: 'http://streams.internal',
    fetch: upstream.fetch,
    clock,
    recheckEveryMs: 60_000,
    revocationSource: hub.revocationSource,
    upstreamAuth: () => ({}),
    authorize: ({ request }) => {
      const sessionId = (request.headers.get('authorization') ?? '').slice('Bearer '.length);
      return hub.isActive(sessionId)
        ? { allow: true, grant: { sessionId } }
        : { allow: false, status: 401, reason: 'session_revoked' };
    },
    recheck: ({ grant }) =>
      hub.isActive(grant.sessionId) ? { allow: true } : { allow: false, reason: 'session_revoked' },
    resolvePath: () => '/projects/mg/events',
  });

  const resPush = await gw1Push(
    new Request('https://app.example.test/stream', {
      headers: { authorization: 'Bearer sess-push' },
    }),
  );
  assertEquals(resPush.status, 200);
  const pushReader = resPush.body!.getReader();
  const pushReadPromise = readOneChunkText(pushReader);
  hub.revoke('sess-push', 'recheck');
  const pushResult = await pushReadPromise;
  assertEquals(pushResult.done, true);
  pushReader.releaseLock();

  // (d) Fresh admission fails on both gateways
  assertEquals(
    (await gw1(
      new Request('https://app.example.test/stream', {
        headers: { authorization: 'Bearer sess-push' },
      }),
    )).status,
    401,
  );
  assertEquals(
    (await gw2(
      new Request('https://app.example.test/stream', {
        headers: { authorization: 'Bearer sess-push' },
      }),
    )).status,
    401,
  );

  await flushMicrotasks();
  assertEquals(upstream.activeCount, 0);
  assertEquals(clock.pendingCount, 0);
});
