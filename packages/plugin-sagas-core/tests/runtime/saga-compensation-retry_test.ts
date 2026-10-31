import { assertEquals } from '@std/assert';
import { DenoKvAdapter, type KvStore, MemoryKvAdapter } from '@netscript/kv';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { KvSagaStore } from '../../src/stores/kv-saga-store.ts';
import {
  assertCompensationRetry,
  COMPENSATION_RETRY_STATUSES,
  type CompensationFault,
} from '../fixtures/compensation-retry.ts';

const FAULTS: readonly CompensationFault[] = ['before-commit', 'after-commit'];

for (const backend of ['memory', 'kv', 'redis']) {
  for (const fault of FAULTS) {
    for (const status of COMPENSATION_RETRY_STATUSES) {
      Deno.test({
        name: `compensation ${backend} ${fault} retries the same ${status} outcome after reopening`,
        ignore: backend === 'redis' && !Deno.env.get('NETSCRIPT_TEST_REDIS_URL'),
        async fn() {
          const root = await Deno.makeTempDir();
          const namespace = crypto.randomUUID();
          let armed = false;
          let faults = 0;
          let compensationBatch:
            | Readonly<{ state: boolean; history: boolean; replay: boolean }>
            | undefined;
          const open = async () => {
            const kv: KvStore = backend === 'memory'
              ? new MemoryKvAdapter()
              : backend === 'kv'
              ? new DenoKvAdapter(await Deno.openKv(root + '/sagas.db'))
              : new RedisKvAdapter({
                url: Deno.env.get('NETSCRIPT_TEST_REDIS_URL')!,
                namespace,
              });
            return new KvSagaStore({
              kv: new Proxy(kv, {
                get(target, key) {
                  if (key === 'atomic') {
                    return async (...args: Parameters<NonNullable<KvStore['atomic']>>) => {
                      if (!armed) return await target.atomic!(...args);
                      armed = false;
                      faults++;
                      const mutations = args[1];
                      compensationBatch = {
                        state: mutations.some((row) =>
                          row.type === 'set' && row.key.includes('state')
                        ),
                        history: mutations.some((row) =>
                          row.type === 'set' && row.key.includes('transition')
                        ),
                        replay: mutations.some((row) =>
                          row.type === 'set' && row.key.includes('applied')
                        ),
                      };
                      if (fault === 'after-commit') {
                        const result = await target.atomic!(...args);
                        assertEquals(result.ok, true);
                      }
                      throw new Error('injected compensation persistence failure');
                    };
                  }
                  const member = Reflect.get(target, key);
                  return typeof member === 'function' ? member.bind(target) : member;
                },
              }),
            });
          };
          let store = await open();
          try {
            await assertCompensationRetry({
              store,
              status,
              fault,
              armFault() {
                armed = true;
              },
              faultCount() {
                return faults;
              },
              async reopen() {
                if (backend !== 'memory') {
                  await store.close();
                  store = await open();
                }
                return store;
              },
            });
            assertEquals(compensationBatch, { state: true, history: true, replay: true });
          } finally {
            await store.close();
            await Deno.remove(root, { recursive: true });
          }
        },
      });
    }
  }
}
