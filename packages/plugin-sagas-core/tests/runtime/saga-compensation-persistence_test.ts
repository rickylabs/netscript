import { assertEquals, assertRejects } from '@std/assert';

import { defineSaga, sagaCompensate, sagaComplete, sagaFail, send } from '../../mod.ts';
import type {
  CascadedMessage,
  SagaCorrelationKey,
  SagaDefinition,
  SagaInstanceId,
  SagaMessage,
  SagaState,
} from '../../src/domain/mod.ts';
import { createSagaRuntime, SagaCompensator, SagaEngine } from '../../src/runtime/mod.ts';
import { MemorySagaStore, TestSagaClock } from '../../src/testing/mod.ts';

// Every assertion reads the store, never a handler's return value: the defect in #1990 was that a
// suite asserting returned effects stayed green while the store never received the outcome.

type Ledger = Readonly<{ payment: 'captured' | 'refunded' }>;
type StoreMode = Readonly<{ name: string; atomic: boolean }>;

const STORE_MODES: readonly StoreMode[] = [
  { name: 'plain store', atomic: false },
  { name: 'atomic transition store', atomic: true },
];
const SAGA_ID = 'refund';
const CORRELATION_KEY = 'order-1' as SagaCorrelationKey;
const INSTANCE_ID = `${SAGA_ID}:${CORRELATION_KEY}` as SagaInstanceId;

function refundSaga(
  mode: StoreMode,
  compensation: (saga: { state: Ledger }) => readonly CascadedMessage[],
): SagaDefinition {
  // Before #1990 a sagaFail returned here was routed back into this same branch without end.
  let runs = 0;
  const builder = defineSaga(SAGA_ID).state<Ledger>({ payment: 'captured' });
  return (mode.atomic ? builder.durableWorkerCommands() : builder)
    .on('FulfillmentFailed', () => [
      sagaCompensate({ type: 'RefundPayment', payload: {} }, 'out of stock'),
    ])
    .compensate('RefundPayment', (saga) => {
      runs += 1;
      if (runs > 1) throw new Error('compensation branch re-entered');
      return compensation(saga as { state: Ledger });
    })
    .build() as SagaDefinition;
}

async function runSaga(
  definition: SagaDefinition,
  messages: readonly SagaMessage[],
  store = new MemorySagaStore(),
): Promise<MemorySagaStore> {
  const runtime = createSagaRuntime({
    native: { store, compensator: new SagaCompensator({ clock: new TestSagaClock() }) },
  });
  await runtime.register([definition]);
  await runtime.start();
  try {
    for (const message of messages) {
      await runtime.publish({ ...message, correlationKey: CORRELATION_KEY });
    }
  } finally {
    await runtime.stop('compensation persistence test complete');
  }
  return store;
}

const fulfillmentFailed: SagaMessage = { type: 'FulfillmentFailed', payload: {} };

for (const mode of STORE_MODES) {
  Deno.test(`${mode.name}: compensate returning sagaFail persists failed and the compensated state`, async () => {
    const store = await runSaga(
      refundSaga(mode, (saga) => {
        saga.state = { payment: 'refunded' };
        return [sagaFail('order cancelled')];
      }),
      [fulfillmentFailed],
    );

    const loaded = await store.load<Ledger>(INSTANCE_ID);
    assertEquals(loaded?.metadata.status, 'failed');
    assertEquals(loaded?.state, { payment: 'refunded' });
    assertEquals(loaded?.metadata.version, 2);
    assertEquals(
      store.transitions(INSTANCE_ID).map((record) => record.transition.status),
      ['compensating', 'failed'],
    );
  });

  Deno.test(`${mode.name}: compensate returning [] persists terminal compensated, distinct from sagaFail`, async () => {
    const store = await runSaga(
      refundSaga(mode, (saga) => {
        saga.state = { payment: 'refunded' };
        return [];
      }),
      [fulfillmentFailed],
    );

    const loaded = await store.load<Ledger>(INSTANCE_ID);
    assertEquals(loaded?.metadata.status, 'compensated');
    assertEquals(loaded?.state, { payment: 'refunded' });
    assertEquals(
      store.transitions(INSTANCE_ID).map((record) => record.transition.status),
      ['compensating', 'compensated'],
    );
  });

  Deno.test(`${mode.name}: compensate returning sagaComplete persists completed`, async () => {
    const store = await runSaga(
      refundSaga(mode, () => [sagaComplete({ refunded: true })]),
      [fulfillmentFailed],
    );

    const loaded = await store.load<Ledger>(INSTANCE_ID);
    assertEquals(loaded?.metadata.status, 'completed');
    assertEquals(loaded?.metadata.completedAt instanceof Date, true);
  });

  Deno.test(`${mode.name}: a throwing compensate handler persists failed with the compensation error`, async () => {
    const store = new MemorySagaStore();
    const definition = refundSaga(mode, (saga) => {
      saga.state = { payment: 'refunded' };
      throw new RangeError('refund gateway rejected the request');
    });

    await assertRejects(
      () => runSaga(definition, [fulfillmentFailed], store),
      RangeError,
      'refund gateway rejected the request',
    );

    const loaded = await store.load<Ledger>(INSTANCE_ID);
    assertEquals(loaded?.metadata.status, 'failed');
    // The throwing handler's partial mutation is discarded; the state is the pre-undo state.
    assertEquals(loaded?.state, { payment: 'captured' });
    assertEquals(loaded?.metadata.compensationError, {
      name: 'RangeError',
      message: 'refund gateway rejected the request',
    });
  });

  Deno.test(`${mode.name}: sagaFail from .on() persists the outcome of its compensate branch`, async () => {
    const builder = defineSaga(SAGA_ID).state<Ledger>({ payment: 'captured' });
    const definition = (mode.atomic ? builder.durableWorkerCommands() : builder)
      .on('PaymentDisputed', () => [sagaFail('disputed')])
      .compensate('PaymentDisputed', (saga) => {
        saga.state = { payment: 'refunded' };
        return [];
      })
      .build() as SagaDefinition;

    const store = await runSaga(definition, [{ type: 'PaymentDisputed', payload: {} }]);

    const loaded = await store.load<Ledger>(INSTANCE_ID);
    assertEquals(loaded?.metadata.status, 'compensated');
    assertEquals(loaded?.state, { payment: 'refunded' });
    assertEquals(
      store.transitions(INSTANCE_ID).map((record) => record.transition.status),
      ['failed', 'compensated'],
    );
  });

  Deno.test(`${mode.name}: sagaFail from a same-type compensate branch terminates instead of re-entering it`, async () => {
    // The documented order-saga shape: the compensate branch is keyed on the failing message type
    // and returns sagaFail. Before #1990 the bridge routed that sagaFail back into the same branch.
    let runs = 0;
    const builder = defineSaga(SAGA_ID).state<Ledger>({ payment: 'captured' });
    const definition = (mode.atomic ? builder.durableWorkerCommands() : builder)
      .on('FulfillmentFailed', (_saga, message) => [sagaCompensate(message, 'out of stock')])
      .compensate('FulfillmentFailed', (saga) => {
        runs += 1;
        if (runs > 1) throw new Error('compensation branch re-entered');
        saga.state = { payment: 'refunded' };
        return [sagaFail('order unfulfilled')];
      })
      .build() as SagaDefinition;

    const store = await runSaga(definition, [fulfillmentFailed]);

    assertEquals(runs, 1);
    const loaded = await store.load<Ledger>(INSTANCE_ID);
    assertEquals(loaded?.metadata.status, 'failed');
    assertEquals(loaded?.metadata.compensationError, undefined);
    assertEquals(loaded?.state, { payment: 'refunded' });
  });

  Deno.test(`${mode.name}: a compensation transition is idempotent on replay`, async () => {
    const store = new MemorySagaStore();
    const engine = new SagaEngine({ store });
    const definition = refundSaga(mode, (saga) => {
      saga.state = { payment: 'refunded' };
      return [];
    });
    await engine.register([definition]);
    await engine.start();
    try {
      const [requested] = await engine.handle({
        ...fulfillmentFailed,
        correlationKey: CORRELATION_KEY,
      });
      const outcome = {
        sagaId: requested.sagaId,
        instanceId: requested.instanceId,
        correlationKey: requested.correlationKey,
        message: { type: 'RefundPayment', payload: {} },
        version: requested.version ?? 0,
        state: { payment: 'refunded' },
        cascaded: [],
      };

      const first = await engine.commitCompensation(outcome);
      const replay = await engine.commitCompensation(outcome);

      assertEquals(first, { committed: true, status: 'compensated', version: 2 });
      assertEquals(replay, { committed: false, status: 'compensated', version: 2 });
      const loaded = await store.load<Ledger>(INSTANCE_ID);
      assertEquals(loaded?.metadata.version, 2);
      assertEquals(store.transitions(INSTANCE_ID).length, 2);
    } finally {
      await engine.stop();
    }
  });

  Deno.test(`${mode.name}: a legacy compensating row is non-terminal but never silently reopened`, async () => {
    const builder = defineSaga(SAGA_ID).state<Ledger>({ payment: 'captured' });
    const definition = (mode.atomic ? builder.durableWorkerCommands() : builder)
      .on('Heartbeat', () => [])
      .on('RefundSettled', (saga) => {
        saga.state = { payment: 'refunded' };
        return [sagaFail('refund settled out of band')];
      })
      .build() as SagaDefinition;
    const store = new MemorySagaStore();
    // A row written by a pre-#1990 runtime: the instance rests at `compensating`.
    await store.save({
      metadata: {
        instanceId: INSTANCE_ID,
        version: 1,
        status: 'compensating',
        durability: 't1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      state: { payment: 'captured' },
    });
    await store.saveCorrelation({
      sagaId: SAGA_ID,
      correlationKey: CORRELATION_KEY,
      instanceId: INSTANCE_ID,
    });

    await runSaga(definition, [{ type: 'Heartbeat', payload: {} }], store);
    assertEquals((await store.load(INSTANCE_ID))?.metadata.status, 'compensating');

    await runSaga(definition, [{ type: 'RefundSettled', payload: {} }], store);
    const settled = await store.load<Ledger>(INSTANCE_ID);
    assertEquals(settled?.metadata.status, 'failed');
    assertEquals(settled?.state, { payment: 'refunded' });
  });
}

Deno.test('compensation cascades still dispatch send effects after the outcome is persisted', async () => {
  const observed: string[] = [];
  const definition = defineSaga(SAGA_ID)
    .state<Ledger>({ payment: 'captured' })
    .on('FulfillmentFailed', () => [sagaCompensate({ type: 'RefundPayment', payload: {} })])
    .on('RefundRecorded', () => {
      observed.push('RefundRecorded');
      return [];
    })
    .compensate('RefundPayment', (saga) => {
      saga.state = { payment: 'refunded' };
      return [send('RefundRecorded', {})];
    })
    .correlate(() => CORRELATION_KEY)
    .build() as SagaDefinition;

  const store = await runSaga(definition, [fulfillmentFailed]);

  assertEquals(observed, ['RefundRecorded']);
  const loaded = await store.load<Ledger>(INSTANCE_ID);
  assertEquals(loaded?.metadata.status, 'compensated');
  assertEquals(loaded?.state, { payment: 'refunded' });
});

Deno.test('a storeless runtime still runs compensation without persisting', async () => {
  const observed: SagaState[] = [];
  const definition = refundSaga(STORE_MODES[0], (saga) => {
    saga.state = { payment: 'refunded' };
    observed.push(saga.state);
    return [sagaFail('order cancelled')];
  });
  const runtime = createSagaRuntime({
    native: { compensator: new SagaCompensator({ clock: new TestSagaClock() }) },
  });
  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({ ...fulfillmentFailed, correlationKey: CORRELATION_KEY });
  } finally {
    await runtime.stop('storeless compensation test complete');
  }
  assertEquals(observed, [{ payment: 'refunded' }]);
});
