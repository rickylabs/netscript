/**
 * @module @netscript/fresh-ui/registry
 *
 * Embedded Fresh UI copy-registry manifest and file content.
 */

import { freshUiRegistryManifest as manifest } from './registry.manifest.ts';

export { FRESH_UI_REGISTRY_CONTENT } from './registry.generated.ts';

/** File entry copied from the Fresh UI registry into an application workspace. */
export type FreshUiRegistryFile = {
  /** Source path inside the Fresh UI registry package. */
  readonly source: string;
  /** Target path or target alias inside the consuming application. */
  readonly target: string;
};

/** CSS contribution appended to the consuming application's style aggregator. */
export type FreshUiRegistryCssContribution = {
  /** Optional CSS cascade layer for the contribution. */
  readonly layer?: 'base' | 'components' | 'utilities';
  /** CSS text, usually an `@import` statement for a copied asset. */
  readonly content: string;
};

/** Fresh UI registry item that can be copied into an application workspace. */
export type FreshUiRegistryItem = {
  /** Stable registry item name. */
  readonly name: string;
  /** Optional item category such as `component`, `style`, `theme`, or `lib`. */
  readonly kind?: string;
  /** Files owned by this registry item. */
  readonly files: readonly FreshUiRegistryFile[];
  /** Other registry items that must be installed first. */
  readonly registryDependencies?: readonly string[];
  /** Runtime import dependencies to merge into the target app's `deno.json`. */
  readonly dependencies?: readonly string[];
  /** Optional CSS aggregator contributions for this item. */
  readonly css?: readonly FreshUiRegistryCssContribution[];
};

/** Named registry collection that expands to multiple item names. */
export type FreshUiRegistryCollection = {
  /** Stable collection name. */
  readonly name: string;
  /** Registry item names included in the collection. */
  readonly items: readonly string[];
};

/** Public embedded Fresh UI registry manifest consumed by the NetScript CLI. */
export type FreshUiRegistryManifest = {
  /** Copyable registry items. */
  readonly items: readonly FreshUiRegistryItem[];
  /** Named groups of registry items. */
  readonly collections: readonly FreshUiRegistryCollection[];
};

/** Embedded Fresh UI copy-registry manifest. */
export const freshUiRegistryManifest: FreshUiRegistryManifest = manifest;
