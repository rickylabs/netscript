import { verifiedFigmaProvenance } from './figma-provenance.ts';
import { figmaTokenSources } from '../src/tokens/adapters/figma/figma-token-sources.ts';
import type { FigmaCollection } from '../src/tokens/domain/token-contract.ts';
import { TOKEN_PRESETS } from '../src/tokens/domain/token-presets.ts';

const root = new URL('../tokens/', import.meta.url);
const output = new URL('v2/', root);
await verifiedFigmaProvenance(new URL('figma/', root));
const check = Deno.args.includes('--check');
if (!check) await Deno.mkdir(output, { recursive: true });
const files = [
  'primitives',
  'scheme',
  'theme',
  'theme-b',
  'theme-set',
  'density',
  'base-gray',
  'base-accent',
  'studio-flavor',
];
const collections: FigmaCollection[] = [];
for (const file of files) {
  collections.push(JSON.parse(await Deno.readTextFile(new URL(`figma/${file}.json`, root))));
}
const sources = figmaTokenSources(collections);
for (
  const [file, document] of Object.entries({
    ...sources.documents,
    'tokens.resolver.json': sources.resolver,
  })
) {
  // Component DTCG is authored directly and never replaced by the importer.
  if (file === 'component.tokens.json') continue;
  const expected = `${JSON.stringify(document, null, 2)}\n`;
  if (check) {
    const actual = await Deno.readTextFile(new URL(file, output)).catch(() => undefined);
    if (actual !== expected) throw new Error(`Stale generated DTCG source: ${file}`);
  } else await Deno.writeTextFile(new URL(file, output), expected);
}
console.log(`Imported ${TOKEN_PRESETS.length} presets with the shared Figma source composer.`);
