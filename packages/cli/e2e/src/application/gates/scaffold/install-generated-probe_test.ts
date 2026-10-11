import { assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { installGeneratedProbe } from './install-generated-probe.ts';
import { runLockedProbe } from './run-locked-probe.ts';

Deno.test('dependency mutation installs into the existing lock before frozen consumers run', async () => {
  const root = await Deno.makeTempDir({ prefix: 'generated-probe-install-' });
  try {
    const committed = JSON.parse(
      await Deno.readTextFile(new URL('../../../../../../../deno.lock', import.meta.url)),
    );
    const dependency = 'npm:@orpc/client@1.15.0';
    const resolution = committed.specifiers[dependency];
    const lock = join(root, 'deno.lock');
    await Deno.writeTextFile(
      lock,
      `${
        JSON.stringify(
          {
            version: committed.version,
            specifiers: { [dependency]: resolution },
            npm: committed.npm,
            workspace: { dependencies: [dependency] },
          },
          null,
          2,
        )
      }\n`,
    );
    const config = join(root, 'deno.json');
    await Deno.writeTextFile(config, JSON.stringify({ imports: { dependency } }));
    const probe = join(root, 'probe.ts');
    await Deno.writeTextFile(probe, "import 'dependency';\n");
    await runLockedProbe([probe], root, root);
    const before = await Deno.readTextFile(lock);

    // Model service/plugin add: a new workspace member changes lock metadata and imports.
    const member = join(root, 'second-service');
    await Deno.mkdir(member);
    await Deno.writeTextFile(
      join(member, 'deno.json'),
      JSON.stringify({
        name: '@probe/second-service',
        version: '1.0.0',
        exports: './mod.ts',
        imports: { server: 'npm:@orpc/server@1.15.0' },
      }),
    );
    await Deno.writeTextFile(join(member, 'mod.ts'), "import 'server';\n");
    await Deno.writeTextFile(
      config,
      JSON.stringify({
        imports: { dependency },
        workspace: ['./second-service'],
      }),
    );
    await Deno.writeTextFile(probe, "import 'dependency';\nimport '@probe/second-service';\n");
    await assertRejects(() => runLockedProbe([probe], root, root), Error);
    assertEquals(await Deno.readTextFile(lock), before);

    await installGeneratedProbe(root, [probe]);
    const installed = await Deno.readTextFile(lock);
    assertNotEquals(installed, before);
    assertEquals(JSON.parse(installed).specifiers[dependency], resolution);
    await runLockedProbe([probe], root, root);
    await runLockedProbe([probe], root, root);
    assertEquals(await Deno.readTextFile(lock), installed);
    // Installing a legitimate mutation does not grant subsequent runs permission to drift.
    await Deno.writeTextFile(probe, "import 'npm:@orpc/client@1.15.5';\n");
    await assertRejects(() => runLockedProbe([probe], root, root), Error);
    assertEquals(await Deno.readTextFile(lock), installed);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated probe installation refuses an unlocked project', async () => {
  const root = await Deno.makeTempDir({ prefix: 'unlocked-generated-probe-' });
  try {
    await assertRejects(() => installGeneratedProbe(root, ['probe.ts']), Deno.errors.NotFound);
    await assertRejects(() => Deno.stat(join(root, 'deno.lock')), Deno.errors.NotFound);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
