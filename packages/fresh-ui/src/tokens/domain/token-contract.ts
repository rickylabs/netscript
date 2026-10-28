/** DTCG values used by the NetScript token boundary. */
export type TokenValue = string | number | boolean | null | TokenValue[] | {
  [key: string]: TokenValue;
};

/** A color mix remains an alias in the semantic tier. */
export interface TokenDerivation {
  readonly kind: 'mix';
  readonly color: string;
  readonly with: string;
  readonly weight: number;
  readonly space: 'srgb' | 'oklab';
}

/** NetScript metadata does not change DTCG value semantics. */
export interface TokenMetadata {
  readonly cssVar?: string;
  readonly css?: string;
  readonly fallback?: string;
  readonly category?: readonly string[];
  readonly derive?: TokenDerivation;
  readonly figma?: { readonly collection: string; readonly name: string; readonly mode: string };
}

/** One DTCG token; composite values are validated with the official schema. */
export interface DesignToken {
  readonly $type: string;
  readonly $value: TokenValue;
  readonly $description?: string;
  readonly $extensions?: { readonly netscript?: TokenMetadata };
}

/** A DTCG group or document. */
export interface TokenDocument {
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
  readonly version: string;
  readonly sets: Readonly<Record<string, { readonly sources: readonly ResolverSource[] }>>;
  readonly modifiers: Readonly<
    Record<string, {
      readonly contexts: Readonly<Record<string, readonly ResolverSource[]>>;
      readonly default?: string;
    }>
  >;
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
  readonly id: string;
  readonly language: string;
  readonly flavor?: string;
  readonly themeMode: string;
  readonly grayMode: string;
  readonly accentMode: string;
  readonly flavorMode: string;
  readonly sourceDensity: string;
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
