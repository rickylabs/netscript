import type { RegistryManifest } from '../../packages/fresh-ui/registry.schema.ts';

/** Project the registry into the app-owned gallery snapshot without runtime registry imports. */
export function renderDesignRegistryCatalog(manifest: RegistryManifest): string {
  const json = (value: unknown): string => JSON.stringify(value, null, 2);
  return `/**
 * App-owned registry catalog for /design/components.
 * Generated from packages/fresh-ui/registry.manifest.ts by gen:assets-barrel.
 */
export type RegistryItemKind = 'theme' | 'style' | 'component' | 'island' | 'block' | 'lib' | 'hook' | 'support';

export interface RegistryCatalogItem {
  readonly name: string;
  readonly kind: RegistryItemKind;
  readonly layer: 2 | 3 | null;
  readonly description: string;
}

export interface RegistryCatalogCollection {
  readonly name: string;
  readonly items: readonly string[];
}

export const registryMeta = ${
    json({
      name: manifest.name,
      version: manifest.version,
      packageName: manifest.packageName,
      total: manifest.items.length,
    })
  } as const;

export const registryCatalog: readonly RegistryCatalogItem[] = ${
    json(manifest.items.map(({ name, kind, layer, description }) => ({
      name,
      kind,
      layer: layer ?? null,
      description,
    })))
  };

export const registryCollections: readonly RegistryCatalogCollection[] = ${
    json(manifest.collections.map(({ name, items }) => ({ name, items })))
  };
`;
}
