import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { runLockedProbe } from './run-locked-probe.ts';

Deno.test('scratch probe rejects npm requirement drift without rewriting its reference lock', async () => {
  const root = await Deno.makeTempDir({ prefix: 'locked-probe-' });
  try {
    const committed = JSON.parse(
      await Deno.readTextFile(new URL('../../../../../../../deno.lock', import.meta.url)),
    );
    // Keep the committed npm resolutions; this isolated fixture has no workspace members.
    const specifier = 'npm:zod@^4.6.5';
    const version = committed.specifiers[specifier];
    const lock = {
      version: committed.version,
      specifiers: { [specifier]: version },
      npm: { [`zod@${version}`]: committed.npm[`zod@${version}`] },
      workspace: { dependencies: [specifier] },
    };
    const lockPath = join(root, 'deno.lock');
    await Deno.writeTextFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    const config = { imports: { dependency: 'npm:zod@^4.6.5' } };
    const configPath = join(root, 'deno.json');
    await Deno.writeTextFile(configPath, JSON.stringify(config));
    const probe = join(root, 'probe.ts');
    await Deno.writeTextFile(
      probe,
      "import { z } from 'dependency'; z.string().parse('locked');\n",
    );
    const locked = await Deno.readTextFile(lockPath);
    await runLockedProbe([probe], root, root);
    assertEquals(await Deno.readTextFile(lockPath), locked);
    // The exact npm requirement is absent from the reference lock. Frozen resolution must
    // reject it even when the registry/cache could satisfy it; no age-policy timing is involved.
    config.imports.dependency = 'npm:zod@4.6.5';
    await Deno.writeTextFile(configPath, JSON.stringify(config));
    await assertRejects(
      () => runLockedProbe([probe], root, root),
      Error,
      'Locked probe command failed',
    );
    assertEquals(await Deno.readTextFile(lockPath), locked);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('scratch probe commands declare a frozen lock and never bypass it', async () => {
  const scaffold = fromFileUrl(new URL('./', import.meta.url));
  for (
    const name of [
      'probe-generated-guarded-service.ts',
      'generated-guarded-service_test.ts',
      'guarded-service-isolation_test.ts',
      'probe-auth-cookie-jar.ts',
      'service-client-runtime-probe.ts',
    ]
  ) {
    const source = await Deno.readTextFile(join(scaffold, name));
    assertEquals(source.includes('--no-lock'), false, name);
    if (name === 'probe-generated-guarded-service.ts') {
      assertStringIncludes(source, 'runLockedProbe');
    } else {
      assertStringIncludes(source, '--frozen');
      assertStringIncludes(source, 'deno.lock');
    }
  }
});
