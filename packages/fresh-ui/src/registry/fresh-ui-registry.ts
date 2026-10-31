import { registryJson } from './assets/registry.generated.ts';
import type { Registry } from './registry-contract.ts';
import { validateRegistry } from './validate-registry.ts';

/** Canonical JSON authoring shared by static publication and the embedded installer. */
export const freshUiRegistryJson: Registry = validateRegistry(registryJson);
