/**
 * @module @netscript/plugin-workers
 *
 * Public plugin manifest for NetScript background workers.
 */

export { workersPlugin } from './src/public/mod.ts';

export type {
  BackgroundProcessorContribution,
  ContractVersionContribution,
  DbSchemaContribution,
  E2eContribution,
  MigrationContribution,
  PluginContext,
  PluginContributions,
  PluginDependencies,
  PluginLifecycleHooks,
  PluginLogger,
  PluginManifest,
  PluginMetadata,
  PluginMetadataValue,
  PluginType,
  RuntimeConfigTopicContribution,
  SdkClientContributionReference,
  ServiceContribution,
  StreamTopicContribution,
  TelemetryContribution,
} from '@netscript/plugin';
