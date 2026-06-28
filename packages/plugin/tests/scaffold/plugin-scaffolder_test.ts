import { assertEquals } from '@std/assert';

import { MemoryFileSystemAdapter } from '../../src/adapters/mod.ts';
import type { FileSystemPort } from '../../src/ports/mod.ts';
import type { ScaffolderContext } from '../../src/protocol/mod.ts';
import { parseScaffolderContextArgs, PluginScaffolder } from '../../src/scaffold/mod.ts';
import type { PluginScaffoldManifestSpec, ScaffoldArtifact } from '../../src/scaffold/mod.ts';

Deno.test('PluginScaffolder reports dry-run changes as planned without writing files', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffolder = new TestScaffolder(fileSystem, [{
    path: 'plugins/example/mod.ts',
    content: 'export const name = "example";\n',
  }]);

  const result = await scaffolder.scaffold(context({ dryRun: true }));

  assertEquals(result.status, 'planned');
  assertEquals(result.createdFiles, ['plugins/example/mod.ts']);
  assertEquals(result.modifiedFiles, []);
  assertEquals(await fileSystem.exists('/workspace/plugins/example/mod.ts'), false);
});

Deno.test('PluginScaffolder writes changed artifacts as applied', async () => {
  const fileSystem = new MemoryFileSystemAdapter();
  const scaffolder = new TestScaffolder(fileSystem, [{
    path: 'plugins/example/mod.ts',
    content: 'export const name = "example";\n',
  }]);

  const result = await scaffolder.scaffold(context());

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, ['plugins/example/mod.ts']);
  assertEquals(result.modifiedFiles, []);
  assertEquals(
    await fileSystem.readText('/workspace/plugins/example/mod.ts'),
    'export const name = "example";\n',
  );
});

Deno.test('PluginScaffolder skips empty artifact plans', async () => {
  const scaffolder = new TestScaffolder(new MemoryFileSystemAdapter(), []);

  const result = await scaffolder.scaffold(context());

  assertEquals(result.status, 'skipped');
  assertEquals(result.createdFiles, []);
  assertEquals(result.modifiedFiles, []);
  assertEquals(result.databaseMigrationsAdded, false);
});

Deno.test('PluginScaffolder reports database migrations when prisma artifacts are planned', async () => {
  const scaffolder = new TestScaffolder(new MemoryFileSystemAdapter(), [{
    path: 'plugins/example/database/schema.prisma',
    content: 'model Example { id String @id }\n',
  }]);

  const result = await scaffolder.scaffold(context({ dryRun: true }));

  assertEquals(result.status, 'planned');
  assertEquals(result.databaseMigrationsAdded, true);
});

Deno.test('parseScaffolderContextArgs preserves the context-json invocation contract', () => {
  const parsed = parseScaffolderContextArgs([
    '--context-json',
    JSON.stringify({
      workspaceRoot: '/workspace',
      options: { pluginName: 'example' },
      dryRun: true,
    }),
  ]);

  assertEquals(parsed.workspaceRoot, '/workspace');
  assertEquals(parsed.options, { pluginName: 'example' });
  assertEquals(parsed.dryRun, true);
});

class TestScaffolder extends PluginScaffolder {
  readonly pluginName = 'example';
  readonly manifestSpec: PluginScaffoldManifestSpec = {
    name: '@netscript/plugin-example',
    displayName: 'Example',
    description: 'Example plugin.',
    capabilities: {
      hasDatabaseMigrations: false,
      hasRoutes: false,
      hasBackgroundWorkers: false,
    },
  };

  constructor(
    fileSystem: FileSystemPort,
    private readonly artifacts: readonly ScaffoldArtifact[],
  ) {
    super(fileSystem);
  }

  protected buildArtifacts(): readonly ScaffoldArtifact[] {
    return this.artifacts;
  }
}

function context(overrides: Partial<ScaffolderContext> = {}): ScaffolderContext {
  return {
    workspaceRoot: '/workspace',
    options: {},
    dryRun: false,
    logger: {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
    ...overrides,
  };
}
