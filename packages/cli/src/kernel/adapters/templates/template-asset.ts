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

const TEMPLATE_REGISTRY_NOT_HYDRATED =
  'Template registry not hydrated — await DEFAULT_TEMPLATE_REGISTRY.hydrate() before sync template reads';

/** Read a scaffold template asset shipped with the CLI package. */
export async function readTemplateAsset(template: URL | TemplateKey): Promise<string> {
  if (typeof template === 'string') {
    const asset = getTemplateAsset(template);
    if (asset.content === undefined) {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
    }
    return getHydratedTemplateContent(template);
  }
  const response = await fetch(template);
  return await response.text();
}

/** Synchronously read a scaffold template asset shipped with the CLI package. */
export function readTemplateAssetSync(template: URL | TemplateKey): string {
  if (typeof template === 'string') {
    return getHydratedTemplateContent(template);
  }
  throw new Error(TEMPLATE_REGISTRY_NOT_HYDRATED);
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

function getHydratedTemplateContent(template: TemplateKey): string {
  const asset = getTemplateAsset(template);
  const content = asset.content;
  if (content === undefined) {
    throw new Error(TEMPLATE_REGISTRY_NOT_HYDRATED);
  }
  return content;
}
