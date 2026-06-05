import type { SagaId } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';

/** Typestate marker for the saga config builder. */
export type SagaConfigBuilderState = 'initial' | 'entrypoint-set';

/** Retry configuration stored in `netscript.config.ts` saga entries. */
export type SagaConfigRetryOptions = Readonly<{
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}>;

/** Timeout configuration stored in `netscript.config.ts` saga entries. */
export type SagaConfigTimeoutOptions = Readonly<{
  completionTimeout?: number;
  minTimeout: number;
  maxTimeout: number;
}>;

/** Config-time saga entry consumed by scaffolding and registry generation. */
export type SagaConfigEntry<TId extends string = string> = Readonly<{
  id: SagaId<TId>;
  entrypoint: string;
  name: string;
  description?: string;
  topic?: string;
  enabled: boolean;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
  timeout?: SagaConfigTimeoutOptions;
  retry?: SagaConfigRetryOptions;
}>;

/** Typestate builder for config-time saga entries. */
export interface SagaConfigBuilder<TId extends string, TState extends SagaConfigBuilderState> {
  /** Set the human-readable saga name. */
  name(value: string): this;
  /** Set the saga description. */
  description(value: string): this;
  /** Set the topic used for message routing. */
  topic(value: string): this;
  /** Set completion timeout in milliseconds. */
  timeout(ms: number): this;
  /** Set retry count and optional backoff behavior. */
  retry(maxAttempts: number, options?: Partial<SagaConfigRetryOptions>): this;
  /** Add tags for filtering and documentation. */
  tags(...values: readonly string[]): this;
  /** Merge metadata into the saga config entry. */
  metadata(value: Readonly<Record<string, unknown>>): this;
  /** Enable or disable this saga entry. */
  enabled(value: boolean): this;
  /** Disable this saga entry. */
  disabled(): this;
  /** Build after the entrypoint has been configured. */
  build(): TState extends 'entrypoint-set' ? SagaConfigEntry<TId> : never;
}

class SagaConfigBuilderImpl<TId extends string, TState extends SagaConfigBuilderState>
  implements SagaConfigBuilder<TId, TState> {
  readonly #id: TId;
  readonly #entrypoint: string;
  #name?: string;
  #description?: string;
  #topic?: string;
  #enabled = true;
  #tags: string[] = [];
  #metadata: Record<string, unknown> = {};
  #timeout?: SagaConfigTimeoutOptions;
  #retry?: SagaConfigRetryOptions;

  constructor(id: TId, entrypoint: string) {
    assertNonEmpty(id, 'Saga ID is required');
    assertNonEmpty(entrypoint, 'Saga entrypoint is required');
    this.#id = id.trim() as TId;
    this.#entrypoint = entrypoint.trim();
  }

  name(value: string): this {
    assertNonEmpty(value, 'Saga name must not be empty');
    this.#name = value.trim();
    return this;
  }

  description(value: string): this {
    assertNonEmpty(value, 'Saga description must not be empty');
    this.#description = value.trim();
    return this;
  }

  topic(value: string): this {
    assertNonEmpty(value, 'Saga topic must not be empty');
    this.#topic = value.trim();
    return this;
  }

  timeout(ms: number): this {
    if (!Number.isFinite(ms) || ms <= 0) {
      throw SagasError.validationFailed('Saga timeout must be a positive finite number.');
    }
    this.#timeout = Object.freeze({
      completionTimeout: ms,
      minTimeout: this.#timeout?.minTimeout ?? 1000,
      maxTimeout: this.#timeout?.maxTimeout ?? 7 * 24 * 60 * 60 * 1000,
    });
    return this;
  }

  retry(maxAttempts: number, options: Partial<SagaConfigRetryOptions> = {}): this {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 0) {
      throw SagasError.validationFailed('Saga retry maxAttempts must be a non-negative integer.');
    }
    this.#retry = Object.freeze({
      maxAttempts,
      initialDelay: options.initialDelay ?? 1000,
      maxDelay: options.maxDelay ?? 60000,
      backoffMultiplier: options.backoffMultiplier ?? 2,
      jitter: options.jitter ?? true,
    });
    return this;
  }

  tags(...values: readonly string[]): this {
    const tags = values.map((value) => value.trim()).filter((value) => value.length > 0);
    this.#tags = [...new Set([...this.#tags, ...tags])];
    return this;
  }

  metadata(value: Readonly<Record<string, unknown>>): this {
    this.#metadata = { ...this.#metadata, ...value };
    return this;
  }

  enabled(value: boolean): this {
    this.#enabled = value;
    return this;
  }

  disabled(): this {
    return this.enabled(false);
  }

  build(): TState extends 'entrypoint-set' ? SagaConfigEntry<TId> : never {
    const metadata = Object.keys(this.#metadata).length > 0
      ? Object.freeze({ ...this.#metadata })
      : undefined;
    const entry = Object.freeze({
      id: this.#id as SagaId<TId>,
      entrypoint: this.#entrypoint,
      name: this.#name ?? this.#id,
      description: this.#description,
      topic: this.#topic,
      enabled: this.#enabled,
      tags: this.#tags.length > 0 ? Object.freeze([...this.#tags]) : undefined,
      metadata,
      timeout: this.#timeout,
      retry: this.#retry,
    }) satisfies SagaConfigEntry<TId>;

    return entry as TState extends 'entrypoint-set' ? SagaConfigEntry<TId> : never;
  }
}

/** Define a config-time saga entry for `netscript.config.ts`. */
export function defineSagaConfig<TId extends string>(
  id: TId,
  entrypoint: string,
): SagaConfigBuilder<TId, 'entrypoint-set'> {
  return new SagaConfigBuilderImpl<TId, 'entrypoint-set'>(id, entrypoint);
}

function assertNonEmpty(value: string, message: string): void {
  if (value.trim().length === 0) {
    throw SagasError.validationFailed(message);
  }
}
