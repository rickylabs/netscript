import { encodeTaskStdin, validateTaskStdinBytes } from '../task-stdin.ts';
import { TaskRuntimeAdapter } from '../../abstracts/mod.ts';
import type {
  ResolvedTaskExecutionOptions,
  TaskDefinition,
  TaskResult,
  TaskType,
} from '../executor-types.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { DaxProcessRunner } from './dax-process-runner.ts';
import type { RuntimeCommandSpec } from './command-spec.ts';

type CommandBuilder = (
  task: TaskDefinition,
  options: ResolvedTaskExecutionOptions,
) => RuntimeCommandSpec;

/** Shared adapter delegation for built-in subprocess runtimes. */
export class RuntimeAdapterBase extends TaskRuntimeAdapter {
  /** Stable adapter identifier. */
  readonly id: string;
  /** Runtime handled by the adapter. */
  readonly runtime: TaskType | null;
  readonly #build: CommandBuilder;
  readonly #runner: ProcessRunner;
  readonly #stdoutLimitBytes?: number;
  readonly #stderrLimitBytes?: number;

  /** Create a subprocess adapter from command-building primitives. */
  constructor(options: {
    id: string;
    runtime: TaskType | null;
    build: CommandBuilder;
    runner?: ProcessRunner;
    stdoutLimitBytes?: number;
    stderrLimitBytes?: number;
  }) {
    super();
    this.id = options.id;
    this.runtime = options.runtime;
    this.#build = options.build;
    this.#stdoutLimitBytes = options.stdoutLimitBytes;
    this.#stderrLimitBytes = options.stderrLimitBytes;
    this.#runner = options.runner ?? new DaxProcessRunner();
  }

  /** Return whether the adapter can execute a task. */
  supports(task: TaskDefinition): boolean {
    return task.type === this.runtime && Boolean(task.entrypoint);
  }

  /** Execute a task through the configured process runner. */
  async execute(task: TaskDefinition, options: ResolvedTaskExecutionOptions): Promise<TaskResult> {
    try {
      const spec = this.#build(task, options);
      return await this.#runner.run({
        command: spec.command,
        args: spec.args,
        task,
        stdin: resolveStdin(task, options),
        options: {
          ...options,
          stdoutLimitBytes: options.stdoutLimitBytes ?? this.#stdoutLimitBytes,
          stderrLimitBytes: options.stderrLimitBytes ?? this.#stderrLimitBytes,
          env: { ...options.env, ...(spec.env ?? {}) },
        },
      });
    } catch (error) {
      return failedTaskResult(task, error);
    }
  }
}

/** Create a task failure result without spawning a process. */
export function failedTaskResult(task: TaskDefinition, error: unknown): TaskResult {
  const startedAt = Date.now();
  const message = error instanceof Error ? error.message : String(error);
  return {
    taskId: task.id,
    status: 'failed',
    exitCode: -1,
    stdout: '',
    stderr: message,
    duration: Date.now() - startedAt,
    success: false,
    error: message,
    result: null,
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date().toISOString(),
    attempt: 0,
  };
}

// This is the sole precedence boundary. Builder bytes are already snapshotted;
// execution input is encoded once, then passed through to the stream writer.
function resolveStdin(
  task: TaskDefinition,
  options: ResolvedTaskExecutionOptions,
): Uint8Array | undefined {
  if (Object.hasOwn(options, 'stdin')) return encodeTaskStdin(options.stdin!);
  if (task.stdin instanceof Uint8Array) {
    validateTaskStdinBytes(task.stdin);
    return task.stdin;
  }
  return task.stdin === undefined ? undefined : encodeTaskStdin(task.stdin);
}
