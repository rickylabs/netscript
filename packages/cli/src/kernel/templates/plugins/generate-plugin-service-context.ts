/**
 * @module templates/plugins/generate-plugin-service-context
 *
 * Generator for the host-owned plugin service context bootstrap module.
 */

import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { readTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/** Generate `services/_shared/plugin-service-context.ts`. */
export function generatePluginServiceContext(): string {
  return readTemplateAssetSync(TEMPLATE_KEYS.pluginsServiceContext);
}
