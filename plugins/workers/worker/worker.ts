/**
 * Worker process for the NetScript workers plugin.
 *
 * @module
 */

import { delay } from '@std/async';
import { createQueue, type MessageQueue } from '@netscript/queue';
import type { WorkerIdempotencyPort } from '@netscript/plugin-workers-core/runtime';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { createWorkerPool, type WorkerPool } from './job-runner-pool.ts';
import {
  startWorkerSpan,
  type TracedMessageContext,
  type TracedQueue,
} from '@netscript/telemetry/instrumentation';
import { describeTelemetryConfig, isTelemetryEnabled } from '@netscript/telemetry/config';
import { WorkerAttributes } from '@netscript/telemetry/attributes';
import type { Span } from '@netscript/telemetry/tracer';
import { processWorkerJob } from './job-dispatcher.ts';
import { type WorkerListenerSnapshot, WorkerListenerSupervisor } from './listener-supervisor.ts';
import { startQueueTriggerListeners, startTaskQueueListener } from './queue-consumer.ts';
import {
  type JobExecutionContext,
  type QueueTriggerConfig,
  resolveWorkerQueueTriggers,
  type WorkerDispatchContext,
  type WorkerExecutionState,
  type WorkerJobRegistry,
  type WorkerOptions,
  type WorkerQueueContext,
  type WorkerTaskExecutor,
  type WorkerTaskRegistry,
} from './worker-options.ts';

export type {
  QueueTriggerConfig,
  WorkerCompleteExecutionOptions,
  WorkerCreateExecutionOptions,
  WorkerExecutionRecord,
  WorkerExecutionState,
  WorkerJobRegistry,
  WorkerOptions,
  WorkerPayloadSchema,
  WorkerTaskExecutor,
  WorkerTaskRegistry,
  WorkerTaskResult,
} from './worker-options.ts';

/** Health snapshot for a worker runtime. */
export interface WorkerHealthStatus {
  /** Aggregate worker health state. */
  readonly status: 'healthy' | 'degraded';
  /** Queue listener health snapshots. */
  readonly listeners: readonly {
    /** Listener name. */
    readonly name: string;
    /** Listener lifecycle status. */
    readonly status: 'idle' | 'running' | 'restarting' | 'failed' | 'stopped';
    /** Whether the listener is healthy. */
    readonly healthy: boolean;
    /** Number of restart attempts. */
    readonly restartCount: number;
    /** Last listener failure message. */
    readonly lastError?: string;
  }[];
}

/** Worker process that consumes queued jobs and tasks for one runtime instance. */
export class Worker {
  private readonly workerId: string;
  private readonly queueName: string;
  private readonly concurrency: number;
  private readonly registry: WorkerJobRegistry;
  private readonly executionState: WorkerExecutionState;
  private readonly taskExecutor: WorkerTaskExecutor;
  private readonly taskRegistry: WorkerTaskRegistry;
  private readonly idempotency: WorkerIdempotencyPort;
  private readonly workerPool: WorkerPool;
  private readonly jobsDir: string;
  private readonly queueTriggers: readonly QueueTriggerConfig[];
  private readonly listenerMaxRestarts: number;
  private readonly listenerInitialBackoffMs: number;
  private readonly listenerMaxBackoffMs: number;
  private readonly triggerQueues: MessageQueue<unknown>[] = [];
  private readonly listenerSupervisors: WorkerListenerSupervisor[] = [];
  private readonly activeJobs = new Map<string, JobExecutionContext>();
  private queue: TracedQueue<JobMessage> | null = null;
  private taskQueue: MessageQueue<TaskMessage> | null = null;
  private running = false;
  private stopping = false;
  private abortController: AbortController | null = null;
  private workerSpan: Span | null = null;

  /** Create a worker with queue, registry, execution, and task runtime dependencies. */
  constructor(options: WorkerOptions) {
    this.workerId = options.workerId;
    this.queueName = options.queueName ?? 'jobs';
    this.concurrency = options.concurrency ?? 1;
    this.registry = options.registry;
    this.executionState = options.executionState;
    this.taskExecutor = options.taskExecutor;
    this.taskRegistry = options.taskRegistry;
    this.idempotency = options.idempotency;
    this.jobsDir = options.jobsDir ?? './jobs';
    this.queueTriggers = resolveWorkerQueueTriggers(options.queueTriggers);
    this.listenerMaxRestarts = options.listenerMaxRestarts ?? 3;
    this.listenerInitialBackoffMs = options.listenerInitialBackoffMs ?? 100;
    this.listenerMaxBackoffMs = options.listenerMaxBackoffMs ?? 5_000;
    this.workerPool = createWorkerPool({
      poolSize: this.concurrency,
      ...options.workerPoolOptions,
      workerUrl: options.workerUrl,
    });

    if (isTelemetryEnabled()) {
      console.log(JSON.stringify({
        prefix: `Worker ${this.workerId} OpenTelemetry`,
        ...describeTelemetryConfig(),
      }));
    }
  }

  /** Worker identifier. */
  get id(): string {
    return this.workerId;
  }

  /** Whether the worker is currently consuming queues. */
  get isRunning(): boolean {
    return this.running;
  }

  /** Number of active job executions. */
  get activeJobCount(): number {
    return this.activeJobs.size;
  }

  /** Current listener health for runtime liveness checks. */
  get healthStatus(): WorkerHealthStatus {
    const listeners = this.listenerSupervisors.map((supervisor) => supervisor.snapshot());
    return {
      status: listeners.some((listener) => !listener.healthy) ? 'degraded' : 'healthy',
      listeners,
    };
  }

  /** Start queue consumption for this worker instance. */
  async start(): Promise<void> {
    if (this.running) {
      console.warn(`[Worker ${this.workerId}] Already running`);
      return;
    }

    console.log(
      `[Worker ${this.workerId}] Starting with Web Worker pool (${this.concurrency} workers)...`,
    );

    this.running = true;
    this.abortController = new AbortController();
    await this.workerPool.initialize();

    this.workerPool.setProgressCallback((jobId, _executionId, percent, message) => {
      console.log(
        `[Worker ${this.workerId}] Job '${jobId}' progress: ${percent}%${
          message ? ` - ${message}` : ''
        }`,
      );
    });

    this.workerSpan = startWorkerSpan({
      workerId: this.workerId,
      queueName: this.queueName,
      concurrency: this.concurrency,
    });

    this.queue = createQueue<JobMessage>(this.queueName) as TracedQueue<JobMessage>;

    this.listenerSupervisors.push(...await startQueueTriggerListeners(this.queueContext()));
    this.listenerSupervisors.push(
      startTaskQueueListener(this.queueContext(), this.dispatchContext()),
    );

    const jobListener = new WorkerListenerSupervisor({
      name: `jobs:${this.queueName}`,
      abortSignal: this.abortController.signal,
      maxRestarts: this.listenerMaxRestarts,
      initialBackoffMs: this.listenerInitialBackoffMs,
      maxBackoffMs: this.listenerMaxBackoffMs,
      run: (signal) => this.listenForJobs(signal),
      onFailure: (error, snapshot) => this.reportListenerFailure(snapshot.name, error, snapshot),
    });
    this.listenerSupervisors.push(jobListener);
    jobListener.start();

    try {
      await jobListener.completion;
    } finally {
      if (jobListener.snapshot().status === 'failed') {
        await this.stop();
      } else {
        this.running = false;
      }
    }
  }

  /** Stop the worker and wait briefly for active jobs to finish. */
  async stop(): Promise<void> {
    if (this.stopping) {
      return;
    }
    if (!this.running && !this.hasRuntimeResources()) {
      return;
    }

    this.stopping = true;
    console.log(`[Worker ${this.workerId}] Stopping...`);
    try {
      this.abortController?.abort();
      await Promise.all(this.listenerSupervisors.map((supervisor) => supervisor.stop()));
      this.listenerSupervisors.length = 0;
      await this.stopTriggerQueues();
      await this.waitForActiveJobs();

      if (this.queue) {
        await this.queue.stop();
        this.queue = null;
      }
      if (this.taskQueue) {
        await this.taskQueue.stop();
        this.taskQueue = null;
      }

      await this.workerPool.shutdown();
      this.workerSpan?.setAttribute(WorkerAttributes.WORKER_ACTIVE_JOBS, 0);
      this.workerSpan?.addEvent('worker.stopped');
      this.workerSpan?.end();
      this.workerSpan = null;
      this.abortController = null;
      this.running = false;
      console.log(`[Worker ${this.workerId}] Stopped`);
    } finally {
      this.stopping = false;
    }
  }

  /** Listen for job queue messages until the provided abort signal stops consumption. */
  private async listenForJobs(signal: AbortSignal): Promise<void> {
    if (!this.queue) {
      throw new TypeError('Worker queue is not initialized.');
    }

    try {
      await this.queue.listen(
        async (message, context) => {
          try {
            await processWorkerJob(
              this.dispatchContext(),
              message,
              context,
              context as TracedMessageContext,
            );
          } catch (error) {
            console.error(
              `[Worker ${this.workerId}] Unexpected error processing job '${message.jobId}':`,
              error instanceof Error ? error.message : String(error),
            );
          }
        },
        { signal },
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`[Worker ${this.workerId}] Stopped gracefully`);
      } else {
        throw error;
      }
    }
  }

  /** Stop all trigger queues owned by this worker instance. */
  private async stopTriggerQueues(): Promise<void> {
    for (const triggerQueue of this.triggerQueues) {
      try {
        await triggerQueue.stop();
      } catch (error) {
        console.error(`[Worker ${this.workerId}] Error stopping trigger queue:`, error);
      }
    }
    this.triggerQueues.length = 0;
  }

  /** Wait for active jobs to finish, cancelling them after the shutdown timeout. */
  private async waitForActiveJobs(): Promise<void> {
    const timeout = 30000;
    const startTime = Date.now();

    while (this.activeJobs.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn(`[Worker ${this.workerId}] Timeout waiting for jobs, forcing stop`);
        for (const [executionId, ctx] of this.activeJobs) {
          ctx.abortController.abort();
          await this.executionState.complete(executionId, {
            status: 'cancelled',
            error: 'Worker shutdown timeout',
          });
        }
        break;
      }
      await delay(100);
    }
  }

  /** Build the dependency context used by job dispatchers. */
  private dispatchContext(): WorkerDispatchContext {
    return {
      workerId: this.workerId,
      registry: this.registry,
      executionState: this.executionState,
      taskExecutor: this.taskExecutor,
      taskRegistry: this.taskRegistry,
      idempotency: this.idempotency,
      workerPool: this.workerPool,
      jobsDir: this.jobsDir,
      activeJobs: this.activeJobs,
      workerSpan: this.workerSpan,
    };
  }

  /** Build the dependency context used by queue listeners. */
  private queueContext(): WorkerQueueContext {
    return {
      workerId: this.workerId,
      registry: this.registry,
      queueTriggers: this.queueTriggers,
      triggerQueues: this.triggerQueues,
      abortController: this.abortController,
      listenerMaxRestarts: this.listenerMaxRestarts,
      listenerInitialBackoffMs: this.listenerInitialBackoffMs,
      listenerMaxBackoffMs: this.listenerMaxBackoffMs,
      processJob: (message, queueContext, context) =>
        processWorkerJob(this.dispatchContext(), message, queueContext, context),
      setTaskQueue: (queue) => {
        this.taskQueue = queue;
      },
      reportListenerFailure: (name, error, snapshot) =>
        this.reportListenerFailure(name, error, snapshot),
    };
  }

  /** Return whether this worker still owns runtime resources that need cleanup. */
  private hasRuntimeResources(): boolean {
    return this.abortController !== null ||
      this.listenerSupervisors.length > 0 ||
      this.triggerQueues.length > 0 ||
      this.queue !== null ||
      this.taskQueue !== null ||
      this.workerSpan !== null;
  }

  /** Log listener restart or terminal failure details. */
  private reportListenerFailure(
    name: string,
    error: unknown,
    snapshot: WorkerListenerSnapshot,
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    const action = snapshot.status === 'failed' ? 'failed permanently' : 'will restart';
    console.error(
      `[Worker ${this.workerId}] Listener '${name}' ${action} after ${snapshot.restartCount} restart(s): ${message}`,
    );
  }
}
