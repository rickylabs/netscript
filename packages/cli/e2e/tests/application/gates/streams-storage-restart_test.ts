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
  waitForStreamsStorageReady,
} from '../../../src/application/gates/scaffold/verify-streams-storage-restart.ts';
import { watchResourceUpdates } from '../../../src/application/gates/scaffold/runtime/resource-state-stream.ts';
import { createControlledFollower } from './controlled-follower.ts';
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
          Services: { users: { PluginReferences: ['auth'] } },
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
    assertEquals(settings.NetScript.Services.users.PluginReferences, ['auth', 'streams']);
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

async function readinessFailure(run: () => Promise<unknown>): Promise<Error> {
  const error = await assertRejects(run);
  assert(error instanceof Error);
  return error;
}

const SECRET_MARKER = 'private-fixture-marker';
const CONTROL = STREAMS_STORAGE_RESOURCES.MEMORY;

function readinessObserver(resources: Readonly<Record<string, unknown>>[], closeFailure = false) {
  let closed = false;
  const watch: typeof watchResourceUpdates = () =>
    Promise.resolve({
      waitFor: (predicate) => {
        for (const resource of resources) {
          const update = {
            rawLine: SECRET_MARKER,
            resource: { displayName: CONTROL, ...resource },
          };
          if (predicate(update)) return Promise.resolve(update);
        }
        return Promise.reject(new Error(`Timed out after 20ms ${SECRET_MARKER}`));
      },
      close: () => {
        closed = true;
        return closeFailure ? Promise.reject(new Error(SECRET_MARKER)) : Promise.resolve();
      },
    });
  return { watch, closed: () => closed };
}

Deno.test('streams readiness terminal states fail fast, close before one safe diagnostic snapshot', async () => {
  for (const state of ['Finished', 'Exited', 'FailedToStart']) {
    const observer = readinessObserver([{ state, exitCode: 1, environment: SECRET_MARKER }]);
    let snapshots = 0;
    const error = await readinessFailure(() =>
      waitForStreamsStorageReady('/owned/apphost', CONTROL, observer.watch, () => {
        assert(observer.closed());
        snapshots++;
        return Promise.resolve(
          JSON.stringify({
            displayName: CONTROL,
            state,
            exitCode: 1,
            healthStatus: 'Unhealthy',
            healthReports: { [SECRET_MARKER]: { status: 'Unhealthy', description: SECRET_MARKER } },
          }),
        );
      }, 20)
    );
    assert(error.message.includes('"reason":"terminal-state"'));
    assert(error.message.includes('"updates":1'));
    assert(error.message.includes(`"state":"${state}"`));
    assert(error.message.includes('"exitCode":1'));
    assert(!error.message.includes(SECRET_MARKER));
    assertEquals(error.cause, undefined);
    assertEquals(snapshots, 1);
  }
});

Deno.test('streams readiness keeps no-update and unhealthy evidence distinct without snapshot success fallback', async () => {
  for (const resources of [[], [{ state: 'Running', healthStatus: 'Unhealthy' }]]) {
    const observer = readinessObserver(resources);
    const error = await readinessFailure(() =>
      waitForStreamsStorageReady(
        '/owned/apphost',
        CONTROL,
        observer.watch,
        () =>
          Promise.resolve(
            JSON.stringify({ displayName: CONTROL, state: 'Running', healthStatus: 'Healthy' }),
          ),
        20,
      )
    );
    assert(error.message.includes(`"updates":${resources.length}`));
    assert(error.message.includes('"reason":"timeout"'));
    assert(!error.message.includes(SECRET_MARKER));
    if (resources.length) assert(error.message.includes('"healthStatus":"Unhealthy"'));
    else assert(error.message.includes('"last":null'));
    assert(observer.closed());
  }
});

Deno.test('healthy streams readiness closes with no diagnostic command, and close failures remain failures', async () => {
  for (const closeFailure of [false, true]) {
    const observer = readinessObserver(
      [{ state: 'Running', healthStatus: 'Healthy' }],
      closeFailure,
    );
    let snapshots = 0;
    const run = () =>
      waitForStreamsStorageReady('/owned/apphost', CONTROL, observer.watch, () => {
        snapshots++;
        return Promise.reject(new Error('unexpected snapshot'));
      }, 20);
    if (closeFailure) {
      const error = await readinessFailure(run);
      assert(error.message.includes('close-failed'));
      assert(!error.message.includes(SECRET_MARKER));
    } else await run();
    assertEquals(snapshots, 0);
    assert(observer.closed());
  }
});

Deno.test('a failed wait and failed close retain bounded state and cleanup attribution', async () => {
  const observer = readinessObserver([{ state: 'Running', healthStatus: 'Unhealthy' }], true);
  const error = await readinessFailure(() =>
    waitForStreamsStorageReady(
      '/owned/apphost',
      CONTROL,
      observer.watch,
      () => Promise.reject(new Error(SECRET_MARKER)),
      20,
    )
  );
  assert(error.message.includes('"observer":"close-failed"'));
  assert(error.message.includes('"healthStatus":"Unhealthy"'));
  assert(!error.message.includes(SECRET_MARKER));
  assertEquals(error.cause, undefined);
});

Deno.test('a healthy event cannot hide a follower that ended before deliberate closure', async () => {
  const watch: typeof watchResourceUpdates = () =>
    Promise.resolve({
      waitFor: (predicate) => {
        const update = {
          rawLine: SECRET_MARKER,
          resource: { state: 'Running', healthStatus: 'Healthy' },
        };
        assert(predicate(update));
        return Promise.resolve(update);
      },
      close: (requireUnbroken) =>
        requireUnbroken ? Promise.reject(new Error(SECRET_MARKER)) : Promise.resolve(),
    });
  const error = await readinessFailure(() =>
    waitForStreamsStorageReady('/owned/apphost', CONTROL, watch, () => {
      throw new Error('unexpected snapshot');
    }, 20)
  );
  assert(error.message.includes('close-failed'));
  assert(!error.message.includes(SECRET_MARKER));
});

Deno.test('streams readiness withholds malformed, oversized and failed diagnostic payloads', async () => {
  for (
    const raw of [
      SECRET_MARKER,
      JSON.stringify({ displayName: 'other', environment: SECRET_MARKER }),
      JSON.stringify({ displayName: CONTROL, environment: '🔒'.repeat(17_000) }),
    ]
  ) {
    const observer = readinessObserver([]);
    const error = await readinessFailure(() =>
      waitForStreamsStorageReady(
        '/owned/apphost',
        CONTROL,
        observer.watch,
        () => Promise.resolve(raw),
        20,
      )
    );
    assert(error.message.includes('"snapshot":{"outcome":"unavailable"}'));
    assert(!error.message.includes(SECRET_MARKER));
    assert(!error.message.includes('🔒'));
    assertEquals(error.cause, undefined);
  }
  const observer = readinessObserver([]);
  const error = await readinessFailure(() =>
    waitForStreamsStorageReady(
      '/owned/apphost',
      CONTROL,
      observer.watch,
      () => Promise.reject(new Error(SECRET_MARKER)),
      20,
    )
  );
  assert(error.message.includes('"snapshot":{"outcome":"unavailable"}'));
  assert(!error.message.includes(SECRET_MARKER));
});

Deno.test('real buffered readiness rejects no updates and malformed lines without leaking raw follower errors', async () => {
  for (const line of [undefined, SECRET_MARKER]) {
    const controlled = createControlledFollower();
    const watch: typeof watchResourceUpdates = async (appHost, resource) => {
      const subscription = await watchResourceUpdates(appHost, resource, () => controlled.follower);
      if (line) await controlled.emit(line);
      return subscription;
    };
    const error = await readinessFailure(() =>
      waitForStreamsStorageReady(
        '/owned/apphost',
        CONTROL,
        watch,
        () =>
          Promise.resolve(
            JSON.stringify({ displayName: CONTROL, state: 'Running', healthStatus: 'Unhealthy' }),
          ),
        20,
      )
    );
    assert(error.message.includes(line ? 'invalid-update' : 'timeout'));
    assert(!error.message.includes(SECRET_MARKER));
    assert(controlled.wasKilled());
  }
});

Deno.test('readiness start/unknown metadata failures are categorical and invalid resource inputs never spawn', async () => {
  const watch: typeof watchResourceUpdates = () => Promise.reject(new Error(SECRET_MARKER));
  const error = await readinessFailure(() =>
    waitForStreamsStorageReady(
      '/owned/apphost',
      CONTROL,
      watch,
      () =>
        Promise.resolve(
          JSON.stringify({
            displayName: CONTROL,
            state: SECRET_MARKER,
            healthStatus: SECRET_MARKER,
            exitCode: SECRET_MARKER,
            healthReports: { [SECRET_MARKER]: { status: SECRET_MARKER } },
          }),
        ),
      20,
    )
  );
  assert(error.message.includes('observer-failed'));
  assert(!error.message.includes(SECRET_MARKER));
  let called = false;
  const invalidWatch: typeof watchResourceUpdates = () => {
    called = true;
    return Promise.reject(new Error('unexpected observer'));
  };
  const invalid = () =>
    Reflect.apply(waitForStreamsStorageReady, undefined, [
      '/owned/apphost',
      SECRET_MARKER,
      invalidWatch,
    ]);
  const rejected = await readinessFailure(invalid);
  assert(!rejected.message.includes(SECRET_MARKER));
  assertEquals(called, false);
});
