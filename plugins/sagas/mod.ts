/**
 * @module @netscript/plugin-sagas
 *
 * Public plugin manifest for NetScript sagas.
 */

export {
  inspectSagas,
  SAGAS_API_DEFAULT_PORT,
  SAGAS_API_SERVICE_NAME,
  SAGAS_PLUGIN_ID,
  SAGAS_PLUGIN_VERSION,
  sagasPlugin,
} from './src/public/mod.ts';
export type {
  SagasPluginContributions,
  SagasPluginDependencies,
  SagasPluginInspection,
  SagasPluginManifest,
} from './src/public/mod.ts';
