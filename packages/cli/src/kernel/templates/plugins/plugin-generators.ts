/**
 * @module templates/plugins
 *
 * Public exports for plugin scaffold generators.
 */

export { generatePluginContracts } from './generate-plugin-contracts.ts';
export { generatePluginDbSchema, type PluginDbSchemaOptions } from './generate-plugin-db-schema.ts';
export { generatePluginDenoJson } from './generate-plugin-deno-json.ts';
export { generatePluginMod, type PluginManifestOptions } from './generate-plugin-mod.ts';
export {
  generatePluginSampleFiles,
  type PluginSampleFile,
  type PluginSampleOptions,
} from './generate-plugin-samples.ts';
export {
  generatePluginProcessorEntrypoint,
  generatePluginRouter,
  generatePluginService,
  type PluginCodeOptions,
} from './generate-plugin-service.ts';
export { generatePluginServiceContext } from './generate-plugin-service-context.ts';
