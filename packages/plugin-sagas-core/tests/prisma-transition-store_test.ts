import type { PostgresCommandClient } from '@netscript/database/commands/postgres';
import type { SagaCorrelationKey, SagaId, SagaInstanceId } from '../src/domain/mod.ts';
import { assertEquals, assertRejects } from '@std/assert';
import * as stores from '../src/stores/mod.ts';

Deno.test('Prisma atomic adapter refuses root callback handles before writes', async () => {
  const factory = Reflect.get(stores, 'createPrismaSagaTransitionStore');
  assertEquals(typeof factory, 'function');
  if (typeof factory !== 'function') throw new Error('missing atomic store');
  let writes = 0;
  const root = {
    $queryRawUnsafe<T>(): Promise<T> {
      writes++;
      return Promise.reject(new Error('unexpected root query'));
    },
    $executeRawUnsafe(): Promise<number> {
      writes++;
      return Promise.resolve(1);
    },
    async $transaction<T>(work: (tx: PostgresCommandClient) => Promise<T>): Promise<T> {
      return await work(root);
    },
  };
  const store = factory(root, { transactionTimeoutMs: 5000 });
  const at = new Date(0);
  await assertRejects(
    () =>
      store.commitTransition({
        expectedVersion: 0,
        envelope: {
          metadata: {
            instanceId: 'document:one' as SagaInstanceId,
            version: 1,
            status: 'running',
            durability: 't2',
            createdAt: at,
            updatedAt: at,
          },
          state: { count: 1 },
        },
        correlation: {
          sagaId: 'document' as SagaId,
          correlationKey: 'one' as SagaCorrelationKey,
          instanceId: 'document:one' as SagaInstanceId,
        },
        record: {
          version: 1,
          transition: {
            from: { count: 0 },
            to: { count: 1 },
            status: 'running',
            message: { type: 'start', payload: {} },
            occurredAt: at,
          },
        },
        commands: [],
        appliedKeyHash: 'a'.repeat(64),
      }),
    TypeError,
    'callback',
  );
  assertEquals(writes, 0);
});
