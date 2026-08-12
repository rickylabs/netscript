import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { discoverDoctrineRoots } from './check-doctrine.ts';

async function expectedDoctrineRoots(repoRoot: string): Promise<string[]> {
  const roots: string[] = [];
  for (const parent of ['packages', 'plugins']) {
    for await (const entry of Deno.readDir(join(repoRoot, parent))) {
      if (!entry.isDirectory) continue;
      try {
        const config = JSON.parse(
          await Deno.readTextFile(join(repoRoot, parent, entry.name, 'deno.json')),
        ) as { name?: string };
        if (config.name) roots.push(`${parent}/${entry.name}`);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
    }
  }
  return roots.sort();
}

Deno.test('doctrine root discovery equals the independently enumerated publishable top-level units', async () => {
  const repoRoot = Deno.cwd();
  const expected = await expectedDoctrineRoots(repoRoot);
  const actual = await discoverDoctrineRoots(repoRoot);

  assertEquals(expected.length, 36);
  assertEquals(actual, expected);
  assertEquals(actual.includes('packages/plugin-streams-core'), true);
  assertEquals(actual.includes('packages/cli/e2e'), false);
});
