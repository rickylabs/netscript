import { DEFAULT_TOPIC } from '../domain/constants.ts';
import type { CronExpression } from '../domain/cron.ts';
import type {
  JobDefinition as DomainJobDefinition,
  JobHandler as DomainJobHandler,
  JobId as DomainJobId,
  TaskPermissionsInput,
} from '../domain/mod.ts';
import type { BuilderPermissions, JobDefinition, JobHandler } from './builder-types.ts';

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
  payload<TNextPayload>(
    this: TConfigured extends 'handler-set' ? never
      : JobBuilder<TId, TConfigured, TPayload, TResult>,
  ): JobBuilder<TId, TConfigured, TNextPayload, TResult>;
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
  permissions(perms: BuilderPermissions): this;
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
  build(
    this: TConfigured extends 'entrypoint-set' | 'handler-set'
      ? JobBuilder<TId, TConfigured, TPayload, TResult>
      : never,
  ): JobDefinition<TId, TPayload, TResult>;
}

function mutablePermission(
  value: boolean | readonly string[] | undefined,
): boolean | string[] | undefined {
  if (typeof value === 'boolean' || value === undefined) return value;
  return [...value];
}

function toDomainPermissions(
  permissions: BuilderPermissions | undefined,
): TaskPermissionsInput | undefined {
  if (!permissions) return undefined;
  return {
    net: mutablePermission(permissions.net),
    read: mutablePermission(permissions.read),
    write: mutablePermission(permissions.write),
    env: mutablePermission(permissions.env),
    run: mutablePermission(permissions.run),
    ffi: permissions.ffi,
    import: permissions.import ? [...permissions.import] : undefined,
  };
}

type JobBuilderData<TId extends string, TPayload, TResult> = Readonly<{
  id: TId;
  name?: string;
  description?: string;
  entrypoint?: string;
  handler?: DomainJobHandler<TPayload, TResult>;
  schedule?: string;
  timezone: string;
  timeout: number;
  maxRetries: number;
  permissions?: BuilderPermissions;
  tags: readonly string[];
  metadata: Readonly<Record<string, unknown>>;
  retention?: Readonly<Record<string, unknown>>;
  enabled: boolean;
  topic: string;
  queueTrigger?: string;
}>;

class JobBuilderImpl<
  TId extends string,
  TConfigured extends JobBuilderState,
  TPayload,
  TResult,
> {
  readonly #data: JobBuilderData<TId, TPayload, TResult>;

  constructor(data: JobBuilderData<TId, TPayload, TResult>) {
    this.#data = data;
  }

  name(value: string): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, name: value });
  }

  description(value: string): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, description: value });
  }

  entrypoint(path: string): JobBuilder<TId, 'entrypoint-set', TPayload, TResult> {
    return new JobBuilderImpl<TId, 'entrypoint-set', TPayload, TResult>({
      ...this.#data,
      entrypoint: path,
    });
  }

  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: JobHandler<TNextPayload, TNextResult>,
  ): JobBuilder<TId, 'handler-set', TNextPayload, TNextResult> {
    const { handler: _previousHandler, ...data } = this.#data;
    return new JobBuilderImpl<TId, 'handler-set', TNextPayload, TNextResult>({
      ...data,
      handler: fn,
    });
  }

  payload<TNextPayload>(
    this: TConfigured extends 'handler-set' ? never
      : JobBuilderImpl<TId, TConfigured, TPayload, TResult>,
  ): JobBuilder<TId, TConfigured, TNextPayload, TResult> {
    const { handler: _handler, ...data } = this.#data;
    return new JobBuilderImpl<TId, TConfigured, TNextPayload, TResult>(data);
  }

  /** @deprecated Define recurring work with `defineScheduledTrigger(...).enqueueJob(...)`. */
  schedule(
    expression: CronExpression | string,
  ): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, schedule: expression });
  }

  timezone(value: string): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, timezone: value });
  }

  timeout(ms: number): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, timeout: ms });
  }

  retry(
    maxRetries: number,
    options?: RetryOptions,
  ): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({
      ...this.#data,
      maxRetries,
      metadata: options ? { ...this.#data.metadata, retry: options } : this.#data.metadata,
    });
  }

  permissions(perms: BuilderPermissions): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, permissions: perms });
  }

  tags(...tags: string[]): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({
      ...this.#data,
      tags: [...new Set([...this.#data.tags, ...tags])],
    });
  }

  metadata(data: Record<string, unknown>): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({
      ...this.#data,
      metadata: { ...this.#data.metadata, ...data },
    });
  }

  retention(options: JobRetentionOptions): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({
      ...this.#data,
      retention: {
        archiveToDb: options.archiveToDb,
        kvRetentionDays: options.kvDays,
        dbRetentionDays: options.dbDays,
        maxExecutions: options.maxExecutions,
      },
    });
  }

  enabled(value: boolean): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, enabled: value });
  }

  topic(name: string): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, topic: name });
  }

  queueTrigger(name: string): JobBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new JobBuilderImpl({ ...this.#data, queueTrigger: name });
  }

  build(
    this: TConfigured extends 'entrypoint-set' | 'handler-set'
      ? JobBuilderImpl<TId, TConfigured, TPayload, TResult>
      : never,
  ): JobDefinition<TId, TPayload, TResult> {
    if (!this.#data.entrypoint && !this.#data.handler) {
      throw new Error(`Job "${this.#data.id}" requires an entrypoint or handler before build().`);
    }

    const metadata = this.#data.queueTrigger
      ? { ...this.#data.metadata, queueTrigger: this.#data.queueTrigger }
      : this.#data.metadata;
    const definition: DomainJobDefinition<TId, TPayload, TResult> = Object.freeze({
      id: this.#data.id as DomainJobId<TId>,
      topic: this.#data.topic,
      name: this.#data.name ?? this.#data.id,
      description: this.#data.description,
      entrypoint: this.#data.entrypoint,
      schedule: this.#data.schedule,
      timezone: this.#data.timezone,
      timeout: this.#data.timeout,
      maxRetries: this.#data.maxRetries,
      priority: 50,
      enabled: this.#data.enabled,
      tags: [...this.#data.tags],
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      source: 'local',
      executionType: 'deno',
      retryDelay: 1000,
      maxConcurrency: 1,
      persist: true,
      permissions: toDomainPermissions(this.#data.permissions),
      retention: this.#data.retention,
      handler: this.#data.handler,
    });

    return definition;
  }
}

/** Start a worker job definition chain. */
export function defineJob<TId extends string>(
  id: TId,
): JobBuilder<TId, 'initial', unknown, unknown> {
  return new JobBuilderImpl<TId, 'initial', unknown, unknown>({
    id,
    enabled: true,
    maxRetries: 3,
    metadata: {},
    tags: [],
    timeout: 300_000,
    timezone: 'UTC',
    topic: DEFAULT_TOPIC,
  });
}
