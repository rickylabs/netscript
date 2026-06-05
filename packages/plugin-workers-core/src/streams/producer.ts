import { createDurableStream, type DurableStreamProducer } from '@netscript/plugin-streams-core';
import { DEFAULT_TOPIC, type ExecutionRecord } from '../domain/mod.ts';
import { type WorkerExecution, type WorkerJob, workersStreamSchema } from './schema.ts';

const DEFAULT_STREAM_PATH = '/workers/executions';
const DEFAULT_PRODUCER_ID = 'workers-service';

/** Durable stream producer type for the workers stream schema. */
export type WorkersStreamProducer = DurableStreamProducer<typeof workersStreamSchema>;

/** Options for creating a workers durable stream producer. */
export type WorkersStreamProducerOptions = Readonly<{
  streamPath?: string;
  producerId?: string;
}>;

/** Execution-state mutation published to the workers durable stream. */
export type ExecutionMutation = Readonly<{
  type: 'created' | 'deleted' | 'updated';
  execution: ExecutionRecord;
}>;

/** Hook called when execution state changes. */
export type ExecutionMutationHook = (mutation: ExecutionMutation) => void;

/** Create a workers durable stream producer for execution and job entities. */
export function createWorkersStreamProducer(
  options: WorkersStreamProducerOptions = {},
): WorkersStreamProducer {
  return createDurableStream({
    streamPath: options.streamPath ?? DEFAULT_STREAM_PATH,
    schema: workersStreamSchema,
    producerId: options.producerId ?? DEFAULT_PRODUCER_ID,
  });
}

/** Convert an execution record into the durable stream execution entity shape. */
export function toExecutionStreamEntity(execution: ExecutionRecord): WorkerExecution {
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
