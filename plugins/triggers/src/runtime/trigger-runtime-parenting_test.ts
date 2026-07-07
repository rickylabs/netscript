import { assertEquals, assertExists } from '@std/assert';
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import { defineJob } from '@netscript/plugin-workers-core';
import type { JobMessage } from '@netscript/plugin-workers-core/runtime';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '@netscript/plugin-triggers-core/domain';
import type {
  TriggerDlqEntry,
  TriggerDlqPort,
  TriggerIdempotencyClaim,
  TriggerIdempotencyKeyInput,
  TriggerIdempotencyPort,
} from '@netscript/plugin-triggers-core/ports';
import { SpanNames } from '@netscript/telemetry/attributes';
import { getSpanFromContext } from '@netscript/telemetry/context';
import {
  type Context,
  type Span,
  type SpanContext,
  SpanKind,
  type SpanOptions,
  type Tracer,
} from '@netscript/telemetry/tracer';
import { createRuntimeTriggerProcessor } from './trigger-runtime-processor.ts';

const INBOUND_TRACE_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const INBOUND_PARENT_ID = 'bbbbbbbbbbbbbbbb';

Deno.test(
  'trigger ingress, detect, and process spans share the inbound trace (regression #405)',
  async () => {
    const recorder = new ParentAwareRecorder();
    const idempotency = new MemoryIdempotency();
    const dlq = new MemoryDlq();
    const queue = new RecordingJobQueue();
    const processor = await createRuntimeTriggerProcessor({
      idempotency,
      dlq,
      jobQueue: queue as never,
      tracer: recorder,
    });
    const job = defineJob('send-receipt').handler(() => ({ success: true })).build();
    const definition = defineWebhook(
      () => Promise.resolve([enqueueJob(job, { payload: { receiptId: 'r_1' } })]),
      { id: 'stripe-payments', path: '/webhooks/stripe', verifier: 'memory' },
    );

    const result = await processor.process(tracedWebhookEvent(), definition);

    assertEquals(result.status, 'completed');

    const ingress = recorder.find(SpanNames.TRIGGER_INGRESS);
    const detect = recorder.find(SpanNames.TRIGGER_DETECT);
    const process = recorder.find(SpanNames.TRIGGER_PROCESS);
    assertExists(ingress, 'expected a trigger.ingress span');
    assertExists(detect, 'expected a trigger.detect span');
    assertExists(process, 'expected a trigger.process span');

    // The ingress span is a SERVER span rooted at the inbound remote trace...
    assertEquals(ingress.kind, SpanKind.SERVER);
    assertEquals(ingress.traceId, INBOUND_TRACE_ID);
    // ...and detect + process continue the SAME trace rather than orphaning one.
    assertEquals(detect.traceId, INBOUND_TRACE_ID);
    assertEquals(process.traceId, INBOUND_TRACE_ID);
    assertEquals(process.traceId, ingress.traceId);
  },
);

interface RecordedSpan {
  name: string;
  traceId: string;
  spanId: string;
  kind?: number;
}

/**
 * A {@link Tracer} that derives each span's trace id from the parent context it
 * is started under, so parent/child trace continuation is observable without a
 * globally registered OpenTelemetry provider.
 */
class ParentAwareRecorder implements Tracer {
  readonly spans: RecordedSpan[] = [];

  find(name: string): RecordedSpan | undefined {
    return this.spans.find((span) => span.name === name);
  }

  startSpan(name: string, options?: SpanOptions, parentContext?: Context): Span {
    const parentTraceId = parentContext
      ? getSpanFromContext(parentContext)?.spanContext().traceId
      : undefined;
    const traceId = parentTraceId && parentTraceId !== INVALID_TRACE_ID
      ? parentTraceId
      : randomHex(16);
    const spanId = randomHex(8);
    this.spans.push({ name, traceId, spanId, kind: options?.kind });
    return makeSpan({ traceId, spanId, traceFlags: 1 });
  }

  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  startActiveSpan<T>(name: string, options: SpanOptions, fn: (span: Span) => T): T;
  startActiveSpan<T>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: (span: Span) => T,
  ): T;
  startActiveSpan<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: Span) => T),
    contextOrFn?: Context | ((span: Span) => T),
    maybeFn?: (span: Span) => T,
  ): T {
    const fn = typeof optionsOrFn === 'function'
      ? optionsOrFn
      : typeof contextOrFn === 'function'
      ? contextOrFn
      : maybeFn;
    const options = typeof optionsOrFn === 'function' ? undefined : optionsOrFn;
    const context = typeof contextOrFn === 'function' ? undefined : contextOrFn;
    if (!fn) {
      throw new TypeError('startActiveSpan requires a callback');
    }
    return fn(this.startSpan(name, options, context));
  }
}

const INVALID_TRACE_ID = '00000000000000000000000000000000';

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function makeSpan(spanContext: SpanContext): Span {
  const span: Span = {
    spanContext: () => spanContext,
    setAttribute: () => span,
    setAttributes: () => span,
    addEvent: () => span,
    addLink: () => span,
    addLinks: () => span,
    setStatus: () => span,
    updateName: () => span,
    isRecording: () => true,
    recordException: () => {},
    end: () => {},
  };
  return span;
}

class MemoryIdempotency implements TriggerIdempotencyPort {
  resolveKey(input: TriggerIdempotencyKeyInput): Promise<TriggerIdempotencyClaim> {
    return Promise.resolve({
      claimed: true,
      key: input.event.idempotencyKey ?? 'payload-hash',
      source: input.event.idempotencyKey ? 'caller' : 'payload-hash',
    });
  }
  markCompleted(): Promise<void> {
    return Promise.resolve();
  }
  release(): Promise<void> {
    return Promise.resolve();
  }
}

class MemoryDlq implements TriggerDlqPort {
  readonly entries: TriggerDlqEntry[] = [];
  enqueue(entry: TriggerDlqEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }
  list(): Promise<readonly TriggerDlqEntry[]> {
    return Promise.resolve(this.entries);
  }
  replay(): Promise<void> {
    return Promise.resolve();
  }
}

class RecordingJobQueue {
  readonly messages: JobMessage[] = [];
  enqueue(message: JobMessage): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }
}

function tracedWebhookEvent(): TriggerEvent<'webhook'> {
  return {
    id: 'evt_1' as TriggerEventId,
    triggerId: 'stripe-payments' as TriggerId,
    kind: 'webhook',
    status: 'pending',
    payload: {
      body: { type: 'payment_intent.succeeded' },
      headers: {},
      method: 'POST',
      path: '/webhooks/stripe',
    },
    attempt: 0,
    detectedAt: '2026-05-17T00:00:00.000Z',
    updatedAt: '2026-05-17T00:00:00.000Z',
    idempotencyKey: 'evt_1',
    traceparent: `00-${INBOUND_TRACE_ID}-${INBOUND_PARENT_ID}-01`,
    tracestate: 'vendorA=abc123',
  };
}
