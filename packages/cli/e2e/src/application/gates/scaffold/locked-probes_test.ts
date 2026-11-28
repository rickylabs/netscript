import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { runLockedProbe } from './run-locked-probe.ts';

Deno.test('scratch probe rejects npm requirement drift without rewriting its reference lock', async () => {
  const root = await Deno.makeTempDir({ prefix: 'locked-probe-' });
  try {
    const rootConfig = JSON.parse(
      await Deno.readTextFile(new URL('../../../../../../../deno.json', import.meta.url)),
    ) as { catalog: Record<string, string> };
    const committed = JSON.parse(
      await Deno.readTextFile(new URL('../../../../../../../deno.lock', import.meta.url)),
    );
    // Keep the committed npm resolutions; this isolated fixture has no workspace members.
    const specifier = `npm:@orpc/client@${rootConfig.catalog['@orpc/client']}`;
    const version = committed.specifiers[specifier];
    assertEquals(typeof version, 'string', `Expected committed lock resolution for ${specifier}`);
    const lock = {
      version: committed.version,
      specifiers: { [specifier]: version },
      npm: committed.npm,
      workspace: { dependencies: [specifier] },
    };
    const lockPath = join(root, 'deno.lock');
    await Deno.writeTextFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    const config = { imports: { dependency: specifier } };
    const configPath = join(root, 'deno.json');
    await Deno.writeTextFile(configPath, JSON.stringify(config));
    const probe = join(root, 'probe.ts');
    await Deno.writeTextFile(
      probe,
      "import 'dependency';\n",
    );
    const locked = await Deno.readTextFile(lockPath);
    await runLockedProbe([probe], root, root);
    assertEquals(await Deno.readTextFile(lockPath), locked);
    // A distinct published npm requirement is absent from the seeded reference lock. Frozen
    // resolution must reject it even when the registry/cache could satisfy it; no age-policy
    // timing is involved.
    const absentSpecifier = 'npm:@orpc/client@1.16.5';
    assertEquals(absentSpecifier in lock.specifiers, false);
    config.imports.dependency = absentSpecifier;
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
      'prepare-flow-b-fixture.ts',
      'verify-clean-clone-readme.ts',
    ]
  ) {
    const source = await Deno.readTextFile(join(scaffold, name));
    assertEquals(source.includes('--no-lock'), false, name);
    if (name === 'verify-clean-clone-readme.ts') {
      assertStringIncludes(source, 'runLockedProbe');
      assertStringIncludes(source, 'installGeneratedProbe');
      assertStringIncludes(source, "config.lock = { path: 'deno.lock', frozen: true }");
    } else if (name === 'probe-generated-guarded-service.ts') {
      assertStringIncludes(source, 'runLockedProbe');
    } else {
      assertStringIncludes(source, '--frozen');
      assertStringIncludes(source, 'deno.lock');
    }
  }
});
