import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { findInstalledLauncher } from './linux-native-driver.ts';

Deno.test({
  name: 'installed native launcher is found with a different dotted-version runtime stem',
  ignore: Deno.build.os !== 'linux',
  async fn() {
    const root = await Deno.makeTempDir();
    try {
      const runtime = join(root, 'app-1.0.so');
      const launcher = join(root, 'app-1.0.0');
      await Deno.writeTextFile(runtime, 'runtime', { mode: 0o755 });
      await Deno.writeTextFile(launcher, 'launcher', { mode: 0o755 });
      await Deno.writeTextFile(join(root, 'renderer.js'), 'asset', { mode: 0o644 });
      assertEquals(await findInstalledLauncher(runtime), launcher);
      await Deno.remove(launcher);
      await assertRejects(() => findInstalledLauncher(runtime), Error, 'found 0');
      await Deno.writeTextFile(launcher, 'launcher', { mode: 0o755 });
      await Deno.writeTextFile(join(root, 'another-launcher'), 'ambiguous', { mode: 0o755 });
      await assertRejects(() => findInstalledLauncher(runtime), Error, 'found 2');
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});
