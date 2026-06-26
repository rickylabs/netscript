/**
 * @module infra/template-asset
 *
 * Runtime loading for checked-in scaffold template assets.
 */

import {
  DEFAULT_TEMPLATE_REGISTRY,
  type TemplateValue,
} from '../../application/registries/template-registry.ts';
import type { TemplateKey } from '../../assets/manifest.ts';

/** Read a scaffold template asset shipped with the CLI package. */
export function readTemplateAsset(template: TemplateKey): Promise<string> {
  return Promise.resolve(readTemplateAssetSync(template));
}

/** Synchronously read a scaffold template asset shipped with the CLI package. */
export function readTemplateAssetSync(template: TemplateKey): string {
  return getTemplateAsset(template).content;
}

/** Synchronously read and interpolate a scaffold template asset. */
export function renderTemplateAssetSync(
  template: TemplateKey,
  variables: Readonly<Record<string, string>>,
): string {
  let content = readTemplateAssetSync(template);
  for (const [key, value] of Object.entries(variables)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  return content;
}

/** Resolve a registered scaffold template asset. */
export function getTemplateAsset(template: TemplateKey): TemplateValue {
  const asset = DEFAULT_TEMPLATE_REGISTRY.get(template);
  if (!asset) {
    throw new Error(`Template asset is not registered: ${template}`);
  }
  return asset;
}
