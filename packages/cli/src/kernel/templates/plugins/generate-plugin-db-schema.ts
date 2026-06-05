/**
 * @module templates/plugins/generate-plugin-db-schema
 *
 * Tier 1 generator for plugin Prisma schema contribution files.
 */

import { toPascalCase, toSnakeCase } from '@std/text';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/** Options for generating a plugin-local Prisma schema contribution. */
export interface PluginDbSchemaOptions {
  /** Plugin name in kebab-case. */
  readonly pluginName: string;
  /** Optional PascalCase model prefix. */
  readonly pascalName?: string;
}

/** Generate `plugins/<name>/database/schema.prisma`. */
export function generatePluginDbSchema(options: PluginDbSchemaOptions): string {
  const pascalName = (options.pascalName ?? toPascalCase(options.pluginName)) || 'Plugin';
  const tableName = `ns_${toSnakeCase(options.pluginName)}_records`;
  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedPluginsGeneratePluginDbSchema1, {
    __slot0__: String(options.pluginName),
    __slot1__: String(options.pluginName),
    __slot2__: String(options.pluginName),
    __slot3__: String(options.pluginName),
    __slot4__: String(pascalName),
    __slot5__: String(tableName),
  });
}
