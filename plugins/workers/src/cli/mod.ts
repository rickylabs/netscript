/**
 * @module @netscript/plugin-workers/cli
 *
 * Mounted CLI command group for the workers plugin.
 */

export { WorkersCli } from './workers-cli.ts';
export { PluginCli } from '@netscript/plugin/cli';
export type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';
export { CliCommand, WorkersCommand } from '@netscript/plugin-workers-core/abstracts';
export type { WorkersCommandDefinition } from '@netscript/plugin-workers-core/abstracts';
export { LocalWorkersRuntimeBackend } from './local-runtime-backend.ts';
export type { LocalWorkersRuntimeBackendOptions } from './local-runtime-backend.ts';
export {
  AddJobCommand,
  AddTaskCommand,
  AddWorkflowCommand,
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
  WorkersCliCommand,
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
