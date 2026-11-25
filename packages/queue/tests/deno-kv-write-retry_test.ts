import { assertEquals, assertRejects } from '@std/assert';
import {
  classifyKvWriteFailure,
  DEFAULT_KV_WRITE_RETRY_POLICY,
  retryKnownUncommittedWrite,
  WRITE_FAILURE_CLASS,
} from '../adapters/_kv-queue/write-retry.ts';
import { KvQueueDispatcher } from '../adapters/_kv-queue/dispatcher.ts';
import type { KvQueueConnection } from '../adapters/_kv-queue/connection.ts';
import { createEnvelope } from '../adapters/_envelope.ts';

Deno.test('classifyKvWriteFailure separates transient SQLite busy, CAS conflict, abort, and unknown outcomes', () => {
  assertEquals(
    classifyKvWriteFailure(new Error('SQLITE_BUSY: database is locked')),
    WRITE_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT,
  );
  assertEquals(
    classifyKvWriteFailure(new Error('SQLITE_LOCKED: database table is locked')),
    WRITE_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT,
  );
  assertEquals(
    classifyKvWriteFailure(
      new Error('outer failure', {
        cause: Object.assign(new Error('busy'), { code: 'SQLITE_BUSY_SNAPSHOT' }),
      }),
    ),
    WRITE_FAILURE_CLASS.KNOWN_UNCOMMITTED_TRANSIENT,
  );

  assertEquals(
    classifyKvWriteFailure(new Error('Worker idempotency claim lost before apply')),
    WRITE_FAILURE_CLASS.CAS_CONFLICT,
  );
  assertEquals(
    classifyKvWriteFailure(
      Object.assign(new Error('SQLITE_BUSY: database is locked'), { code: 'CAS_CONFLICT' }),
    ),
    WRITE_FAILURE_CLASS.CAS_CONFLICT,
  );

  const abort = new AbortController();
  const reason = new Error('custom abort reason');
  abort.abort(reason);
  assertEquals(classifyKvWriteFailure(reason, abort.signal), WRITE_FAILURE_CLASS.ABORTED);
  assertEquals(
    classifyKvWriteFailure(new DOMException('cancelled', 'AbortError')),
    WRITE_FAILURE_CLASS.ABORTED,
  );

  assertEquals(
    classifyKvWriteFailure(new Deno.errors.BadResource('KV closed')),
    WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
  );
  assertEquals(
    classifyKvWriteFailure(new Error('SQLITE_BUSY after commit: outcome unknown')),
    WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
  );
  assertEquals(
    classifyKvWriteFailure(new Error('dead-letter storage temporarily unavailable')),
    WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
  );
  assertEquals(
    classifyKvWriteFailure(
      Object.assign(new Error('database is locked'), { code: 'SQLITE_IOERR_WRITE' }),
    ),
    WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
    'explicit non-busy SQLite code must override lock-message fallback',
  );
  assertEquals(
    classifyKvWriteFailure(new Error('SQLITE_IOERR_WRITE: database is locked')),
    WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
  );
  assertEquals(
    classifyKvWriteFailure(
      Object.assign(new Error('SQLITE_BUSY: database is locked'), { code: 'SQLITE_FULL' }),
    ),
    WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
  );
  assertEquals(
    classifyKvWriteFailure(
      new Error('database is locked', {
        cause: Object.assign(new Error('fsync failed'), { code: 'SQLITE_IOERR_FSYNC' }),
      }),
    ),
    WRITE_FAILURE_CLASS.UNKNOWN_COMMIT_OUTCOME,
  );
});

Deno.test('retryKnownUncommittedWrite enforces maxAttempts, maxTotalTimeMs, and equal-jitter backoff', async () => {
  let attempts = 0;
  const waits: number[] = [];
  let clock = 0;
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          attempts += 1;
          return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
        },
        {
          policy: DEFAULT_KV_WRITE_RETRY_POLICY,
          now: () => clock,
          random: () => 1,
          sleep: (ms) => {
            waits.push(ms);
            clock += ms;
            return Promise.resolve();
          },
        },
      ),
    Error,
    'SQLITE_BUSY',
  );
  assertEquals(attempts, DEFAULT_KV_WRITE_RETRY_POLICY.maxAttempts);
  assertEquals(waits, [15, 30, 60, 120, 240]);

  let minJitterAttempts = 0;
  const minWaits: number[] = [];
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          minJitterAttempts += 1;
          return Promise.reject(new Error('database is locked'));
        },
        {
          policy: { maxAttempts: 4, maxTotalTimeMs: 500, baseDelayMs: 20, maxDelayMs: 50 },
          now: () => 0,
          random: () => 0,
          sleep: (ms) => {
            minWaits.push(ms);
            return Promise.resolve();
          },
        },
      ),
    Error,
    'database is locked',
  );
  assertEquals(minJitterAttempts, 4);
  assertEquals(minWaits, [10, 20, 25]);

  let timedAttempts = 0;
  const timedWaits: number[] = [];
  let elapsed = 0;
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          timedAttempts += 1;
          elapsed += 30;
          return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
        },
        {
          policy: { maxAttempts: 10, maxTotalTimeMs: 50, baseDelayMs: 10, maxDelayMs: 100 },
          now: () => elapsed,
          random: () => 1,
          sleep: (ms) => {
            timedWaits.push(ms);
            elapsed += ms;
            return Promise.resolve();
          },
        },
      ),
    Error,
    'SQLITE_BUSY',
  );
  assertEquals(timedAttempts, 2);
  assertEquals(timedWaits, [10]);

  // Must never start a retry at or after the retry-start deadline.
  const tightStarts: number[] = [];
  let tightClock = 0;
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          tightStarts.push(tightClock);
          return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
        },
        {
          policy: { maxAttempts: 4, maxTotalTimeMs: 10, baseDelayMs: 20, maxDelayMs: 50 },
          now: () => tightClock,
          random: () => 1,
          sleep: (ms) => {
            tightClock += ms;
            return Promise.resolve();
          },
        },
      ),
    Error,
    'SQLITE_BUSY',
  );
  assertEquals(tightStarts, [0], 'retry must not start at or after the 10 ms deadline');

  // Must recheck the monotonic deadline after backoff in case sleep overshoots.
  const overshootStarts: number[] = [];
  let overshootClock = 0;
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          overshootStarts.push(overshootClock);
          return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
        },
        {
          policy: { maxAttempts: 4, maxTotalTimeMs: 10, baseDelayMs: 4, maxDelayMs: 50 },
          now: () => overshootClock,
          random: () => 1,
          sleep: () => {
            overshootClock += 12;
            return Promise.resolve();
          },
        },
      ),
    Error,
    'SQLITE_BUSY',
  );
  assertEquals(overshootStarts, [0], 'post-sleep deadline recheck must stop before retry');
});

Deno.test('retryKnownUncommittedWrite stops immediately on abort, CAS conflict, and verifies unknown outcomes', async () => {
  const controller = new AbortController();
  let abortedAttempts = 0;
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          abortedAttempts += 1;
          return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
        },
        {
          signal: controller.signal,
          policy: { maxAttempts: 6, maxTotalTimeMs: 2_000, baseDelayMs: 500, maxDelayMs: 500 },
          sleep: (_ms, signal) => {
            controller.abort(new DOMException('stop', 'AbortError'));
            return Promise.reject(signal?.reason);
          },
        },
      ),
    DOMException,
  );
  assertEquals(abortedAttempts, 1);

  let casAttempts = 0;
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          casAttempts += 1;
          return Promise.reject(new Error('Worker idempotency claim lost before apply'));
        },
      ),
    Error,
    'claim lost',
  );
  assertEquals(casAttempts, 1);

  let unknownCommittedAttempts = 0;
  let verifyCalls = 0;
  const recovered = await retryKnownUncommittedWrite(
    () => {
      unknownCommittedAttempts += 1;
      return Promise.reject(new Error('ambiguous commit outcome'));
    },
    {
      verifyCommitted: () => {
        verifyCalls += 1;
        return Promise.resolve({ committed: true, value: 'already-committed' });
      },
    },
  );
  assertEquals(recovered, 'already-committed');
  assertEquals(unknownCommittedAttempts, 1);
  assertEquals(verifyCalls, 1);

  let unknownUncommittedAttempts = 0;
  await assertRejects(
    () =>
      retryKnownUncommittedWrite(
        () => {
          unknownUncommittedAttempts += 1;
          return Promise.reject(new Error('ambiguous commit outcome'));
        },
        {
          verifyCommitted: () => Promise.resolve({ committed: false }),
        },
      ),
    Error,
    'ambiguous commit outcome',
  );
  assertEquals(unknownUncommittedAttempts, 1);
});

Deno.test('KvQueueDispatcher.enqueue retries known-uncommitted SQLite busy and never retries unknown errors', async () => {
  const realKv = await Deno.openKv(':memory:');
  try {
    let mode: 'busy-once' | 'ambiguous' = 'busy-once';
    let enqueueCalls = 0;
    const wrappedKv = new Proxy(realKv, {
      get(target, prop, receiver) {
        if (prop === 'enqueue') {
          return (value: unknown, options?: { delay?: number }) => {
            enqueueCalls += 1;
            if (mode === 'busy-once' && enqueueCalls === 1) {
              return Promise.reject(new Error('SQLITE_BUSY: database is locked'));
            }
            if (mode === 'ambiguous') {
              return Promise.reject(new Error('ambiguous enqueue outcome'));
            }
            return target.enqueue(value, options);
          };
        }
        const member = Reflect.get(target, prop, receiver);
        return typeof member === 'function' ? member.bind(target) : member;
      },
    });
    const connection: KvQueueConnection = {
      dedicatedListener: false,
      shared: () => Promise.resolve(wrappedKv),
      listener: () => Promise.resolve(wrappedKv),
      close: () => Promise.resolve(false),
    };
    const dispatcher = new KvQueueDispatcher(connection);

    await dispatcher.enqueue(createEnvelope({ n: 1 }, undefined, 'retry-q'));
    assertEquals(enqueueCalls, 2);

    mode = 'ambiguous';
    enqueueCalls = 0;
    await assertRejects(
      () => dispatcher.enqueue(createEnvelope({ n: 2 }, undefined, 'retry-q')),
      Error,
      'ambiguous enqueue outcome',
    );
    assertEquals(enqueueCalls, 1);
  } finally {
    realKv.close();
  }
});
