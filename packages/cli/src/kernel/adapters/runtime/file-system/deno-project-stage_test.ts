import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { DenoProjectStage } from './deno-project-stage.ts';

Deno.test('project staging isolates binary edits and removals, preserves unchanged files and excludes runtime trees', async () => {
  const projectRoot = await Deno.makeTempDir();
  const bytes = Uint8Array.from({ length: 150_000 }, (_, index) => index % 256);
  try {
    await Deno.mkdir(join(projectRoot, '.data'));
    await Deno.mkdir(join(projectRoot, 'empty'));
    await Deno.writeFile(join(projectRoot, 'binary.dat'), bytes);
    await Deno.writeTextFile(join(projectRoot, 'unchanged.ts'), '// untouched\r\n');
    await Deno.writeTextFile(join(projectRoot, 'removed.ts'), '// removed');
    await Deno.writeFile(join(projectRoot, '.data/state'), bytes);
    const unchangedBefore = await Deno.stat(join(projectRoot, 'unchanged.ts'));
    const stage = await new DenoProjectStage().stage(projectRoot);
    try {
      assertEquals((await Deno.stat(join(stage.root, 'empty'))).isDirectory, true);
      await assertRejects(() => Deno.stat(join(stage.root, '.data')), Deno.errors.NotFound);
      bytes[100_000] = 42;
      await Deno.writeFile(join(stage.root, 'binary.dat'), bytes);
      await Deno.writeFile(join(stage.root, 'new.dat'), bytes);
      await Deno.remove(join(stage.root, 'removed.ts'));
      assertEquals((await Deno.readFile(join(projectRoot, 'binary.dat')))[100_000], 160);
      await Deno.stat(join(projectRoot, 'removed.ts'));
      await assertRejects(() => Deno.stat(join(projectRoot, 'new.dat')), Deno.errors.NotFound);
      await stage.commit();
      assertEquals(await Deno.readFile(join(projectRoot, 'binary.dat')), bytes);
      assertEquals(await Deno.readFile(join(projectRoot, 'new.dat')), bytes);
      assertEquals((await Deno.readFile(join(projectRoot, '.data/state')))[100_000], 160);
      assertEquals(
        (await Deno.stat(join(projectRoot, 'unchanged.ts'))).mtime,
        unchangedBefore.mtime,
      );
      await assertRejects(() => Deno.stat(join(projectRoot, 'removed.ts')), Deno.errors.NotFound);
    } finally {
      await stage.dispose();
    }
    await assertRejects(() => Deno.stat(stage.root), Deno.errors.NotFound);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
