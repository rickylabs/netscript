import { createQueue } from '@netscript/queue';
import { DEFAULT_TOPIC, type JobMessage } from '@netscript/plugin-workers-core/runtime';
import type {
  EnqueueJobAction,
  TriggerActionResult,
  TriggerEvent,
} from '@netscript/plugin-triggers-core/domain';
import { TriggersError } from '@netscript/plugin-triggers-core/domain';
import type {
  ProcessableTriggerDefinition,
  TriggerDlqPort,
  TriggerEventSubscriptionPort,
  TriggerIdempotencyPort,
  TriggerProcessorPort,
  TriggerProcessorStopOptions,
  TriggerProcessResult,
} from '@netscript/plugin-triggers-core/ports';
import { createTriggerProcessor } from '@netscript/plugin-triggers-core/runtime';
import {
  KvTriggerDlqStore,
  KvTriggerIdempotencyStore,
  openTriggerRuntimeKv,
} from '@netscript/plugin-triggers-core/stores';
import type { KvStore } from '@netscript/kv';
import { traceJobDispatch } from '@netscript/telemetry/instrumentation';
import { SpanNames, TriggerAttributes } from '@netscript/telemetry/attributes';
import {
  type Context,
  contextWithSpan,
  extractFromTraceContext,
  withContextAsync,
} from '@netscript/telemetry/context';
import {
  createSpan,
  getTriggerTracer,
  SpanKind,
  SpanStatusCode,
  type Tracer,
} from '@netscript/telemetry/tracer';

/** Options for constructing the plugin trigger processor runtime. */
export type RuntimeTriggerProcessorOptions = Readonly<{
  kv?: KvStore;
  idempotency?: TriggerIdempotencyPort;
  dlq?: TriggerDlqPort;
  jobQueue?: ReturnType<typeof createQueue<JobMessage>>;
  eventSubscription?: TriggerEventSubscriptionPort;
  /** Tracer override; defaults to the shared trigger-domain facade tracer. */
  tracer?: Tracer;
}>;

/** Create the trigger processor used by plugin service and background runtimes. */
export async function createRuntimeTriggerProcessor(
  options: RuntimeTriggerProcessorOptions = {},
): Promise<TriggerProcessorPort> {
  const needsKv = options.idempotency === undefined || options.dlq === undefined;
  const kv = needsKv ? options.kv ?? await openTriggerRuntimeKv() : options.kv;
  const queue = options.jobQueue ?? createQueue<JobMessage>('jobs');
  const processor = createTriggerProcessor({
    idempotency: options.idempotency ?? new KvTriggerIdempotencyStore({ kv: requireKv(kv) }),
    dlq: options.dlq ?? new KvTriggerDlqStore({ kv: requireKv(kv) }),
    dispatchAction: async (action, event, definition) => {
      await dispatchTriggerAction(action, event, definition, queue);
    },
    eventSubscription: options.eventSubscription,
  });

  return new TracedTriggerProcessor(processor, options.tracer);
}

function requireKv(kv: KvStore | undefined): KvStore {
  if (kv === undefined) {
    throw new Error('Trigger runtime KV is required to construct default stores.');
  }
  return kv;
}

class TracedTriggerProcessor implements TriggerProcessorPort {
  readonly #processor: TriggerProcessorPort;
  readonly #tracer: Tracer;

  constructor(processor: TriggerProcessorPort, tracer?: Tracer) {
    this.#processor = processor;
    // Converge onto the shared trigger-domain facade tracer (TC-13) instead of
    // a private `getTracer('@netscript/triggers')` instance.
    this.#tracer = tracer ?? getTriggerTracer();
  }

  async process<TDefinition extends ProcessableTriggerDefinition>(
    event: TriggerEvent,
    definition: TDefinition,
  ): Promise<TriggerProcessResult> {
    // Re-establish the inbound trace as the parent so ingress -> detect ->
    // process share one trace, even though processing runs in a detached
    // microtask after the 202 ack (the async context no longer carries the
    // request span). The captured `traceparent`/`tracestate` are the durable
    // link; without this the process span started a brand-new, orphaned trace.
    const parentContext = event.traceparent
      ? extractFromTraceContext({
        traceparent: event.traceparent,
        tracestate: event.tracestate,
      })
      : undefined;

    const attributes = {
      [TriggerAttributes.TRIGGER_ID]: String(event.triggerId),
      [TriggerAttributes.EVENT_ID]: String(event.id),
      [TriggerAttributes.EVENT_KIND]: String(event.kind),
      [TriggerAttributes.EVENT_STATUS]: String(event.status),
    };

    return await this.#runSpan(
      SpanNames.TRIGGER_INGRESS,
      SpanKind.SERVER,
      attributes,
      parentContext,
      (ingressContext) =>
        this.#runSpan(
          SpanNames.TRIGGER_DETECT,
          SpanKind.INTERNAL,
          attributes,
          ingressContext,
          (detectContext) =>
            this.#runSpan(
              SpanNames.TRIGGER_PROCESS,
              SpanKind.INTERNAL,
              attributes,
              detectContext,
              (processContext) =>
                withContextAsync(
                  processContext,
                  async () => await this.#processor.process(event, definition),
                ),
            ),
        ),
    );
  }

  /**
   * Start a span parented under `parentContext`, run `fn` with the span's own
   * context threaded explicitly (so nesting holds without a global context
   * manager), record OK/ERROR status, and end the span.
   */
  async #runSpan<T>(
    name: string,
    kind: SpanKind,
    attributes: Readonly<Record<string, string>>,
    parentContext: Context | undefined,
    fn: (childContext: Context) => Promise<T>,
  ): Promise<T> {
    const span = createSpan(this.#tracer, name, { kind, attributes, parentContext });
    const childContext = contextWithSpan(span, parentContext);
    try {
      const result = await fn(childContext);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  }

  stop(options?: TriggerProcessorStopOptions): Promise<void> {
    return this.#processor.stop(options);
  }
}

async function dispatchTriggerAction(
  action: TriggerActionResult,
  event: TriggerEvent,
  definition: Readonly<{ id: string }>,
  queue: ReturnType<typeof createQueue<JobMessage>>,
): Promise<void> {
  if (action.kind === 'defer') {
    throw TriggersError.unsupportedOperation(
      'trigger-action.defer',
      `Deferred trigger action dispatch is not implemented for ${definition.id}; until=${action.until}.`,
    );
  }

  await enqueueWorkerJob(action, event, definition, queue);
}

async function enqueueWorkerJob(
  action: EnqueueJobAction,
  event: TriggerEvent,
  definition: Readonly<{ id: string }>,
  queue: ReturnType<typeof createQueue<JobMessage>>,
): Promise<void> {
  const idempotencyKey = action.options.idempotencyKey ?? event.idempotencyKey ?? event.id;
  const message: JobMessage = {
    jobId: action.jobId,
    topic: action.job.topic ?? DEFAULT_TOPIC,
    triggeredBy: 'event',
    triggeredAt: new Date().toISOString(),
    payload: normalizePayload(action.options.payload),
    idempotencyKey,
    priority: action.options.priority ?? 50,
    correlationId: event.id,
  };

  await traceJobDispatch(
    {
      job: {
        id: action.jobId,
        name: action.job.name,
        entrypoint: action.job.entrypoint,
      },
      triggeredBy: 'event',
      queueName: 'jobs',
      priority: message.priority,
      payload: message.payload,
    },
    async (headers) => {
      await queue.enqueue(
        {
          ...message,
          traceparent: headers.traceparent,
          tracestate: headers.tracestate,
        },
        {
          priority: message.priority,
          deduplicationId: idempotencyKey,
          headers: {
            ...headers,
            'trigger-id': String(definition.id),
            'trigger-event-id': String(event.id),
          },
        },
      );
    },
  );
}

function normalizePayload(payload: unknown): Record<string, unknown> | undefined {
  if (payload === undefined) {
    return undefined;
  }
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return { value: payload };
}
