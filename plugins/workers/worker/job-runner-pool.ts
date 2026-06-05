import {
  InProcessJobRunner,
  type JobDefinition,
  type JobMessage,
  type JobResult,
  type StaticJobRegistry,
} from '@netscript/plugin-workers-core/runtime';

/** Options for the plugin-layer in-process job runner pool. */
export type WorkerPoolOptions = Readonly<{
  poolSize?: number;
  registry?: StaticJobRegistry;
  workerUrl?: string;
}>;

/** Callback for job progress reports. */
export type ProgressCallback = (
  jobId: string,
  executionId: string,
  percent: number,
  message?: string,
) => void;

/** Plugin-layer job runner pool. */
export class WorkerPool {
  readonly #runner: InProcessJobRunner;
  #onProgress?: ProgressCallback;
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

  setProgressCallback(callback: ProgressCallback): void {
    this.#onProgress = callback;
  }

  async executeJob(
    message: JobMessage,
    jobDef: JobDefinition,
  ): Promise<JobResult<unknown>> {
    if (!this.#initialized) {
      throw new Error('WorkerPool not initialized. Call initialize() first.');
    }
    const executionId = crypto.randomUUID();
    return await this.#runner.dispatch(jobDef, {
      id: jobDef.id,
      job: jobDef,
      payload: message.payload,
      correlationId: message.correlationId,
      traceparent: message.traceparent,
      tracestate: message.tracestate,
      reportProgress: (percent, progressMessage) => {
        this.#onProgress?.(message.jobId, executionId, percent, progressMessage);
      },
    });
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
