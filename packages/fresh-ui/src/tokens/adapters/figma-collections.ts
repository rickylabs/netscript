import primitives from '../../../tokens/figma/primitives.json' with { type: 'json' };
import scheme from '../../../tokens/figma/scheme.json' with { type: 'json' };
import theme from '../../../tokens/figma/theme.json' with { type: 'json' };
import density from '../../../tokens/figma/density.json' with { type: 'json' };
import gray from '../../../tokens/figma/base-gray.json' with { type: 'json' };
import accent from '../../../tokens/figma/base-accent.json' with { type: 'json' };
import flavor from '../../../tokens/figma/studio-flavor.json' with { type: 'json' };
import type { FigmaCollection } from '../domain/token-contract.ts';

/** Original value/alias/scopes/syntax snapshots used by round-trip formats. */
export function figmaCollections(): readonly FigmaCollection[] {
  return [primitives, scheme, theme, density, gray, accent, flavor] as FigmaCollection[];
}
