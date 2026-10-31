import { assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { createUiRemoveCommand } from './remove-ui-command.ts';

Deno.test('ui:remove reports an absent registry item without a zero-file success message', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/fresh-ui.lock.json', JSON.stringify({ version: 1, items: {} }));
  const before = new Map(fs.getFiles());
  const output: string[] = [];
  const command = createUiRemoveCommand({
    installDependencies: { fs },
    resolveUiAppRoot: () => Promise.resolve('/app'),
    print: (line) => output.push(line),
  });
  await assertRejects(
    () => command.parse(['missing']),
    Error,
    "Registry item 'missing' is not installed",
  );
  assertEquals(output, []);
  assertEquals(fs.getFiles(), before);
});

Deno.test('ui:remove reports no legacy copies without claiming zero files were removed', async () => {
  const fs = new MemoryFileSystemAdapter();
  const output: string[] = [];
  await createUiRemoveCommand({
    installDependencies: { fs },
    resolveUiAppRoot: () => Promise.resolve('/app'),
    print: (line) => output.push(line),
  }).parse(['button']);
  assertEquals(output, ["Nothing to remove for registry item 'button'."]);
});
