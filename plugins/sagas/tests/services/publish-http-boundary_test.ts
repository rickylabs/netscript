import { assertEquals, assertNotEquals } from '@std/assert';
import { createPluginService } from '@netscript/plugin/service';
import { defineSaga, schedule } from '@netscript/plugin-sagas-core';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { MemorySagaStore } from '@netscript/plugin-sagas-core/testing';
import { MemoryQueueAdapter } from '@netscript/queue/testing';

import { router } from '../../services/src/router.ts';
import {
  createSagaDeliveryPublisher,
  type SagaDeliveryMessage,
} from '../../src/runtime/saga-delivery.ts';
import {
  ProjectingSagaStore,
  type SagaInstanceProjection,
  type SagaInstanceProjectionPort,
} from '../../src/runtime/saga-instance-projection.ts';
import { startSagaRunner } from '../../src/runtime/saga-runner.ts';
import type {
  SagaServiceContext,
  SagaServiceDatabaseClient,
} from '../../services/src/routers/v1-types.ts';

const emptyDatabase: SagaServiceDatabaseClient = Object.freeze({
  sagaInstance: Object.freeze({
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  }),
  sagaExecutionHistory: Object.freeze({
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  }),
});

Deno.test('HTTP saga publish fails within its deadline when delivery never settles', async () => {
  const context = {
    db: emptyDatabase,
    sagaRuntime: {
      publish: () => new Promise<never>(() => undefined),
    },
    publishTimeoutMs: 10,
  } as SagaServiceContext;
  const app = createPluginService(router, {
    name: 'sagas-publish-boundary-test',
    context: () => context,
  }).build();

  const outcome = await Promise.race([
    app.request('/api/v1/sagas/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'checkout.started',
        payload: { orderId: 'order-http-timeout' },
        correlationId: 'order-http-timeout',
      }),
    }),
    timeoutMarker(100),
  ]);

  assertNotEquals(outcome, 'request-timed-out');
  if (outcome !== 'request-timed-out') {
    assertNotEquals(outcome.status, 200);
  }
});

Deno.test('HTTP saga publish reaches the runner, persists, projects, and schedules', async () => {
  const queue = new MemoryQueueAdapter<SagaDeliveryMessage>({ pollInterval: 1 });
  const projection = new RecordingProjection();
  const definition = defineSaga('checkout-delivery')
    .state({ received: 0, confirmed: false })
    .on('checkout.started', (saga, message) => {
      saga.state = { ...saga.state, received: saga.state.received + 1 };
      return [schedule({
        type: 'checkout.confirmed',
        payload: message.payload,
        correlationKey: message.correlationKey,
      }, '5ms')];
    })
    .on('checkout.confirmed', (saga) => {
      saga.state = { ...saga.state, confirmed: true };
      return [];
    })
    .build();
  const supervisor = await startSagaRunner({
    deliveryQueue: queue,
    projection,
    readEnv: () => undefined,
    cwd: () => '/consumer/http-delivery-project',
    importer: () => Promise.resolve({ definitions: [definition] }),
    supervisor: {
      createRuntime: (options) =>
        createSagaRuntime({
          ...options,
          native: {
            ...options.native,
            store: new ProjectingSagaStore(new MemorySagaStore(), projection),
          },
        }),
    },
  });
  const publisher = createSagaDeliveryPublisher({ queue });
  const app = createPluginService(router, {
    name: 'sagas-delivery-boundary-test',
    context: () => ({ db: emptyDatabase, sagaRuntime: publisher, publishTimeoutMs: 100 }),
  }).build();

  try {
    const response = await app.request('/api/v1/sagas/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'checkout.started',
        payload: { orderId: 'order-http-delivery' },
        correlationId: 'order-http-delivery',
        idempotencyKey: 'publish-order-http-delivery',
      }),
    });

    assertEquals(response.status, 200);
    assertEquals(await response.json(), {
      published: true,
      messageType: 'checkout.started',
      correlationId: 'order-http-delivery',
    });
    await waitFor(() => projection.records.length >= 2, 500);
    assertEquals(projection.records.map((record) => record.transition.transition.message.type), [
      'checkout.started',
      'checkout.confirmed',
    ]);
    assertEquals(projection.records.at(-1)?.envelope.state, {
      received: 1,
      confirmed: true,
    });
  } finally {
    await supervisor.stop('HTTP delivery test complete');
  }
});

function timeoutMarker(ms: number): Promise<'request-timed-out'> {
  return new Promise((resolve) => setTimeout(() => resolve('request-timed-out'), ms));
}

class RecordingProjection implements SagaInstanceProjectionPort {
  readonly records: SagaInstanceProjection[] = [];

  upsert(projection: SagaInstanceProjection): Promise<void> {
    this.records.push(projection);
    return Promise.resolve();
  }
}

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error(`Condition did not become true within ${timeoutMs}ms.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
}
