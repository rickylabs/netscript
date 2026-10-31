/** DTCG values used by the NetScript token boundary. */
export type TokenValue = string | number | boolean | null | TokenValue[] | {
  [key: string]: TokenValue;
};

/** A color mix remains an alias in the semantic tier. */
export interface TokenMixDerivation {
  /** Select the native CSS color-mix recipe. */
  readonly kind: 'mix';
  /** DTCG path of the first color. */
  readonly color: string;
  /** DTCG path of the second color, often transparent. */
  readonly with: string;
  /** First-color weight in the inclusive range 0…1. */
  readonly weight: number;
  /** Interpolation color space. */
  readonly space: 'srgb' | 'oklab';
}

/** A shadow recipe composes themeable semantic dimensions and its color. */
export interface TokenShadowDerivation {
  /** Select the composite shadow recipe. */
  readonly kind: 'shadow';
  /** DTCG path of the shadow color. */
  readonly color: string;
  /** DTCG path of the vertical offset dimension. */
  readonly offsetY: string;
  /** DTCG path of the blur dimension. */
  readonly blur: string;
  /** Horizontal offset in CSS pixels. */
  readonly offsetX: number;
  /** Spread distance in CSS pixels. */
  readonly spread: number;
}

/** Vendor derivations retain alias-only semantic values. */
export type TokenDerivation = TokenMixDerivation | TokenShadowDerivation;

/** NetScript metadata does not change DTCG value semantics. */
export interface TokenMetadata {
  /** Perceptual color retained alongside the portable sRGB Figma value. */
  readonly oklch?: { readonly components: readonly number[]; readonly alpha: number };
  /** Exported custom property registered by code. */
  readonly cssVar?: string;
  /** Exact legacy spelling or an explicit CSS expression. */
  readonly css?: string;
  /** Explicit fallback spelling, when supplied by the source. */
  readonly fallback?: string;
  /** Category path for design-route grouping. */
  readonly category?: readonly string[];
  /** Composite recipe evaluated by the output formats. */
  readonly derive?: TokenDerivation;
  /** Exact font style when DTCG has no corresponding fontStyle primitive. */
  readonly figmaStyle?: string;
  /** Original value provenance in the approved Figma export. */
  readonly figma?: {
    /** Owning Figma collection. */
    readonly collection: string;
    /** Original slash-delimited variable name. */
    readonly name: string;
    /** Selected mode in that collection. */
    readonly mode: string;
    /** Selected router mode, independent of the origin collection. */
    readonly themeSet?: 'A' | 'B';
    /** Theme collection selected by the router. */
    readonly themeCollection?: string;
    /** Active language mode in that selected collection. */
    readonly themeMode?: string;
  };
}

/** One DTCG token; composite values are validated with the official schema. */
export interface DesignToken {
  /** Explicit DTCG type; validated against the official schema. */
  readonly $type: string;
  /** Typed value or whole-token alias. */
  readonly $value: TokenValue;
  /** Human-readable source or role description. */
  readonly $description?: string;
  /** Vendor metadata, without changing the standard value contract. */
  readonly $extensions?: {
    /** NetScript output and provenance metadata. */
    readonly netscript?: TokenMetadata;
  };
}

/** A DTCG group or document. */
export interface TokenDocument {
  /** Nested groups, tokens and standard metadata such as $schema. */
  [name: string]: TokenDocument | DesignToken | string;
}

/** A named token reached through its DTCG path. */
export interface TokenEntry {
  readonly path: string;
  readonly token: DesignToken;
}

/** A resolver source can be inline or reference a document or JSON pointer. */
export type ResolverSource = { readonly $ref: string } | TokenDocument;

/** The supported DTCG 2025.10 resolver document boundary. */
export interface TokenResolver {
  /** DTCG resolver version, currently 2025.10. */
  readonly version: string;
  /** Named, ordered source sets. */
  readonly sets: Readonly<Record<string, { readonly sources: readonly ResolverSource[] }>>;
  /** Public axes and their named source contexts. */
  readonly modifiers: Readonly<
    Record<string, {
      readonly contexts: Readonly<Record<string, readonly ResolverSource[]>>;
      readonly default?: string;
    }>
  >;
  /** Ordered references to sets and modifiers. */
  readonly resolutionOrder: readonly { readonly $ref: string }[];
}

/** The two public scheme contexts. */
export const TOKEN_SCHEMES = ['light', 'dark'] as const;
/** Additional Figma densities need a public schema extension. */
export const TOKEN_DENSITIES = ['comfortable', 'compact'] as const;
/** Supported color schemes. */
export type TokenScheme = typeof TOKEN_SCHEMES[number];
/** Supported density context names. */
export type TokenDensity = typeof TOKEN_DENSITIES[number];

/** A preset fixes every axis other than scheme. */
export interface TokenPreset {
  /** Unique resolver context and registry preset ID. */
  readonly id: string;
  /** Root data-theme value. */
  readonly language: string;
  /** Studio data-flavor value, absent for other languages. */
  readonly flavor?: string;
  /** Active Theme set mode; defaults to A for existing callers. */
  readonly themeSet?: 'A' | 'B';
  /** Active mode in the Theme or Theme B collection selected by Theme set. */
  readonly themeMode: string;
  /** Active mode in the Figma Base gray collection. */
  readonly grayMode: string;
  /** Active mode in the Figma Base accent collection. */
  readonly accentMode: string;
  /** Active mode in the Figma Studio flavor collection. */
  readonly flavorMode: string;
  /** Original Figma density, including deferred public schema names. */
  readonly sourceDensity: string;
  /** Supported root data-density value fixed by this preset. */
  readonly density: TokenDensity;
}

/** Figma's export shape, kept independent of DTCG's type vocabulary. */
export interface FigmaVariable {
  readonly name: string;
  readonly type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  readonly scopes: readonly string[];
  readonly codeSyntax?: string;
  readonly description?: string;
  readonly values: Readonly<Record<string, string | number | boolean | { readonly alias: string }>>;
}

/** One collection uses its own active mode while resolving aliases. */
export interface FigmaCollection {
  readonly collection: string;
  readonly modes: readonly string[];
  readonly variables: readonly FigmaVariable[];
}

/** Enumerate tokens without interpreting their values or dropping extensions. */
export function tokenEntries(document: TokenDocument, prefix = ''): TokenEntry[] {
  const result: TokenEntry[] = [];
  for (const [name, value] of Object.entries(document)) {
    if (name.startsWith('$') || typeof value === 'string') continue;
    const path = prefix ? `${prefix}.${name}` : name;
    if ('$value' in value) result.push({ path, token: value as DesignToken });
    else result.push(...tokenEntries(value, path));
  }
  return result;
}

/** Create a typed alias, optionally exposing a registered CSS name. */
export function tokenAlias(path: string, type: string, metadata?: TokenMetadata): DesignToken {
  return {
    $type: type,
    $value: `{${path}}`,
    ...(metadata ? { $extensions: { netscript: metadata } } : {}),
  };
}
