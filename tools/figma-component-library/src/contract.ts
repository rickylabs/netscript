import type { ComponentContract } from '../../../packages/fresh-ui/contracts.ts';
import type { FigmaVariable } from '../../../packages/fresh-ui/tokens.ts';

/** Portable component-library format; unrelated to Figma's transient node IDs. */
export const LIBRARY_VERSION = 1;
/** Ownership marker used only on the isolated generated page. */
export const LIBRARY_OWNER = 'netscript-component-library-v1';
/** Bounds cover the current 720-variant table while rejecting accidental explosions. */
export const VARIANT_LIMITS = { component: 1024, library: 8192 } as const;
/** Native properties on dedicated token inspection layers, not an inferred visual style. */
export const BINDING_FIELDS = {
  COLOR: 'fills',
  FLOAT: 'itemSpacing',
  STRING: 'characters',
  BOOLEAN: 'visible',
} as const;
/** External data is parsed in full before generation or mutation. */
export interface LibraryInput {
  readonly catalog: unknown;
  readonly registry: unknown;
  readonly collections: unknown;
  readonly style: string;
  readonly aliases: Readonly<Record<string, string>>;
}
/** A selection is explicit and remains visibly partial in the bundle's coverage. */
export interface GenerateOptions {
  readonly items?: readonly string[];
}
/** One set property retains the actual data-attribute name and its anatomy scope. */
export interface LibraryAxis {
  readonly property: `data-${string}`;
  readonly values: readonly string[];
  readonly parts: readonly string[];
  readonly default?: string;
}
/** Complete Cartesian state, with a deterministic Figma-compatible variant name. */
export interface LibraryVariant {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
}
/** Identity-only reference; Figma remains the source of variable values. */
export interface TokenBinding {
  readonly role: string;
  readonly collection: string;
  readonly variable: string;
  readonly type: FigmaVariable['type'];
  readonly field: (typeof BINDING_FIELDS)[FigmaVariable['type']];
  readonly codeSyntax?: string;
}
/** One logical registry component mapped to its exact physical source item. */
export interface LibraryComponent {
  readonly item: string;
  readonly registryItem: string;
  readonly source: string;
  readonly contract: ComponentContract;
  readonly axes: readonly LibraryAxis[];
  readonly variants: readonly LibraryVariant[];
  readonly bindings: readonly TokenBinding[];
}
/** Coverage is derived from the current style map, not a hand-maintained component list. */
export interface LibraryCoverage {
  readonly complete: boolean;
  readonly available: readonly string[];
  readonly selected: readonly string[];
  readonly omitted: readonly string[];
  readonly unregisteredContracts: readonly { readonly name: string; readonly shipped: boolean }[];
}
/** Deterministic library document consumed by the separate native plugin. */
export interface LibraryBundle {
  readonly schemaVersion: typeof LIBRARY_VERSION;
  readonly kind: typeof LIBRARY_OWNER;
  readonly style: string;
  readonly coverage: LibraryCoverage;
  readonly components: readonly LibraryComponent[];
}
/** A native inspection receipt is evidence, not a cryptographic editor attestation. */
export interface ImportReceipt {
  readonly schemaVersion: 1;
  readonly provenance: 'figma-editor' | 'fixture';
  readonly bundleHash: string;
  readonly fileKey: string;
  readonly pageId: string;
  readonly components: readonly {
    readonly item: string;
    readonly registryItem: string;
    readonly nodeId: string;
  }[];
}
