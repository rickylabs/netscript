import { assert, assertEquals, assertMatch, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { prepareLockedFixture } from './locked-fixture.ts';

Deno.test('isolated fixtures preserve the committed graph and reject resolution drift', async () => {
  const repositoryLock = new URL('../../../deno.lock', import.meta.url);
  const original = await Deno.readTextFile(repositoryLock);
  const directory = await Deno.makeTempDir();
  try {
    const configPath = join(directory, 'deno.json');
    const config = { imports: { dependency: 'npm:@opentelemetry/api@^1.9.1' } };
    await Deno.writeTextFile(configPath, JSON.stringify(config));
    const probe = join(directory, 'probe.ts');
    await Deno.writeTextFile(
      probe,
      "import { trace } from 'dependency'; if (!trace) throw Error();",
    );
    const frozen = await prepareLockedFixture(directory);
    assert(frozen.includes('--lock'));
    assert(frozen.includes('--frozen'));
    assert(!frozen.includes('--no-lock'));
    const lockPath = join(directory, 'deno.lock');
    const pinned = await Deno.readTextFile(lockPath);
    const actualGraph = JSON.parse(pinned);
    assertEquals(
      actualGraph.npm['@opentelemetry/api@1.9.1'].integrity,
      JSON.parse(original).npm['@opentelemetry/api@1.9.1'].integrity,
    );

    const run = () =>
      new Deno.Command(Deno.execPath(), {
        args: ['run', ...frozen, '--config', configPath, probe],
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
      }).output();
    const positive = await run();
    assertEquals(positive.code, 0, new TextDecoder().decode(positive.stderr));
    assertEquals(await Deno.readTextFile(lockPath), pinned);

    // The registry/cache can satisfy this release, but the committed lock cannot.
    config.imports.dependency = 'npm:@opentelemetry/api@1.10.0';
    Object.assign(config, { nodeModulesDir: 'none' });
    await Deno.writeTextFile(configPath, JSON.stringify(config));
    const drifted = await run();
    assert(drifted.code !== 0);
    assertMatch(new TextDecoder().decode(drifted.stderr), /frozen|lockfile/i);
    assertEquals(await Deno.readTextFile(lockPath), pinned);
  } finally {
    assertEquals(await Deno.readTextFile(repositoryLock), original);
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('fixture preparation rejects unrecorded packages and incompatible requirements without changing repository locks', async () => {
  const locks = [
    new URL('../../../deno.lock', import.meta.url),
    new URL('../../../packages/fresh-ui/deno.lock', import.meta.url),
  ];
  const originals = await Promise.all(locks.map((path) => Deno.readTextFile(path)));
  const directory = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${directory}/deno.json`,
      JSON.stringify({
        imports: { unrecorded: 'npm:is-odd@3.0.1' },
      }),
    );
    // This package is deliberately absent from both authorities, so rejection
    // exercises the native preparation result guard, before any fixture runs.
    for (const original of originals) {
      assert(!Object.keys(JSON.parse(original).npm).some((id) => id.startsWith('is-odd@')));
    }
    await assertRejects(
      () => prepareLockedFixture(directory),
      Error,
      'absent from the committed lockfile',
    );
    await Deno.writeTextFile(
      `${directory}/deno.json`,
      JSON.stringify({
        imports: { incompatible: 'npm:@opentelemetry/api@>=1.10.0 <1.11.0' },
      }),
    );
    await assertRejects(
      () => prepareLockedFixture(directory),
      Error,
      'requirement is absent from the committed lockfile',
    );
  } finally {
    assertEquals(await Promise.all(locks.map((path) => Deno.readTextFile(path))), originals);
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('open-ended instrumentation stays on its recorded compatible release', async () => {
  const directory = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${directory}/deno.json`,
      JSON.stringify({
        imports: {
          instrumentation: 'npm:@opentelemetry/instrumentation@>=0.203.0',
          '@opentelemetry/api': 'npm:@opentelemetry/api@^1.9.1',
        },
      }),
    );
    await prepareLockedFixture(directory);
    const config = JSON.parse(await Deno.readTextFile(`${directory}/deno.json`));
    assertEquals(config.imports.instrumentation, 'npm:@opentelemetry/instrumentation@0.223.0');
    const lock = JSON.parse(await Deno.readTextFile(`${directory}/deno.lock`));
    const versions = Object.keys(lock.npm).filter((id) =>
      id.startsWith('@opentelemetry/instrumentation@')
    );
    assertEquals(versions.length, 1);
    assert(versions[0].startsWith('@opentelemetry/instrumentation@0.223.0'));
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('a dotenv 16 consumer remains on a compatible recorded version', async () => {
  const reference = new URL(
    '../../../packages/cli/tests/fixtures/postgres-normalizer/deno.lock',
    import.meta.url,
  );
  const original = await Deno.readTextFile(reference);
  const directory = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${directory}/deno.json`,
      JSON.stringify({
        imports: { dotenv: 'npm:dotenv@^16.4.7' },
      }),
    );
    await prepareLockedFixture(directory, [], reference);
    const config = JSON.parse(await Deno.readTextFile(`${directory}/deno.json`));
    assertEquals(config.imports.dotenv, 'npm:dotenv@16.6.1');
    const lock = JSON.parse(await Deno.readTextFile(`${directory}/deno.lock`));
    assertEquals(lock.specifiers['npm:dotenv@16.6.1'], '16.6.1');
  } finally {
    assertEquals(await Deno.readTextFile(reference), original);
    await Deno.remove(directory, { recursive: true });
  }
});
