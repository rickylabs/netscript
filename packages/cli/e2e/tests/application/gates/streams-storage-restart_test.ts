/** Negative controls for the generated-project streams storage acceptance gate. @module */
import { assert, assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import {
  prepareStreamsStorageFixture,
  STREAMS_STORAGE_RESOURCES,
} from '../../../src/application/gates/scaffold/prepare-streams-storage-fixture.ts';
import {
  type StreamsStorageRestartEffects,
  verifyStreamsStorageRestart,
} from '../../../src/application/gates/scaffold/verify-streams-storage-restart.ts';
import { resolveSuite } from '../../../src/presentation/cli/suites/registry.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';

const health = (mode: 'memory' | 'file') => ({
  checks: [{
    name: 'streams-storage',
    storage: {
      mode,
      durable: mode === 'file',
      probe: mode === 'file' ? 'passed' : 'not-applicable',
    },
  }],
});
const events = [{
  type: 'document',
  key: 'retained',
  value: { id: 'retained' },
  headers: { operation: 'upsert' },
}];

function fixture(overrides: Partial<StreamsStorageRestartEffects> = {}) {
  let restarted = false;
  const effects: StreamsStorageRestartEffects = {
    read: (resource, path) =>
      Promise.resolve(
        path === '/health'
          ? health(resource === STREAMS_STORAGE_RESOURCES.MEMORY ? 'memory' : 'file')
          : events,
      ),
    produce: () => Promise.resolve(events),
    restart: () => {
      restarted = true;
      return Promise.resolve();
    },
    ...overrides,
  };
  return { effects, restarted: () => restarted };
}

Deno.test('streams restart gate checks both modes, producer delivery and replay', async () => {
  const control = fixture();
  await verifyStreamsStorageRestart(control.effects);
  assert(control.restarted());
});

Deno.test('streams restart gate refuses missing opt-in, swallowed writes, empty or changed replay and failed restart', async () => {
  const wrongFileHealth = fixture({ read: () => Promise.resolve(health('memory')) });
  await assertRejects(() => verifyStreamsStorageRestart(wrongFileHealth.effects));
  assertEquals(wrongFileHealth.restarted(), false);
  const emptyProducer = fixture({ produce: () => Promise.resolve([]) });
  await assertRejects(() => verifyStreamsStorageRestart(emptyProducer.effects), Error, 'nonempty');
  for (const broken of [[], [{ ...events[0], value: { id: 'changed' } }]]) {
    const swallowed = fixture({
      read: (resource, path) =>
        Promise.resolve(
          path === '/health'
            ? health(resource === STREAMS_STORAGE_RESOURCES.MEMORY ? 'memory' : 'file')
            : broken,
        ),
    });
    await assertRejects(
      () => verifyStreamsStorageRestart(swallowed.effects),
      Error,
      'silently swallow',
    );
    assertEquals(swallowed.restarted(), false);
    let restarted = false;
    const lost = fixture({
      restart: () => {
        restarted = true;
        return Promise.resolve();
      },
      read: (resource, path) =>
        Promise.resolve(
          path === '/health'
            ? health(resource === STREAMS_STORAGE_RESOURCES.MEMORY ? 'memory' : 'file')
            : restarted
            ? broken
            : events,
        ),
    });
    await assertRejects(
      () => verifyStreamsStorageRestart(lost.effects),
      Error,
      'identical history',
    );
  }
  await assertRejects(
    () =>
      verifyStreamsStorageRestart(
        fixture({ restart: () => Promise.reject(new Error('restart failed')) }).effects,
      ),
    Error,
    'restart failed',
  );
});

Deno.test('streams storage fixture preserves ephemeral defaults and never precreates the data directory', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      join(root, 'appsettings.json'),
      JSON.stringify({
        NetScript: {
          Plugins: {
            streams: {
              Entrypoint: 'services/main.ts',
              HostPort: 12345,
              Environment: { OTHER: 'preserved' },
            },
          },
        },
      }),
    );
    await prepareStreamsStorageFixture(root);
    const settings = JSON.parse(await Deno.readTextFile(join(root, 'appsettings.json')));
    assertEquals(settings.NetScript.Plugins.streams.DataDirectories, {
      STREAMS_DATA_DIR: '.netscript/data/streams',
    });
    const control = settings.NetScript.Plugins[STREAMS_STORAGE_RESOURCES.MEMORY];
    assertEquals(control.DataDirectories, undefined);
    assertEquals(control.HostPort, undefined);
    assertEquals(control.Environment, { OTHER: 'preserved' });
    await assertRejects(
      () => Deno.stat(join(root, '.netscript/data/streams')),
      Deno.errors.NotFound,
    );
    await prepareStreamsStorageFixture(root); // Reruns retain the original ephemeral control.
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('both runtime tiers execute streams storage fixture before start and restart proof after readiness', () => {
  for (const suiteId of [SCAFFOLD.RUNTIME, SCAFFOLD.RUNTIME_SQLITE]) {
    const ids = resolveSuite(suiteId).gates.map((gate) => gate.id);
    const fixtureIndex = ids.indexOf(GATE.RUNTIME_STREAMS_STORAGE_FIXTURE);
    assert(fixtureIndex >= 0);
    assert(fixtureIndex < ids.indexOf(GATE.RUNTIME_ASPIRE_RESTORE));
    const proofIndex = ids.indexOf(GATE.BEHAVIOR_STREAMS_STORAGE_RESTART);
    assert(proofIndex > ids.indexOf(GATE.BEHAVIOR_STREAMS_HEALTH));
  }
});
