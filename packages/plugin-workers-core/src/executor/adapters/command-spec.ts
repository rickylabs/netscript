import type {
  ResolvedTaskExecutionOptions,
  RuntimeTaskMetadata,
  TaskDefinition,
} from '../executor-types.ts';
export type { RuntimeTaskMetadata } from '../executor-types.ts';

/** Command and arguments prepared for a task runtime adapter. */
export type RuntimeCommandSpec = Readonly<{
  command: string;
  args: readonly string[];
  env?: Readonly<Record<string, string>>;
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

/** Require a task entrypoint and return it. */
export function requireEntrypoint(task: TaskDefinition): string {
  if (!task.entrypoint) {
    throw new Error(`Task ${task.id} does not define an entrypoint.`);
  }
  return task.entrypoint;
}

/** Return runtime-specific task metadata. */
export function runtimeMetadata(task: TaskDefinition): RuntimeTaskMetadata {
  return (task.metadata ?? {}) as RuntimeTaskMetadata;
}

/** Combine task and execution-option arguments. */
export function allTaskArgs(
  task: TaskDefinition,
  options: ResolvedTaskExecutionOptions,
): readonly string[] {
  return [...(task.args ?? []), ...options.args];
}
