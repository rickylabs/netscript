import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { ModuleManifestResolver } from './manifest-resolver.ts';

Deno.test('ModuleManifestResolver follows workspace package exports absent from root imports', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'plugins', 'fixture'), { recursive: true });
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ workspace: ['./plugins/*'], imports: {} }),
    );
    await Deno.writeTextFile(
      join(root, 'plugins', 'fixture', 'deno.json'),
      JSON.stringify({ name: '@fixture/plugin', exports: './mod.ts' }),
    );
    await Deno.writeTextFile(
      join(root, 'plugins', 'fixture', 'mod.ts'),
      "export default { name: '@fixture/plugin', version: '1.0.0', description: 'fixture', contributions: {} };\n",
    );

    const manifest = await new ModuleManifestResolver({ projectRoot: root }).resolve(
      '@fixture/plugin',
    );
    assertEquals(manifest?.name, '@fixture/plugin');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
