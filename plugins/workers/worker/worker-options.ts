import type { MessageQueue } from '@netscript/queue';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import type { TaskExecutor } from '@netscript/plugin-workers-core/executor';
import type { KvExecutionState } from '@netscript/plugin-workers-core/state';
import type { KvJobRegistry, KvTaskRegistry } from '@netscript/plugin-workers-core/registry';
import type { TracedMessageContext } from '@netscript/telemetry/instrumentation';
import type { Span } from '@netscript/telemetry/tracer';
import { z } from 'zod';
import type { WorkerPool, WorkerPoolOptions } from './job-runner-pool.ts';
import type { WorkerListenerSnapshot } from './listener-supervisor.ts';

/** Configuration for a queue that triggers a job when messages arrive. */
export interface QueueTriggerConfig {
  /** Queue name to listen to. */
  queueName: string;
  /** Job ID to trigger when messages arrive. */
  jobId: string;
  /** Optional Zod schema for message validation. */
  schema?: z.ZodSchema;
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
  registry: KvJobRegistry;
  /** Execution state instance. */
  executionState: KvExecutionState;
  /** Task executor instance. */
  taskExecutor: TaskExecutor;
  /** Task registry instance. */
  taskRegistry: KvTaskRegistry;
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
  readonly registry: KvJobRegistry;
  readonly executionState: KvExecutionState;
  readonly taskExecutor: TaskExecutor;
  readonly taskRegistry: KvTaskRegistry;
  readonly workerPool: WorkerPool;
  readonly jobsDir: string;
  readonly activeJobs: Map<string, JobExecutionContext>;
  readonly workerSpan: Span | null;
}

/** Context required by queue-consumer helpers. */
export interface WorkerQueueContext {
  readonly workerId: string;
  readonly registry: KvJobRegistry;
  readonly queueTriggers: readonly QueueTriggerConfig[];
  readonly triggerQueues: MessageQueue<unknown>[];
  readonly abortController: AbortController | null;
  readonly processJob: (
    message: JobMessage,
    context?: TracedMessageContext,
  ) => Promise<void>;
  setTaskQueue(queue: MessageQueue<TaskMessage> | null): void;
  reportListenerFailure(name: string, error: unknown, snapshot: WorkerListenerSnapshot): void;
  listenerMaxRestarts: number;
  listenerInitialBackoffMs: number;
  listenerMaxBackoffMs: number;
}

/** Queue notification payload used by the default export trigger. */
export const ExportNotificationSchema: z.ZodSchema = z.object({
  webhookPayload: z.object({
    exportId: z.string(),
    exportType: z.string(),
    filePath: z.string().optional(),
    fileName: z.string().optional(),
    recordCount: z.number().optional(),
    fileSize: z.number().optional(),
    exportedAt: z.string().optional(),
    triggeredBy: z.string().optional(),
    jobId: z.string().optional(),
    status: z.string().optional(),
    completedAt: z.string().optional(),
  }).passthrough(),
  webhookPath: z.string().optional(),
  _source: z.string().optional(),
});

/** Default queue triggers mapped to worker jobs. */
export const DEFAULT_QUEUE_TRIGGERS: readonly QueueTriggerConfig[] = Object.freeze([
  {
    queueName: 'export-notifications',
    jobId: 'notify-export-complete',
    schema: ExportNotificationSchema,
    concurrency: 2,
  },
]);
