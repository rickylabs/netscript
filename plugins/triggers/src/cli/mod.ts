/**
 * @module @netscript/plugin-triggers/cli
 *
 * Mounted CLI command group for the triggers plugin.
 */

export { PluginCli } from '@netscript/plugin/cli';
export type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';
export { TriggersCli } from './triggers-cli.ts';
export { LocalProjectFiles, resolveProjectRoot } from './adapters/local-project-files.ts';
export type { ProjectFileEntry, ProjectFiles } from './adapters/local-project-files.ts';
export { LocalTriggersRuntimeBackend } from './local-runtime-backend.ts';
export type { LocalTriggersRuntimeBackendOptions } from './local-runtime-backend.ts';
export {
  AddFileWatchCommand,
  AddScheduledCommand,
  AddWebhookCommand,
  DisableTriggerCommand,
  EnableTriggerCommand,
  FireTriggerCommand,
  ListTriggersCommand,
  PreviewScheduleCommand,
  StaticTriggersCliBackend,
  TestTriggerCommand,
  TriggersCliCommand,
} from './commands.ts';
export { TRIGGERS_CLI_COMMANDS } from './command-types.ts';
export type {
  TriggersCliBackend,
  TriggersCliCategory,
  TriggersCliCommandDefinition,
  TriggersCliCommandName,
  TriggersCliFlagDefinition,
} from './command-types.ts';
export { TRIGGERS_PLUGIN_ID, TRIGGERS_PLUGIN_VERSION } from '../constants.ts';
