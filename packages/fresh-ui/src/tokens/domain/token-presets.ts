import type { TokenPreset } from './token-contract.ts';

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
): TokenPreset => ({
  id,
  language: id,
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
  language('tonal', 'Tonal', 'Mauve', 'Violet'),
  language('bloom', 'Tonal', 'Mauve', 'Violet'),
  language('cupertino', 'Glass', 'Slate', 'Blue'),
  language('liquid', 'Glass', 'Slate', 'Blue'),
  language('fluent', 'Fluent', 'Neutral', 'Blue'),
  language('brutal', 'Brutal', 'Sand', 'Orange'),
  language('filigrane', 'Filigrane', 'Sand', 'Tomato'),
  language('terminal', 'Signal', 'Neutral', 'Lime', 'compact'),
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
    Theme: preset.themeMode,
    'Base gray': preset.grayMode,
    'Base accent': preset.accentMode,
    'Studio flavor': preset.flavorMode,
    Density: preset.sourceDensity,
  };
}
