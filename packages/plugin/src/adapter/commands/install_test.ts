import { assertEquals } from '@std/assert';

import { runInstallCommand } from './install.ts';
import { createTestContext, createTestPlugin, MemoryFileSystem } from '../test_fixtures.ts';
import { textArtifact } from '../item/artifact.ts';

Deno.test('runInstallCommand writes starter artifacts through the shared emit path', async () => {
  const fileSystem = new MemoryFileSystem();
  const result = await runInstallCommand({
    plugin: createTestPlugin(),
    context: createTestContext(fileSystem),
  });

  assertEquals(result.status, 'applied');
  assertEquals(result.createdFiles, ['src/jobs/starter.ts']);
  assertEquals(
    fileSystem.files.get('/workspace/src/jobs/starter.ts'),
    'export const id = "starter";',
  );
});

Deno.test('runInstallCommand omits samples and emits alternate structural artifacts', async () => {
  const fileSystem = new MemoryFileSystem();
  const plugin = createTestPlugin();
  const result = await runInstallCommand({
    plugin: {
      ...plugin,
      install: {
        ...plugin.install,
        starterResources: [
          {
            scaffolder: {
              name: 'sample',
              emit: () => [textArtifact('src/sample.ts', 'export const sample = true;')],
            },
            input: {},
            samples: { kind: 'omit' },
          },
          {
            scaffolder: {
              name: 'sample-barrel',
              emit: () => [textArtifact('src/mod.ts', "export * from './sample.ts';")],
            },
            input: {},
            samples: {
              kind: 'alternate',
              scaffolder: {
                name: 'empty-barrel',
                emit: () => [textArtifact('src/mod.ts', 'export {};')],
              },
              input: {},
            },
          },
        ],
      },
    },
    context: {
      ...createTestContext(fileSystem),
      options: { includeSamples: false },
    },
  });

  assertEquals(result.createdFiles, ['src/mod.ts']);
  assertEquals(fileSystem.files.has('/workspace/src/sample.ts'), false);
  assertEquals(fileSystem.files.get('/workspace/src/mod.ts'), 'export {};');
});

Deno.test('runInstallCommand preserves emit-all behavior when samples policy is undefined', async () => {
  const fileSystem = new MemoryFileSystem();
  const result = await runInstallCommand({
    plugin: createTestPlugin(),
    context: {
      ...createTestContext(fileSystem),
      options: { includeSamples: false },
    },
  });

  assertEquals(result.createdFiles, ['src/jobs/starter.ts']);
});

Deno.test('runInstallCommand reports plugin-declared UI registry requirements', async () => {
  const fileSystem = new MemoryFileSystem();
  const plugin = createTestPlugin();
  const result = await runInstallCommand({
    plugin: {
      ...plugin,
      install: { ...plugin.install, uiRegistryItems: ['markdown'] },
    },
    context: createTestContext(fileSystem),
  });

  assertEquals(result.uiRegistryItems, ['markdown']);
});
