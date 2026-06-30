/**
 * CLI commands and local project adapters for sagas plugin operations.
 *
 * @module
 */

export { LocalProjectFiles } from '@netscript/plugin/cli';
export type {
  PluginCli,
  PluginCliArgs,
  PluginCliCommand,
  PluginCliResult,
} from '@netscript/plugin/cli';
export type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
export { codemodSagaImports } from './codemod.ts';
export type {
  CodemodSagaImportsChange,
  CodemodSagaImportsOptions,
  CodemodSagaImportsResult,
} from './codemod.ts';
export {
  AddSagaCommand,
  CodemodCommand,
  GenerateRegistryCommand,
  InspectCommand,
  SagasCliCommand,
  StaticSagasCliBackend,
} from './commands.ts';
export { SAGAS_CLI_COMMANDS } from './command-types.ts';
export type {
  SagasCliBackend,
  SagasCliCategory,
  SagasCliCommandDefinition,
  SagasCliCommandName,
  SagasCliFlagDefinition,
} from './command-types.ts';
export { generateSagaRegistry } from './registry-generator.ts';
export type {
  GenerateSagaRegistryOptions,
  GenerateSagaRegistryResult,
} from './registry-generator.ts';
export { SagasCli } from './sagas-cli.ts';
export { LocalSagasRuntimeBackend } from './local-runtime-backend.ts';
export type { LocalSagasRuntimeBackendOptions } from './local-runtime-backend.ts';
export { inspectSagasProject } from './saga-inspector.ts';
export type {
  InspectSagasOptions,
  InspectSagasResult,
  SagaInspectionEntry,
} from './saga-inspector.ts';
export { SAGAS_PLUGIN_ID, SAGAS_PLUGIN_VERSION } from '../constants.ts';
