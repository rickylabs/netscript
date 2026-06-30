import { assertEquals, assertRejects } from '@std/assert';
import {
  findGeneratedProjectRoot,
  loadGeneratedProjectRegistry,
  type ProjectFiles,
} from '../../src/cli/mod.ts';

type Definition = Readonly<{ id: string }>;

const files: ProjectFiles = {
  projectRoot: '/repo/app',
  resolve: (path) => `/repo/app/${path}`,
  writeTextFile: () => Promise.resolve(),
  readTextFile: () => Promise.resolve(undefined),
  listFiles: () => Promise.resolve([]),
  toImportUrl: (path) => `file:///repo/app/${path}`,
  relative: (path) => path.replace('/repo/app/', ''),
};

Deno.test('findGeneratedProjectRoot resolves file URLs and relative paths', () => {
  assertEquals(findGeneratedProjectRoot(undefined, '/repo/app'), '/repo/app');
  assertEquals(findGeneratedProjectRoot('nested', '/repo/app'), '/repo/app/nested');
  assertEquals(findGeneratedProjectRoot('file:///repo/app', '/fallback'), '/repo/app');
});

Deno.test('loadGeneratedProjectRegistry validates exported entries', async () => {
  const registry = await loadGeneratedProjectRegistry({
    files,
    registryPath: '.netscript/generated/jobs.ts',
    exportName: 'jobRegistry',
    isDefinition: (value): value is Definition =>
      typeof value === 'object' && value !== null && 'id' in value,
    importModule: () => Promise.resolve({ jobRegistry: [{ id: 'welcome' }] }),
  });

  assertEquals(registry, [{ id: 'welcome' }]);

  await assertRejects(
    () =>
      loadGeneratedProjectRegistry({
        files,
        registryPath: '.netscript/generated/jobs.ts',
        exportName: 'jobRegistry',
        isDefinition: (value): value is Definition =>
          typeof value === 'object' && value !== null && 'id' in value,
        importModule: () => Promise.resolve({ jobRegistry: [null] }),
      }),
    TypeError,
    'invalid entry',
  );
});
