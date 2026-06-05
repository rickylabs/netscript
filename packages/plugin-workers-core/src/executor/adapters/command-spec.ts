import type {
  DotNetTaskConfig,
  PythonTaskConfig,
  ShellTaskConfig,
  TaskDefinition,
} from '../../domain/mod.ts';
import type { ResolvedTaskExecutionOptions } from '../../abstracts/mod.ts';

/** Command and arguments prepared for a task runtime adapter. */
export type RuntimeCommandSpec = Readonly<{
  command: string;
  args: readonly string[];
  env?: Readonly<Record<string, string>>;
}>;

/** Runtime-specific task metadata recognized by built-in adapters. */
export type RuntimeTaskMetadata = Readonly<{
  dotnetConfig?: DotNetTaskConfig;
  pythonConfig?: PythonTaskConfig;
  shellConfig?: ShellTaskConfig;
}>;

/** Function used by command builders to read process environment. */
export type EnvironmentReader = (name: string) => string | undefined;

/** Context passed to runtime command builders. */
export type RuntimeCommandBuildContext = Readonly<{
  task: TaskDefinition;
  options: ResolvedTaskExecutionOptions;
  env: EnvironmentReader;
  os: typeof Deno.build.os;
}>;

export function requireEntrypoint(task: TaskDefinition): string {
  if (!task.entrypoint) {
    throw new Error(`Task ${task.id} does not define an entrypoint.`);
  }
  return task.entrypoint;
}

export function runtimeMetadata(task: TaskDefinition): RuntimeTaskMetadata {
  return (task.metadata ?? {}) as RuntimeTaskMetadata;
}

export function allTaskArgs(
  task: TaskDefinition,
  options: ResolvedTaskExecutionOptions,
): readonly string[] {
  return [...(task.args ?? []), ...options.args];
}
