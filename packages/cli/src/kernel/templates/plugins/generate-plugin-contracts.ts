/**
 * @module templates/plugins/generate-plugin-contracts
 *
 * Tier 1 generator for a scaffolded plugin contract stub.
 */

import { toCamelCase, toPascalCase } from '@std/text';

import type { PluginKindProvider, PluginScaffoldOptions } from '../../domain/plugin-kind.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/** Generate `plugins/<name>/contracts/v1/mod.ts`. */
export function generatePluginContracts(
  provider: PluginKindProvider,
  options: Pick<PluginScaffoldOptions, 'pluginName'>,
): string {
  const pascalName = toPascalCase(options.pluginName);
  const camelName = toCamelCase(options.pluginName);

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedPluginsGeneratePluginContracts1, {
    __slot0__: String(pascalName),
    __slot1__: String(options.pluginName),
    __slot2__: String(pascalName),
    __slot3__: String(provider.kind),
    __slot4__: String(pascalName),
    __slot5__: String(pascalName),
    __slot6__: String(camelName),
    __slot7__: String(options.pluginName),
    __slot8__: String(pascalName),
    __slot9__: String(camelName),
    __slot10__: String(camelName),
    __slot11__: String(camelName),
    __slot12__: String(camelName),
  });
}
