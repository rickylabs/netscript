import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';

import { writePlannedFiles } from './files.ts';

Deno.test('writePlannedFiles rolls back already-written files when a later write fails', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'plugins/workers/conflict'), { recursive: true });

    await assertRejects(
      () =>
        writePlannedFiles(
          root,
          [
            { path: 'plugins/workers/created.ts', content: 'export const created = true;\n' },
            { path: 'plugins/workers/conflict', content: 'cannot overwrite a directory\n' },
          ],
          false,
        ),
      Error,
    );

    await assertRejects(
      () => Deno.stat(join(root, 'plugins/workers/created.ts')),
      Deno.errors.NotFound,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('writePlannedFiles restores modified files when a later write fails', async () => {
  const root = await Deno.makeTempDir();
  try {
    const existingPath = join(root, 'plugins/workers/existing.ts');
    await Deno.mkdir(join(root, 'plugins/workers/conflict'), { recursive: true });
    await Deno.writeTextFile(existingPath, 'export const value = 1;\n');

    await assertRejects(
      () =>
        writePlannedFiles(
          root,
          [
            { path: 'plugins/workers/existing.ts', content: 'export const value = 2;\n' },
            { path: 'plugins/workers/conflict', content: 'cannot overwrite a directory\n' },
          ],
          false,
        ),
      Error,
    );

    assertEquals(await Deno.readTextFile(existingPath), 'export const value = 1;\n');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
