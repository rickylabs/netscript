/**
 * The single concurrency environment contract for the workers background runtime.
 *
 * Every emitter (Aspire contribution, `scaffold.plugin.json`, adapter config params,
 * generated `.env`) names {@link WORKERS_CONCURRENCY_ENV}; the runtime entrypoints read it
 * through {@link resolveWorkersConcurrency}.
 *
 * @module
 */

/** Canonical env var naming the workers runtime job-execution pool size. */
export const WORKERS_CONCURRENCY_ENV = 'WORKERS_CONCURRENCY' as const;

/**
 * Singular name emitted by 0.0.7 and earlier metadata.
 *
 * @deprecated Read as an alias for {@link WORKERS_CONCURRENCY_ENV} during 0.0.8 only.
 */
export const DEPRECATED_WORKER_CONCURRENCY_ENV = 'WORKER_CONCURRENCY' as const;

/** Pool size used when neither env name is set. */
export const DEFAULT_WORKERS_CONCURRENCY = 1;

/** Ports used to resolve the workers pool size. */
export type ResolveWorkersConcurrencyOptions = Readonly<{
  /** Reads one environment variable; defaults to `Deno.env.get`. */
  readEnv?: (name: string) => string | undefined;
  /** Receives the deprecated-alias warning; defaults to a once-per-process `console.warn`. */
  warn?: (message: string) => void;
}>;

let deprecatedAliasWarned = false;

function warnOncePerProcess(message: string): void {
  if (deprecatedAliasWarned) return;
  deprecatedAliasWarned = true;
  console.warn(message);
}

function readEnvVar(readEnv: (name: string) => string | undefined, name: string) {
  const value = readEnv(name)?.trim();
  return value ? value : undefined;
}

function parsePoolSize(name: string, raw: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`[Workers Runtime] ${name} must be a positive integer, received "${raw}".`);
  }
  return value;
}

/**
 * Resolve the workers pool size from the environment.
 *
 * Reads {@link WORKERS_CONCURRENCY_ENV}; when it is unset, falls back to the deprecated
 * singular {@link DEPRECATED_WORKER_CONCURRENCY_ENV} and emits a deprecation warning, then to
 * {@link DEFAULT_WORKERS_CONCURRENCY}. A set value that is not a positive integer throws.
 *
 * @example
 * ```ts
 * import { resolveWorkersConcurrency } from './concurrency.ts';
 *
 * const concurrency = resolveWorkersConcurrency({
 *   readEnv: (name) => name === 'WORKERS_CONCURRENCY' ? '4' : undefined,
 * });
 * ```
 */
export function resolveWorkersConcurrency(
  options: ResolveWorkersConcurrencyOptions = {},
): number {
  const readEnv = options.readEnv ?? ((name: string) => Deno.env.get(name));
  const canonical = readEnvVar(readEnv, WORKERS_CONCURRENCY_ENV);
  if (canonical !== undefined) return parsePoolSize(WORKERS_CONCURRENCY_ENV, canonical);

  const alias = readEnvVar(readEnv, DEPRECATED_WORKER_CONCURRENCY_ENV);
  if (alias === undefined) return DEFAULT_WORKERS_CONCURRENCY;

  (options.warn ?? warnOncePerProcess)(
    `[Workers Runtime] ${DEPRECATED_WORKER_CONCURRENCY_ENV} is deprecated and is read only ` +
      `during 0.0.8; rename it to ${WORKERS_CONCURRENCY_ENV}.`,
  );
  return parsePoolSize(DEPRECATED_WORKER_CONCURRENCY_ENV, alias);
}
