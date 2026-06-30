/**
 * Unified NetScript plugin adapter contract and command runner.
 *
 * Plugins export a typed {@linkcode NetScriptPlugin} object and pass it to
 * {@linkcode createPluginAdapter}. Core owns the mandatory command algorithms,
 * while plugins provide seams, item scaffolders, resources, and optional verbs.
 *
 * @example
 * ```ts
 * import {
 *   createPluginAdapter,
 *   textArtifact,
 *   type NetScriptPlugin,
 * } from '@netscript/plugin/adapter';
 *
 * const plugin: NetScriptPlugin = {
 *   name: '@example/plugin-workers',
 *   kind: 'workers',
 *   displayName: 'Workers',
 *   install: {
 *     dependencySpecifier: 'jsr:@example/plugin-workers@^1',
 *     starterResources: [{
 *       scaffolder: { name: 'job', emit: () => [textArtifact('src/jobs/example.ts', 'export {};')] },
 *       input: {},
 *     }],
 *   },
 * };
 *
 * export default createPluginAdapter(plugin).toCli();
 * ```
 *
 * @module
 */

export type {
  DoctorCheck,
  DoctorReport,
  PluginCliArgs,
  PluginCliCommand,
  PluginCliResult,
} from '../cli/mod.ts';
export type { PluginLogger } from '../domain/mod.ts';
export type { FileSystemPort } from '../ports/mod.ts';
export type {
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '../protocol/mod.ts';
export type {
  DoctorCheckSpec,
  DoctorSpec,
  InfoSpec,
  InstallSpec,
  InstallStarterResource,
  NetScriptPlugin,
  PluginAdapter,
  PluginCliEntrypoint,
  PluginCommandConfig,
  PluginCommandContext,
  PluginCommandSpec,
  PluginCommandValue,
  PluginResource,
  RemoveSpec,
  UpdateSpec,
} from './contract.ts';
export {
  createDenoFileSystem,
  DEFAULT_PLUGIN_HEALTH_ENDPOINT,
  DEFAULT_PLUGIN_WORKSPACE_ROOT,
  resolveWorkspacePath,
} from './defaults.ts';
export { createPluginAdapter } from './factory.ts';
export type { ScaffoldArtifact, ScaffoldArtifactBody } from './item/artifact.ts';
export { artifactText, textArtifact } from './item/artifact.ts';
export type { ItemScaffolder } from './item/item-scaffolder.ts';
export type { StubSource, TokenValues } from './item/substitute.ts';
export { defineStub, substituteTokens } from './item/substitute.ts';
export type { RunInstallCommandOptions } from './commands/install.ts';
export {
  collectInstallArtifacts,
  createInstallScaffoldEntrypoint,
  runInstallCommand,
} from './commands/install.ts';
export type { RunDoctorCommandOptions } from './commands/doctor.ts';
export { runDoctorCommand } from './commands/doctor.ts';
export type { PluginInfoReport, RunInfoCommandOptions } from './commands/info.ts';
export { runInfoCommand } from './commands/info.ts';
export type { RunUpdateCommandOptions } from './commands/update.ts';
export { runUpdateCommand } from './commands/update.ts';
export type { RunRemoveCommandOptions } from './commands/remove.ts';
export { runRemoveCommand } from './commands/remove.ts';
export type { RunPluginCliCommandOptions } from './runner/plugin-cli-runner.ts';
export { runPluginCliCommand } from './runner/plugin-cli-runner.ts';
export { runPluginScaffoldCli } from './scaffold-cli-runner.ts';
