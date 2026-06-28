/**
 * Published plugin installer protocol for static manifest validation and scaffolders.
 *
 * @module
 */

export {
  parsePluginManifest,
  PLUGIN_MANIFEST_SCHEMA_VERSION,
  PluginInstallerManifestSchema,
} from './manifest.ts';
export type {
  PluginInstallerManifest,
  PluginManifestCapabilities,
  PluginManifestOfficialSource,
  PluginManifestParseError,
  PluginManifestParseIssue,
  PluginManifestParseResult,
  PluginManifestPostScript,
  PluginManifestProvider,
  PluginManifestScaffolder,
  PluginScaffolderRequiredPermissions,
} from './manifest.ts';
export type { PluginScaffoldEntrypoint, ScaffolderContext, ScaffoldResult } from './scaffolder.ts';
