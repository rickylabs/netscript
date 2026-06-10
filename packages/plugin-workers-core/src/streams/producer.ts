import { createDurableStream } from '@netscript/plugin-streams-core';
import { DEFAULT_TOPIC } from '../domain/mod.ts';
import { type WorkerExecution, type WorkerJob, workersStreamSchema } from './schema.ts';

const DEFAULT_STREAM_PATH = '/workers/executions';
const DEFAULT_PRODUCER_ID = 'workers-service';

/** Durable stream producer type for the workers stream schema. */
export type WorkersStreamProducer = Readonly<{
  upsert(entity: 'execution', value: WorkerExecution): void | Promise<void>;
  upsert(entity: 'job', value: WorkerJob): void | Promise<void>;
  delete(entity: 'execution' | 'job', id: string): void | Promise<void>;
}>;

/** Execution record shape mirrored into the workers durable stream. */
export type WorkerExecutionRecord = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly jobId: string;
    readonly status: string;
    readonly topic?: string;
    readonly concept?: 'job' | 'task';
    readonly correlationId?: string;
    readonly triggeredAt?: string;
    readonly startedAt?: string | null;
    readonly completedAt?: string | null;
    readonly duration?: number | null;
    readonly exitCode?: number | null;
    readonly error?: string | null;
    readonly result?: Record<string, unknown> | null;
    readonly workerId?: string | null;
    readonly attempt?: number;
  }
>;

/** Options for creating a workers durable stream producer. */
export type WorkersStreamProducerOptions = Readonly<{
  streamPath?: string;
  producerId?: string;
}>;

/** Execution-state mutation published to the workers durable stream. */
export type ExecutionMutation = Readonly<{
  type: 'created' | 'deleted' | 'updated';
  execution: WorkerExecutionRecord;
}>;

/** Hook called when execution state changes. */
export type ExecutionMutationHook = (mutation: ExecutionMutation) => void;

/** Create a workers durable stream producer for execution and job entities. */
export function createWorkersStreamProducer(
  options: WorkersStreamProducerOptions = {},
): WorkersStreamProducer {
  return createDurableStream({
    streamPath: options.streamPath ?? DEFAULT_STREAM_PATH,
    schema: workersStreamSchema as never,
    producerId: options.producerId ?? DEFAULT_PRODUCER_ID,
  }) as unknown as WorkersStreamProducer;
}

/** Convert an execution record into the durable stream execution entity shape. */
export function toExecutionStreamEntity(execution: WorkerExecutionRecord): WorkerExecution {
  return {
    id: execution.id,
    jobId: execution.jobId,
    topic: execution.topic ?? DEFAULT_TOPIC,
    concept: execution.concept ?? 'job',
    status: execution.status,
    correlationId: execution.correlationId,
    triggeredAt: execution.triggeredAt,
    startedAt: execution.startedAt ?? null,
    completedAt: execution.completedAt ?? null,
    duration: execution.duration ?? null,
    exitCode: execution.exitCode ?? null,
    error: execution.error ?? null,
    result: execution.result ?? null,
    workerId: execution.workerId ?? null,
    attempt: execution.attempt ?? 0,
  };
}

/** Create a mutation hook that mirrors execution state into the durable stream. */
export function createStreamMutationHook(
  producer: WorkersStreamProducer,
): ExecutionMutationHook {
  return ({ type, execution }) => {
    if (type === 'deleted') {
      producer.delete('execution', execution.id);
    } else {
      producer.upsert('execution', toExecutionStreamEntity(execution));
    }
  };
}

/** Emit a job entity to the workers durable stream. */
export function emitJobToStream(
  producer: WorkersStreamProducer,
  job: WorkerJob,
): void {
  producer.upsert('job', job);
}
