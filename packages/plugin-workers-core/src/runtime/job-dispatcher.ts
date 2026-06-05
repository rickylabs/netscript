import type { JobContext, JobDefinition, JobHandler, JobResult } from '../domain/mod.ts';

/** Registry of statically imported job handlers for compiled runtimes. */
export type StaticJobRegistry = ReadonlyMap<string, JobHandler>;

/** Dynamic module importer used only when explicitly enabled. */
export type JobModuleImporter = (specifier: string) => Promise<Readonly<Record<string, unknown>>>;

/** Handler resolution source used for diagnostics. */
export type JobResolutionSource = 'definition' | 'dynamic-import' | 'static-registry';

/** Result of resolving a job handler. */
export type JobResolution<TPayload = unknown, TResult = unknown> = Readonly<{
  handler: JobHandler<TPayload, TResult>;
  source: JobResolutionSource;
}>;

/** Options for resolving a job handler. */
export type JobDispatcherOptions = Readonly<{
  registry?: StaticJobRegistry;
  fallbackToDynamicImport?: boolean;
  importModule?: JobModuleImporter;
}>;

/** Resolve job handlers from a static registry, definition, or explicit import fallback. */
export class InProcessJobDispatcher {
  readonly #registry?: StaticJobRegistry;
  readonly #fallbackToDynamicImport: boolean;
  readonly #importModule: JobModuleImporter;

  constructor(options: JobDispatcherOptions = {}) {
    this.#registry = options.registry;
    this.#fallbackToDynamicImport = options.fallbackToDynamicImport ?? false;
    this.#importModule = options.importModule ?? ((specifier) => import(specifier));
  }

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

  async dispatch<TPayload, TResult>(
    job: JobDefinition<string, TPayload, TResult>,
    context: JobContext<TPayload, TResult>,
  ): Promise<JobResult<TResult>> {
    const resolution = await this.resolve(job);
    return resolution.handler(context);
  }
}
