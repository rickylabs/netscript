import type {
  TaskDefinition as DomainTaskDefinition,
  TaskHandler as DomainTaskHandler,
  TaskId as DomainTaskId,
} from '../domain/mod.ts';
import type {
  BuilderPermissions,
  BuilderTaskType,
  TaskDefinition,
  TaskHandler,
} from './builder-types.ts';

/** Task builder state used to gate `build()`. */
export type TaskBuilderState = 'initial' | 'entrypoint-set' | 'handler-set';

/** Typestate builder interface for task definitions. */
export interface TaskBuilder<
  TId extends string,
  TConfigured extends TaskBuilderState,
  TPayload,
  TResult,
> {
  /** Set the task runtime. */
  runtime(type: BuilderTaskType): this;
  /** Set the module, script, or executable entrypoint. */
  entrypoint(path: string): TaskBuilder<TId, 'entrypoint-set', TPayload, TResult>;
  /** Set an in-process task handler. */
  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: TaskHandler<TNextPayload, TNextResult>,
  ): TaskBuilder<TId, 'handler-set', TNextPayload, TNextResult>;
  /** Narrow the payload type carried by this task definition. */
  payload<TNextPayload>(): TaskBuilder<TId, TConfigured, TNextPayload, TResult>;
  /** Set the task timeout in milliseconds. */
  timeout(ms: number): this;
  /** Set the maximum retry count. */
  retry(maxRetries: number): this;
  /** Set execution permissions for this task. */
  permissions(perms: BuilderPermissions): this;
  /** Append command-line arguments. */
  args(...args: string[]): this;
  /** Merge environment variables. */
  env(vars: Record<string, string>): this;
  /** Set the working directory. */
  workingDir(path: string): this;
  /** Add tags to this task definition. */
  tags(...tags: string[]): this;
  /** Merge metadata into this task definition. */
  metadata(data: Record<string, unknown>): this;
  /** Enable or disable this task definition. */
  enabled(value: boolean): this;
  /** Build the task definition after an entrypoint or handler has been configured. */
  build(): TConfigured extends 'entrypoint-set' | 'handler-set'
    ? TaskDefinition<TId, TPayload, TResult>
    : never;
}

class TaskBuilderImpl<
  TId extends string,
  TConfigured extends TaskBuilderState,
  TPayload,
  TResult,
> implements TaskBuilder<TId, TConfigured, TPayload, TResult> {
  readonly #id: TId;
  #runtime: BuilderTaskType = 'deno';
  #entrypoint?: string;
  #handler?: DomainTaskHandler<TPayload, TResult>;
  #timeout = 300_000;
  #maxRetries = 1;
  #permissions?: BuilderPermissions;
  #args: string[] = [];
  #env?: Record<string, string>;
  #cwd?: string;
  #tags: string[] = [];
  #metadata: Record<string, unknown> = {};
  #enabled = true;

  constructor(id: TId) {
    this.#id = id;
  }

  runtime(type: BuilderTaskType): this {
    this.#runtime = type;
    return this;
  }

  entrypoint(path: string): TaskBuilder<TId, 'entrypoint-set', TPayload, TResult> {
    this.#entrypoint = path;
    return this as unknown as TaskBuilder<TId, 'entrypoint-set', TPayload, TResult>;
  }

  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: TaskHandler<TNextPayload, TNextResult>,
  ): TaskBuilder<TId, 'handler-set', TNextPayload, TNextResult> {
    this.#handler = fn as unknown as DomainTaskHandler<TPayload, TResult>;
    return this as unknown as TaskBuilder<TId, 'handler-set', TNextPayload, TNextResult>;
  }

  payload<TNextPayload>(): TaskBuilder<TId, TConfigured, TNextPayload, TResult> {
    return this as unknown as TaskBuilder<TId, TConfigured, TNextPayload, TResult>;
  }

  timeout(ms: number): this {
    this.#timeout = ms;
    return this;
  }

  retry(maxRetries: number): this {
    this.#maxRetries = maxRetries;
    return this;
  }

  permissions(perms: BuilderPermissions): this {
    this.#permissions = perms;
    return this;
  }

  args(...args: string[]): this {
    this.#args.push(...args);
    return this;
  }

  env(vars: Record<string, string>): this {
    this.#env = { ...this.#env, ...vars };
    return this;
  }

  workingDir(path: string): this {
    this.#cwd = path;
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

  enabled(value: boolean): this {
    this.#enabled = value;
    return this;
  }

  build(): TConfigured extends 'entrypoint-set' | 'handler-set'
    ? TaskDefinition<TId, TPayload, TResult>
    : never {
    if (!this.#entrypoint && !this.#handler) {
      throw new Error(`Task "${this.#id}" requires an entrypoint or handler before build().`);
    }

    const definition = Object.freeze({
      id: this.#id as DomainTaskId<TId>,
      topic: 'default',
      name: this.#id,
      type: this.#runtime,
      entrypoint: this.#entrypoint,
      timeout: this.#timeout,
      maxRetries: this.#maxRetries,
      priority: 50,
      enabled: this.#enabled,
      tags: this.#tags,
      metadata: Object.keys(this.#metadata).length > 0 ? this.#metadata : undefined,
      source: 'local',
      args: this.#args,
      cwd: this.#cwd,
      env: this.#env,
      permissions: this.#permissions,
      timezone: 'UTC',
      retryDelay: 1000,
      maxConcurrency: 1,
      persist: true,
      handler: this.#handler,
    }) as unknown as DomainTaskDefinition<TId, TPayload, TResult>;

    return definition as unknown as TConfigured extends 'entrypoint-set' | 'handler-set'
      ? TaskDefinition<TId, TPayload, TResult>
      : never;
  }
}

/** Start a worker task definition chain. */
export function defineTask<TId extends string>(
  id: TId,
): TaskBuilder<TId, 'initial', unknown, unknown> {
  return new TaskBuilderImpl<TId, 'initial', unknown, unknown>(id);
}
