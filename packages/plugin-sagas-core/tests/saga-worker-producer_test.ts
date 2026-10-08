import { assertEquals, assertRejects } from '@std/assert';
import { z } from 'zod';
import { defineJob, defineTask } from '@netscript/plugin-workers-core';
import { defineSaga, sagaComplete, send } from '../mod.ts';
import type {
  SagaCorrelationKey,
  SagaInstanceId,
  SagaTransitionEffect,
} from '../src/domain/mod.ts';
import { workerJobEffect, workerTaskEffect } from '../src/integration/workers/mod.ts';
import { MemorySagaStore } from '../src/testing/memory-saga-store.ts';
import type { SagaTransitionCommitRequest, SagaTransitionCommitResult } from '../src/ports/mod.ts';
import { SagaEngine } from '../src/runtime/saga-engine.ts';
import { createSagaRuntime } from '../src/runtime/create-saga-runtime.ts';
const route = { destination: 'workers', topic: 'document' };
const schema = z.object({ documentId: z.string() });
let workerCalls = 0;
const job = defineJob('document-job').payload(schema).handler(() => {
  workerCalls++;
  return { success: true };
}).build();
const task = defineTask('document-task').payload(schema).handler(() => {
  workerCalls++;
  return true;
}).build();
const key = 'one' as SagaCorrelationKey;
const instanceId = 'document:one' as SagaInstanceId;
const message = {
  type: 'start',
  payload: {},
  correlationKey: key,
  idempotencyKey: 'inbound-one',
  traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
  tracestate: 'tenant=value',
};
class RecordingAtomicStore extends MemorySagaStore {
  commits = 0;
  granular = 0;
  failOnce = false;
  override commitTransition(
    request: SagaTransitionCommitRequest,
    signal?: AbortSignal,
  ): Promise<SagaTransitionCommitResult> {
    this.commits++;
    if (this.failOnce) {
      this.failOnce = false;
      return Promise.reject(new Error('fault before commit'));
    }
    return super.commitTransition(request, signal);
  }
  override save(...args: Parameters<MemorySagaStore['save']>): Promise<void> {
    this.granular++;
    return super.save(...args);
  }
  override saveCorrelation(...args: Parameters<MemorySagaStore['saveCorrelation']>): Promise<void> {
    this.granular++;
    return super.saveCorrelation(...args);
  }
  override appendTransition(
    ...args: Parameters<MemorySagaStore['appendTransition']>
  ): Promise<void> {
    this.granular++;
    return super.appendTransition(...args);
  }
}
function definition(effects: () => readonly SagaTransitionEffect[]) {
  return defineSaga('document').durableWorkerCommands().state({ count: 0 }).on('start', (saga) => {
    saga.state.count++;
    return effects();
  }).build();
}

Deno.test('durable saga commits pure worker effects once with stable original ordinal and context', async () => {
  workerCalls = 0;
  const store = new RecordingAtomicStore();
  const engine = new SagaEngine({ store });
  const jobEffect = workerJobEffect(job, { documentId: 'one' }, route);
  const taskEffect = workerTaskEffect(task, { documentId: 'one' }, {
    ...route,
    topic: 'document-task',
  });
  await engine.register([
    definition(() => [send('audit', {}), jobEffect, sagaComplete(), taskEffect]),
  ]);
  await engine.start();
  try {
    const [result] = await engine.handle(message, { correlationId: 'corr-one' });
    assertEquals(store.granular, 0);
    assertEquals(store.commits, 1);
    assertEquals(workerCalls, 0);
    const intents = store.commandIntents();
    assertEquals(intents.length, 2);
    assertEquals(intents.map((i) => i.id), [
      'sgwc-v1:a0043737fb2a0f07a010726189ef0d1c30d9d3985ed8f8bbd749d4994db6849f',
      'sgwc-v1:2eb58de172055f08d1e3f89c7c297cf60311095ac23716345471bb86869932be',
    ]);
    assertEquals(intents.map((i) => i.dedupeKey), intents.map((i) => i.id));
    assertEquals(intents.map((i) => [i.correlationId, i.traceparent, i.tracestate]), [[
      'corr-one',
      message.traceparent,
      message.tracestate,
    ], ['corr-one', message.traceparent, message.tracestate]]);
    assertEquals(result.cascaded.map((i) => i.kind), ['send', 'complete']);
    assertEquals(result.state.count, 1);
    assertEquals((await store.load(instanceId))?.metadata.version, 1);
    const [duplicate] = await engine.handle(message, { correlationId: 'corr-one' });
    assertEquals(duplicate.alreadyApplied, true);
    assertEquals(duplicate.state.count, 1);
    assertEquals(duplicate.cascaded, []);
    assertEquals(store.commandIntents().length, 2);
    assertEquals(store.transitions(instanceId).length, 1);
  } finally {
    await engine.stop();
  }
});

Deno.test('durable producer rejects selected payload and canonical JSON faults before writes without consuming replay', async () => {
  const store = new RecordingAtomicStore();
  const engine = new SagaEngine({ store });
  let valid = false;
  await engine.register([definition(() => {
    if (valid) return [workerJobEffect(job, { documentId: 'one' }, route)];
    // @ts-expect-error selected job definition must refuse another payload type
    return [workerJobEffect(job, { taskId: 'other' }, route)];
  })]);
  await engine.start();
  try {
    await assertRejects(() => engine.handle(message));
    assertEquals(store.commits, 0);
    assertEquals(store.granular, 0);
    assertEquals(store.entries(), []);
    assertEquals(store.commandIntents(), []);
    valid = true;
    await engine.handle(message);
    assertEquals(store.commandIntents().length, 1);
    const transformed = defineJob('transformed').payload(
      schema.transform((value) => ({ documentId: value.documentId + '!' })),
    ).entrypoint('transform.ts').build();
    await engine.register([
      definition(() => [workerJobEffect(transformed, { documentId: 'one' }, route)]),
    ]);
    await assertRejects(() => engine.handle({ ...message, idempotencyKey: 'transformed' }));
    class ExoticPayload {
      documentId = 'one';
    }
    const untyped = defineJob('untyped').payload(z.unknown()).entrypoint('untyped.ts').build();
    await engine.register([
      definition(() => [workerJobEffect(untyped, new ExoticPayload(), route)]),
    ]);
    await assertRejects(() => engine.handle({ ...message, idempotencyKey: 'prototype' }));
    let getters = 0;
    const accessor = Object.defineProperty({}, 'documentId', {
      enumerable: true,
      get() {
        getters++;
        return 'one';
      },
    });
    await engine.register([definition(() => [workerJobEffect(untyped, accessor, route)])]);
    await assertRejects(() => engine.handle({ ...message, idempotencyKey: 'accessor' }));
    assertEquals(getters, 0);
    const exotic = defineJob('exotic').payload(z.date()).entrypoint('exotic.ts').build();
    await engine.register([definition(() => [workerJobEffect(exotic, new Date(), route)])]);
    await assertRejects(() => engine.handle({ ...message, idempotencyKey: 'exotic' }));
    await engine.register([definition(() => [workerJobEffect(job, { documentId: 'one' }, route)])]);
    await assertRejects(() =>
      engine.handle({ ...message, idempotencyKey: 'badtrace', traceparent: 'bad' })
    );
    assertEquals(store.commits, 1);
    assertEquals(store.granular, 0);
  } finally {
    await engine.stop();
  }
});

Deno.test('durable bridge and engine replay remain retryable after failed commit and dedupe after restart', async () => {
  const store = new RecordingAtomicStore();
  store.failOnce = true;
  const def = definition(() => [workerJobEffect(job, { documentId: 'one' }, route)]);
  const runtime = createSagaRuntime({ native: { store } });
  await runtime.register([def]);
  await runtime.start();
  try {
    await assertRejects(() => runtime.publish(message), Error, 'fault before commit');
    assertEquals(store.entries(), []);
    assertEquals(store.commandIntents(), []);
    assertEquals(store.transitions(instanceId), []);
    await runtime.publish(message);
    assertEquals(store.commandIntents().length, 1);
    assertEquals((await store.load(instanceId))?.state.count, 1);
    assertEquals(store.granular, 0);
  } finally {
    await runtime.stop();
  }
  const restarted = createSagaRuntime({ native: { store } });
  await restarted.register([def]);
  await restarted.start();
  try {
    await restarted.publish(message);
    assertEquals((await store.load(instanceId))?.metadata.version, 1);
    assertEquals(store.commandIntents().length, 1);
  } finally {
    await restarted.stop();
  }
});
