/**
 * @module @netscript/plugin-auth
 *
 * Public plugin manifest for NetScript auth.
 */

export {
  AUTH_API_DEFAULT_PORT,
  AUTH_API_SERVICE_NAME,
  AUTH_PLUGIN_ID,
  AUTH_PLUGIN_VERSION,
  authPlugin,
  inspectAuth,
} from './src/public/mod.ts';
export type {
  AuthContractVersionContribution,
  AuthPluginContributions,
  AuthPluginDependencies,
  AuthPluginDependencyManifest,
  AuthPluginInspection,
  AuthPluginManifest,
  AuthRuntimeConfigTopicContribution,
  AuthServiceContribution,
} from './src/public/mod.ts';
