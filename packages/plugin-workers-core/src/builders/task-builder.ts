import type { TaskStdin } from '../domain/task.ts';
import { encodeTaskStdin } from '../executor/task-stdin.ts';
import { validateJobPayload } from '../domain/job-handler.ts';
import type {
  JobPayloadSchema,
  TaskDefinition as DomainTaskDefinition,
  TaskHandler as DomainTaskHandler,
  TaskId as DomainTaskId,
  TaskPermissions,
} from '../domain/mod.ts';
import type {
  BuilderPermissions,
  BuilderTaskType,
  TaskDefinition,
  TaskHandler,
} from './builder-types.ts';

/** Task builder state used to gate `build()`. */
export type TaskBuilderState =
  | 'initial'
  | 'entrypoint-set'
  | 'payload-set'
  | 'payload-entrypoint-set'
  | 'handler-set';

type AfterEntrypoint<T extends TaskBuilderState> = T extends
  'payload-set' | 'payload-entrypoint-set' ? 'payload-entrypoint-set' : 'entrypoint-set';
type AfterPayload<T extends TaskBuilderState> = T extends
  'entrypoint-set' | 'payload-entrypoint-set' ? 'payload-entrypoint-set' : 'payload-set';
type HandlerPayload<T extends TaskBuilderState, P, N> = T extends
  'payload-set' | 'payload-entrypoint-set' ? P : N;

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
  entrypoint(
    path: string,
  ): TaskBuilder<
    TId,
    TConfigured extends 'payload-set' | 'payload-entrypoint-set' ? 'payload-entrypoint-set'
      : 'entrypoint-set',
    TPayload,
    TResult
  >;
  /** Set an in-process task handler. */
  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: TaskHandler<
      TConfigured extends 'payload-set' | 'payload-entrypoint-set' ? TPayload : TNextPayload,
      TNextResult
    >,
  ): TaskBuilder<
    TId,
    'handler-set',
    TConfigured extends 'payload-set' | 'payload-entrypoint-set' ? TPayload : TNextPayload,
    TNextResult
  >;
  /** Narrow the payload type carried by this task definition. */
  payload<TNextPayload>(
    this: TConfigured extends 'handler-set' ? never
      : TaskBuilder<TId, TConfigured, TPayload, TResult>,
  ): TaskBuilder<TId, TConfigured, TNextPayload, TResult>;
  /** Select a runtime payload schema; durable effects require this overload. */
  payload<TNextPayload>(
    this: TConfigured extends 'handler-set' ? never
      : TaskBuilder<TId, TConfigured, TPayload, TResult>,
    schema: JobPayloadSchema<TNextPayload>,
  ): TaskBuilder<
    TId,
    TConfigured extends 'entrypoint-set' | 'payload-entrypoint-set' ? 'payload-entrypoint-set'
      : 'payload-set',
    TNextPayload,
    TResult
  >;
  /** Set the task timeout in milliseconds. */
  timeout(ms: number): this;
  /** Set the maximum retry count. */
  retry(maxRetries: number): this;
  /** Set execution permissions for this task. */
  permissions(perms: BuilderPermissions): this;
  /** Append command-line arguments. */
  args(...args: string[]): this;
  /** Set bytes or JSON on stdin (maximum 1 MiB), written once and closed. */
  stdin(payload: TaskStdin): this;
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
  build(
    this: TConfigured extends 'entrypoint-set' | 'payload-entrypoint-set' | 'handler-set'
      ? TaskBuilder<TId, TConfigured, TPayload, TResult>
      : never,
  ): TaskDefinition<TId, TPayload, TResult>;
}

function mutablePermission(
  value: boolean | readonly string[] | undefined,
): boolean | string[] | undefined {
  if (typeof value === 'boolean' || value === undefined) return value;
  return [...value];
}

function toDomainPermissions(
  permissions: BuilderPermissions | undefined,
): TaskPermissions | undefined {
  if (!permissions) return undefined;
  return {
    net: mutablePermission(permissions.net) ?? false,
    read: mutablePermission(permissions.read) ?? false,
    write: mutablePermission(permissions.write) ?? false,
    env: mutablePermission(permissions.env) ?? false,
    run: mutablePermission(permissions.run) ?? false,
    ffi: permissions.ffi ?? false,
    import: permissions.import ? [...permissions.import] : undefined,
  };
}

type TaskBuilderData<TId extends string, TPayload, TResult> = Readonly<{
  id: TId;
  runtime: BuilderTaskType;
  entrypoint?: string;
  handler?: DomainTaskHandler<TPayload, TResult>;
  payloadSchema?: JobPayloadSchema<TPayload>;
  timeout: number;
  maxRetries: number;
  permissions?: BuilderPermissions;
  args: readonly string[];
  stdin?: Uint8Array;
  env?: Readonly<Record<string, string>>;
  cwd?: string;
  tags: readonly string[];
  metadata: Readonly<Record<string, unknown>>;
  enabled: boolean;
}>;

class TaskBuilderImpl<
  TId extends string,
  TConfigured extends TaskBuilderState,
  TPayload,
  TResult,
> {
  readonly #data: TaskBuilderData<TId, TPayload, TResult>;

  constructor(data: TaskBuilderData<TId, TPayload, TResult>) {
    this.#data = data;
  }

  runtime(type: BuilderTaskType): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, runtime: type });
  }

  entrypoint(path: string): TaskBuilder<TId, AfterEntrypoint<TConfigured>, TPayload, TResult> {
    return new TaskBuilderImpl<TId, AfterEntrypoint<TConfigured>, TPayload, TResult>({
      ...this.#data,
      entrypoint: path,
    });
  }

  handler<TNextPayload = TPayload, TNextResult = TResult>(
    fn: TaskHandler<HandlerPayload<TConfigured, TPayload, TNextPayload>, TNextResult>,
  ): TaskBuilder<
    TId,
    'handler-set',
    HandlerPayload<TConfigured, TPayload, TNextPayload>,
    TNextResult
  > {
    const { handler: _previousHandler, ...data } = this.#data;
    type P = HandlerPayload<TConfigured, TPayload, TNextPayload>;
    const payloadSchema = this.#data.payloadSchema as JobPayloadSchema<P> | undefined;
    const handler: TaskHandler<P, TNextResult> = payloadSchema
      ? async (context) =>
        await fn({
          ...context,
          payload: await validateJobPayload(payloadSchema, context.payload, this.#data.id),
        })
      : fn;
    return new TaskBuilderImpl<
      TId,
      'handler-set',
      HandlerPayload<TConfigured, TPayload, TNextPayload>,
      TNextResult
    >({
      ...data,
      handler,
      payloadSchema: this.#data.payloadSchema as
        | JobPayloadSchema<HandlerPayload<TConfigured, TPayload, TNextPayload>>
        | undefined,
    });
  }

  payload<TNextPayload>(
    this: TConfigured extends 'handler-set' ? never
      : TaskBuilderImpl<TId, TConfigured, TPayload, TResult>,
  ): TaskBuilder<TId, TConfigured, TNextPayload, TResult>;
  payload<TNextPayload>(
    this: TConfigured extends 'handler-set' ? never
      : TaskBuilderImpl<TId, TConfigured, TPayload, TResult>,
    schema: JobPayloadSchema<TNextPayload>,
  ): TaskBuilder<TId, AfterPayload<TConfigured>, TNextPayload, TResult>;
  payload<TNextPayload>(
    schema?: JobPayloadSchema<TNextPayload>,
  ): unknown {
    const { handler: _handler, payloadSchema: _schema, ...data } = this.#data;
    return new TaskBuilderImpl<TId, TConfigured, TNextPayload, TResult>(
      { ...data, payloadSchema: schema },
    );
  }

  timeout(ms: number): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, timeout: ms });
  }

  retry(maxRetries: number): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, maxRetries });
  }

  permissions(perms: BuilderPermissions): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, permissions: perms });
  }

  args(...args: string[]): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, args: [...this.#data.args, ...args] });
  }

  stdin(payload: TaskStdin): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, stdin: encodeTaskStdin(payload) });
  }

  env(vars: Record<string, string>): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, env: { ...this.#data.env, ...vars } });
  }

  workingDir(path: string): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, cwd: path });
  }

  tags(...tags: string[]): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({
      ...this.#data,
      tags: [...new Set([...this.#data.tags, ...tags])],
    });
  }

  metadata(data: Record<string, unknown>): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({
      ...this.#data,
      metadata: { ...this.#data.metadata, ...data },
    });
  }

  enabled(value: boolean): TaskBuilderImpl<TId, TConfigured, TPayload, TResult> {
    return new TaskBuilderImpl({ ...this.#data, enabled: value });
  }

  build(
    this: TConfigured extends 'entrypoint-set' | 'payload-entrypoint-set' | 'handler-set'
      ? TaskBuilderImpl<TId, TConfigured, TPayload, TResult>
      : never,
  ): TaskDefinition<TId, TPayload, TResult> {
    if (!this.#data.entrypoint && !this.#data.handler) {
      throw new Error(`Task "${this.#data.id}" requires an entrypoint or handler before build().`);
    }

    const definition: DomainTaskDefinition<TId, TPayload, TResult> = Object.freeze({
      id: this.#data.id as DomainTaskId<TId>,
      topic: 'default',
      name: this.#data.id,
      type: this.#data.runtime,
      entrypoint: this.#data.entrypoint,
      timeout: this.#data.timeout,
      maxRetries: this.#data.maxRetries,
      priority: 50,
      enabled: this.#data.enabled,
      tags: [...this.#data.tags],
      metadata: Object.keys(this.#data.metadata).length > 0 ? this.#data.metadata : undefined,
      source: 'local',
      args: [...this.#data.args],
      cwd: this.#data.cwd,
      stdin: this.#data.stdin?.slice(),
      env: this.#data.env ? { ...this.#data.env } : undefined,
      permissions: toDomainPermissions(this.#data.permissions),
      timezone: 'UTC',
      retryDelay: 1000,
      maxConcurrency: 1,
      persist: true,
      handler: this.#data.handler,
      payloadSchema: this.#data.payloadSchema,
    });

    return definition;
  }
}

/** Start a worker task definition chain. */
export function defineTask<TId extends string>(
  id: TId,
): TaskBuilder<TId, 'initial', unknown, unknown> {
  return new TaskBuilderImpl<TId, 'initial', unknown, unknown>({
    id,
    args: [],
    enabled: true,
    maxRetries: 1,
    metadata: {},
    runtime: 'deno',
    tags: [],
    timeout: 300_000,
  });
}
