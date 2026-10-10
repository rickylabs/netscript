/**
 * Static doctor adapter and its public protocol vocabulary for the workers plugin.
 *
 * @module
 */
export { workersAdapterPlugin } from './src/adapter/plugin.ts';
export type {
  DoctorCheck,
  DoctorCheckSpec,
  DoctorReport,
  DoctorSpec,
  FileSystemPort,
  InfoSpec,
  InstallSpec,
  InstallStarterResource,
  InstallStarterSamplesPolicy,
  ItemScaffolder,
  NetScriptPlugin,
  PluginCliArgs,
  PluginCliResult,
  PluginCommandConfig,
  PluginCommandContext,
  PluginCommandSpec,
  PluginCommandValue,
  PluginResource,
  RemoveSpec,
  ScaffoldArtifact,
  ScaffoldArtifactBody,
  UpdateSpec,
} from '@netscript/plugin/adapter';
