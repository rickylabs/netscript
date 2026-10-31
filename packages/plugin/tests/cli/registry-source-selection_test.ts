import { assertEquals, assertRejects } from '@std/assert';
import { REGISTRY_IGNORE_DIRECTIVE, selectRegistrySources } from '../../src/cli/mod.ts';

Deno.test('registry opt-out is an exact first-line comment, preserving candidate order', async () => {
  const contents = new Map([
    ['helper.ts', `${REGISTRY_IGNORE_DIRECTIVE}\nthrow new Error('never import');`],
    ['bom.ts', `\uFEFF\t${REGISTRY_IGNORE_DIRECTIVE}  \r\nexport const helper = 1;`],
    ['eof.ts', REGISTRY_IGNORE_DIRECTIVE],
    ['valid.ts', 'export default { id: "valid" };'],
    ['string.ts', `export const example = '${REGISTRY_IGNORE_DIRECTIVE}';`],
    ['later.ts', `// ordinary header\n${REGISTRY_IGNORE_DIRECTIVE}\nexport const helper = 1;`],
    ['blank.ts', `\n${REGISTRY_IGNORE_DIRECTIVE}`],
    ['suffix.ts', `${REGISTRY_IGNORE_DIRECTIVE}-extra`],
    ['reason.ts', `${REGISTRY_IGNORE_DIRECTIVE} because this is a helper`],
    ['block.ts', `/* ${REGISTRY_IGNORE_DIRECTIVE} */`],
  ]);
  const read: string[] = [];
  const selection = await selectRegistrySources({
    readTextFile: (path) => {
      read.push(path);
      return Promise.resolve(contents.get(path));
    },
  }, [...contents.keys()]);
  assertEquals(selection.excludedSourceFiles, ['helper.ts', 'bom.ts', 'eof.ts']);
  assertEquals(selection.sourceFiles, [
    'valid.ts',
    'string.ts',
    'later.ts',
    'blank.ts',
    'suffix.ts',
    'reason.ts',
    'block.ts',
  ]);
  assertEquals(read, [...contents.keys()]);
  assertEquals(Object.isFrozen(selection.sourceFiles), true);
  assertEquals(Object.isFrozen(selection.excludedSourceFiles), true);
});

Deno.test('registry opt-out preserves read failures rather than silently skipping a module', async () => {
  await assertRejects(
    () =>
      selectRegistrySources({
        readTextFile: () => Promise.reject(new Error('source unreadable')),
      }, ['helper.ts']),
    Error,
    'source unreadable',
  );
});
