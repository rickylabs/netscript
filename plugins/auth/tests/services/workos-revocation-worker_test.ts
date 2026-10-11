import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import {
  createWorkosRevocationStore,
  type WorkosRevocationClient,
  type WorkosRevocationStore,
} from '@netscript/auth-workos';
import { createWorkosRevocationWorker } from '../../services/src/workos-revocation-worker.ts';
import { cutoff } from '../../../../packages/auth-workos/tests/testing/revocation-fixture.ts';

Deno.test('WorkOS worker consumes durable pages without any app request and drains on shutdown', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
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

Deno.test('WorkOS worker bounds retry attempts, retains failure and keeps the subject fenced', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', cutoff);
  const failed = Promise.withResolvers<void>();
  const attempts: number[] = [];
  const dueTimes: number[] = [];
  const observed: WorkosRevocationStore = {
    ...store,
    async checkpoint(delivery, next) {
      assert(next);
      attempts.push(next.attempt);
      dueTimes.push(next.dueAt);
      return await store.checkpoint(delivery, next);
    },
    async fail(delivery, reason) {
      const result = await store.fail(delivery, reason);
      failed.resolve();
      return result;
    },
  };
  let lists = 0;
  const client: WorkosRevocationClient = {
    userManagement: {
      listSessions() {
        lists++;
        return Promise.reject(new Error('provider down'));
      },
      revokeSession() {
        throw new Error('unexpected revoke');
      },
    },
  };
  let clock = Date.parse(cutoff);
  const worker = createWorkosRevocationWorker(observed, client, () => clock += 60_000);
  const running = worker.start();
  try {
    await failed.promise;
  } finally {
    await worker.stop();
    await running;
  }
  assertEquals(lists, 8);
  assertEquals(attempts, [1, 2, 3, 4, 5, 6, 7]);
  assert(dueTimes.every((time, index) => index === 0 || time > dueTimes[index - 1]));
  assertEquals(await store.nextDelivery(clock), undefined);
  assertEquals(await store.isRevoked('alice', 'rotated', clock), true);
  let failures = 0;
  for await (const entry of kv.list({ prefix: ['auth-workos', 'revocation', 'failed'] })) {
    failures++;
    assertEquals((entry.value as { reason: string }).reason, 'Error');
  }
  assertEquals(failures, 1);
});

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
