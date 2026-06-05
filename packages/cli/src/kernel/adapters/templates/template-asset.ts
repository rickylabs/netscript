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
export async function readTemplateAsset(template: URL | TemplateKey): Promise<string> {
  if (typeof template === 'string') {
    return await Deno.readTextFile(getTemplateAsset(template).url);
  }
  return await Deno.readTextFile(template);
}

/** Synchronously read a scaffold template asset shipped with the CLI package. */
export function readTemplateAssetSync(template: URL | TemplateKey): string {
  if (typeof template === 'string') {
    const asset = getTemplateAsset(template);
    return Deno.readTextFileSync(asset.url);
  }
  return Deno.readTextFileSync(template);
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
