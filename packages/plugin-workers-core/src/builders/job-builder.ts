import { DEFAULT_TOPIC } from '../domain/constants.ts';
import type { CronExpression } from '../domain/cron.ts';
import type { JobDefinition, JobHandler, JobId } from '../domain/mod.ts';
import type { PermissionPreset } from '../domain/permissions.ts';
import type { TaskPermissions } from '../domain/task.ts';

/** Job builder state used to gate `build()`. */
export type JobBuilderState = 'initial' | 'entrypoint-set' | 'handler-set';

/** Retry configuration options for job definitions. */
export type RetryOptions = Readonly<{
  backoff?: 'linear' | 'exponential';
  delayMs?: number;
  maxDelayMs?: number;
}>;

/** Execution retention settings for job definitions. */
export type JobRetentionOptions = Readonly<{
  archiveToDb?: boolean;
  kvDays?: number;
  dbDays?: number;
  maxExecutions?: number;
}>;

/** Typestate builder interface for job definitions. */
export interface JobBuilder<
  TId extends string,
  TConfigured extends JobBuilderState,
  TPayload,
  TResult,
> {
  /** Set the display name for this job. */
  name(value: string): this;
  /** Set the job description. */
  description(value: string): this;
  /** Set the module entrypoint that executes the job. */
  entrypoint(path: string): JobBuilder<TId, 'entrypoint-set', TPayload, TResult>;
  /** Set an in-process handler that executes the job. */
  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: JobHandler<TNextPayload, TNextResult>,
  ): JobBuilder<TId, 'handler-set', TNextPayload, TNextResult>;
  /** Narrow the payload type carried by this job definition. */
  payload<TNextPayload>(): JobBuilder<TId, TConfigured, TNextPayload, TResult>;
  /** Set the cron schedule expression for this job.
   * @deprecated Define recurring work with `defineScheduledTrigger(...).enqueueJob(...)`.
   */
  schedule(expression: CronExpression | string): this;
  /** Set the schedule timezone. */
  timezone(value: string): this;
  /** Set the execution timeout in milliseconds. */
  timeout(ms: number): this;
  /** Set retry count and optional retry behavior. */
  retry(maxRetries: number, options?: RetryOptions): this;
  /** Set execution permissions for this job. */
  permissions(perms: PermissionPreset | TaskPermissions): this;
  /** Add tags to this job definition. */
  tags(...tags: string[]): this;
  /** Merge metadata into this job definition. */
  metadata(data: Record<string, unknown>): this;
  /** Set execution retention policy for this job. */
  retention(options: JobRetentionOptions): this;
  /** Enable or disable this job definition. */
  enabled(value: boolean): this;
  /** Set the worker topic for this job. */
  topic(name: string): this;
  /** Set the queue trigger name for this job. */
  queueTrigger(name: string): this;
  /** Build the job definition after an entrypoint or handler has been configured. */
  build(): TConfigured extends 'entrypoint-set' | 'handler-set'
    ? JobDefinition<TId, TPayload, TResult>
    : never;
}

class JobBuilderImpl<
  TId extends string,
  TConfigured extends JobBuilderState,
  TPayload,
  TResult,
> implements JobBuilder<TId, TConfigured, TPayload, TResult> {
  readonly #id: TId;
  #name?: string;
  #description?: string;
  #entrypoint?: string;
  #handler?: JobHandler<TPayload, TResult>;
  #schedule: string | undefined;
  #timezone = 'UTC';
  #timeout = 300_000;
  #maxRetries = 3;
  #permissions?: PermissionPreset | TaskPermissions;
  #tags: string[] = [];
  #metadata: Record<string, unknown> = {};
  #retention?: Record<string, unknown>;
  #enabled = true;
  #topic = DEFAULT_TOPIC;
  #queueTrigger?: string;

  constructor(id: TId) {
    this.#id = id;
  }

  name(value: string): this {
    this.#name = value;
    return this;
  }

  description(value: string): this {
    this.#description = value;
    return this;
  }

  entrypoint(path: string): JobBuilder<TId, 'entrypoint-set', TPayload, TResult> {
    this.#entrypoint = path;
    return this as unknown as JobBuilder<TId, 'entrypoint-set', TPayload, TResult>;
  }

  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: JobHandler<TNextPayload, TNextResult>,
  ): JobBuilder<TId, 'handler-set', TNextPayload, TNextResult> {
    this.#handler = fn as unknown as JobHandler<TPayload, TResult>;
    return this as unknown as JobBuilder<TId, 'handler-set', TNextPayload, TNextResult>;
  }

  payload<TNextPayload>(): JobBuilder<TId, TConfigured, TNextPayload, TResult> {
    return this as unknown as JobBuilder<TId, TConfigured, TNextPayload, TResult>;
  }

  /** @deprecated Define recurring work with `defineScheduledTrigger(...).enqueueJob(...)`. */
  schedule(expression: CronExpression | string): this {
    this.#schedule = expression;
    return this;
  }

  timezone(value: string): this {
    this.#timezone = value;
    return this;
  }

  timeout(ms: number): this {
    this.#timeout = ms;
    return this;
  }

  retry(maxRetries: number, options?: RetryOptions): this {
    this.#maxRetries = maxRetries;
    if (options) this.metadata({ retry: options });
    return this;
  }

  permissions(perms: PermissionPreset | TaskPermissions): this {
    this.#permissions = perms;
    return this;
  }

  tags(...tags: string[]): this {
    this.#tags = [...new Set([...this.#tags, ...tags])];
    return this;
  }

  metadata(data: Record<string, unknown>): this {
    this.#metadata = { ...this.#metadata, ...data };
    return this;
  }

  retention(options: JobRetentionOptions): this {
    this.#retention = {
      archiveToDb: options.archiveToDb,
      kvRetentionDays: options.kvDays,
      dbRetentionDays: options.dbDays,
      maxExecutions: options.maxExecutions,
    };
    return this;
  }

  enabled(value: boolean): this {
    this.#enabled = value;
    return this;
  }

  topic(name: string): this {
    this.#topic = name;
    return this;
  }

  queueTrigger(name: string): this {
    this.#queueTrigger = name;
    return this;
  }

  build(): TConfigured extends 'entrypoint-set' | 'handler-set'
    ? JobDefinition<TId, TPayload, TResult>
    : never {
    if (!this.#entrypoint && !this.#handler) {
      throw new Error(`Job "${this.#id}" requires an entrypoint or handler before build().`);
    }

    const metadata = this.#queueTrigger
      ? { ...this.#metadata, queueTrigger: this.#queueTrigger }
      : this.#metadata;
    const definition = Object.freeze({
      id: this.#id as JobId<TId>,
      topic: this.#topic,
      name: this.#name ?? this.#id,
      description: this.#description,
      entrypoint: this.#entrypoint,
      schedule: this.#schedule,
      timezone: this.#timezone,
      timeout: this.#timeout,
      maxRetries: this.#maxRetries,
      priority: 50,
      enabled: this.#enabled,
      tags: this.#tags,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      source: 'local',
      executionType: 'deno',
      retryDelay: 1000,
      maxConcurrency: 1,
      persist: true,
      permissions: this.#permissions,
      retention: this.#retention,
      handler: this.#handler,
    }) as unknown as JobDefinition<TId, TPayload, TResult>;

    return definition as TConfigured extends 'entrypoint-set' | 'handler-set'
      ? JobDefinition<TId, TPayload, TResult>
      : never;
  }
}

/** Start a worker job definition chain. */
export function defineJob<TId extends string>(
  id: TId,
): JobBuilder<TId, 'initial', unknown, unknown> {
  return new JobBuilderImpl<TId, 'initial', unknown, unknown>(id);
}
