import { assertEquals, assertRejects } from '@std/assert';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { MemorySagaStore } from '@netscript/plugin-sagas-core/testing';
import type { SagaCorrelationKey, SagaInstanceId } from '@netscript/plugin-sagas-core/domain';
import type { SagaTransitionCommitRequest } from '@netscript/plugin-sagas-core/ports';
import { publishOrderSaga } from './fixtures/publish-order-saga.ts';

Deno.test('reversed saga delivery retains the early fact and commits one worker effect', async () => {
  const store = new MemorySagaStore();
  const runtime = createSagaRuntime({ native: { store } });
  await runtime.register([publishOrderSaga]);
  await runtime.start();
  const correlationKey = 'order' as SagaCorrelationKey;
  const instanceId = 'publish-order:order' as SagaInstanceId;
  const second = { type: 'Second', payload: {}, correlationKey, idempotencyKey: 'order:2' };
  try {
    await runtime.publish(second);
    assertEquals((await store.load(instanceId))?.state, {
      status: 'waiting-first',
      first: false,
      second: true,
    });
    assertEquals(store.commandIntents().length, 0);
    await runtime.publish(second);
    assertEquals((await store.load(instanceId))?.metadata.version, 1);
    await runtime.publish({
      type: 'First',
      payload: {},
      correlationKey,
      idempotencyKey: 'order:1',
    });
    assertEquals((await store.load(instanceId))?.state, {
      status: 'ready',
      first: true,
      second: true,
    });
    assertEquals(store.transitions(instanceId).map((row) => row.transition.message.type), [
      'Second',
      'First',
    ]);
    assertEquals(store.commandIntents().length, 1);
    await runtime.publish(second);
    assertEquals((await store.load(instanceId))?.metadata.version, 2);
    assertEquals(store.commandIntents().length, 1);
  } finally {
    await runtime.stop();
  }
});

Deno.test('stale saga commit rejects without consuming its inbound key or adding an effect', async () => {
  const store = new MemorySagaStore();
  const runtime = createSagaRuntime({ native: { store } });
  await runtime.register([publishOrderSaga]);
  await runtime.start();
  const correlationKey = 'stale' as SagaCorrelationKey;
  const instanceId = 'publish-order:stale' as SagaInstanceId;
  try {
    await runtime.publish({
      type: 'First',
      payload: {},
      correlationKey,
      idempotencyKey: 'stale:1',
    });
    const old = (await store.load(instanceId))!;
    await runtime.publish({
      type: 'Second',
      payload: {},
      correlationKey,
      idempotencyKey: 'stale:2',
    });
    const before = await store.load(instanceId);
    const history = store.transitions(instanceId);
    const commands = store.commandIntents();
    const request: SagaTransitionCommitRequest = {
      expectedVersion: old.metadata.version,
      envelope: { ...old, metadata: { ...old.metadata, version: 2 }, state: { corrupt: true } },
      correlation: { sagaId: publishOrderSaga.id, correlationKey, instanceId },
      record: { ...history[1], transition: { ...history[1].transition, to: { corrupt: true } } },
      commands: [{ ...commands[0], id: 'stale-effect', dedupeKey: 'stale-effect' }],
      appliedKeyHash: 'a'.repeat(64),
    };
    await assertRejects(() => store.commitTransition(request), Error, 'version');
    assertEquals(await store.load(instanceId), before);
    assertEquals(store.transitions(instanceId), history);
    assertEquals(store.commandIntents(), commands);
    assertEquals(
      await store.commitTransition({
        ...request,
        expectedVersion: 2,
        commands: [],
        envelope: { ...before!, metadata: { ...before!.metadata, version: 3 } },
        record: { ...history[1], version: 3 },
      }),
      { committed: true },
    );
  } finally {
    await runtime.stop();
  }
});
