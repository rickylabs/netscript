import { COMPONENT_ROOT, type ComponentCatalog } from './catalog.ts';
import { DOC_CONTENT_BUDGET } from '../../../packages/mcp/src/domain/docs/doc-retrieval-contract.ts';
import { documentedItems, inputHash, OUTPUT, registryItems, ROOT } from './generate.ts';
import { join } from '@std/path';

/** Independent freshness verdict for an existing built site, without regenerating its inputs. */
export function assertCatalogFresh(
  catalog: ComponentCatalog,
  expected: readonly string[],
  hash: string,
): void {
  if (catalog.inputHash !== hash) {
    throw new Error('Fresh UI docs inputs changed; rebuild docs/site.');
  }
  if (JSON.stringify(expected) !== JSON.stringify(catalog.components.map((item) => item.name))) {
    throw new Error('Fresh UI registry coverage is stale; rebuild docs/site.');
  }
}

export async function checkGeneratedSite(): Promise<
  { components: number; presets: number; maximumPageBytes: number }
> {
  const catalog: ComponentCatalog = JSON.parse(
    await Deno.readTextFile(join(OUTPUT, 'catalog.json')),
  );
  const expected = documentedItems(await registryItems()).map((item) => item.name);
  assertCatalogFresh(catalog, expected, await inputHash());
  for (const preset of catalog.presets) {
    const published = await Deno.readTextFile(
      join(ROOT, 'docs/site/_site/assets/fresh-ui/presets', preset.id + '.css'),
    );
    const source = await Deno.readTextFile(
      join(ROOT, 'packages/fresh-ui/registry/theme/presets', preset.id + '.css'),
    );
    // Lume may minify CSS; the preview catalog records the canonical values and browser tests
    // additionally verify computed roles. Every selected stylesheet must at least be present.
    if (!published.trim() || !source.trim()) throw new Error('Missing preset CSS: ' + preset.id);
  }
  let maximumPageBytes = 0;
  for (const name of expected) {
    const base = join(ROOT, 'docs/site/_site', COMPONENT_ROOT, name);
    const html = await Deno.readTextFile(join(base, 'index.html'));
    const markdown = await Deno.readTextFile(join(base, 'index.md'));
    for (
      const section of [
        'Live preview',
        'Install',
        'Usage and examples',
        'Props',
        'Keyboard',
        'Tokens',
      ]
    ) {
      if (!html.includes(section) || !markdown.includes(section)) {
        throw new Error(`${name}: missing ${section}`);
      }
    }
    const bytes = new TextEncoder().encode(markdown).byteLength;
    maximumPageBytes = Math.max(maximumPageBytes, bytes);
    if (bytes > DOC_CONTENT_BUDGET) {
      throw new Error(
        `${name}: agent twin ${bytes} exceeds ${DOC_CONTENT_BUDGET} bytes; split auxiliary reference details.`,
      );
    }
    if (!markdown.includes(`netscript ui:add ${name}`)) {
      throw new Error(`${name}: install command missing`);
    }
  }
  await Deno.stat(join(ROOT, 'docs/site/_site/create/index.html'));
  return { components: expected.length, presets: catalog.presets.length, maximumPageBytes };
}

if (import.meta.main) {
  console.log(JSON.stringify({ verdict: 'PASS', ...await checkGeneratedSite() }));
}
