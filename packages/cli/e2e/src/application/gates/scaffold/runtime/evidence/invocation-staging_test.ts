import { assert, assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import {
  INVOCATION_ARTIFACT_DIRECTORY,
  saveOwnedInvocationDiagnostics,
} from './owned-invocation-diagnostic.ts';

Deno.test('known nested workspace diagnostics stage flat without visiting unrelated protected data', async () => {
  const supplied = Deno.env.get('NETSCRIPT_E2E_DIAGNOSTIC_FIXTURE_ROOT');
  const runner = supplied ?? await Deno.makeTempDir();
  try {
    const uid = (await Deno.stat(runner)).uid;
    if (uid === null) throw new Error('fixture requires filesystem UID');
    for (const variant of ['skip-seed-handoff', 'drop-link', 'restored']) {
      const projectRoot = join(runner, 'documented', variant, 'app');
      await Deno.mkdir(projectRoot, { recursive: true });
      const forbidden = join(projectRoot, '.data');
      if (!supplied) {
        await Deno.mkdir(join(forbidden, 'postgres/18/docker'), { recursive: true });
        await Deno.writeTextFile(join(forbidden, 'private.txt'), 'SECRET_UNRELATED_SUBTREE');
      }
      if (supplied) {
        await assertRejects(async () => {
          for await (const _entry of Deno.readDir(forbidden)) { /* negative permission control */ }
        }, Deno.errors.NotCapable);
      }
      await saveOwnedInvocationDiagnostics({
        runnerRoot: runner,
        projectRoot,
        appHost: join(projectRoot, 'host.mts'),
        kind: 'cleanup',
        home: join(runner, 'home'),
        uid,
        transcripts: [{ code: 0, stdout: 'SECRET_RAW_SENTINEL', stderr: 'SECRET_STDERR_SENTINEL' }],
      });
    }
    const directory = join(runner, INVOCATION_ARTIFACT_DIRECTORY);
    const files = [];
    for await (const entry of Deno.readDir(directory)) files.push(entry);
    assertEquals(files.length, 3);
    for (const entry of files) {
      assert(entry.isFile);
      assert(/^cleanup-[a-f0-9]{64}-diagnostic\.json$/.test(entry.name));
      const text = await Deno.readTextFile(join(directory, entry.name));
      assert(!text.includes('SECRET_'));
      assert(!text.includes(runner));
      assert(!text.includes('.data'));
      const value = JSON.parse(text);
      assertEquals(value.status, 'collected');
      assertEquals(value.commands[0].log.status, 'missing_reference');
    }
  } finally {
    if (!supplied) await Deno.remove(runner, { recursive: true });
  }
});
Deno.test('staging refuses a foreign root or target and never broadens discovery', async () => {
  const root = await Deno.makeTempDir();
  try {
    const runner = join(root, 'runner'), projectRoot = join(root, 'foreign');
    await Deno.mkdir(runner);
    await Deno.mkdir(projectRoot);
    const uid = (await Deno.stat(root)).uid;
    if (uid === null) throw new Error('fixture requires filesystem UID');
    const input = {
      runnerRoot: runner,
      projectRoot,
      appHost: join(projectRoot, 'host.mts'),
      kind: 'cleanup' as const,
      home: root,
      uid,
      transcripts: [],
    };
    await assertRejects(
      () => saveOwnedInvocationDiagnostics(input),
      Error,
      'diagnostic_workspace_refused',
    );
    await assertRejects(
      () => saveOwnedInvocationDiagnostics({ ...input, projectRoot: runner }),
      Error,
      'diagnostic_target_refused',
    );
    await assertRejects(
      () => Deno.stat(join(runner, INVOCATION_ARTIFACT_DIRECTORY)),
      Deno.errors.NotFound,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('both runtime uploads select only the flat safe diagnostic files', async () => {
  const source = await Deno.readTextFile(
    new URL('../../../../../../../../../.github/workflows/e2e-cli.yml', import.meta.url),
  );
  const paths = source.split(/\r?\n/).map((line) => line.trim()).filter((line) =>
    line.startsWith('.llm/tmp/') && line.includes('diagnostic')
  );
  assertEquals(paths, [
    '.llm/tmp/e2e-invocation-diagnostics/*-diagnostic.json',
    '.llm/tmp/e2e-invocation-diagnostics/*-diagnostic.json',
  ]);
});
