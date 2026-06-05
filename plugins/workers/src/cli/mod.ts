/**
 * @module @netscript/plugin-workers/cli
 *
 * Mounted CLI command group for the workers plugin.
 */

export { WorkersCli } from './workers-cli.ts';
export { LocalWorkersCliBackend } from './workers-cli-backend.ts';
export type { LocalWorkersCliBackendOptions } from './workers-cli-backend.ts';
export {
  AddJobCommand,
  AddTaskCommand,
  CompileRegistryCommand,
  ConfigEditCommand,
  ConfigPublishCommand,
  DisableCommand,
  EnableCommand,
  ListJobsCommand,
  ListTasksCommand,
  LogsCommand,
  RunJobCommand,
  StaticWorkersCliBackend,
} from './commands.ts';
export { compileWorkersRegistry } from './registry-compiler.ts';
export type { CompileRegistryResult } from './registry-compiler.ts';
export { generateRuntimeRegistries } from './runtime-registry-generator.ts';
export type { GenerateRuntimeRegistriesOptions } from './runtime-registry-generator.ts';
export { WORKERS_CLI_COMMANDS } from './command-types.ts';
export type {
  WorkersCliBackend,
  WorkersCliCategory,
  WorkersCliCommandDefinition,
  WorkersCliCommandName,
  WorkersCliFlagDefinition,
} from './command-types.ts';
