import { assertEquals, assertRejects } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { createUiBuildCommand } from './build-ui-command.ts';

Deno.test('ui:build parses publisher paths and validates the complete build before writing', async () => {
  const fs = new MemoryFileSystemAdapter();
  const registry = {
    name: 'acme',
    homepage: 'https://example.com',
    items: [{ name: 'x', type: 'registry:ui', files: [{ path: 'x.ts', type: 'registry:ui' }] }],
  };
  await fs.writeFile('/source/registry.json', JSON.stringify(registry));
  const before = new Map(fs.getFiles());
  const command = () =>
    createUiBuildCommand({
      fs,
      paths: { assertContained: () => Promise.resolve() },
      resolvePath: (path) => path ?? '/',
      print: () => {},
    });
  const args = ['--registry', '/source/registry.json', '--output', '/public/r'];
  await assertRejects(() => command().parse(args));
  assertEquals(fs.getFiles(), before);
  await fs.writeFile('/source/x.ts', 'export const x = 1;');
  await command().parse(args);
  assertEquals(
    JSON.parse(await fs.readFile('/public/r/x.json')).files[0].content,
    'export const x = 1;',
  );
  assertEquals(JSON.parse(await fs.readFile('/public/r/registry.json')).name, 'acme');
});
