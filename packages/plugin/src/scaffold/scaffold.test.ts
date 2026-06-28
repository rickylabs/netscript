import { assertEquals } from '@std/assert';
import { MemoryFileSystemAdapter } from '../adapters/memory-file-system-adapter.ts';
import type { PluginLogger } from '../domain/mod.ts';
import type { ScaffolderContext } from '../protocol/mod.ts';
import type { ScaffoldArtifact } from './artifact.ts';
import { createPluginScaffold } from './scaffold.ts';

const silentLogger: PluginLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

function context(workspaceRoot: string, dryRun: boolean): ScaffolderContext {
  return { workspaceRoot, options: { pluginName: 'demo' }, dryRun, logger: silentLogger };
}

const artifacts: readonly ScaffoldArtifact[] = [
  { path: 'plugins/demo/mod.ts', content: 'export const demo = true;\n' },
  { path: 'plugins/demo/database/schema.prisma', content: 'model Demo { id String @id }\n' },
];

Deno.test('createPluginScaffold writes expected artifacts through the file system port', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts: () => artifacts });

  const result = await scaffold(context('/ws', false));

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, [
    'plugins/demo/mod.ts',
    'plugins/demo/database/schema.prisma',
  ]);
  assertEquals(result.modifiedFiles, []);
  assertEquals(result.databaseMigrationsAdded, true);
  assertEquals(fileSystem.files.get('/ws/plugins/demo/mod.ts'), 'export const demo = true;\n');
  assertEquals(
    fileSystem.files.get('/ws/plugins/demo/database/schema.prisma'),
    'model Demo { id String @id }\n',
  );
});

Deno.test('createPluginScaffold dryRun writes nothing and reports planned', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts: () => artifacts });

  const result = await scaffold(context('/ws', true));

  assertEquals(result.status, 'planned');
  assertEquals(result.createdFiles, [
    'plugins/demo/mod.ts',
    'plugins/demo/database/schema.prisma',
  ]);
  assertEquals(fileSystem.files.size, 0);
});

Deno.test('createPluginScaffold skips unchanged artifacts', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  fileSystem.files.set('/ws/plugins/demo/mod.ts', 'export const demo = true;\n');
  fileSystem.files.set(
    '/ws/plugins/demo/database/schema.prisma',
    'model Demo { id String @id }\n',
  );
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts: () => artifacts });

  const result = await scaffold(context('/ws', false));

  assertEquals(result.status, 'skipped');
  assertEquals(result.createdFiles, []);
  assertEquals(result.modifiedFiles, []);
});

Deno.test('createPluginScaffold reports modified artifacts when content differs', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  fileSystem.files.set('/ws/plugins/demo/mod.ts', 'export const demo = false;\n');
  fileSystem.files.set(
    '/ws/plugins/demo/database/schema.prisma',
    'model Demo { id String @id }\n',
  );
  const scaffold = createPluginScaffold({ fileSystem, buildArtifacts: () => artifacts });

  const result = await scaffold(context('/ws', false));

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, []);
  assertEquals(result.modifiedFiles, ['plugins/demo/mod.ts']);
  assertEquals(fileSystem.files.get('/ws/plugins/demo/mod.ts'), 'export const demo = true;\n');
});
