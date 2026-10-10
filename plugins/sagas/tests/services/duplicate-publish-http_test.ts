import { assertEquals } from '@std/assert';
import { createPluginService } from '@netscript/plugin/service';
import { defineSaga } from '@netscript/plugin-sagas-core';
import type { SagaCorrelationKey } from '@netscript/plugin-sagas-core/domain';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { MemorySagaStore } from '@netscript/plugin-sagas-core/testing';
import { router } from '../../services/src/router.ts';
import type { SagaServiceDatabaseClient } from '../../services/src/routers/v1-types.ts';
import { createSagaPublisher } from '../../src/runtime/saga-publisher.ts';

const emptyDatabase: SagaServiceDatabaseClient = {
  sagaInstance: { findMany: () => Promise.resolve([]), count: () => Promise.resolve(0) },
  sagaExecutionHistory: { findMany: () => Promise.resolve([]), count: () => Promise.resolve(0) },
};

Deno.test('duplicate publish through the HTTP publisher and sagas-api applies one transition', async () => {
  const store = new MemorySagaStore();
  let handled = 0;
  const definition = defineSaga('http-idempotency')
    .state({ received: 0 })
    .on('UserSettingsCreated', (saga) => {
      handled += 1;
      saga.state = { received: saga.state.received + 1 };
      return [];
    })
    .build();
  const runtime = createSagaRuntime({ native: { store } });
  await runtime.register([definition]);
  await runtime.start();
  const app = createPluginService(router, {
    auth: { public: true, reason: 'Lease-free HTTP idempotency fixture' },
    name: 'sagas-http-idempotency-test',
    context: () => ({ db: emptyDatabase, sagaRuntime: runtime }),
  }).build();
  const statuses: number[] = [];
  const publisher = createSagaPublisher({
    readEnv: () => undefined,
    baseUrl: 'https://example.invalid',
    fetcher: async (input, init) => {
      const response = await app.request(new Request(input, init));
      statuses.push(response.status);
      return response;
    },
  });
  const message = {
    type: 'UserSettingsCreated',
    payload: { userId: 'user-http' },
    correlationKey: 'user-http' as SagaCorrelationKey,
    idempotencyKey: 'settings-request-1',
  };

  try {
    const first = await publisher.publish(message);
    assertEquals(first.published, true);
    assertEquals(first.correlationKey, message.correlationKey);
    assertEquals(store.entries().length, 1);
    const envelope = store.entries()[0];
    assertEquals(envelope.state, { received: 1 });
    assertEquals(store.transitions(envelope.metadata.instanceId).length, 1);

    const duplicate = await publisher.publish(message);
    assertEquals(duplicate.published, true);
    assertEquals(duplicate.correlationKey, message.correlationKey);
    assertEquals(handled, 1);
    assertEquals(store.entries(), [envelope]);
    assertEquals(store.transitions(envelope.metadata.instanceId).length, 1);

    // A new key must still advance the same instance. Also exercise option-key precedence.
    const next = await publisher.publish(message, { idempotencyKey: 'settings-request-2' });
    const nextDuplicate = await publisher.publish(message, {
      idempotencyKey: 'settings-request-2',
    });
    assertEquals(next.published, true);
    assertEquals(nextDuplicate.published, true);
    assertEquals(handled, 2);
    assertEquals(store.entries().length, 1);
    assertEquals(store.entries()[0].state, { received: 2 });
    assertEquals(store.entries()[0].metadata.version, envelope.metadata.version + 1);
    assertEquals(store.transitions(envelope.metadata.instanceId).length, 2);
    assertEquals(statuses, [200, 200, 200, 200]);
  } finally {
    await runtime.stop('HTTP duplicate-publish test complete');
  }
});
