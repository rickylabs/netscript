import { TaskExecutor } from '../abstracts/task-executor.ts';
import type {
  ResolvedTaskExecutionOptions,
  TaskInstrumentation,
  TaskRuntimeAdapter,
} from '../abstracts/mod.ts';
import type { TaskDefinition, TaskExecutionOptions, TaskResult, TaskType } from '../domain/mod.ts';
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

/** Options for the default multi-runtime task executor. */
export type MultiRuntimeTaskExecutorOptions = Readonly<{
  adapters?: ReadonlyMap<TaskType, TaskRuntimeAdapter>;
  customAdapters?: Readonly<Record<string, TaskRuntimeAdapter>>;
  defaults?: Readonly<{
    cwd?: string;
    timeout?: number;
  }>;
  instrumentations?: readonly TaskInstrumentation[];
}>;

/** Dispatches task execution to runtime-specific adapters. */
export class MultiRuntimeTaskExecutor extends TaskExecutor {
  readonly id = 'multi-runtime-task-executor';
  readonly #adapters: ReadonlyMap<TaskType, TaskRuntimeAdapter>;
  readonly #customAdapters: Readonly<Record<string, TaskRuntimeAdapter>>;
  readonly #defaults: Required<NonNullable<MultiRuntimeTaskExecutorOptions['defaults']>>;
  readonly #instrumentations: readonly TaskInstrumentation[];

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

  override supports(task: TaskDefinition): boolean {
    return this.#resolveAdapter(task)?.supports(task) ?? false;
  }

  override async execute(
    task: TaskDefinition,
    options: TaskExecutionOptions = {},
  ): Promise<TaskResult> {
    const adapter = this.#resolveAdapter(task);
    if (!adapter || !adapter.supports(task)) {
      return failedTaskResult(task, `No task runtime adapter supports runtime '${task.type}'.`);
    }

    const resolved = this.#resolveOptions(task, options);
    this.#applyInstrumentation(task, resolved, 'running');
    const result = await adapter.execute(task, resolved).catch((error) =>
      failedTaskResult(task, error)
    );
    this.#applyInstrumentation(task, resolved, result.status);
    return result;
  }

  #resolveAdapter(task: TaskDefinition): TaskRuntimeAdapter | undefined {
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
  ): void {
    if (this.#instrumentations.length === 0) return;
    const span = new TaskExecutorSpan();
    for (const instrumentation of this.#instrumentations) {
      instrumentation.applyTo(span, {
        correlationId: options.correlationId,
        status: toTelemetryStatus(status),
        taskId: task.id,
      });
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
export function createDefaultRuntimeAdapterMap(): ReadonlyMap<TaskType, TaskRuntimeAdapter> {
  return new Map<TaskType, TaskRuntimeAdapter>([
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
}
