import {
  generatePluginManifestSchemaText,
  PLUGIN_MANIFEST_SCHEMA_PATH,
} from './manifest-schema.ts';

if (import.meta.main) {
  await Deno.writeTextFile(PLUGIN_MANIFEST_SCHEMA_PATH, generatePluginManifestSchemaText());
}
