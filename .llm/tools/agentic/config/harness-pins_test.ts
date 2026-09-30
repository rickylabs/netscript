import { assert, assertEquals, assertMatch } from '@std/assert';

Deno.test('the Harness matrix task and every Harness import share one full commit SHA', async () => {
  const config = JSON.parse(await Deno.readTextFile('deno.json')) as {
    imports: Record<string, string>;
    tasks: Record<string, string>;
  };
  const prefix = 'https://raw.githubusercontent.com/rickylabs/harness/';
  const imports = Object.entries(config.imports).filter(([name]) => name.startsWith('@harness/'));
  assert(imports.some(([name]) => name === '@harness/matrix'));
  assert(imports.some(([name]) => name === '@harness/models'));
  const task = config.tasks['agentic:matrix'];
  assertMatch(
    task,
    /^deno run --no-lock https:\/\/raw\.githubusercontent\.com\/rickylabs\/harness\/[a-f0-9]{40}\/packages\/routing\/matrix\/cli\/matrix-view\.ts$/,
  );
  const revision = task.slice(`deno run --no-lock ${prefix}`.length).split('/')[0];
  for (const [name, pointer] of imports) {
    assertMatch(
      pointer,
      /^https:\/\/raw\.githubusercontent\.com\/rickylabs\/harness\/[a-f0-9]{40}\/packages\/routing\/matrix\/[a-z-]+\.ts$/,
      name,
    );
    assertEquals(
      pointer.slice(prefix.length).split('/')[0],
      revision,
      `${name} and agentic:matrix must share one SHA`,
    );
  }
});
