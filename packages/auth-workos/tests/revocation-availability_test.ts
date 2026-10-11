import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { createWorkosRevocationStore, revokeWorkosSubjectPage } from '../mod.ts';
import { cutoff } from './testing/revocation-fixture.ts';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
const adapters = [
  { name: 'Memory', create: () => Promise.resolve(new MemoryKvAdapter()) },
  { name: 'Deno KV', create: async () => new DenoKvAdapter(await Deno.openKv(':memory:')) },
  {
    name: 'Redis',
    create: () =>
      Promise.resolve(
        new RedisKvAdapter({
          url: redisUrl,
          namespace: `availability-${crypto.randomUUID()}`,
        }),
      ),
  },
];

for (const adapter of adapters) {
  Deno.test({
    name:
      `WorkOS ${adapter.name} selects due jobs behind future retries in an unordered bounded window`,
    ignore: adapter.name === 'Redis' && !redisUrl,
    async fn() {
      await using kv = await adapter.create();
      const clock = Date.parse(cutoff);
      const lists: number[] = [];
      // Force future-first traversal even on naturally ordered adapters. Range filtering belongs
      // to the real adapter; only traversal order changes. More future jobs than the window bound
      // prove selection filters before limiting instead of repeatedly starving a due subject.
      const unordered: KvStore = {
        get: kv.get.bind(kv),
        set: kv.set.bind(kv),
        delete: kv.delete.bind(kv),
        has: kv.has.bind(kv),
        atomic: kv.atomic.bind(kv),
        close: kv.close.bind(kv),
        [Symbol.asyncDispose]: kv[Symbol.asyncDispose].bind(kv),
        async *list<T>(options: import('@netscript/kv').KvListOptions) {
          assert(options.limit && options.limit <= 50);
          const entries = [];
          for await (const entry of kv.list<T>({ ...options, limit: undefined })) {
            entries.push(entry);
          }
          entries.reverse();
          const window = entries.slice(0, options.limit);
          lists.push(window.length);
          yield* window;
        },
      };
      const store = createWorkosRevocationStore(unordered, { now: () => clock });
      for (let i = 0; i < 60; i++) {
        await store.revokeSubject(`future-${i}`, new Date(clock + 60_000).toISOString());
      }
      await store.revokeSubject('due', cutoff);
      await store.revokeSubject('earliest', new Date(clock - 1000).toISOString());
      const delivery = await store.nextDelivery(clock);
      assertEquals(delivery?.job.subject, 'earliest');
      assertEquals(lists, [2]);
      assert(delivery);
      await store.checkpoint(delivery);
      assertEquals((await store.nextDelivery(clock))?.job.subject, 'due');
      assertEquals(await store.isRevoked('future-0', 'new', clock + 1), true);
      assertEquals(await store.isRevoked('unrelated', 'new', clock + 1), false);
    },
  });

  Deno.test({
    name:
      `WorkOS ${adapter.name} repairs every tombstone across unordered pages and restart without clearing a newer fence`,
    ignore: adapter.name === 'Redis' && !redisUrl,
    async fn() {
      await using kv = await adapter.create();
      const clock = Date.parse(cutoff);
      let repairReads = 0;
      const unordered: KvStore = {
        get: kv.get.bind(kv),
        set: kv.set.bind(kv),
        delete: kv.delete.bind(kv),
        has: kv.has.bind(kv),
        atomic: kv.atomic.bind(kv),
        close: kv.close.bind(kv),
        [Symbol.asyncDispose]: kv[Symbol.asyncDispose].bind(kv),
        async *list<T>(options: import('@netscript/kv').KvListOptions) {
          assert(options.limit && options.limit <= 51);
          const entries = [];
          for await (const entry of kv.list<T>({ ...options, limit: undefined })) {
            entries.push(entry);
          }
          // Reverse order puts a high key first, exposing the old "last returned key" cursor.
          entries.reverse();
          const window = entries.slice(0, options.limit);
          if (options.prefix.includes('repair') || options.prefix.includes('session')) {
            repairReads += window.length;
          }
          yield* window;
        },
      };
      const store = createWorkosRevocationStore(unordered, { now: () => clock });
      const job = await store.revokeSubject('alice', cutoff);
      for (let i = 0; i < 121; i++) {
        await store.revokeSession('alice', `s${String(i).padStart(3, '0')}`, job.id);
      }
      const delivery = await store.nextDelivery(clock);
      assert(delivery);
      const newer = await store.revokeSubject('alice', cutoff);
      await store.revokeSession('alice', 'newer', newer.id);
      await store.checkpoint(delivery);
      assert(repairReads <= 51);
      // Resume the exact original job after restart, with no upstream calls in repair mode.
      const restarted = createWorkosRevocationStore(unordered, { now: () => clock });
      const prefix = ['auth-workos', 'revocation'];
      async function pendingJob() {
        for await (const entry of kv.list<typeof job>({ prefix: [...prefix, 'pending'] })) {
          if (entry.value.id === job.id) return entry;
        }
        return undefined;
      }
      for (let page = 0; page < 3; page++) {
        const pending = await pendingJob();
        if (!pending) break;
        await revokeWorkosSubjectPage(
          restarted,
          {
            userManagement: {
              listSessions() {
                throw new Error('repair must not call WorkOS');
              },
              revokeSession() {
                throw new Error('repair must not call WorkOS');
              },
            },
          },
          { job: pending.value, versionstamp: pending.versionstamp },
          new AbortController().signal,
        );
      }
      assertEquals(await pendingJob(), undefined);
      for (let i = 0; i < 121; i++) {
        const entry = await kv.get<{ expiresAt?: number }>([
          ...prefix,
          'session',
          'alice',
          `s${String(i).padStart(3, '0')}`,
        ]);
        assertEquals(entry?.value.expiresAt, clock + 86_460_000);
      }
      assertEquals(repairReads, 121);
      assertEquals(
        (await kv.get<{ expiresAt?: number }>([...prefix, 'session', 'alice', 'newer']))?.value
          .expiresAt,
        undefined,
      );
      assertEquals(await store.isRevoked('alice', 'fresh', clock + 1), true);
      assertEquals(await store.isRevoked('bob', 'fresh', clock + 1), false);
    },
  });
}
