import { assertEquals, assertStringIncludes } from '@std/assert';
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

Deno.test('A14 distinguishes imported, locally-bound, and unresolved test identifiers', async () => {
  const fixtureRoot = await Deno.makeTempDir();
  const tool = join(Deno.cwd(), '.llm/tools/fitness/check-doctrine.ts');
  const cases = [
    {
      name: 'imported',
      source:
        "import { describe, it } from '@std/testing/bdd';\ndescribe('suite', () => it('works', () => {}));\n",
      code: 0,
    },
    {
      name: 'locally-bound',
      source: "const describe = (value: string) => value;\ndescribe('local helper');\n",
      code: 0,
    },
    {
      name: 'fixture-data',
      source:
        'const fixtureSource =\n  "describe(\'bare global in fixture data\', () => {});";\nexport { fixtureSource };\n',
      code: 0,
    },
    {
      name: 'unresolved',
      source: "describe('bare global in real source', () => {});\n",
      code: 1,
    },
  ] as const;

  for (const fixture of cases) {
    const root = join(fixtureRoot, fixture.name);
    await Deno.mkdir(join(root, 'tests'), { recursive: true });
    await Deno.writeTextFile(join(root, 'mod.ts'), '/** @module */\nexport const value = true;\n');
    await Deno.writeTextFile(join(root, 'tests', 'origin_test.ts'), fixture.source);
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-read', tool, '--root', root],
    }).output();
    assertEquals(output.code, fixture.code, fixture.name);
    const stdout = new TextDecoder().decode(output.stdout);
    if (fixture.name === 'unresolved') {
      assertStringIncludes(stdout, "FAIL A14: unresolved Jest/Vitest global 'describe'");
    } else {
      assertEquals(stdout.includes('FAIL A14'), false, fixture.name);
    }
  }
});
