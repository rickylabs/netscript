import { legacy } from '../../assets/legacy.generated.ts';
import type { FigmaCollection, TokenDocument } from '../../domain/token-contract.ts';
import { assertSemanticAliases, type TokenSources } from '../../domain/resolve-tokens.ts';
import { createTokenResolver } from '../../domain/token-resolver.ts';
import { defaultTokenSources } from '../default-token-sources.ts';
import { importFigmaTokens } from './figma-token-source.ts';

const FORMAT_SCHEMA = 'https://www.designtokens.org/schemas/2025.10/format.json';

/** Compose Figma values with the existing resolver and authored component tokens. */
export function figmaTokenSources(collections: readonly FigmaCollection[]): TokenSources {
  const result = importFigmaTokens(collections, legacy);
  assertSemanticAliases(result.presets);
  assertSemanticAliases(result.schemes.light);
  assertSemanticAliases(result.schemes.dark);
  const shared: TokenDocument = { light: {}, dark: {} };
  for (const scheme of ['light', 'dark'] as const) {
    const maps = Object.values(result.presets).map((preset) =>
      ((preset as TokenDocument).context as TokenDocument)[scheme] as TokenDocument
    );
    for (const [name, token] of Object.entries(maps[0])) {
      const serialized = JSON.stringify(token);
      if (maps.every((map) => JSON.stringify(map[name]) === serialized)) {
        (shared[scheme] as TokenDocument)[name] = token;
        for (const map of maps) delete map[name];
      }
    }
  }
  const base = defaultTokenSources();
  return {
    resolver: createTokenResolver(),
    documents: {
      ...structuredClone(base.documents),
      'primitives.tokens.json': { $schema: FORMAT_SCHEMA, ...result.primitives },
      'presets.tokens.json': { $schema: FORMAT_SCHEMA, ...result.presets },
      'semantic.tokens.json': { $schema: FORMAT_SCHEMA, context: shared, ...result.schemes.light },
      'themes/light.tokens.json': { $schema: FORMAT_SCHEMA, ...result.schemes.light },
      'themes/dark.tokens.json': { $schema: FORMAT_SCHEMA, ...result.schemes.dark },
      'density.tokens.json': { $schema: FORMAT_SCHEMA, comfortable: {}, compact: {} },
    },
  };
}
