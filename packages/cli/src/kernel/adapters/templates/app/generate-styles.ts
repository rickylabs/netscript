/**
 * @module infra/templates/app/generate-styles
 *
 * Tier 1 generator for the scaffolded Fresh app theme entrypoint.
 */

import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';
import { readTemplateAssetSync } from '../../templates/template-asset.ts';

/**
 * Generate the scaffold-owned theme entrypoint for `assets/styles.css`.
 *
 * Mirrors the FreshUI registry theme entrypoint so the scaffolded app gets the
 * same token, layout, and component layers as the playground.
 */
export function generateAppStyles(): string {
  return readTemplateAssetSync(TEMPLATE_KEYS.appAssetsStyles);
}
