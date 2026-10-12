import { assert, assertEquals, assertRejects, assertStrictEquals, assertThrows } from '@std/assert';
import { defineSaga } from '@netscript/plugin-sagas-core';
import { SagaEngine } from '@netscript/plugin-sagas-core/runtime';
import { isSagaTransitionStore } from '@netscript/plugin-sagas-core/ports';
import type {
  SagaStorePort,
  SagaTransitionCommitRequest,
  SagaTransitionCommitResult,
} from '@netscript/plugin-sagas-core/ports';
import { createPrismaSagaTransitionStore } from '@netscript/plugin-sagas-core/stores';
import { MemorySagaStore } from '@netscript/plugin-sagas-core/testing';
import { workerJobEffect } from '@netscript/plugin-sagas-core/integration/workers';
import { defineJob } from '@netscript/plugin-workers-core';
import { z } from 'zod';
import { transitionRequest } from '../../../../packages/plugin-sagas-core/tests/transition-conformance.ts';
import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import {
  createProjectingSagaStore,
  PrismaSagaInstanceProjection,
  ProjectingSagaStore,
} from './saga-instance-projection.ts';
import type { SagaInstanceProjection } from './saga-instance-projection.ts';

function legacyStore(delegate: MemorySagaStore): SagaStorePort {
  return {
    id: 'legacy',
    load: delegate.load.bind(delegate),
    save: delegate.save.bind(delegate),
    appendTransition: delegate.appendTransition.bind(delegate),
    findByCorrelation: delegate.findByCorrelation.bind(delegate),
    saveCorrelation: delegate.saveCorrelation.bind(delegate),
    delete: delegate.delete.bind(delegate),
  };
}

Deno.test('atomic Prisma registration preserves capability through projection with zero IO', async () => {
  let ioCalls = 0;
  const unexpectedIo = (): never => {
    ioCalls++;
    throw new Error('Probe must perform no database IO');
  };
  const store = createPrismaSagaTransitionStore({
    $queryRawUnsafe: unexpectedIo,
    $executeRawUnsafe: unexpectedIo,
    $transaction: unexpectedIo,
  }, { transactionTimeoutMs: 5000 });
  const definition = defineSaga('agent-action-projection-probe').durableWorkerCommands()
    .state({ status: 'admitted' }).on('admit', () => []).build();
  const projection = new PrismaSagaInstanceProjection({ sagaInstance: { upsert: unexpectedIo } });
  for (const configuredProjection of [undefined, projection]) {
    const durable = await createDurableSagaRuntime({ store, projection: configuredProjection });
    try {
      await durable.runtime.register([definition]);
      assert(isSagaTransitionStore(durable.store));
      if (!configuredProjection) assertStrictEquals(durable.store, store);
    } finally {
      await durable.dispose();
    }
  }
  const oldEngine = new SagaEngine({ store: new ProjectingSagaStore(store, projection) });
  const error = assertThrows(() => oldEngine.register([definition]), TypeError);
  assertEquals(
    error.message,
    'Saga store prisma-saga-transition-store:projecting lacks atomic transition/outbox and replay capability.',
  );
  assertEquals(ioCalls, 0);
});

Deno.test('projected atomic runtime commits worker intent and state together, then projects and replays after restart', async () => {
  const delegate = new MemorySagaStore();
  const calls: SagaTransitionCommitRequest[] = [];
  const commit = delegate.commitTransition.bind(delegate);
  delegate.commitTransition = (request, signal) => {
    calls.push(request);
    return commit(request, signal);
  };
  let projected: SagaInstanceProjection | undefined;
  const projection = {
    upsert(value: SagaInstanceProjection): Promise<void> {
      assertEquals(delegate.commandIntents().length, 1);
      assertEquals(delegate.transitions(value.envelope.metadata.instanceId).length, 1);
      projected = value;
      return Promise.resolve();
    },
  };
  const job = defineJob('projection-job').payload(z.object({ documentId: z.string() })).entrypoint(
    'job.ts',
  ).build();
  const definition = defineSaga('document').durableWorkerCommands().state({ count: 0 })
    .on('start', (saga) => {
      saga.state.count++;
      return [
        workerJobEffect(job, { documentId: 'one' }, { destination: 'workers', topic: 'document' }),
      ];
    }).build();
  const message = {
    type: 'start',
    payload: {},
    correlationKey: transitionRequest().correlation.correlationKey,
    idempotencyKey: 'inbound-one',
  };
  for (let restart = 0; restart < 2; restart++) {
    const durable = await createDurableSagaRuntime({ store: delegate, projection });
    try {
      await durable.runtime.register([definition]);
      await durable.runtime.start();
      await durable.runtime.publish(message);
      assertEquals(delegate.commandIntents().length, 1);
      assertEquals(projected?.envelope.state.count, 1);
      assertEquals(projected?.envelope.metadata.version, 1);
      assertEquals(projected?.correlationKey, 'one');
      assertEquals(projected?.transition.transition.message.type, 'start');
    } finally {
      await durable.runtime.stop();
      await durable.dispose();
    }
  }
  assertEquals(calls.length, 2);
  assertEquals(calls[0].commands.length, 1);
  assertEquals(calls[0].envelope.state.count, 1);
  assertEquals(delegate.transitions(calls[0].correlation.instanceId).length, 1);
});

Deno.test('atomic wrapper forwards request, signal, capabilities and result; replay has no projection writes', async () => {
  const delegate = new MemorySagaStore();
  const request = transitionRequest();
  const signal = new AbortController().signal;
  const result: SagaTransitionCommitResult = { committed: true };
  const commit = delegate.commitTransition.bind(delegate);
  delegate.commitTransition = async (value, receivedSignal) => {
    assertStrictEquals(value, request);
    assertStrictEquals(receivedSignal, signal);
    const committed = await commit(value, receivedSignal);
    return committed.committed ? result : committed;
  };
  let projections = 0;
  const store = createProjectingSagaStore(delegate, {
    upsert: () => {
      projections++;
      return Promise.resolve();
    },
  });
  assert(isSagaTransitionStore(store));
  assertStrictEquals(store.transitionCommitCapabilities, delegate.transitionCommitCapabilities);
  assertStrictEquals(await store.commitTransition(request, signal), result);
  assertEquals(await store.commitTransition(request, signal), { committed: false });
  assertEquals(projections, 1);
  assertEquals(delegate.commandIntents().length, 1);
});

Deno.test('projection errors propagate after atomic commit and explicit recovery does not repeat commands', async () => {
  const delegate = new MemorySagaStore();
  const request = transitionRequest();
  const failure = new Error('projection unavailable');
  const store = createProjectingSagaStore(delegate, { upsert: () => Promise.reject(failure) });
  assert(isSagaTransitionStore(store));
  assertStrictEquals(await assertRejects(() => store.commitTransition(request)), failure);
  assertEquals(delegate.commandIntents().length, 1);
  assertEquals(await store.commitTransition(request), { committed: false });
  const envelope = await delegate.load(request.correlation.instanceId);
  assert(envelope);
  let row: Readonly<Record<string, unknown>> | undefined;
  const recovered = new PrismaSagaInstanceProjection({
    sagaInstance: {
      upsert: (args) => {
        row = args;
        return Promise.resolve();
      },
    },
  });
  await recovered.upsert({
    ...request.correlation,
    envelope,
    transition: delegate.transitions(request.correlation.instanceId)[0],
  });
  assertEquals(row?.create, {
    id: request.correlation.instanceId,
    sagaName: 'document',
    correlationId: 'one',
    version: 1,
    isCompleted: false,
    state: {
      ...envelope.state,
      sagaId: 'document',
      instanceId: request.correlation.instanceId,
      correlationKey: 'one',
      status: 'running',
      lastMessageType: 'start',
      metadata: {
        sagaId: 'document',
        instanceId: request.correlation.instanceId,
        version: 1,
        status: 'running',
        durability: 't2',
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        completedAt: undefined,
        traceparent: undefined,
        tracestate: undefined,
      },
    },
    createdAt: new Date(0),
    updatedAt: new Date(0),
  });
  assertEquals(delegate.commandIntents().length, 1);
  assertEquals(delegate.transitions(request.correlation.instanceId).length, 1);
});

Deno.test('failed atomic commit never projects and projected legacy stores retain append timing and errors', async () => {
  const atomic = new MemorySagaStore();
  let projections = 0;
  const store = createProjectingSagaStore(atomic, {
    upsert: () => {
      projections++;
      return Promise.resolve();
    },
  });
  assert(isSagaTransitionStore(store));
  await assertRejects(
    () => store.commitTransition(transitionRequest(), AbortSignal.abort(new Error('cancelled'))),
    Error,
    'cancelled',
  );
  assertEquals(projections, 0);
  assertEquals(atomic.entries(), []);
  const delegate = new MemorySagaStore();
  const failure = new Error('legacy projection unavailable');
  const legacy = createProjectingSagaStore(legacyStore(delegate), {
    upsert: () => Promise.reject(failure),
  });
  assertEquals(isSagaTransitionStore(legacy), false);
  assertEquals(Reflect.has(legacy, 'commitTransition'), false);
  assertEquals(Reflect.has(legacy, 'transitionCommitCapabilities'), false);
  const request = transitionRequest();
  await legacy.saveCorrelation(request.correlation);
  await legacy.save(request.envelope);
  assertEquals(delegate.transitions(request.correlation.instanceId), []);
  assertStrictEquals(
    await assertRejects(() =>
      legacy.appendTransition(request.correlation.instanceId, request.record)
    ),
    failure,
  );
  assertEquals(delegate.transitions(request.correlation.instanceId).length, 1);
  assertEquals(await legacy.load(request.correlation.instanceId), request.envelope);
  assertEquals(
    await legacy.findByCorrelation(request.correlation.sagaId, request.correlation.correlationKey),
    request.correlation.instanceId,
  );
  await legacy.delete(request.correlation.instanceId);
  assertEquals(await legacy.load(request.correlation.instanceId), undefined);
});
