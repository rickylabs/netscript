import { assertFigmaTokenNames } from '../../packages/fresh-ui/src/tokens/adapters/figma/figma-token-names.ts';
import {
  exportFigmaTokenBundle,
  importFigmaTokenBundle,
} from '../../packages/fresh-ui/src/tokens/adapters/figma/figma-round-trip.ts';
import { validateFigmaSnapshot } from '../../packages/fresh-ui/src/tokens/domain/figma/figma-snapshot.ts';
import { z } from 'zod';

/** Validate pinned snapshots and portable export items using the same checker as the plugin and CLI. */
async function main(): Promise<void> {
  const args = Deno.args.filter((arg) => arg !== '--');
  const files: string[] = [];
  let negative = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--negative-control') negative = true;
    else if (args[index] === '--theme' && args[index + 1]) files.push(args[++index]);
    else throw new Error('Usage: check:figma-names [--theme <item.json>] [--negative-control]');
  }
  const root = new URL('../../packages/fresh-ui/tokens/figma/', import.meta.url);
  const index = z.object({
    collections: z.array(z.object({ file: z.string().regex(/^[a-z-]+\.json$/) })),
  }).parse(JSON.parse(await Deno.readTextFile(new URL('index.json', root))));
  const snapshot = validateFigmaSnapshot(
    await Promise.all(
      index.collections.map(async (entry) =>
        JSON.parse(await Deno.readTextFile(new URL(entry.file, root)))
      ),
    ),
  );
  assertFigmaTokenNames(snapshot);
  const item = z.object({
    type: z.literal('registry:theme'),
    meta: z.object({
      netscript: z.object({ version: z.literal(1), preset: z.string(), figma: z.unknown() })
        .strict(),
    }).strict(),
  }).passthrough();
  const fixtures: unknown[] = files.length
    ? await Promise.all(files.map(async (file) => JSON.parse(await Deno.readTextFile(file))))
    : [{
      type: 'registry:theme',
      meta: {
        netscript: {
          version: 1,
          preset: 'studio-utility',
          figma: exportFigmaTokenBundle(snapshot),
        },
      },
    }];
  if (negative) {
    const bundle = exportFigmaTokenBundle(snapshot);
    fixtures.push({
      type: 'registry:theme',
      meta: {
        netscript: {
          version: 1,
          preset: 'studio-utility',
          figma: {
            ...bundle,
            collections: bundle.collections.map((collection) =>
              collection.collection === 'Scheme'
                ? {
                  ...collection,
                  variables: collection.variables.map((variable, index) =>
                    index === 0 ? { ...variable, codeSyntax: 'var(--ns-unknown-export)' } : variable
                  ),
                }
                : collection
            ),
          },
        },
      },
    });
  }
  for (const candidate of fixtures) {
    importFigmaTokenBundle(item.parse(candidate).meta.netscript.figma);
  }
  console.log(
    `Figma names: PASS; pinned variables=${
      snapshot.reduce((sum, collection) => sum + collection.variables.length, 0)
    } portable items=${fixtures.length}`,
  );
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Figma token name validation failed');
    Deno.exit(1);
  }
}
