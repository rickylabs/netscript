import {
  createDefaultJobDeadLetterStore,
  type JobDeadLetterStorePort,
} from './job-dead-letters.ts';
/**
 * Worker process for the NetScript workers plugin.
 *
 * @module
 */

import { ChildHealthMonitor, type ChildHealthSnapshot } from '@netscript/plugin/health';
import {
  drainWorker,
  resolveWorkerDrainBudget,
  type WorkerDrainOptions,
  type WorkerLifecycleState,
} from '@netscript/plugin-workers-core/shutdown';
import { createQueue, type MessageContext, type MessageQueue } from '@netscript/queue';
import type { JobRunnerClock, WorkerIdempotencyPort } from '@netscript/plugin-workers-core/runtime';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { createWorkerPool, type WorkerPool } from './job-runner-pool.ts';
import { startWorkerSpan, type TracedMessageContext } from '@netscript/telemetry/instrumentation';
import { describeTelemetryConfig, isTelemetryEnabled } from '@netscript/telemetry/config';
import { WorkerAttributes } from '@netscript/telemetry/attributes';
import type { Span } from '@netscript/telemetry/tracer';
import { processWorkerJob } from './job-dispatcher.ts';
import {
  resolveListenerHealthyResetMs,
  type WorkerListenerSnapshot,
  WorkerListenerSupervisor,
} from './listener-supervisor.ts';
export type { WorkerListenerFailureCause } from './listener-supervisor.ts';
import { startQueueTriggerListeners, startTaskQueueListener } from './queue-consumer.ts';
import {
  type JobExecutionContext,
  type QueueTriggerConfig,
  resolveWorkerQueueTriggers,
  type WorkerDispatchContext,
  type WorkerExecutionState,
  type WorkerHealthStatus,
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
  WorkerHealthStatus,
  WorkerJobRegistry,
  WorkerOptions,
  WorkerPayloadSchema,
  WorkerTaskExecutor,
  WorkerTaskRegistry,
  WorkerTaskResult,
} from './worker-options.ts';

/** Worker process that consumes queued jobs and tasks for one runtime instance. */
export class Worker {
  /** Durable terminal job store; also supports listing and controlled reprocessing. */
  readonly deadLetters: JobDeadLetterStorePort;
  private readonly workerId: string;
  private readonly queueName: string;
  private readonly concurrency: number;
  private readonly registry: WorkerJobRegistry;
  private readonly executionState: WorkerExecutionState;
  private readonly taskExecutor: WorkerTaskExecutor;
  private readonly taskRegistry: WorkerTaskRegistry;
  private readonly idempotency: WorkerIdempotencyPort;
  private readonly workerPool: WorkerPool;
  private readonly retryClock?: JobRunnerClock;
  private readonly jobsDir: string;
  private readonly queueTriggers: readonly QueueTriggerConfig[];
  private readonly listenerMaxRestarts: number;
  private readonly listenerHealthyResetMs: number;
  private readonly listenerInitialBackoffMs: number;
  private readonly listenerMaxBackoffMs: number;
  private readonly triggerQueues: MessageQueue<unknown>[] = [];
  private readonly listenerSupervisors: WorkerListenerSupervisor[] = [];
  private readonly activeJobs = new Map<string, JobExecutionContext>();
  private readonly suppliedQueue?: MessageQueue<JobMessage>;
  private readonly suppliedTaskQueue?: MessageQueue<TaskMessage>;
  private queue: MessageQueue<JobMessage> | null = null;
  private taskQueue: MessageQueue<TaskMessage> | null = null;
  private lifecycle: WorkerLifecycleState = 'idle';
  private startup: Promise<void> = Promise.resolve();
  private readonly drainOptions: WorkerDrainOptions;
  private readonly childHealth = new ChildHealthMonitor();
  private stoppedListeners: readonly WorkerListenerSnapshot[] = [];
  private stopCompletion: Promise<void> | null = null;
  private abortController: AbortController | null = null;
  private workerSpan: Span | null = null;

  /** Create a worker with queue, registry, execution, and task runtime dependencies. */
  constructor(options: WorkerOptions) {
    const budget = resolveWorkerDrainBudget({
      ...options,
      abortGracePeriodMs: options.abortGracePeriodMs ??
        options.workerPoolOptions?.abortGracePeriodMs,
    });
    this.drainOptions = {
      drainTimeoutMs: budget.totalMs,
      abortGracePeriodMs: budget.abortGracePeriodMs,
      drainClock: options.drainClock,
    };
    this.listenerHealthyResetMs = resolveListenerHealthyResetMs(options.listenerHealthyResetMs);
    this.workerId = options.workerId;
    this.queueName = options.queueName ?? 'jobs';
    this.deadLetters = options.deadLetters ?? createDefaultJobDeadLetterStore(this.queueName);
    this.suppliedQueue = options.queue;
    this.suppliedTaskQueue = options.taskQueue;
    this.queue = options.queue ?? null;
    this.taskQueue = options.taskQueue ?? null;
    this.concurrency = options.concurrency ?? 1;
    this.registry = options.registry;
    this.executionState = options.executionState;
    this.taskExecutor = options.taskExecutor;
    this.taskRegistry = options.taskRegistry;
    this.idempotency = options.idempotency;
    this.retryClock = options.retryClock;
    this.jobsDir = options.jobsDir ?? './jobs';
    this.queueTriggers = resolveWorkerQueueTriggers(options.queueTriggers);
    this.listenerMaxRestarts = options.listenerMaxRestarts ?? 3;
    this.listenerInitialBackoffMs = options.listenerInitialBackoffMs ?? 100;
    this.listenerMaxBackoffMs = options.listenerMaxBackoffMs ?? 5_000;
    this.workerPool = createWorkerPool({
      poolSize: this.concurrency,
      ...options.workerPoolOptions,
      workerUrl: options.workerUrl,
      abortGracePeriodMs: budget.abortGracePeriodMs,
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

  /** Whether the runtime is alive, including paused or draining work. */
  get isRunning(): boolean {
    return this.lifecycle === 'running' || this.lifecycle === 'paused' ||
      this.lifecycle === 'draining';
  }

  /** Whether intake was intentionally paused. */
  get isPaused(): boolean {
    return this.lifecycle === 'paused';
  }

  /** Stop intake immediately; admitted jobs and tasks continue on their own signals. */
  pause(): void {
    if (this.lifecycle !== 'running') return;
    this.lifecycle = 'paused';
    for (const listener of this.listenerSupervisors) void listener.pause().catch(() => {});
  }

  /** Resume once the previous intake generation has joined its admitted work. */
  resume(): void {
    if (this.lifecycle !== 'paused') return;
    this.lifecycle = 'running';
    for (const listener of this.listenerSupervisors) listener.resume();
  }

  /** Number of active job executions. */
  get activeJobCount(): number {
    return this.activeJobs.size;
  }

  /** Current listener health for runtime liveness checks. */
  get healthStatus(): WorkerHealthStatus {
    const listeners = this.listenerSupervisors.length > 0
      ? this.listenerSupervisors.map((supervisor) => supervisor.snapshot())
      : this.stoppedListeners;
    const base = this.childHealth.snapshot();
    const unhealthy =
      listeners.find((listener) => listener.childHealth.state === 'crash-looping') ??
        listeners.find((listener) => listener.childHealth.state === 'failed') ??
        listeners.find((listener) => !listener.healthy);
    const latestIncident = listeners.reduce<ChildHealthSnapshot['lastFatalError']>(
      (latest, listener) => {
        const incident = listener.childHealth.lastFatalError;
        return incident && (!latest || incident.timestamp > latest.timestamp) ? incident : latest;
      },
      base.lastFatalError,
    );
    const childHealth: ChildHealthSnapshot = Object.freeze({
      ...base,
      state: unhealthy?.childHealth.state ?? base.state,
      dependencyReady: base.dependencyReady && listeners.every((listener) => listener.healthy),
      restartCount: listeners.reduce((count, listener) => count + listener.restartCount, 0),
      lastFatalError: latestIncident,
    });
    return {
      status: childHealth.state === 'ready' ? 'healthy' : 'degraded',
      lifecycle: this.lifecycle,
      childHealth,
      listeners,
    };
  }

  /** Read current durable DLQ depth; a storage outage makes dependency health unavailable. */
  async readHealthStatus(): Promise<WorkerHealthStatus> {
    try {
      const depth = await this.deadLetters.depth();
      return { ...this.healthStatus, deadLetters: { available: true, depth } };
    } catch {
      const health = this.healthStatus;
      return {
        ...health,
        status: 'degraded',
        childHealth: { ...health.childHealth, dependencyReady: false },
        deadLetters: { available: false, depth: null },
      };
    }
  }

  /** Start this instance until stopped or its job listener exhausts recovery. */
  async start(): Promise<void> {
    if (this.isRunning) return;
    if (this.lifecycle === 'stopped') {
      throw new Error('A stopped Worker cannot be restarted; create a replacement.');
    }
    this.lifecycle = 'running';
    this.childHealth.registryLoaded();
    this.abortController = new AbortController();
    const initialized = Promise.withResolvers<void>();
    this.startup = initialized.promise;
    let jobListener: WorkerListenerSupervisor | undefined;
    let failure: { error: unknown } | undefined;
    try {
      await this.workerPool.initialize();
      if (!this.canStartListeners()) return;
      this.workerSpan = startWorkerSpan({
        workerId: this.workerId,
        queueName: this.queueName,
        concurrency: this.concurrency,
      });
      this.queue ??= this.suppliedQueue ?? createQueue<JobMessage>(this.queueName);
      const triggers = await startQueueTriggerListeners(this.queueContext());
      if (!this.canStartListeners()) {
        await Promise.all(triggers.map((listener) => listener.stop()));
        return;
      }
      this.listenerSupervisors.push(...triggers);
      this.listenerSupervisors.push(
        startTaskQueueListener(this.queueContext(), this.dispatchContext()),
      );
      jobListener = new WorkerListenerSupervisor({
        name: `jobs:${this.queueName}`,
        abortSignal: this.abortController.signal,
        maxRestarts: this.listenerMaxRestarts,
        healthyResetMs: this.listenerHealthyResetMs,
        initialBackoffMs: this.listenerInitialBackoffMs,
        maxBackoffMs: this.listenerMaxBackoffMs,
        run: (signal) => this.listenForJobs(signal),
        onFailure: (error, snapshot) => this.reportListenerFailure(snapshot.name, error, snapshot),
      });
      this.listenerSupervisors.push(jobListener);
      jobListener.start();
      if (this.isPaused) {
        for (const listener of this.listenerSupervisors) void listener.pause().catch(() => {});
      }
      this.childHealth.dependenciesReady();
      this.childHealth.running();
    } catch (error) {
      failure = { error };
      this.childHealth.failed();
    } finally {
      initialized.resolve();
    }
    if (failure) {
      await this.stop();
      throw failure.error;
    }
    await jobListener?.completion;
    if (jobListener?.snapshot().status === 'failed') await this.stop();
    else if (this.stopCompletion) await this.stopCompletion;
  }

  /** Request cancellation of an active local execution; first cause wins. */
  cancel(executionId: string): boolean {
    const execution = this.activeJobs.get(executionId);
    if (!execution || execution.abortController.signal.aborted) return false;
    execution.abortController.abort(new DOMException('Job cancellation requested.', 'AbortError'));
    return true;
  }

  /** Wait for admitted work, then cancel leftovers and settle within one total budget. */
  stop(): Promise<void> {
    if (this.stopCompletion) return this.stopCompletion;
    if (!this.isRunning && !this.hasRuntimeResources()) {
      this.lifecycle = 'stopped';
      return this.stopCompletion = Promise.resolve();
    }
    this.lifecycle = 'draining';
    const completion = Promise.withResolvers<void>();
    this.stopCompletion = completion.promise;
    void this.drain().then(completion.resolve, completion.reject);
    return completion.promise;
  }

  /** One bounded shutdown; resource references remain owned even after a timeout. */
  private async drain(): Promise<void> {
    let intake = Promise.resolve();
    try {
      await drainWorker(this.drainOptions, {
        pauseIntake: () => {
          intake = this.startup.then(async () => {
            await Promise.all(this.listenerSupervisors.map((listener) => listener.pause()));
          });
          return intake;
        },
        abort: () =>
          this.abortController?.abort(new DOMException('Worker shutdown began.', 'ShutdownError')),
        abortCompleted: async () => {
          await Promise.all([intake, this.workerPool.shutdown()]);
        },
        close: async () => {
          const listeners = [...this.listenerSupervisors];
          const queues = new Set([...this.triggerQueues, this.queue, this.taskQueue]);
          try {
            await Promise.all(listeners.map((listener) => listener.stop()));
          } finally {
            await Promise.all([...queues].map((queue) => queue?.stop()));
          }
          this.stoppedListeners = listeners.map((listener) => listener.snapshot());
        },
      });
    } finally {
      this.listenerSupervisors.length = 0;
      this.triggerQueues.length = 0;
      this.childHealth.stopped();
      this.lifecycle = 'stopped';
      this.workerSpan?.setAttribute(WorkerAttributes.WORKER_ACTIVE_JOBS, 0);
      this.workerSpan?.addEvent('worker.stopped');
      this.workerSpan?.end();
      this.workerSpan = null;
      this.abortController = null;
      this.queue = null;
      this.taskQueue = null;
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
          if (!await this.admit(context)) return;
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
            throw error;
          }
        },
        { signal, concurrency: this.concurrency, drainTimeoutMs: Infinity },
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`[Worker ${this.workerId}] Stopped gracefully`);
      } else {
        throw error;
      }
    }
  }

  /** Never admit a new execution after a pause/drain boundary. */
  private async admit(delivery: MessageContext): Promise<boolean> {
    if (this.lifecycle === 'running') return true;
    await delivery.nack({
      requeue: true,
      ...(this.lifecycle === 'draining' || this.lifecycle === 'stopped'
        ? { preserveDeliveryCount: true }
        : {}),
    });
    return false;
  }

  /** Startup continuations may not allocate listeners after stop was requested. */
  private canStartListeners(): boolean {
    return this.lifecycle === 'running' || this.lifecycle === 'paused';
  }

  /** Build the dependency context used by job dispatchers. */
  private dispatchContext(): WorkerDispatchContext {
    return {
      workerId: this.workerId,
      deadLetters: this.deadLetters,
      queueName: this.queueName,
      concurrency: this.concurrency,
      registry: this.registry,
      executionState: this.executionState,
      taskExecutor: this.taskExecutor,
      taskRegistry: this.taskRegistry,
      idempotency: this.idempotency,
      workerPool: this.workerPool,
      jobsDir: this.jobsDir,
      activeJobs: this.activeJobs,
      workerSpan: this.workerSpan,
      shutdownSignal: this.abortController?.signal,
      retryClock: this.retryClock,
    };
  }

  /** Build the dependency context used by queue listeners. */
  private queueContext(): WorkerQueueContext {
    return {
      workerId: this.workerId,
      registry: this.registry,
      queueTriggers: this.queueTriggers,
      triggerQueues: this.triggerQueues,
      canConsume: (delivery) => this.admit(delivery),
      abortController: this.abortController,
      taskQueue: this.suppliedTaskQueue,
      listenerMaxRestarts: this.listenerMaxRestarts,
      listenerHealthyResetMs: this.listenerHealthyResetMs,
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
