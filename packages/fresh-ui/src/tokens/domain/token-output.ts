import type {
  TokenDensity,
  TokenDocument,
  TokenPreset,
  TokenScheme,
  TokenValue,
} from './token-contract.ts';
import type { TokenSources } from './resolve-tokens.ts';
import { TOKEN_PRESETS } from './token-presets.ts';

/** One exported token, compatible with the design route's original manifest. */
export interface ExportedToken {
  /** DTCG type name. */
  readonly type: string;
  /** CSS value, preserving semantic references and native mixes. */
  readonly value: string;
  /** Registered custom property, including the --ns- prefix. */
  readonly cssVar: string;
  /** Display category path used by the design routes. */
  readonly path: readonly string[];
  /** Computed sRGB hex color, including alpha when needed. */
  readonly hex?: string;
  /** Color fallback emitted before its modern CSS value. */
  readonly fallback?: string;
}

/** SD's resolved value is retained for Figma and contrast, away from browser bundles. */
export interface BuiltToken extends ExportedToken {
  /** Resolved DTCG value, including computed vendor derivations. */
  readonly resolved: TokenValue;
  /** Exact Figma style when its CSS meaning is carried in an extension. */
  readonly sourceStyle?: string;
  /** Theme set input retained in catalogs and loaded into NS One CSS by aliases. */
  readonly sourceOnly?: boolean;
}

/** One requested resolver permutation and its fixed effective preset. */
export interface TokenContextOutput {
  /** Effective language preset and its fixed axes. */
  readonly preset: TokenPreset;
  /** Selected light or dark scheme. */
  readonly scheme: TokenScheme;
  /** Resolver input; effective geometry comes from the preset. */
  readonly requestedDensity: TokenDensity;
  /** Exported roles keyed by custom-property name without --ns-. */
  readonly tokens: Readonly<Record<string, BuiltToken>>;
}

/** Build input; app aliases apply last to the semantic tier in every context. */
export interface TokenBuildOptions {
  /** App builds skip catalog-only Figma outputs. */
  readonly target?: 'catalog' | 'app';
  /** Include separate design preview styles in app output. */
  readonly previews?: boolean;
  /** Initial preset for root CSS and the generated preset configuration. */
  readonly preset?: string;
  /** Alias-only semantic app layer applied after all source modifiers. */
  readonly override?: TokenDocument;
  /** Caller-owned DTCG inputs; defaults to bundled sources. */
  readonly sources?: TokenSources;
}

/** All output bytes come from registered Style Dictionary formats. */
export interface TokenBuildResult {
  /** Relative output filenames mapped to deterministic UTF-8 content. */
  readonly files: Readonly<Record<string, string>>;
  /** Every requested scheme × preset × density context. */
  readonly contexts: readonly TokenContextOutput[];
  /** Selected initial preset. */
  readonly preset: TokenPreset;
}

/** Five core web files; design preview styles are explicitly opt-in. */
export const APP_TOKEN_FILES: readonly string[] = [
  'tokens.css',
  'theme-bridge.css',
  'tokens.json',
  'fonts.json',
  'theme-preset.json',
];

/** Separate stylesheets installed only for development design previews. */
export const PREVIEW_TOKEN_FILES: readonly string[] = TOKEN_PRESETS.map((preset) =>
  `presets/${preset.id}.css`
);
