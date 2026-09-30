import { assertEquals, assertMatch } from '@std/assert';

Deno.test('the Harness matrix task and both imports share one full commit SHA', async () => {
  const config = JSON.parse(await Deno.readTextFile('deno.json')) as {
    imports: Record<string, string>;
    tasks: Record<string, string>;
  };
  const pointers = [
    ['agentic:matrix', config.tasks['agentic:matrix'], 'cli/matrix-view.ts', 'deno run --no-lock '],
    ['@harness/matrix', config.imports['@harness/matrix'], 'delegation-matrix.ts', ''],
    ['@harness/models', config.imports['@harness/models'], 'models.ts', ''],
  ];
  const revisions = pointers.map(([name, pointer, file, prefix]) => {
    const pattern = new RegExp(
      `^${prefix}https://raw\\.githubusercontent\\.com/rickylabs/harness/([a-f0-9]{40})/packages/routing/matrix/${
        file.replaceAll('.', '\\.')
      }$`,
    );
    assertMatch(pointer, pattern, `${name} must pin its Harness source to a full commit SHA`);
    return pointer.match(pattern)![1];
  });
  assertEquals(revisions[0], revisions[1], 'agentic:matrix and @harness/matrix must share one SHA');
  assertEquals(
    revisions[2],
    revisions[1],
    '@harness/models and @harness/matrix must share one SHA',
  );
});
