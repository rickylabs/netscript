import type { TokenResolver } from './token-contract.ts';
import { TOKEN_PRESETS } from './token-presets.ts';

/** Derive the one resolver from registered presets, independently of generated assets. */
export function createTokenResolver(): TokenResolver & {
  readonly $schema: string;
  readonly name: string;
} {
  return {
    $schema: 'https://www.designtokens.org/schemas/2025.10/resolver.json',
    version: '2025.10',
    name: 'NetScript tokens v2',
    sets: {
      primitives: { sources: [{ $ref: 'primitives.tokens.json' }] },
      semantics: { sources: [{ $ref: 'semantic.tokens.json' }] },
      components: { sources: [{ $ref: 'component.tokens.json' }] },
    },
    modifiers: {
      scheme: {
        default: 'light',
        contexts: {
          light: [{ $ref: 'themes/light.tokens.json' }],
          dark: [{ $ref: 'themes/dark.tokens.json' }],
        },
      },
      theme: {
        default: 'ns-one',
        contexts: Object.fromEntries(
          TOKEN_PRESETS.map((
            preset,
          ) => [preset.id, [{ $ref: `presets.tokens.json#/${preset.id}` }]]),
        ),
      },
      density: {
        default: 'comfortable',
        contexts: {
          comfortable: [{ $ref: 'density.tokens.json#/comfortable' }],
          compact: [{ $ref: 'density.tokens.json#/compact' }],
        },
      },
    },
    resolutionOrder: [
      { $ref: '#/sets/primitives' },
      { $ref: '#/sets/semantics' },
      { $ref: '#/modifiers/density' },
      { $ref: '#/modifiers/theme' },
      { $ref: '#/modifiers/scheme' },
      { $ref: '#/sets/components' },
    ],
  };
}
