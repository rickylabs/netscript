import type { TokenPreset } from './token-contract.ts';

/** Figma router collection owns the shared theme WEB names. */
export const FIGMA_THEME_SET = 'Theme set';
/** Each router mode selects exactly one theme collection. */
export const FIGMA_THEME_COLLECTIONS: Readonly<Record<'A' | 'B', string>> = {
  A: 'Theme',
  B: 'Theme B',
};

const studio = (
  flavor: string,
  grayMode: string,
  accentMode: string,
  sourceDensity: string,
  density: TokenPreset['density'],
): TokenPreset => ({
  id: `studio-${flavor.toLowerCase()}`,
  language: 'studio',
  flavor: flavor.toLowerCase(),
  themeSet: 'A',
  themeMode: 'Studio',
  grayMode,
  accentMode,
  flavorMode: flavor,
  sourceDensity,
  density,
});

const language = (
  id: string,
  themeMode: string,
  grayMode = 'Neutral',
  accentMode = 'Ink',
  density: TokenPreset['density'] = 'comfortable',
  themeSet: 'A' | 'B' = 'A',
): TokenPreset => ({
  id,
  language: id,
  themeSet,
  themeMode,
  grayMode,
  accentMode,
  flavorMode: 'Utility',
  sourceDensity: density === 'compact' ? 'Compact' : 'Comfortable',
  density,
});

/** Approved language presets; base collection inputs are not free UI axes. */
export const TOKEN_PRESETS: readonly TokenPreset[] = [
  language('ns-one', 'Studio'),
  studio('Utility', 'Neutral', 'Ink', 'Compact', 'compact'),
  studio('Cloud', 'Slate', 'Blue', 'Comfortable', 'comfortable'),
  studio('Workshop', 'Sand', 'Orange', 'Chunky', 'comfortable'),
  studio('Playful', 'Mauve', 'Violet', 'Chunky', 'comfortable'),
  studio('Ledger', 'Slate', 'Indigo', 'Dense', 'compact'),
  studio('Atelier', 'Sand', 'Tomato', 'Airy', 'comfortable'),
  studio('Signal', 'Neutral', 'Lime', 'Dense', 'compact'),
  { ...language('ledger', 'Ledger', 'Slate', 'Indigo', 'compact'), sourceDensity: 'Dense' },
  { ...language('signal', 'Signal', 'Neutral', 'Lime', 'compact'), sourceDensity: 'Dense' },
  language('glass', 'Glass', 'Slate', 'Blue'),
  language('macos-27', 'macOS 27', 'Slate', 'Blue', 'comfortable', 'B'),
  language('apple-classic', 'Apple Classic', 'Slate', 'Blue', 'comfortable', 'B'),
  language('fluent-2-web', 'Fluent 2 Web', 'Neutral', 'Blue', 'comfortable', 'B'),
  language('tonal', 'Tonal', 'Mauve', 'Violet'),
  language('bloom', 'Bloom', 'Mauve', 'Violet', 'comfortable', 'B'),
  language('cupertino', 'Cupertino', 'Slate', 'Blue', 'comfortable', 'B'),
  language('liquid', 'Liquid', 'Slate', 'Blue', 'comfortable', 'B'),
  language('fluent', 'Fluent', 'Neutral', 'Blue'),
  language('brutal', 'Brutal', 'Sand', 'Orange'),
  language('filigrane', 'Filigrane', 'Sand', 'Tomato'),
  language('terminal', 'Terminal', 'Neutral', 'Lime', 'compact', 'B'),
  language('pixel', 'Pixel', 'Sand', 'Orange'),
  language('tactile', 'Tactile', 'Slate', 'Blue'),
];

/** Reject unknown presets instead of silently changing a visual language. */
export function tokenPreset(id: string): TokenPreset {
  const preset = TOKEN_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown token preset: ${id}`);
  return preset;
}

/** Only the target collection's active mode participates in a Figma alias. */
export function figmaModes(preset: TokenPreset, scheme: 'light' | 'dark'): Record<string, string> {
  return {
    Primitives: 'Value',
    Scheme: scheme === 'light' ? 'Light' : 'Dark',
    [FIGMA_THEME_SET]: preset.themeSet ?? 'A',
    [FIGMA_THEME_COLLECTIONS.A]: preset.themeSet === 'B' ? 'Studio' : preset.themeMode,
    [FIGMA_THEME_COLLECTIONS.B]: preset.themeSet === 'B' ? preset.themeMode : 'Bloom',
    'Base gray': preset.grayMode,
    'Base accent': preset.accentMode,
    'Studio flavor': preset.flavorMode,
    Density: preset.sourceDensity,
  };
}
