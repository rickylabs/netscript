/**
 * @module @netscript/plugin-triggers
 *
 * Public plugin manifest for NetScript triggers.
 */

export {
  inspectTriggers,
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  TRIGGERS_PLUGIN_VERSION,
  triggersPlugin,
} from './src/public/mod.ts';
export type {
  TriggersApiServiceName,
  TriggersPluginContributions,
  TriggersPluginCoreDependencies,
  TriggersPluginDependencies,
  TriggersPluginId,
  TriggersPluginInspection,
  TriggersPluginManifest,
  TriggersPluginVersion,
} from './src/public/mod.ts';
