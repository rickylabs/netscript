import { assert, assertEquals, assertRejects } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';

import { defineSaga, sagaCompensate, sagaComplete, sagaFail } from '../../mod.ts';
import type {
  CascadedMessage,
  SagaCorrelationKey,
  SagaDefinition,
  SagaInstanceStatus,
  SagaState,
  SagaStateEnvelope,
} from '../../src/domain/mod.ts';
import type { SagaStoreWriteOptions } from '../../src/ports/mod.ts';
import { createSagaEngine, createSagaRuntime, SagaCompensator } from '../../src/runtime/mod.ts';
import { MemorySagaStore, TestSagaClock } from '../../src/testing/mod.ts';
import { KvSagaAppliedKeyStore, KvSagaStore } from '../../src/stores/mod.ts';
import {
  SagaAttributes,
  SagaInstrumentation,
  SagaSpanEvents,
  SagaSpanNames,
  type SagaTelemetryAttributes,
  type SagaTelemetryOutcome,
  SagaTelemetryOutcomes,
  type SagaTelemetrySpan,
  type SagaTelemetrySpanKind,
  type SagaTelemetryStatus,
  type SagaTraceParent,
} from '../../src/telemetry/mod.ts';

for (
  const scenario of [
    { name: 'finished undo', cascaded: [], status: 'compensated', outcome: 'compensated' },
    {
      name: 'failed undo',
      cascaded: [sagaFail('refund rejected')],
      status: 'failed',
      outcome: 'error',
    },
    { name: 'completed saga', cascaded: [sagaComplete()], status: 'completed', outcome: 'success' },
    {
      name: 'nested undo still pending',
      cascaded: [sagaCompensate({ type: 'RefundPayment', payload: {} })],
      status: 'compensating',
      outcome: 'success',
    },
  ] satisfies readonly {
    name: string;
    cascaded: readonly CascadedMessage[];
    status: SagaInstanceStatus;
    outcome: SagaTelemetryOutcome;
  }[]
) {
  Deno.test(`SagaEngine compensation telemetry distinguishes ${scenario.name}`, async () => {
    const telemetry = new RecordingTelemetry();
    const store = new MemorySagaStore();
    const engine = createSagaEngine({ store, instrumentation: telemetry.instrumentation });
    const definition = defineSaga('telemetry-compensation')
      .state<SagaState>({ payment: 'captured' })
      .on('FulfillmentFailed', () => [sagaCompensate({ type: 'RefundPayment', payload: {} })])
      .build() as SagaDefinition;
    await engine.register([definition]);
    await engine.start();
    try {
      const [requested] = await engine.handle({
        type: 'FulfillmentFailed',
        payload: {},
        correlationKey: 'order-1' as SagaCorrelationKey,
      });
      assertEquals((await store.load(requested.instanceId))?.metadata.status, 'compensating');
      assertEquals(telemetry.spans[0].attributes[SagaAttributes.OUTCOME], 'success');
      assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.OUTCOME], 'success');
      assertEquals(
        telemetry.spans[0].events.at(-1)?.attributes?.[SagaAttributes.STATUS],
        'compensating',
      );

      assert(requested.version !== undefined);
      const compensation = {
        sagaId: requested.sagaId,
        instanceId: requested.instanceId,
        correlationKey: requested.correlationKey,
        version: requested.version,
        state: { payment: 'refunded' },
        message: { type: 'RefundPayment', payload: {} },
        cascaded: scenario.cascaded,
      };
      const committed = await engine.commitCompensation(compensation);
      assertEquals(committed.committed, true);
      assertEquals((await store.load(requested.instanceId))?.metadata.status, scenario.status);
      assertEquals(telemetry.spans.length, 2);
      assertEquals(telemetry.durations.length, 2);
      const span = telemetry.spans.at(-1)!;
      assertEquals(span.attributes[SagaAttributes.OUTCOME], scenario.outcome);
      assertEquals(span.events.at(-1)?.attributes?.[SagaAttributes.STATUS], scenario.status);
      assertEquals(span.status?.status, scenario.status === 'failed' ? 'error' : 'ok');
      assertEquals(span.ended, true);
      assertEquals(
        telemetry.durations.at(-1)?.attributes?.[SagaAttributes.OUTCOME],
        scenario.outcome,
      );
      assertEquals((await engine.commitCompensation(compensation)).committed, false);
      assertEquals(telemetry.spans.length, 2);
      assertEquals(telemetry.durations.length, 2);
    } finally {
      await engine.stop('compensation telemetry test complete');
    }
  });
}

for (const atomic of [false, true]) {
  for (const throws of [false, true]) {
    Deno.test(`SagaEngine ${atomic ? 'atomic' : 'Deno KV'} compensation telemetry is immediate and replay-safe (${throws ? 'thrown failure' : 'finished undo'})`, async () => {
      await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
      const store = atomic ? new MemorySagaStore() : new KvSagaStore({ kv });
      const telemetry = new RecordingTelemetry();
      const builder = defineSaga('atomic-telemetry-compensation')
        .state<SagaState>({ payment: 'captured' });
      const definition = (atomic ? builder.durableWorkerCommands() : builder)
        .on('Start', () => [sagaCompensate({ type: 'Undo', payload: {} })])
        .build() as SagaDefinition;
      const engine = createSagaEngine({
        store,
        instrumentation: telemetry.instrumentation,
        appliedKeys: new KvSagaAppliedKeyStore({ kv }),
      });
      await engine.register([definition]);
      await engine.start();
      try {
        const [requested] = await engine.handle({
          type: 'Start',
          payload: {},
          correlationKey: 'order-1' as SagaCorrelationKey,
        });
        const error = throws ? new RangeError('undo failed') : undefined;
        const outcome = {
          sagaId: requested.sagaId,
          instanceId: requested.instanceId,
          correlationKey: requested.correlationKey,
          message: { type: 'Undo', payload: {} },
          version: requested.version!,
          state: throws ? requested.state : { payment: 'refunded' },
          cascaded: [],
          error,
        };
        const committed = await engine.commitCompensation(outcome);
        assertEquals(committed.committed, true);
        const status = throws ? 'failed' : 'compensated';
        assertEquals((await store.load(requested.instanceId))?.metadata.status, status);
        assertEquals(telemetry.spans.length, 2);
        const span = telemetry.spans.at(-1)!;
        assertEquals(span.events.at(-1)?.attributes?.[SagaAttributes.STATUS], status);
        assertEquals(span.attributes[SagaAttributes.OUTCOME], throws ? 'error' : 'compensated');
        assertEquals(span.exceptions, throws ? [error] : []);
        assertEquals(span.ended, true);
        assertEquals(telemetry.durations.length, 2);
        assertEquals((await engine.commitCompensation(outcome)).committed, false);
        assertEquals(telemetry.spans.length, 2);
        assertEquals(telemetry.durations.length, 2);
      } finally {
        await engine.stop();
      }
    });
  }
}

Deno.test('SagaEngine reports no compensation outcome for a failed atomic write and reports a successful retry once', async () => {
  const telemetry = new RecordingTelemetry();
  const store = new RetryableCompensationStore();
  const engine = createSagaEngine({ store, instrumentation: telemetry.instrumentation });
  const definition = defineSaga('retry-compensation-telemetry')
    .state<SagaState>({})
    .durableWorkerCommands()
    .on('Start', () => [sagaCompensate({ type: 'Undo', payload: {} })])
    .build() as SagaDefinition;
  await engine.register([definition]);
  await engine.start();
  try {
    const [requested] = await engine.handle({ type: 'Start', payload: {} });
    const outcome = {
      sagaId: requested.sagaId,
      instanceId: requested.instanceId,
      correlationKey: requested.correlationKey,
      version: requested.version!,
      message: { type: 'Undo', payload: {} },
      state: {},
      cascaded: [],
    };
    const failure = await assertRejects(
      () => engine.commitCompensation(outcome),
      Error,
      'write unavailable',
    );
    assertEquals(engine.classifyRetry(failure, 1).retryable, true);
    assertEquals(telemetry.spans.length, 1);
    assertEquals(telemetry.durations.length, 1);
    assertEquals((await store.load(requested.instanceId))?.metadata.status, 'compensating');
    assertEquals((await engine.commitCompensation(outcome)).committed, true);
    assertEquals(telemetry.spans.length, 2);
    assertEquals(telemetry.spans[1].attributes[SagaAttributes.OUTCOME], 'compensated');
    assertEquals((await engine.commitCompensation(outcome)).committed, false);
    assertEquals(telemetry.spans.length, 2);
    assertEquals(telemetry.durations.length, 2);
  } finally {
    await engine.stop();
  }
});

for (const returnedFailure of [false, true]) {
  Deno.test(`runtime committed compensation telemetry preserves span and correlation ownership (${returnedFailure ? 'returned' : 'thrown'} failure)`, async () => {
    const telemetry = new RecordingTelemetry();
    const store = new MemorySagaStore();
    const definition = defineSaga('runtime-compensation-outcome')
      .state<SagaState>({})
      .correlate(() => 'domain-order-1' as SagaCorrelationKey)
      .on('Start', () => [sagaCompensate({ type: 'Undo', payload: {} })])
      .compensate('Undo', () => {
        if (returnedFailure) return [sagaFail('refund rejected')];
        throw new RangeError('refund rejected');
      })
      .build() as SagaDefinition;
    const runtime = createSagaRuntime({
      native: {
        store,
        instrumentation: telemetry.instrumentation,
        compensator: new SagaCompensator({ clock: new TestSagaClock() }),
      },
    });
    await runtime.register([definition]);
    await runtime.start();
    try {
      const publish = () =>
        runtime.publish({
          type: 'Start',
          payload: {},
          correlationKey: 'flow-b-order-1' as SagaCorrelationKey,
          idempotencyKey: 'start-1',
        });
      if (returnedFailure) await publish();
      else await assertRejects(publish, RangeError, 'refund rejected');
      assertEquals(telemetry.spans.length, 3);
      const [handle, compensate, committed] = telemetry.spans;
      assertEquals(compensate.name, SagaSpanNames.CASCADE_COMPENSATE);
      assertEquals(compensate.attributes[SagaAttributes.OUTCOME], 'error');
      assertEquals(committed.name, SagaSpanNames.HANDLE);
      assertEquals(committed.attributes[SagaAttributes.OUTCOME], 'error');
      assertEquals(committed.events.at(-1)?.attributes?.[SagaAttributes.STATUS], 'failed');
      assertEquals(compensate.parent, handle.spanContext());
      assertEquals(committed.parent, handle.spanContext());
      for (const span of telemetry.spans) {
        assertEquals(span.attributes[SagaAttributes.CORRELATION_ID], 'flow-b-order-1');
        assertEquals(span.attributes[SagaAttributes.SAGA_CORRELATION_KEY], 'domain-order-1');
        assertEquals(span.ended, true);
      }
      await publish();
      assertEquals(telemetry.spans.length, 3);
      assertEquals(telemetry.durations.length, 2);
    } finally {
      await runtime.stop();
    }
  });
}

Deno.test('SagaEngine reads a legacy stuck compensating row without reporting compensated', async () => {
  const telemetry = new RecordingTelemetry();
  const store = new MemorySagaStore();
  const definition = defineSaga('legacy-compensation')
    .state<SagaState>({ payment: 'captured' })
    .on('Inspect', () => [])
    .build() as SagaDefinition;
  const instanceId = 'legacy-compensation:order-1' as SagaStateEnvelope['metadata']['instanceId'];
  const now = new Date('2026-01-01T00:00:00Z');
  await store.save({
    metadata: {
      instanceId,
      sagaId: definition.id,
      status: 'compensating',
      version: 7,
      durability: definition.durability,
      createdAt: now,
      updatedAt: now,
    },
    state: { payment: 'captured' },
  });
  const engine = createSagaEngine({ store, instrumentation: telemetry.instrumentation });
  await engine.register([definition]);
  await engine.start();
  try {
    await engine.handle({
      type: 'Inspect',
      payload: {},
      correlationKey: 'order-1' as SagaCorrelationKey,
    });
    const loaded = await store.load(instanceId);
    assertEquals(loaded?.metadata.status, 'compensating');
    assertEquals(loaded?.metadata.version, 8);
    assertEquals(loaded?.state, { payment: 'captured' });
    assertEquals(telemetry.spans[0].events[0].attributes?.[SagaAttributes.STATUS], 'compensating');
    assertEquals(telemetry.spans[0].attributes[SagaAttributes.OUTCOME], 'success');
    assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.OUTCOME], 'success');
  } finally {
    await engine.stop('legacy compensation telemetry test complete');
  }
});

Deno.test('SagaEngine emits one successful saga.handle span for a handled message', async () => {
  const telemetry = new RecordingTelemetry();
  const engine = createSagaEngine({
    instrumentation: telemetry.instrumentation,
  });
  const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
  const definition = defineSaga('telemetry-success')
    .state<SagaState>({ count: 0 })
    .durability('t2')
    .on('counter.incremented', (saga) => {
      saga.state = { count: Number(saga.state.count ?? 0) + 1 };
      return [sagaComplete()];
    })
    .build() as SagaDefinition;

  await engine.register([definition]);
  await engine.start();
  try {
    const results = await engine.handle({
      type: 'counter.incremented',
      payload: {},
      correlationKey: 'counter-1' as SagaCorrelationKey,
      traceparent,
      tracestate: 'vendor=value',
    });

    assertEquals(results.length, 1);
    assertEquals(telemetry.spans.length, 2);
    const span = telemetry.spans.find((candidate) => candidate.name === SagaSpanNames.HANDLE);
    const complete = telemetry.spans.find(
      (candidate) => candidate.name === SagaSpanNames.CASCADE_COMPLETE,
    );
    assert(span);
    assert(complete);
    assertEquals(span.name, SagaSpanNames.HANDLE);
    assertEquals(span.kind, 'internal');
    assertEquals(span.parent, { traceparent, tracestate: 'vendor=value' });
    assertEquals(span.attributes[SagaAttributes.SAGA_ID], 'telemetry-success');
    assertEquals(span.attributes[SagaAttributes.SAGA_INSTANCE_ID], 'telemetry-success:counter-1');
    assertEquals(span.attributes[SagaAttributes.SAGA_EVENT_TYPE], 'counter.incremented');
    assertEquals(span.attributes[SagaAttributes.SAGA_ATTEMPT], 1);
    assertEquals(span.attributes[SagaAttributes.SAGA_DURABILITY_TIER], 't2');
    assertEquals(span.attributes[SagaAttributes.CORRELATION_ID], 'counter-1');
    assertEquals(span.attributes[SagaAttributes.SAGA_CORRELATION_KEY], 'counter-1');
    assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.SUCCESS);
    assertEquals(span.events, [
      { name: SagaSpanEvents.STATE_BEFORE, attributes: { [SagaAttributes.STATUS]: undefined } },
      { name: SagaSpanEvents.STATE_AFTER, attributes: { [SagaAttributes.STATUS]: 'completed' } },
    ]);
    assertEquals(span.status, { status: 'ok', description: undefined });
    assertEquals(span.exceptions.length, 0);
    assertEquals(span.ended, true);
    assertEquals(complete.parent, span.spanContext());
    assertEquals(complete.attributes[SagaAttributes.SAGA_ID], 'telemetry-success');
    assertEquals(
      complete.attributes[SagaAttributes.SAGA_INSTANCE_ID],
      'telemetry-success:counter-1',
    );
    assertEquals(complete.attributes[SagaAttributes.CORRELATION_ID], 'counter-1');
    assertEquals(complete.attributes[SagaAttributes.SAGA_CORRELATION_KEY], 'counter-1');
    assertEquals(complete.attributes[SagaAttributes.STATUS], 'completed');
    assertEquals(complete.attributes[SagaAttributes.SAGA_RESULT_PRESENT], false);
    assertEquals(complete.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.SUCCESS);
    assertEquals(complete.ended, true);
    assertEquals(results[0].correlationId, 'counter-1');
    assertEquals(results[0].correlationKey, 'counter-1');
    assertEquals(results[0].spanContext, span.spanContext());
    assertEquals(telemetry.durations.length, 1);
    assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.SAGA_ID], 'telemetry-success');
    assertEquals(
      telemetry.durations[0].attributes?.[SagaAttributes.SAGA_EVENT_TYPE],
      'counter.incremented',
    );
    assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.OUTCOME], 'success');
    assert(telemetry.durations[0].value >= 0);
  } finally {
    await engine.stop('saga engine telemetry test complete');
  }
});

Deno.test('SagaEngine complete span reports mixed terminal status without claiming success', async () => {
  const telemetry = new RecordingTelemetry();
  const engine = createSagaEngine({ instrumentation: telemetry.instrumentation });
  const definition = defineSaga('telemetry-mixed-terminal')
    .state<SagaState>({})
    .on('order.closed', () => [sagaComplete({ orderId: '42' }), sagaFail('payment failed')])
    .build() as SagaDefinition;

  await engine.register([definition]);
  await engine.start();
  try {
    const results = await engine.handle({
      type: 'order.closed',
      payload: {},
      correlationKey: 'order-42' as SagaCorrelationKey,
    });

    const complete = telemetry.spans.find(
      (candidate) => candidate.name === SagaSpanNames.CASCADE_COMPLETE,
    );
    assert(complete);
    assertEquals(results[0].completed, true);
    assertEquals(complete.attributes[SagaAttributes.STATUS], 'failed');
    assertEquals(complete.attributes[SagaAttributes.SAGA_RESULT_PRESENT], true);
    assertEquals(complete.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
    assertEquals(complete.status, { status: 'error', description: undefined });
    assertEquals(complete.ended, true);
  } finally {
    await engine.stop('mixed terminal telemetry test complete');
  }
});

Deno.test('SagaEngine finishes complete and handle spans when completion persistence fails', async () => {
  const telemetry = new RecordingTelemetry();
  const engine = createSagaEngine({
    instrumentation: telemetry.instrumentation,
    store: new FailingSagaStore(),
  });
  const definition = defineSaga('telemetry-complete-persist-error')
    .state<SagaState>({})
    .on('order.closed', () => [sagaComplete()])
    .build() as SagaDefinition;

  await engine.register([definition]);
  await engine.start();
  try {
    await assertRejects(
      () =>
        engine.handle({
          type: 'order.closed',
          payload: {},
          correlationKey: 'order-42' as SagaCorrelationKey,
        }),
      Error,
      'persistence unavailable',
    );
    const complete = telemetry.spans.find(
      (candidate) => candidate.name === SagaSpanNames.CASCADE_COMPLETE,
    );
    const handle = telemetry.spans.find((candidate) => candidate.name === SagaSpanNames.HANDLE);
    assert(complete);
    assert(handle);
    for (const span of [complete, handle]) {
      assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
      assertEquals(span.status?.status, 'error');
      assertEquals(span.exceptions.length, 1);
      assertEquals(span.ended, true);
    }
  } finally {
    await engine.stop('completion persistence failure telemetry test complete');
  }
});

Deno.test('SagaEngine records an ERROR span and rethrows when a handler throws', async () => {
  const telemetry = new RecordingTelemetry();
  const engine = createSagaEngine({
    instrumentation: telemetry.instrumentation,
  });
  const failure = new Error('handler failed');
  const definition = defineSaga('telemetry-failure')
    .state<SagaState>({})
    .on('work.requested', () => {
      throw failure;
    })
    .build() as SagaDefinition;

  await engine.register([definition]);
  await engine.start();
  try {
    await assertRejects(
      () =>
        engine.handle({
          type: 'work.requested',
          payload: {},
          correlationKey: 'work-1' as SagaCorrelationKey,
        }),
      Error,
      'handler failed',
    );

    assertEquals(telemetry.spans.length, 1);
    const span = telemetry.spans[0];
    assertEquals(span.name, SagaSpanNames.HANDLE);
    assertEquals(span.attributes[SagaAttributes.SAGA_ID], 'telemetry-failure');
    assertEquals(span.attributes[SagaAttributes.SAGA_INSTANCE_ID], 'telemetry-failure:work-1');
    assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
    assertEquals(span.events, [
      { name: SagaSpanEvents.STATE_BEFORE, attributes: { [SagaAttributes.STATUS]: undefined } },
    ]);
    assertEquals(span.status, { status: 'error', description: 'handler failed' });
    assertEquals(span.exceptions, [failure]);
    assertEquals(span.ended, true);
    assertEquals(telemetry.durations.length, 1);
    assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.OUTCOME], 'error');
    assert(telemetry.durations[0].value >= 0);
  } finally {
    await engine.stop('saga engine telemetry failure test complete');
  }
});

Deno.test('createSagaRuntime threads native instrumentation into the saga engine', async () => {
  const telemetry = new RecordingTelemetry();
  const runtime = createSagaRuntime({
    native: {
      instrumentation: telemetry.instrumentation,
    },
  });
  const definition = defineSaga('telemetry-runtime')
    .state<SagaState>({})
    .on('work.requested', () => [sagaComplete()])
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'work.requested',
      payload: {},
      correlationKey: 'work-1' as SagaCorrelationKey,
    });

    assertEquals(telemetry.spans.length, 2);
    const handle = telemetry.spans.find((span) => span.name === SagaSpanNames.HANDLE);
    assert(handle);
    assertEquals(handle.attributes[SagaAttributes.SAGA_ID], 'telemetry-runtime');
    assertEquals(handle.attributes[SagaAttributes.CORRELATION_ID], 'work-1');
    assertEquals(handle.attributes[SagaAttributes.OUTCOME], 'success');
    assertEquals(handle.ended, true);
  } finally {
    await runtime.stop('saga runtime telemetry test complete');
  }
});

class RecordingTelemetry {
  readonly spans: RecordingSpan[] = [];
  readonly durations: Array<{
    value: number;
    attributes?: SagaTelemetryAttributes;
  }> = [];
  readonly instrumentation = new SagaInstrumentation({
    tracer: {
      startSpan: (name, options): SagaTelemetrySpan => {
        const spanId = (this.spans.length + 1).toString(16).padStart(16, '0');
        const span = new RecordingSpan(
          name,
          options.kind,
          options.attributes,
          options.parent,
          { traceparent: `00-${'a'.repeat(32)}-${spanId}-01` },
        );
        this.spans.push(span);
        return span;
      },
    },
    meter: {
      handleDurationMs: {
        record: (value, attributes): void => {
          this.durations.push({ value, attributes });
        },
      },
    },
  });
}

class RecordingSpan implements SagaTelemetrySpan {
  readonly attributes: Record<string, string | number | boolean | undefined>;
  readonly events: Array<{
    name: string;
    attributes?: SagaTelemetryAttributes;
  }> = [];
  readonly exceptions: unknown[] = [];
  status?: Readonly<{ status: SagaTelemetryStatus; description?: string }>;
  ended = false;

  constructor(
    readonly name: string,
    readonly kind: SagaTelemetrySpanKind,
    attributes: SagaTelemetryAttributes | undefined,
    readonly parent: SagaTraceParent | undefined,
    readonly context: SagaTraceParent,
  ) {
    this.attributes = { ...attributes };
  }

  spanContext(): SagaTraceParent {
    return this.context;
  }

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  addEvent(name: string, attributes?: SagaTelemetryAttributes): void {
    this.events.push({ name, attributes });
  }

  setStatus(status: SagaTelemetryStatus, description?: string): void {
    this.status = { status, description };
  }

  recordException(error: unknown): void {
    this.exceptions.push(error);
  }

  end(): void {
    this.ended = true;
  }
}

class FailingSagaStore extends MemorySagaStore {
  override save<TState extends SagaState>(
    _envelope: SagaStateEnvelope<TState>,
    _options?: SagaStoreWriteOptions,
  ): Promise<void> {
    return Promise.reject(new Error('persistence unavailable'));
  }
}

class RetryableCompensationStore extends MemorySagaStore {
  #failed = false;

  override commitTransition(
    request: Parameters<MemorySagaStore['commitTransition']>[0],
    signal?: AbortSignal,
  ): ReturnType<MemorySagaStore['commitTransition']> {
    if (request.envelope.metadata.version === 2 && !this.#failed) {
      this.#failed = true;
      return Promise.reject(new Error('write unavailable'));
    }
    return super.commitTransition(request, signal);
  }
}
