import type {
  JobContext,
  JobDefinition,
  JobDispatcherOptions,
  JobHandler,
  JobModuleImporter,
  JobResolution,
  JobResult,
  StaticJobRegistry,
} from './runtime-types.ts';

export type {
  JobDispatcherOptions,
  JobModuleImporter,
  JobResolution,
  JobResolutionSource,
  StaticJobRegistry,
} from './runtime-types.ts';

/** Resolve job handlers from a static registry, definition, or explicit import fallback. */
export class InProcessJobDispatcher {
  readonly #registry?: StaticJobRegistry;
  readonly #fallbackToDynamicImport: boolean;
  readonly #importModule: JobModuleImporter;

  /** Create a dispatcher from explicit handler resolution options. */
  constructor(options: JobDispatcherOptions = {}) {
    this.#registry = options.registry;
    this.#fallbackToDynamicImport = options.fallbackToDynamicImport ?? false;
    this.#importModule = options.importModule ?? ((specifier) => import(specifier));
  }

  /** Resolve the handler for a job definition. */
  async resolve<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
  ): Promise<JobResolution<TPayload, TResult>> {
    const registered = this.#registry?.get(job.id);
    if (registered) {
      return Object.freeze({
        handler: registered as JobHandler<TPayload, TResult>,
        source: 'static-registry',
      });
    }

    if (job.handler) {
      return Object.freeze({ handler: job.handler, source: 'definition' });
    }

    if (!this.#fallbackToDynamicImport) {
      throw new Error(`Job ${job.id} has no static registry handler.`);
    }

    if (!job.entrypoint) {
      throw new Error(`Job ${job.id} has no entrypoint for dynamic import.`);
    }

    const module = await this.#importModule(job.sourceUrl ?? job.entrypoint);
    const handler = module.default ?? module.run;
    if (typeof handler !== 'function') {
      throw new Error(`Job ${job.id} module does not export a runnable handler.`);
    }

    return Object.freeze({
      handler: handler as JobHandler<TPayload, TResult>,
      source: 'dynamic-import',
    });
  }

  /** Dispatch a job to its resolved handler. */
  async dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    context: JobContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>> {
    const resolution = await this.resolve(job);
    return resolution.handler(context);
  }
}
