import { freshUiRegistryJson } from './src/registry/fresh-ui-registry.ts';
import type { RegistryManifest } from './registry.schema.ts';
import { legacyRegistryManifest } from './src/registry/legacy-registry.ts';

export type { Registry } from './src/registry/registry-contract.ts';

/** Compatibility projection for existing scaffold and copy-registry consumers. */
export const freshUiRegistryManifest: RegistryManifest = legacyRegistryManifest(
  freshUiRegistryJson,
);
