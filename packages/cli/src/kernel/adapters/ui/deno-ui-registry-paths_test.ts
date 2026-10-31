import { assertRejects } from '@std/assert';
import { join } from '@std/path';
import { DenoUiRegistryPaths } from './deno-ui-registry-paths.ts';

Deno.test('registry physical containment rejects source, destination and dangling symlink escapes', async () => {
  const directory = await Deno.makeTempDir();
  const root = join(directory, 'source');
  const outside = join(directory, 'outside');
  await Deno.mkdir(root);
  await Deno.mkdir(outside);
  const paths = new DenoUiRegistryPaths();
  try {
    await Deno.writeTextFile(join(outside, 'secret.ts'), 'outside');
    await Deno.symlink(join(outside, 'secret.ts'), join(root, 'source.ts'));
    await Deno.symlink(outside, join(root, 'output'));
    await Deno.symlink(join(outside, 'missing.ts'), join(root, 'dangling.ts'));
    await assertRejects(
      () => paths.assertContained(root, join(root, 'source.ts')),
      Error,
      'escapes',
    );
    await assertRejects(
      () => paths.assertContained(root, join(root, 'output', 'new.ts')),
      Error,
      'escapes',
    );
    await assertRejects(
      () => paths.assertContained(root, join(root, 'dangling.ts')),
      Error,
      'dangling',
    );
    await paths.assertContained(root, join(root, 'new', 'inside.ts'));
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
