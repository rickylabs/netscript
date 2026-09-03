import { assertEquals } from '@std/assert';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { ContractVersionRegistry } from './version-registry.ts';

Deno.test('contract version registry writes canonical aggregates', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/contracts/versions/v1/users.contract.ts', 'export {};\n');
  const formattedPaths: string[] = [];
  const formatter: GeneratedSourceFormatterPort = {
    formatContent: (path, content) => {
      formattedPaths.push(path);
      return Promise.resolve(`// canonical\n${content}`);
    },
    formatFiles: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };
  const registry = new ContractVersionRegistry(fs, formatter);

  const versionPath = await registry.regenerate('/project/contracts', 'v1');
  const rootPath = await registry.regenerateRoot('/project/contracts');

  assertEquals(formattedPaths, [versionPath, rootPath]);
  assertEquals((await fs.readFile(versionPath)).startsWith('// canonical\n'), true);
  assertEquals((await fs.readFile(rootPath)).startsWith('// canonical\n'), true);
});
