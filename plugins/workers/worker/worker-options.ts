import type { MessageContext, MessageQueue } from '@netscript/queue';
import type {
  JobDefinition,
  JobMessage,
  TaskDefinition,
  TaskExecutionOptions,
  TaskMessage,
  TriggerType,
  WorkerIdempotencyPort,
} from '@netscript/plugin-workers-core/runtime';
import type { TracedMessageContext } from '@netscript/telemetry/instrumentation';
import type { Span } from '@netscript/telemetry/tracer';
import type { WorkerPool, WorkerPoolOptions } from './job-runner-pool.ts';
import type { WorkerListenerSnapshot } from './listener-supervisor.ts';

/** Structural validation schema accepted by worker queue triggers. */
export interface WorkerPayloadSchema {
  /** Parse and validate an incoming queue payload. */
  parse(value: unknown): unknown;
}

/** Job registry surface consumed by the worker process. */
export interface WorkerJobRegistry {
  /** Return a job definition by identifier. */
  get(jobId: string): Promise<JobDefinition | undefined>;
}

/** Task registry surface consumed by the worker process. */
export interface WorkerTaskRegistry {
  /** Return a task definition by identifier. */
  get(taskId: string): Promise<TaskDefinition | undefined>;
}

/** Execution record returned by the worker execution-state port. */
export interface WorkerExecutionRecord {
  /** Execution identifier. */
  readonly id: string;
}

/** Options for creating a worker execution record. */
export type WorkerCreateExecutionOptions = Readonly<{
  /** Execution concept. */
  concept?: 'job' | 'task';
  /** Job or task identifier. */
  jobId: string;
  /** Topic associated with the execution. */
  topic: string;
  /** Trigger source (canonical {@link TriggerType} enum, not bare `string`). */
  triggeredBy: TriggerType;
  /** Optional execution payload. */
  payload?: Record<string, unknown>;
  /** Optional correlation identifier. */
  correlationId?: string;
  /** W3C traceparent header. */
  traceparent?: string;
  /** W3C tracestate header. */
  tracestate?: string;
}>;

/** Options for completing a worker execution record. */
export type WorkerCompleteExecutionOptions = Readonly<{
  /** Final execution status. */
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  /** Process-style exit code. */
  exitCode?: number;
  /** Structured execution result. */
  result?: Record<string, unknown> | null;
  /** Failure message. */
  error?: string | null;
}>;

/** Execution-state surface consumed by the worker process. */
export interface WorkerExecutionState {
  /** Create an execution record. */
  create(options: WorkerCreateExecutionOptions): Promise<WorkerExecutionRecord>;
  /** Mark an execution as running. */
  start(executionId: string): Promise<WorkerExecutionRecord | null>;
  /** Complete an execution record. */
  complete(
    executionId: string,
    options: WorkerCompleteExecutionOptions,
  ): Promise<WorkerExecutionRecord | null>;
}

/** Task executor surface consumed by the worker process. */
export interface WorkerTaskExecutor {
  /** Execute a task definition. */
  execute(task: TaskDefinition, options: TaskExecutionOptions): Promise<WorkerTaskResult>;
}

/** Task execution result surface consumed by the worker process. */
export type WorkerTaskResult = Readonly<{
  /** Whether the task completed successfully. */
  success: boolean;
  /** Task duration in milliseconds. */
  duration: number;
  /** Process-style exit code. */
  exitCode?: number;
  /** Structured task result payload. */
  result?: Record<string, unknown> | null;
  /** Failure message. */
  error?: string | null;
  /** Captured standard output. */
  stdout?: string;
  /** Captured standard error. */
  stderr?: string;
}>;

/** Configuration for a queue that triggers a job when messages arrive. */
export interface QueueTriggerConfig {
  /** Queue name to listen to. */
  queueName: string;
  /** Job ID to trigger when messages arrive. */
  jobId: string;
  /** Optional schema for message validation. */
  schema?: WorkerPayloadSchema;
  /** Concurrency for this queue listener. */
  concurrency?: number;
}

/** Worker configuration options. */
export interface WorkerOptions {
  /** Worker identifier. */
  workerId: string;
  /** Queue name to consume from. */
  queueName?: string;
  /** Number of concurrent jobs to process. */
  concurrency?: number;
  /** Job registry instance. */
  registry: WorkerJobRegistry;
  /** Execution state instance. */
  executionState: WorkerExecutionState;
  /** Task executor instance. */
  taskExecutor: WorkerTaskExecutor;
  /** Task registry instance. */
  taskRegistry: WorkerTaskRegistry;
  /** Durable applied-keys store for consumer-side idempotency. */
  idempotency: WorkerIdempotencyPort;
  /** Base directory for job scripts. */
  jobsDir?: string;
  /** Additional queue triggers. */
  queueTriggers?: QueueTriggerConfig[];
  /** Custom Web Worker entry point URL for the worker pool. */
  workerUrl?: string;
  /** Options for in-process job handler resolution. */
  workerPoolOptions?: WorkerPoolOptions;
  /** Maximum listener restarts before worker health degrades. */
  listenerMaxRestarts?: number;
  /** Initial listener restart backoff in milliseconds. */
  listenerInitialBackoffMs?: number;
  /** Maximum listener restart backoff in milliseconds. */
  listenerMaxBackoffMs?: number;
}

/** Job execution context tracked while the worker is stopping. */
export interface JobExecutionContext {
  /** Job identifier. */
  readonly jobId: string;
  /** Job topic. */
  readonly topic: string;
  /** Execution identifier. */
  readonly executionId: string;
  /** Execution start time. */
  readonly startTime: Date;
  /** Abort controller for the active job. */
  readonly abortController: AbortController;
  /** Parent span for tracing. */
  readonly span?: Span;
}

/** Internal result shape returned by worker job execution. */
export interface WorkerJobResult {
  /** Whether execution succeeded. */
  readonly success: boolean;
  /** Process-style exit code. */
  readonly exitCode?: number;
  /** Structured result payload. */
  readonly result?: Record<string, unknown>;
  /** Error message for failed execution. */
  readonly error?: string;
}

/** Context required by worker job dispatch helpers. */
export interface WorkerDispatchContext {
  readonly workerId: string;
  readonly registry: WorkerJobRegistry;
  readonly executionState: WorkerExecutionState;
  readonly taskExecutor: WorkerTaskExecutor;
  readonly taskRegistry: WorkerTaskRegistry;
  readonly idempotency: WorkerIdempotencyPort;
  readonly workerPool: WorkerPool;
  readonly jobsDir: string;
  readonly activeJobs: Map<string, JobExecutionContext>;
  readonly workerSpan: Span | null;
}

/** Context required by queue-consumer helpers. */
export interface WorkerQueueContext {
  readonly workerId: string;
  readonly registry: WorkerJobRegistry;
  readonly queueTriggers: readonly QueueTriggerConfig[];
  readonly triggerQueues: MessageQueue<unknown>[];
  readonly abortController: AbortController | null;
  readonly processJob: (
    message: JobMessage,
    queueContext?: MessageContext,
    context?: TracedMessageContext,
  ) => Promise<void>;
  setTaskQueue(queue: MessageQueue<TaskMessage> | null): void;
  reportListenerFailure(name: string, error: unknown, snapshot: WorkerListenerSnapshot): void;
  listenerMaxRestarts: number;
  listenerInitialBackoffMs: number;
  listenerMaxBackoffMs: number;
}

/** Resolve explicitly configured worker queue triggers without retaining caller-owned state. */
export function resolveWorkerQueueTriggers(
  queueTriggers: readonly QueueTriggerConfig[] | undefined,
): readonly QueueTriggerConfig[] {
  return Object.freeze([...(queueTriggers ?? [])]);
}
