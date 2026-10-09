import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  type ClaimedCommandOutboxRow,
  type CommandOutboxPublication,
  type CommandOutboxRelayOptions,
  type CommandOutboxRelayStore,
  type CommandOutboxRelease,
  CommandRelayError,
  type CommandRelayFailureClass,
  createCommandOutboxRelay,
} from '../commands-relay.ts';
const parent = '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01';
function row(id = 'message'): ClaimedCommandOutboxRow {
  return {
    id,
    executionId: 'execution',
    commandName: 'project.rename',
    commandVersion: 1,
    destination: 'sink',
    topic: 'job.rename',
    payloadJson: '{"name":"safe"}',
    dedupeKey: 'stable',
    correlationId: 'correlation',
    traceparent: parent,
    attemptCount: 1,
    claimToken: 'lease',
    claimUntil: new Date(2000),
  };
}
function fixture(rows: readonly ClaimedCommandOutboxRow[] = [row()]) {
  const releases: CommandOutboxRelease[] = [],
    publications: CommandOutboxPublication[] = [],
    claims: string[] = [],
    events: string[] = [];
  let pending = [...rows];
  let current = 1000;
  const store: CommandOutboxRelayStore = {
    claim(request) {
      claims.push(request.claimToken);
      events.push('claim');
      const selected = pending.slice(0, request.limit);
      pending = pending.slice(request.limit);
      return Promise.resolve(selected.map((r) => ({ ...r, claimToken: request.claimToken })));
    },
    markPublished(request) {
      events.push('mark');
      publications.push(request);
      return Promise.resolve(true);
    },
    release(request) {
      releases.push(request);
      return Promise.resolve(true);
    },
  };
  const options: CommandOutboxRelayOptions = {
    store,
    sinks: new Map([['sink', {
      id: 'sink',
      publish() {
        events.push('publish');
        return Promise.resolve({ identity: 'run', acceptedAt: new Date(1000) });
      },
    }]]),
    clock: { now: () => new Date(current) },
    ids: { next: () => `generation-${claims.length}` },
    batchSize: 4,
    concurrency: 2,
    leaseMs: 100,
    maxAttempts: 3,
    maxRetryDelayMs: 1000,
    classify: () => 'unavailable',
    retryAt: (_attempt, now) => new Date(now.getTime() + 10),
  };
  return {
    options,
    store,
    releases,
    publications,
    claims,
    events,
    setTime(value: number) {
      current = value;
    },
    add(record: ClaimedCommandOutboxRow) {
      pending.push(record);
    },
  };
}
Deno.test('relay decodes canonical payload and W3C before publication and refuses corrupt rows or missing sinks', async () => {
  const f = fixture([row('json'), row('trace'), row('missing')]);
  const records = [{ ...row('json'), payloadJson: '{"b":2,"a":1}' }, {
    ...row('trace'),
    traceparent: 'invalid',
  }, { ...row('missing'), destination: 'absent' }];
  const g = fixture(records);
  const relay = createCommandOutboxRelay(g.options);
  assertEquals(await relay.drainOnce(), 0);
  assertEquals(g.publications.length, 0);
  assertEquals(g.releases.length, 3);
  assertEquals(g.events, ['claim']);
  assert(g.releases.every((r) => r.failure === 'misconfigured'));
  await relay.stop();
  assertThrows(() => createCommandOutboxRelay({ ...f.options, batchSize: 0 }), TypeError);
});
Deno.test('relay publishes before settlement with copied registry fresh generations and normalized acceptance', async () => {
  const f = fixture();
  const sinks = new Map(f.options.sinks);
  let seen: unknown;
  sinks.set('sink', {
    id: 'sink',
    publish(message) {
      seen = message;
      f.events.push('publish');
      return Promise.resolve({ identity: 'run', acceptedAt: new Date(1000) });
    },
  });
  const relay = createCommandOutboxRelay({ ...f.options, sinks });
  sinks.clear();
  assertEquals(await relay.drainOnce(), 1);
  assertEquals(f.events, ['claim', 'publish', 'mark']);
  assertEquals(seen, {
    id: 'message',
    destination: 'sink',
    topic: 'job.rename',
    payload: { name: 'safe' },
    dedupeKey: 'stable',
    correlationId: 'correlation',
    trace: { traceparent: parent },
  });
  assertEquals(f.publications[0].acceptance, { identity: 'run', acceptedAt: new Date(1000) });
  f.add(row('next'));
  assertEquals(await relay.drainOnce(), 1);
  assertEquals(f.claims, ['generation-0', 'generation-1']);
  await relay.stop();
});
Deno.test('relay publication then settlement crash redelivers stable key with explicitly idempotent downstream persistence', async () => {
  const f = fixture();
  const accepted: string[] = [], applied = new Set<string>();
  let fail = true;
  f.store.markPublished = async () => {
    if (fail) throw new Error('commit acknowledgement lost');
    return await Promise.resolve(true);
  };
  const sink = {
    id: 'sink',
    publish(message: { dedupeKey: string }) {
      accepted.push(message.dedupeKey);
      applied.add(message.dedupeKey);
      return Promise.resolve();
    },
  };
  const relay = createCommandOutboxRelay({ ...f.options, sinks: new Map([['sink', sink]]) });
  await assertRejects(() => relay.drainOnce(), Error, 'acknowledgement lost');
  assertEquals(f.releases.length, 0);
  assertEquals(accepted, ['stable']);
  f.setTime(2100);
  f.add({ ...row(), attemptCount: 2 });
  fail = false;
  assertEquals(await relay.drainOnce(), 1);
  assertEquals(accepted, ['stable', 'stable']);
  assertEquals(applied.size, 1);
  await relay.stop();
  const before = fixture();
  before.store.claim = () => {
    throw new Error('claim unavailable');
  };
  const untouched = createCommandOutboxRelay(before.options);
  await assertRejects(() => untouched.drainOnce(), Error, 'claim unavailable');
  assertEquals(before.events, []);
  await untouched.stop();
});
Deno.test('relay bounds retry attempts failure classes malformed receipts and invalid backoff without losing ownership', async () => {
  for (const mode of ['reject', 'receipt', 'classifier', 'retry', 'exhausted']) {
    const f = fixture([{ ...row(), attemptCount: mode === 'exhausted' ? 3 : 1 }]);
    const relay = createCommandOutboxRelay({
      ...f.options,
      sinks: new Map([['sink', {
        id: 'sink',
        publish() {
          if (mode === 'receipt') {
            return Promise.resolve({ identity: '', acceptedAt: new Date(NaN) });
          }
          throw mode === 'reject' || mode === 'exhausted'
            ? new CommandRelayError('rejected')
            : new Error('private detail');
        },
      }]]),
      classify: (): CommandRelayFailureClass => {
        const broken: { failure: CommandRelayFailureClass } = { failure: 'unavailable' };
        if (mode === 'classifier') Reflect.set(broken, 'failure', 'open');
        return broken.failure;
      },
      retryAt: () => mode === 'retry' ? new Date(999) : new Date(1010),
    });
    assertEquals(await relay.drainOnce(), 0);
    assertEquals(f.publications.length, 0);
    assertEquals(f.releases.length, 1);
    const release = f.releases[0];
    assertEquals(
      release.failure,
      mode === 'receipt'
        ? 'invalid_response'
        : mode === 'classifier' || mode === 'retry'
        ? 'misconfigured'
        : mode === 'reject' || mode === 'exhausted'
        ? 'rejected'
        : 'unavailable',
    );
    assertEquals(
      release.disposition,
      mode === 'exhausted' || mode === 'retry' ? 'terminal' : 'retry',
    );
    assertEquals(release.now, new Date(1000));
    await relay.stop();
  }
});
Deno.test('relay stop aborts publishers and awaits all overlapping drains under one concurrency ceiling', async () => {
  const f = fixture([
    row('one'),
    row('two'),
    row('three'),
    row('four'),
    row('five'),
    row('six'),
    row('seven'),
    row('eight'),
  ]);
  const started = Promise.withResolvers<void>(), finish = Promise.withResolvers<void>();
  let running = 0, maximum = 0, published = 0;
  const signals: AbortSignal[] = [];
  const relay = createCommandOutboxRelay({
    ...f.options,
    sinks: new Map([['sink', {
      id: 'sink',
      async publish(_message, signal) {
        assert(signal);
        signals.push(signal);
        running++;
        published++;
        maximum = Math.max(maximum, running);
        if (running === 2) started.resolve();
        await finish.promise;
        running--;
      },
    }]]),
  });
  const first = relay.drainOnce(), second = relay.drainOnce();
  await started.promise;
  let stopped = false;
  const stopping = relay.stop().then(() => {
    stopped = true;
  });
  await Promise.resolve();
  assertEquals(stopped, false);
  assert(signals.every((s) => s.aborted));
  finish.resolve();
  await Promise.all([first, second, stopping]);
  assertEquals(stopped, true);
  assertEquals(maximum, 2);
  assertEquals(published, 2);
  assertEquals(f.claims.length, 1);
  assertEquals(await relay.drainOnce(), 0);
  assertEquals(f.publications.length, 0);
});
Deno.test('relay observer failures preserve exactly one publication and finite privacy-safe tracing inputs', async () => {
  const f = fixture();
  let calls = 0;
  const starts: unknown[] = [];
  const observer = {
    async traceRelay<T>(
      start: unknown,
      operation: (span: { finish(): void }) => Promise<T>,
    ): Promise<T> {
      starts.push(start);
      const result = await operation({
        finish() {
          throw new Error('observer');
        },
      });
      throw Object.assign(new Error('end'), { result });
    },
    async tracePublish<T>(
      start: unknown,
      operation: (span: { finish(): void }) => Promise<T>,
    ): Promise<T> {
      calls++;
      starts.push(start);
      return await operation({
        finish() {
          throw new Error('observer');
        },
      });
    },
  };
  const relay = createCommandOutboxRelay({
    ...f.options,
    provider: 'postgres',
    telemetry: observer,
  });
  assertEquals(await relay.drainOnce(), 1);
  assertEquals(calls, 1);
  assertEquals(f.events, ['claim', 'publish', 'mark']);
  assertEquals(starts, [{
    name: 'project.rename',
    definitionVersion: 1,
    provider: 'postgres',
    isolation: 'default',
    idempotency: 'claimed',
  }, {
    name: 'project.rename',
    definitionVersion: 1,
    provider: 'postgres',
    isolation: 'default',
    idempotency: 'claimed',
  }]);
  await relay.stop();
});
