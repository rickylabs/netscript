import registryJson from './registry.json' with { type: 'json' };
import type { RegistryManifest } from './registry.schema.ts';
import type { Registry } from './src/registry/registry-contract.ts';
import { legacyRegistryManifest } from './src/registry/legacy-registry.ts';
import { validateRegistry } from './src/registry/validate-registry.ts';

export type { Registry } from './src/registry/registry-contract.ts';

/** Canonical JSON authoring shared by static publication and the embedded installer. */
export const freshUiRegistryJson: Registry = validateRegistry(registryJson);

/** Compatibility projection for existing scaffold and copy-registry consumers. */
export const freshUiRegistryManifest: RegistryManifest = legacyRegistryManifest(
  freshUiRegistryJson,
);
