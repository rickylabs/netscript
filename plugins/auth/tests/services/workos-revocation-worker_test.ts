import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import {
  createWorkosBackend,
  createWorkosRevocationStore,
  type WorkosRevocationClient,
  type WorkosRevocationStore,
} from '@netscript/auth-workos';
import { createWorkosRevocationWorker } from '../../services/src/workos-revocation-worker.ts';
import {
  cutoff,
  sessionClient,
} from '../../../../packages/auth-workos/tests/testing/revocation-fixture.ts';

Deno.test('WorkOS worker consumes durable pages without any app request and drains on shutdown', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  const backend = createWorkosBackend({
    workos: sessionClient(),
    cookiePassword: 'x'.repeat(32),
    revocations: store,
    now: () => new Date(cutoff),
  });
  await backend.sessions.revokeSubjectSessions({ subject: 'alice' });
  const completed = Promise.withResolvers<void>();
  let lists = 0;
  const revoked: string[] = [];
  const observed: WorkosRevocationStore = {
    ...store,
    async checkpoint(delivery, next) {
      const result = await store.checkpoint(delivery, next);
      if (!next && result) completed.resolve();
      return result;
    },
  };
  const client: WorkosRevocationClient = {
    userManagement: {
      listSessions(subject, options) {
        lists++;
        assertEquals(options.limit, 50);
        return Promise.resolve({
          data: [{ id: options.after ? 'b' : 'a', userId: subject, createdAt: cutoff }],
          listMetadata: { after: options.after ? null : 'a' },
        });
      },
      revokeSession({ sessionId }) {
        revoked.push(sessionId);
        return Promise.resolve();
      },
    },
  };
  const worker = createWorkosRevocationWorker(observed, client, () => Date.parse(cutoff));
  const running = worker.start();
  try {
    await completed.promise;
  } finally {
    await worker.stop();
    await running;
  }
  assertEquals(lists, 2);
  assertEquals(revoked, ['a', 'b']);
  assertEquals(await store.nextDelivery(Date.parse(cutoff)), undefined);
  assertEquals(await store.isRevoked('alice', 'a', Date.parse(cutoff) + 1000), true);
});

Deno.test('WorkOS worker recovers after more than eight provider failures with capped retries', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
  const completed = Promise.withResolvers<void>();
  const attempts: number[] = [];
  const waits: number[] = [];
  let clock = Date.parse(cutoff);
  const observed: WorkosRevocationStore = {
    ...store,
    async checkpoint(delivery, next) {
      if (next) {
        attempts.push(next.attempt);
        assertEquals(await store.isRevoked('alice', 'new-session', clock), true);
      }
      const result = await store.checkpoint(delivery, next);
      if (!next && result) completed.resolve();
      return result;
    },
  };
  let lists = 0;
  const client: WorkosRevocationClient = {
    userManagement: {
      listSessions() {
        if (++lists <= 10) return Promise.reject(new Error('secret-provider-error'));
        return Promise.resolve({ data: [], listMetadata: {} });
      },
      revokeSession() {
        throw new Error('unexpected revoke');
      },
    },
  };
  const stages: string[] = [];
  const worker = createWorkosRevocationWorker(observed, client, () => clock, {
    wait: (ms, signal) => {
      if (lists >= 11) return waitForStop(signal);
      waits.push(ms);
      clock += ms;
      return Promise.resolve();
    },
  });
  const running = worker.start((stage) => {
    stages.push(stage);
  });
  try {
    await Promise.race([
      completed.promise,
      running.then(() => {
        throw new Error('worker exited');
      }),
    ]);
  } finally {
    await worker.stop();
  }
  assertEquals(lists, 11);
  assertEquals(attempts, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assertEquals(waits, [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000, 60000]);
  assertEquals(stages, Array(10).fill('delivery'));
  assertEquals(await store.nextDelivery(clock), undefined);
  assertEquals(await store.isRevoked('alice', 'new-session', clock + 1), false);
  assertEquals(await store.isRevoked('alice', 'old-session', Date.parse(cutoff)), true);
  assertEquals(await store.isRevoked('bob', 'unrelated', Date.parse(cutoff)), false);
});

for (const operation of ['nextDelivery', 'checkpoint'] as const) {
  Deno.test(`WorkOS worker supervises transient ${operation} storage failures and failing observers`, async () => {
    await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
    const store = createWorkosRevocationStore(kv);
    await store.revokeSubject('alice', cutoff);
    const completed = Promise.withResolvers<void>();
    let failed = false;
    let providerFailed = false;
    let clock = Date.parse(cutoff);
    const observed: WorkosRevocationStore = {
      ...store,
      async nextDelivery(now) {
        if (operation === 'nextDelivery' && !failed) {
          failed = true;
          throw new Error('credential-must-not-leak');
        }
        return await store.nextDelivery(now);
      },
      async checkpoint(delivery, next) {
        if (operation === 'checkpoint' && !failed) {
          failed = true;
          throw new Error('credential-must-not-leak');
        }
        const result = await store.checkpoint(delivery, next);
        if (!next && result) completed.resolve();
        return result;
      },
    };
    const client: WorkosRevocationClient = {
      userManagement: {
        listSessions() {
          // Fail the first dispatch to exercise the retry checkpoint outside the runner too.
          if (operation === 'checkpoint' && !providerFailed) {
            providerFailed = true;
            return Promise.reject(new Error('provider down'));
          }
          return Promise.resolve({ data: [], listMetadata: {} });
        },
        revokeSession() {
          throw new Error('unexpected revoke');
        },
      },
    };
    const stages: string[] = [];
    const worker = createWorkosRevocationWorker(observed, client, () => clock, {
      wait: (ms, signal) => {
        if (stages.length > 0 && !completedDone) {
          clock += ms;
          return Promise.resolve();
        }
        return waitForStop(signal);
      },
    });
    let completedDone = false;
    void completed.promise.then(() => {
      completedDone = true;
    });
    const running = worker.start((stage) => {
      stages.push(stage);
      throw new Error('broken logger');
    });
    try {
      await Promise.race([
        completed.promise,
        running.then(() => {
          throw new Error('worker exited');
        }),
      ]);
    } finally {
      await worker.stop();
    }
    assert(failed);
    assert(stages.includes('storage'));
    assertEquals(await store.nextDelivery(clock), undefined);
    assertEquals(await store.isRevoked('alice', 'new', clock + 1), false);
  });
}

Deno.test('WorkOS worker backs off idle KV reads to one per minute and aborts its wait', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  const idle = Promise.withResolvers<void>();
  const waits: number[] = [];
  let reads = 0;
  const worker = createWorkosRevocationWorker(
    {
      ...store,
      nextDelivery(now) {
        reads++;
        return store.nextDelivery(now);
      },
    },
    {
      userManagement: {
        listSessions() {
          throw new Error('no queued work');
        },
        revokeSession() {
          throw new Error('no queued work');
        },
      },
    },
    Date.now,
    {
      wait: (ms, signal) => {
        waits.push(ms);
        if (waits.length === 11) {
          idle.resolve();
          return waitForStop(signal);
        }
        return Promise.resolve();
      },
    },
  );
  const running = worker.start();
  try {
    await Promise.race([idle.promise, running]);
  } finally {
    await worker.stop();
  }
  assertEquals(waits, [250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000]);
  assertEquals(reads, waits.length);
});

function waitForStop(signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) =>
    signal.addEventListener('abort', () => resolve(), { once: true })
  );
}

Deno.test('WorkOS worker shutdown leaves an interrupted page durable for restart', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const client: WorkosRevocationClient = {
    userManagement: {
      async listSessions() {
        entered.resolve();
        await release.promise;
        return { data: [], listMetadata: { after: null } };
      },
      revokeSession() {
        throw new Error('unexpected revoke');
      },
    },
  };
  const worker = createWorkosRevocationWorker(store, client, () => Date.parse(cutoff));
  const running = worker.start();
  await entered.promise;
  const stopped = worker.stop();
  release.resolve();
  await stopped;
  await running;
  assert(await store.nextDelivery(Date.parse(cutoff)));
  assertEquals(await store.isRevoked('alice', 'a', Date.parse(cutoff)), true);
});
