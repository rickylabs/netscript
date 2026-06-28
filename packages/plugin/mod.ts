/**
 * @module @netscript/plugin
 *
 * Plugin definition DSL and diagnostics for NetScript plugin packages.
 *
 * The root entrypoint is the plugin authoring contract. Host tooling, CLI
 * integration, SDK discovery, adapters, and fixtures live on subpaths:
 * `@netscript/plugin/config`, `@netscript/plugin/cli`,
 * `@netscript/plugin/protocol`, `@netscript/plugin/sdk`, and
 * `@netscript/plugin/testing`.
 *
 * @example Define a plugin
 * ```ts
 * import { definePlugin, inspectPlugin } from "@netscript/plugin";
 *
 * const plugin = definePlugin("@example/plugin", "0.0.1-alpha.0").build();
 *
 * console.log(inspectPlugin(plugin).summary);
 * ```
 */

export { definePlugin } from './src/config/mod.ts';
export { PLUGIN_TYPES } from './src/config/mod.ts';
export type {
  BackgroundProcessorContribution,
  ContractVersionContribution,
  ContributionInput,
  DbSchemaContribution,
  DependencyContext,
  E2eContribution,
  MigrationContribution,
  PluginBuilder,
  PluginBuilderState,
  PluginContributions,
  PluginDependencies,
  PluginLifecycleHooks,
  PluginManifest,
  PluginManifestParser,
  PluginMetadata,
  PluginMetadataValue,
  PluginType,
  RuntimeConfigTopicContribution,
  ServiceContribution,
  StreamTopicContribution,
  TelemetryContribution,
} from './src/config/mod.ts';
export type { PluginContext, PluginLogger } from './src/domain/mod.ts';
export { DuplicatePluginError, PluginError, PluginValidationError } from './src/domain/mod.ts';
export { PluginContribution } from './src/abstracts/mod.ts';
export type { ContributionAxis } from './src/abstracts/mod.ts';
export { inspectPlugin } from './src/diagnostics/mod.ts';
export type {
  InspectablePluginManifest,
  InspectablePluginRegistry,
  InspectionReport,
} from './src/diagnostics/mod.ts';
export {
  parsePluginManifest,
  PLUGIN_MANIFEST_SCHEMA_VERSION,
  PluginInstallerManifestSchema,
} from './src/protocol/mod.ts';
export type {
  PluginInstallerManifest,
  PluginManifestCapabilities,
  PluginManifestOfficialSource,
  PluginManifestParseError,
  PluginManifestParseIssue,
  PluginManifestParseResult,
  PluginManifestProvider,
  PluginManifestScaffolder,
  PluginScaffoldEntrypoint,
  PluginScaffolderRequiredPermissions,
  ScaffolderContext,
  ScaffoldResult,
} from './src/protocol/mod.ts';
