/** The twelve item categories supported by the shadcn registry protocol. */
export const REGISTRY_ITEM_TYPES = [
  'registry:base',
  'registry:style',
  'registry:theme',
  'registry:font',
  'registry:ui',
  'registry:component',
  'registry:block',
  'registry:page',
  'registry:lib',
  'registry:hook',
  'registry:file',
  'registry:item',
] as const;

/** Protocol category, including the registry namespace prefix. */
export type RegistryItemType = (typeof REGISTRY_ITEM_TYPES)[number];

/** Nested selectors, properties and at-rules in a registry CSS contribution. */
export type RegistryCss = { readonly [key: string]: string | RegistryCss };

/** A source file, optionally carrying its bytes in a built item. */
export interface RegistryFile {
  /** Path relative to the publisher's source root. */
  readonly path: string;
  /** Registry file category; fonts use registry:file for file payloads. */
  readonly type: Exclude<RegistryItemType, 'registry:font'>;
  /** Copied bytes; populated by ui:build. */
  readonly content?: string;
  /** Destination path or configured alias placeholder. */
  readonly target?: string;
}

/** Font metadata used by portable registry:font items. */
export interface RegistryFont {
  /** Display family name. */
  readonly family: string;
  /** Upstream provider identifier. */
  readonly provider: 'google';
  /** Provider's import identifier. */
  readonly import: string;
  /** CSS variable, including its -- prefix. */
  readonly variable: string;
  /** Requested weights. */
  readonly weight?: readonly string[];
  /** Requested language subsets. */
  readonly subsets?: readonly string[];
  /** Selector receiving the font. */
  readonly selector?: string;
  /** Optional package containing the font for non-Next.js consumers. */
  readonly dependency?: string;
}

/** Portable source or built registry item; metadata belongs to the publisher. */
export interface RegistryItem {
  /** Stable item id, unique within a registry. */
  readonly name: string;
  /** Protocol category. */
  readonly type: RegistryItemType;
  /** Human-readable label. */
  readonly title?: string;
  /** Short description. */
  readonly description?: string;
  /** Publisher attribution. */
  readonly author?: string;
  /** Package dependencies; npm or explicit Deno specifiers. */
  readonly dependencies?: readonly string[];
  /** Development package dependencies. */
  readonly devDependencies?: readonly string[];
  /** Item ids, namespace references, or HTTP URLs. */
  readonly registryDependencies?: readonly string[];
  /** Source files or built file payloads. */
  readonly files?: readonly RegistryFile[];
  /** CSS variables grouped by scheme. */
  readonly cssVars?: Readonly<{
    theme?: Readonly<Record<string, string>>;
    light?: Readonly<Record<string, string>>;
    dark?: Readonly<Record<string, string>>;
  }>;
  /** Nested CSS selectors and at-rules. */
  readonly css?: RegistryCss;
  /** Installation notes or documentation URL. */
  readonly docs?: string;
  /** Searchable categories. */
  readonly categories?: readonly string[];
  /** Extension metadata; NetScript's style source map is meta.components. */
  readonly meta?: Readonly<Record<string, unknown>>;
  /** Font metadata; required for font items by the published schema. */
  readonly font?: RegistryFont;
  /** Component style for a registry:base item. */
  readonly style?: string;
  /** Icon library for a registry:base item. */
  readonly iconLibrary?: string;
  /** Base colour for a registry:base item. */
  readonly baseColor?: string;
  /** Theme name for a registry:base item. */
  readonly theme?: string;
}

/** A portable registry catalog or authoring document. */
export interface Registry {
  /** Published schema URI. */
  readonly $schema?: string;
  /** Registry name; required for a root source registry. */
  readonly name?: string;
  /** Registry publisher homepage. */
  readonly homepage?: string;
  /** Items declared directly by this registry. */
  readonly items: readonly RegistryItem[];
  /** Relative registry.json chunks to compose during a build. */
  readonly include?: readonly string[];
  /** Publisher metadata, including NetScript collections. */
  readonly meta?: Readonly<Record<string, unknown>>;
}
