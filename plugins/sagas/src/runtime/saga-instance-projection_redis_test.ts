import { assert, assertEquals } from '@std/assert';
import { RedisKvAdapter } from '@netscript/kv/redis';
import { KvSagaStore } from '@netscript/plugin-sagas-core/stores';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '@netscript/plugin-sagas-core/runtime';

import {
  KvSagaInstanceProjection,
  ProjectingSagaStore,
  type SagaInstanceReadModel,
} from './saga-instance-projection.ts';

Deno.test({
  name: 'projection revives date strings from real Redis-persisted saga state',
  ignore: !Deno.env.get('NETSCRIPT_TEST_REDIS_URL'),
  async fn() {
    const url = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
    assert(url);
    const namespace = `saga-projection-${crypto.randomUUID()}`;
    const kv = new RedisKvAdapter({ url, namespace });
    const canonical = new KvSagaStore({ kv, prefix: ['sagas'] });
    const store = new ProjectingSagaStore(canonical, new KvSagaInstanceProjection(kv));
    const sagaId = 'checkout' as SagaId;
    const correlationKey = 'order-redis-date' as SagaCorrelationKey;
    const instanceId = `${sagaId}:${correlationKey}` as SagaInstanceId;
    const occurredAt = new Date('2026-08-04T10:30:00.000Z');
    const envelope: SagaStateEnvelope = Object.freeze({
      metadata: Object.freeze({
        instanceId,
        version: 1,
        status: 'running',
        durability: 't1',
        createdAt: occurredAt,
        updatedAt: occurredAt,
      }),
      state: Object.freeze({ stage: 'started' }),
    });
    const transition: SagaTransitionRecord = Object.freeze({
      version: 1,
      transition: Object.freeze({
        from: Object.freeze({ stage: 'pending' }),
        to: envelope.state,
        status: 'running',
        message: Object.freeze({ type: 'checkout.started', payload: {}, occurredAt }),
        occurredAt,
      }),
    });

    try {
      await store.saveCorrelation({ sagaId, correlationKey, instanceId });
      await store.save(envelope);

      const persisted = await canonical.load(instanceId);
      assert(persisted);
      assertEquals(typeof persisted.metadata.createdAt, 'string');

      await store.appendTransition(instanceId, transition);

      const projection = await kv.get<SagaInstanceReadModel>([
        'saga_instances',
        sagaId,
        instanceId,
      ]);
      assertEquals(projection?.value?.createdAt, occurredAt.toISOString());
      assertEquals(projection?.value?.state.metadata, {
        sagaId,
        instanceId,
        version: 1,
        status: 'running',
        durability: 't1',
        createdAt: occurredAt.toISOString(),
        updatedAt: occurredAt.toISOString(),
      });
    } finally {
      await canonical.close();
    }
  },
});
