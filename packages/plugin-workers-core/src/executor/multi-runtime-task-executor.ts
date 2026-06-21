import { TaskExecutor } from '../abstracts/task-executor.ts';
import {
  type AttributeValue,
  getTracer,
  type Span,
  SpanKind,
  withSpan,
} from '@netscript/telemetry/tracer';
import type {
  ResolvedTaskExecutionOptions,
  TaskDefinition,
  TaskExecutionOptions,
  TaskInstrumentationLike,
  TaskResult,
  TaskRuntimeAdapterLike,
  TaskType,
} from './executor-types.ts';
import type { TelemetryAttributeValue, WorkerTelemetryStatus } from '../telemetry/mod.ts';
import {
  CmdRuntimeAdapter,
  DenoRuntimeAdapter,
  DotNetRuntimeAdapter,
  ExecutableRuntimeAdapter,
  PowerShellRuntimeAdapter,
  PythonRuntimeAdapter,
  ShellRuntimeAdapter,
} from './adapters/mod.ts';
import { failedTaskResult } from './adapters/runtime-adapter-base.ts';
import { WorkerSpanNames, WorkerTelemetryAttributes } from '../telemetry/mod.ts';

const TASK_EXECUTOR_TRACER_NAME = '@netscript/plugin-workers-core/task-executor';

const TaskExecutorTelemetryAttributes = {
  adapterId: 'task.adapter.id',
  executorId: 'task.executor.id',
  runtime: 'task.runtime',
} as const;

/** Options for the default multi-runtime task executor. */
export type MultiRuntimeTaskExecutorOptions = Readonly<{
  adapters?: ReadonlyMap<TaskType, TaskRuntimeAdapterLike>;
  customAdapters?: Readonly<Record<string, TaskRuntimeAdapterLike>>;
  defaults?: Readonly<{
    cwd?: string;
    timeout?: number;
  }>;
  instrumentations?: readonly TaskInstrumentationLike[];
}>;

/** Dispatches task execution to runtime-specific adapters. */
export class MultiRuntimeTaskExecutor extends TaskExecutor {
  /** Stable executor identifier. */
  readonly id = 'multi-runtime-task-executor';
  readonly #adapters: ReadonlyMap<TaskType, TaskRuntimeAdapterLike>;
  readonly #customAdapters: Readonly<Record<string, TaskRuntimeAdapterLike>>;
  readonly #defaults: Required<NonNullable<MultiRuntimeTaskExecutorOptions['defaults']>>;
  readonly #instrumentations: readonly TaskInstrumentationLike[];

  /** Create a task executor from runtime adapters and defaults. */
  constructor(options: MultiRuntimeTaskExecutorOptions = {}) {
    super();
    this.#adapters = options.adapters ?? createDefaultRuntimeAdapterMap();
    this.#customAdapters = options.customAdapters ?? {};
    this.#defaults = {
      cwd: options.defaults?.cwd ?? '',
      timeout: options.defaults?.timeout ?? 300000,
    };
    this.#instrumentations = options.instrumentations ?? [];
  }

  /** Return whether any configured adapter can execute a task. */
  override supports(task: TaskDefinition): boolean {
    return this.#resolveAdapter(task)?.supports(task) ?? false;
  }

  /** Execute a task through the resolved runtime adapter. */
  override async execute(
    task: TaskDefinition,
    options: TaskExecutionOptions = {},
  ): Promise<TaskResult> {
    const adapter = this.#resolveAdapter(task);
    if (!adapter || !adapter.supports(task)) {
      return failedTaskResult(task, `No task runtime adapter supports runtime '${task.type}'.`);
    }

    const resolved = this.#resolveOptions(task, options);
    const tracer = getTracer(TASK_EXECUTOR_TRACER_NAME);
    return await withSpan(
      tracer,
      WorkerSpanNames.taskExecute,
      async (span) => {
        this.#setTaskAttributes(span, task, adapter);
        this.#applyInstrumentation(task, resolved, 'running', span);
        const result = await adapter.execute(task, resolved).catch((error) =>
          failedTaskResult(task, error)
        );
        this.#setTaskResultAttributes(span, result);
        this.#applyInstrumentation(task, resolved, result.status, span, result.duration);
        return result;
      },
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          [TaskExecutorTelemetryAttributes.adapterId]: adapter.id,
          [TaskExecutorTelemetryAttributes.executorId]: this.id,
          [TaskExecutorTelemetryAttributes.runtime]: task.type,
          [WorkerTelemetryAttributes.taskId]: task.id,
          ...(resolved.correlationId
            ? { [WorkerTelemetryAttributes.correlationId]: resolved.correlationId }
            : {}),
        },
      },
    );
  }

  #resolveAdapter(task: TaskDefinition): TaskRuntimeAdapterLike | undefined {
    const runtime = task.type;
    if (runtime && this.#customAdapters[runtime]) {
      return this.#customAdapters[runtime];
    }
    return this.#adapters.get(runtime as TaskType);
  }

  #resolveOptions(
    task: TaskDefinition,
    options: TaskExecutionOptions,
  ): ResolvedTaskExecutionOptions {
    return {
      ...options,
      args: options.args ?? [],
      cwd: options.cwd ?? task.cwd ?? this.#defaults.cwd,
      env: { ...(task.env ?? {}), ...(options.env ?? {}) },
      timeout: options.timeout ?? task.timeout ?? this.#defaults.timeout,
    };
  }

  #applyInstrumentation(
    task: TaskDefinition,
    options: ResolvedTaskExecutionOptions,
    status: string,
    otelSpan?: Span,
    durationMs?: number,
  ): void {
    if (this.#instrumentations.length === 0) return;
    const span = new TaskExecutorSpan();
    for (const instrumentation of this.#instrumentations) {
      instrumentation.applyTo(span, {
        correlationId: options.correlationId,
        durationMs,
        status: toTelemetryStatus(status),
        taskId: task.id,
      });
    }
    if (otelSpan) {
      span.copyTo(otelSpan);
    }
  }

  #setTaskAttributes(
    span: Span,
    task: TaskDefinition,
    adapter: TaskRuntimeAdapterLike,
  ): void {
    span.setAttributes({
      [TaskExecutorTelemetryAttributes.adapterId]: adapter.id,
      [TaskExecutorTelemetryAttributes.executorId]: this.id,
      [TaskExecutorTelemetryAttributes.runtime]: task.type,
      [WorkerTelemetryAttributes.taskId]: task.id,
    });
  }

  #setTaskResultAttributes(span: Span, result: TaskResult): void {
    span.setAttributes({
      [WorkerTelemetryAttributes.durationMs]: result.duration,
      [WorkerTelemetryAttributes.status]: toTelemetryStatus(result.status),
      [WorkerTelemetryAttributes.taskId]: result.taskId,
    });
    if (result.error) {
      span.setAttribute('error.message', result.error);
    }
  }
}

/** Create the default executor with all built-in runtime adapters. */
export function createDefaultTaskExecutor(
  options: MultiRuntimeTaskExecutorOptions = {},
): TaskExecutor {
  return new MultiRuntimeTaskExecutor({
    ...options,
    adapters: options.adapters ?? createDefaultRuntimeAdapterMap(),
  });
}

/** Create the default built-in runtime adapter map. */
export function createDefaultRuntimeAdapterMap(): ReadonlyMap<TaskType, TaskRuntimeAdapterLike> {
  return new Map<TaskType, TaskRuntimeAdapterLike>([
    ['deno', new DenoRuntimeAdapter()],
    ['python', new PythonRuntimeAdapter()],
    ['dotnet', new DotNetRuntimeAdapter()],
    ['shell', new ShellRuntimeAdapter()],
    ['powershell', new PowerShellRuntimeAdapter()],
    ['cmd', new CmdRuntimeAdapter()],
    ['executable', new ExecutableRuntimeAdapter()],
  ]);
}

function toTelemetryStatus(status: string): WorkerTelemetryStatus {
  return status === 'cancelled' || status === 'completed' || status === 'failed' ||
      status === 'pending' || status === 'running' || status === 'timeout'
    ? status
    : 'failed';
}

class TaskExecutorSpan {
  readonly attributes = new Map<string, TelemetryAttributeValue>();
  readonly events: Array<
    Readonly<{ name: string; attributes?: Readonly<Record<string, TelemetryAttributeValue>> }>
  > = [];

  setAttribute(name: string, value: TelemetryAttributeValue): void {
    this.attributes.set(name, value);
  }

  setAttributes(attributes: Readonly<Record<string, TelemetryAttributeValue>>): void {
    for (const [name, value] of Object.entries(attributes)) {
      this.attributes.set(name, value);
    }
  }

  addEvent(name: string, attributes?: Readonly<Record<string, TelemetryAttributeValue>>): void {
    this.events.push({ name, attributes });
  }

  copyTo(span: Span): void {
    for (const [name, value] of this.attributes) {
      span.setAttribute(name, toOtelAttributeValue(value));
    }
    for (const event of this.events) {
      span.addEvent(event.name, toOtelAttributes(event.attributes));
    }
  }
}

function toOtelAttributes(
  attributes: Readonly<Record<string, TelemetryAttributeValue>> | undefined,
): Record<string, AttributeValue> | undefined {
  if (!attributes) return undefined;
  const otelAttributes: Record<string, AttributeValue> = {};
  for (const [name, value] of Object.entries(attributes)) {
    otelAttributes[name] = toOtelAttributeValue(value);
  }
  return otelAttributes;
}

function toOtelAttributeValue(value: TelemetryAttributeValue): AttributeValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return [...value];
}
