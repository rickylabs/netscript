import {
  InProcessJobRunner,
  type JobDefinition,
  type JobMessage,
  type JobResult,
  type StaticJobRegistry,
  type WorkerOutboundMessage,
} from '@netscript/plugin-workers-core/runtime';

/** Options for the plugin-layer in-process job runner pool. */
export type WorkerPoolOptions = Readonly<{
  /** @deprecated The current runner is in-process and does not allocate a thread pool. */
  poolSize?: number;
  registry?: StaticJobRegistry;
  /** @deprecated The current runner is in-process and does not load a worker entry point. */
  workerUrl?: string;
}>;

type ProgressSink = (
  percent: number,
  message?: string,
) => Promise<void>;

/** Plugin-layer job runner pool. */
export class WorkerPool {
  readonly #runner: InProcessJobRunner;
  #initialized = false;

  constructor(options: WorkerPoolOptions = {}) {
    this.#runner = new InProcessJobRunner({
      fallbackToDynamicImport: true,
      registry: options.registry,
    });
  }

  initialize(): Promise<void> {
    this.#initialized = true;
    return Promise.resolve();
  }

  async executeJob(
    message: JobMessage,
    jobDef: JobDefinition,
    executionId: string,
    progressSink: ProgressSink,
  ): Promise<JobResult<unknown>> {
    if (!this.#initialized) {
      throw new Error('WorkerPool not initialized. Call initialize() first.');
    }
    let progressTail: Promise<void> = Promise.resolve();
    let progressFailure: Readonly<{ error: unknown }> | undefined;

    const consumeOutbound = (
      outbound: WorkerOutboundMessage,
    ): Promise<JobResult<unknown> | undefined> => {
      switch (outbound.type) {
        case 'progress': {
          progressTail = progressTail.then(async () => {
            if (progressFailure) return;
            try {
              await progressSink(outbound.percent, outbound.message);
            } catch (error) {
              progressFailure = { error };
            }
          });
          const reported = progressTail.then(() => {
            if (progressFailure) throw progressFailure.error;
            return undefined;
          });
          // A handler may omit `await`; terminal drain still observes the failure.
          void reported.catch(() => undefined);
          return reported;
        }
        case 'complete':
          return progressTail.then(() => {
            if (progressFailure) throw progressFailure.error;
            return outbound.result;
          });
        case 'error':
          return progressTail.then(() => {
            if (progressFailure) throw progressFailure.error;
            return outbound.data === undefined
              ? { success: false, error: outbound.error }
              : { success: false, error: outbound.error, data: outbound.data };
          });
        case 'log':
          console[outbound.level](outbound.message, outbound.data ?? '');
          return Promise.resolve(undefined);
      }

      const exhaustive: never = outbound;
      return Promise.reject(
        new Error(`Unsupported worker outbound message: ${String(exhaustive)}`),
      );
    };

    const startedAt = performance.now();
    const result = await this.#runner.dispatch(jobDef, {
      id: jobDef.id,
      job: jobDef,
      payload: message.payload,
      correlationId: message.correlationId,
      traceparent: message.traceparent,
      tracestate: message.tracestate,
      reportProgress: (percent, progressMessage) => {
        const reported = consumeOutbound({
          type: 'progress',
          executionId,
          jobId: message.jobId,
          percent,
          message: progressMessage,
        }).then(() => undefined);
        void reported.catch(() => undefined);
        return reported;
      },
    });

    const duration = performance.now() - startedAt;
    if (result.success) {
      const terminal = await consumeOutbound({
        type: 'complete',
        executionId,
        jobId: message.jobId,
        result,
        duration,
      });
      return terminal!;
    }

    const terminal = await consumeOutbound({
      type: 'error',
      executionId,
      jobId: message.jobId,
      error: result.error,
      data: result.data,
      duration,
    });
    return terminal!;
  }

  shutdown(): Promise<void> {
    this.#initialized = false;
    return this.#runner.stop('worker-pool shutdown');
  }
}

/** Create a plugin-layer job runner pool. */
export function createWorkerPool(options?: WorkerPoolOptions): WorkerPool {
  return new WorkerPool(options);
}
