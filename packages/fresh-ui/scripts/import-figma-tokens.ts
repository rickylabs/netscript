import { importFigmaTokens } from '../src/tokens/adapters/figma-token-source.ts';
import type { FigmaCollection, TokenDocument } from '../src/tokens/domain/token-contract.ts';
import { TOKEN_PRESETS } from '../src/tokens/domain/token-presets.ts';
import { assertSemanticAliases } from '../src/tokens/domain/resolve-tokens.ts';

const root = new URL('../tokens/', import.meta.url);
const output = new URL('v2/', root);
const check = Deno.args.includes('--check');
if (!check) await Deno.mkdir(output, { recursive: true });
const files = [
  'primitives',
  'scheme',
  'theme',
  'density',
  'base-gray',
  'base-accent',
  'studio-flavor',
];
const collections: FigmaCollection[] = [];
for (const file of files) {
  collections.push(JSON.parse(await Deno.readTextFile(new URL(`figma/${file}.json`, root))));
}
const legacy = JSON.parse(await Deno.readTextFile(new URL('legacy.json', root)));
const result = importFigmaTokens(collections, legacy);
// DTCG contexts share unchanged roles; avoid duplicating whole language packs 18 times.
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
const schema = 'https://www.designtokens.org/schemas/2025.10/format.json';
const write = async (file: string, document: object): Promise<void> => {
  const expected = `${JSON.stringify(document, null, 2)}\n`;
  if (check) {
    const actual = await Deno.readTextFile(new URL(file, output)).catch(() => undefined);
    if (actual !== expected) throw new Error(`Stale generated DTCG source: ${file}`);
  } else await Deno.writeTextFile(new URL(file, output), expected);
};
assertSemanticAliases(result.presets);
assertSemanticAliases(result.schemes.light);
assertSemanticAliases(result.schemes.dark);
await write('primitives.tokens.json', { $schema: schema, ...result.primitives });
await write('presets.tokens.json', { $schema: schema, ...result.presets });
await write('semantic.tokens.json', { $schema: schema, context: shared, ...result.schemes.light });
await write('themes/light.tokens.json', { $schema: schema, ...result.schemes.light });
await write('themes/dark.tokens.json', { $schema: schema, ...result.schemes.dark });
await write('density.tokens.json', { $schema: schema, comfortable: {}, compact: {} });

// Component DTCG is authored directly; Figma has no component collection yet.
await write('tokens.resolver.json', {
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
        TOKEN_PRESETS.map((preset) => [preset.id, [{ $ref: `presets.tokens.json#/${preset.id}` }]]),
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
});
console.log(
  `Imported ${TOKEN_PRESETS.length} presets, ${Object.keys(result.roles).length} registered roles.`,
);
