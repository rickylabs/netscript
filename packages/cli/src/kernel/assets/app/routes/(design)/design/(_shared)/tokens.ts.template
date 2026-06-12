import manifest from '@app/assets/tokens.json' with { type: 'json' };

/**
 * One entry from the generated design-token manifest (`assets/tokens.json`).
 */
export interface DesignToken {
  readonly name: string;
  readonly type: string;
  readonly value: string;
  readonly cssVar: string;
  readonly path: readonly string[];
}

/** A primitive color ramp (gray, copper, ...) in ascending step order. */
export interface ColorRamp {
  readonly name: string;
  readonly steps: readonly DesignToken[];
}

/** A semantic intent (primary, success, ...) with its companion tokens. */
export interface SemanticIntent {
  readonly role: string;
  readonly tokens: readonly DesignToken[];
}

const RAMP_ORDER = ['gray', 'copper', 'teal', 'slate', 'red', 'amber'] as const;

const INTENT_ORDER = [
  'primary',
  'secondary',
  'accent',
  'success',
  'warning',
  'destructive',
] as const;

const FOUNDATION_ORDER = [
  'bg',
  'fg',
  'surface',
  'surface-raised',
  'overlay',
  'card',
  'card-fg',
  'muted',
  'muted-fg',
  'border',
  'border-hover',
  'border-strong',
  'input-border',
  'ring',
] as const;

const allTokens: readonly DesignToken[] = Object.entries(manifest.tokens).map(
  ([name, token]) => ({
    name,
    type: token.type,
    value: String(token.value),
    cssVar: token.cssVar,
    path: token.path,
  }),
);

function tokensIn(group: string): DesignToken[] {
  return allTokens.filter((token) => token.path[0] === group);
}

/** Sorts spacing tokens by their resolved pixel size. */
function spaceSize(token: DesignToken): number {
  if (token.value.endsWith('px')) return Number.parseFloat(token.value);
  return Number.parseFloat(token.value) * 16;
}

/** Manifest metadata for the page header. */
export const tokenManifestMeta = {
  version: manifest.version,
  generatedBy: manifest.generatedBy,
  total: allTokens.length,
} as const;

/** Primitive color ramps in display order. */
export const colorRamps: readonly ColorRamp[] = RAMP_ORDER.map((name) => ({
  name,
  steps: tokensIn('color').filter((token) => token.path[1] === name),
}));

/** Theme-independent semantic foundation tokens (surfaces, text, borders). */
export const foundationTokens: readonly DesignToken[] = FOUNDATION_ORDER.map(
  (name) => tokensIn('semantic').find((token) => token.name === name),
).filter((token): token is DesignToken => token !== undefined);

/** Semantic intents with their full companion sets (base, fg, hover, subtle, border). */
export const semanticIntents: readonly SemanticIntent[] = INTENT_ORDER.map((role) => ({
  role,
  tokens: tokensIn('semantic').filter(
    (token) => token.name === role || token.name.startsWith(`${role}-`),
  ),
}));

/** Font family tokens. */
export const fontTokens: readonly DesignToken[] = tokensIn('font');

/** Type scale tokens in ascending size order. */
export const textTokens: readonly DesignToken[] = tokensIn('text');

/** Line-height tokens. */
export const leadingTokens: readonly DesignToken[] = tokensIn('leading');

/** Letter-spacing tokens. */
export const trackingTokens: readonly DesignToken[] = tokensIn('tracking');

/** Spacing scale sorted by resolved size. */
export const spaceTokens: readonly DesignToken[] = [...tokensIn('space')].sort(
  (a, b) => spaceSize(a) - spaceSize(b),
);

/** Corner radius tokens. */
export const radiusTokens: readonly DesignToken[] = tokensIn('radius');

/** Elevation (box-shadow) tokens. */
export const shadowTokens: readonly DesignToken[] = tokensIn('shadow');

/** Motion (duration + easing) tokens. */
export const easeTokens: readonly DesignToken[] = tokensIn('ease');

/** Z-index scale tokens in stacking order. */
export const zTokens: readonly DesignToken[] = [...tokensIn('z')].sort(
  (a, b) => Number.parseFloat(a.value) - Number.parseFloat(b.value),
);
