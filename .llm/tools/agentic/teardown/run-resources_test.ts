import { assertEquals, assertRejects } from '@std/assert';
import {
  emptyRunResources,
  readRunResources,
  registerAppHost,
  registerOwnedRoot,
  RUN_RESOURCES_FILE,
  RUN_RESOURCES_SCHEMA_VERSION,
} from './run-resources.ts';

Deno.test('missing registry reads as an empty schema-versioned registry', async () => {
  const dir = await Deno.makeTempDir();
  try {
    assertEquals(await readRunResources(dir, '/worktree'), emptyRunResources('/worktree'));
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('registration writes atomically and deduplicates identity pairs', async () => {
  const dir = await Deno.makeTempDir();
  try {
    const first = {
      appHostPath: '/worktree/apphost.mts',
      appHostPid: 10,
      appHostStartedAt: 'start',
      startedAt: '2026-08-02T00:00:00Z',
    };
    await registerAppHost(dir, '/worktree', first);
    await registerAppHost(dir, '/worktree', { ...first, startedAt: 'later' });
    const registry = await readRunResources(dir, '/worktree');
    assertEquals(registry.schemaVersion, RUN_RESOURCES_SCHEMA_VERSION);
    assertEquals(registry.appHosts.length, 1);
    assertEquals(registry.appHosts[0].startedAt, 'later');
    assertEquals([...Deno.readDirSync(dir)].map((entry) => entry.name), [RUN_RESOURCES_FILE]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('wrong schema never becomes ownership evidence', async () => {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${dir}/${RUN_RESOURCES_FILE}`, '{"schemaVersion":999}');
    await assertRejects(() => readRunResources(dir, '/worktree'), Error, 'schema');
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('a v1 registry reads forward with no owned roots', async () => {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${dir}/${RUN_RESOURCES_FILE}`,
      JSON.stringify({
        schemaVersion: 1,
        worktreeRoot: '/worktree',
        appHosts: [],
        containers: [],
      }),
    );
    const registry = await readRunResources(dir, '/worktree');
    assertEquals(registry.schemaVersion, RUN_RESOURCES_SCHEMA_VERSION);
    assertEquals(registry.ownedRoots, []);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('owned roots deduplicate and refuse to claim a shared parent', async () => {
  const dir = await Deno.makeTempDir();
  try {
    await registerOwnedRoot(dir, '/worktree', '/tmp/opencode/cleanroom/statusline');
    await registerOwnedRoot(dir, '/worktree', '/tmp/opencode/cleanroom/statusline');
    assertEquals((await readRunResources(dir, '/worktree')).ownedRoots, [
      '/tmp/opencode/cleanroom/statusline',
    ]);
    await assertRejects(() => registerOwnedRoot(dir, '/worktree', '/tmp'), Error, 'refusing');
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
