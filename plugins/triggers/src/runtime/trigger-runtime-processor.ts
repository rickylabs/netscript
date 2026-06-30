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
import { TriggerSpanNames } from '@netscript/plugin-triggers-core/telemetry';
import { traceJobDispatch } from '@netscript/telemetry/instrumentation';
import { getTracer, withSpan } from '@netscript/telemetry/tracer';

/** Options for constructing the plugin trigger processor runtime. */
export type RuntimeTriggerProcessorOptions = Readonly<{
  kv?: KvStore;
  idempotency?: TriggerIdempotencyPort;
  dlq?: TriggerDlqPort;
  jobQueue?: ReturnType<typeof createQueue<JobMessage>>;
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
  });

  return new TracedTriggerProcessor(processor);
}

function requireKv(kv: KvStore | undefined): KvStore {
  if (kv === undefined) {
    throw new Error('Trigger runtime KV is required to construct default stores.');
  }
  return kv;
}

class TracedTriggerProcessor implements TriggerProcessorPort {
  readonly #processor: TriggerProcessorPort;
  readonly #tracer = getTracer('@netscript/triggers');

  constructor(processor: TriggerProcessorPort) {
    this.#processor = processor;
  }

  async process<TDefinition extends ProcessableTriggerDefinition>(
    event: TriggerEvent,
    definition: TDefinition,
  ): Promise<TriggerProcessResult> {
    const attributes = {
      'trigger.id': String(event.triggerId),
      'trigger.event.id': String(event.id),
      'trigger.kind': event.kind,
    };

    return await withSpan(
      this.#tracer,
      TriggerSpanNames.DETECT,
      async () =>
        await withSpan(
          this.#tracer,
          TriggerSpanNames.PROCESS,
          async () => await this.#processor.process(event, definition),
          { attributes },
        ),
      { attributes },
    );
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
