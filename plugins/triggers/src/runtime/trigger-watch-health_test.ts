import { assert, assertEquals } from '@std/assert';
import { ChildHealthMonitor, childHealthResponse } from '@netscript/plugin/health';
import type { FileWatchDefinition, TriggerId } from '@netscript/plugin-triggers-core/domain';
import type { LoggerPort } from '@netscript/plugin-triggers-core/runtime';
import { TriggerHealthMonitor, type TriggerHealthSnapshot } from './trigger-health-monitor.ts';
import { startTriggerProcessorRuntime } from './trigger-processor.ts';
import { artifactText, collectInstallArtifacts } from '@netscript/plugin/adapter';
import { triggersAdapterPlugin } from '../adapter/plugin.ts';

const logger: LoggerPort = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

function definition(root: string, id: string): FileWatchDefinition<string, never, never> {
  return {
    id: id as TriggerId,
    kind: 'file-watch',
    durability: 't1',
    paths: [root],
    patterns: ['*.txt'],
    on: ['create'],
    handler: () => Promise.resolve([]),
  };
}

async function waitFor(predicate: () => boolean | Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt++) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert(await predicate(), 'watch health did not reach the expected state');
}

Deno.test('existing child health HTTP response exposes independent real watch loss and recovery', async () => {
  const directory = await Deno.makeTempDir();
  const root = `${directory}/incoming`;
  const sibling = `${directory}/sibling`;
  await Deno.mkdir(root);
  await Deno.mkdir(sibling);
  const health = new TriggerHealthMonitor();
  const controller = new AbortController();
  const handled: string[] = [];
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen: () => {} },
    (request) => childHealthResponse(request, health.snapshot()),
  );
  const url = `http://127.0.0.1:${server.addr.port}/health`;
  const read = async (): Promise<TriggerHealthSnapshot> => {
    const response = await fetch(url);
    assertEquals(response.status, 200);
    return await response.json();
  };
  const completion = startTriggerProcessorRuntime({
    health,
    signal: controller.signal,
    logger,
    definitions: [definition(root, 'incoming'), definition(sibling, 'sibling')],
    processor: {
      process: (event) => {
        handled.push(event.triggerId);
        return Promise.resolve({ event, status: 'completed', actionsDispatched: 0 });
      },
      stop: () => Promise.resolve(),
    },
  });
  try {
    await waitFor(() =>
      health.snapshot().fileWatches.length === 2 &&
      health.snapshot().fileWatches.every((watch) => watch.state === 'watching')
    );
    assertEquals((await read()).fileWatches.map((watch) => watch.triggerId), [
      'incoming',
      'sibling',
    ]);
    await Deno.remove(root, { recursive: true });
    await waitFor(async () => (await read()).fileWatches[0]?.state === 'unavailable');
    const failed = await read();
    assertEquals(failed.fileWatches[1].state, 'watching');
    assertEquals(failed.state, 'ready');
    assertEquals(failed.dependencyReady, true);
    await Deno.writeTextFile(`${sibling}/during.txt`, 'during sibling outage');
    await waitFor(() => handled.includes('sibling'));
    await Deno.mkdir(root);
    await waitFor(async () => (await read()).fileWatches[0]?.state === 'watching');
    await Deno.writeTextFile(`${root}/after.txt`, 'after recovery');
    await waitFor(() => handled.includes('incoming'));
  } finally {
    controller.abort();
    await completion;
    await server.shutdown();
    await Deno.remove(directory, { recursive: true });
  }
  assertEquals(health.snapshot().state, 'stopped');
  assertEquals(health.snapshot().fileWatches.map((watch) => watch.state), [
    'unavailable',
    'unavailable',
  ]);
});

async function generatedStarter(): Promise<FileWatchDefinition<string, never, never>> {
  const artifact = collectInstallArtifacts(triggersAdapterPlugin).find((item) =>
    item.path === 'triggers/incoming-file-watch.ts'
  );
  assert(artifact);
  const source = artifactText(artifact)
    .replaceAll(
      '@netscript/plugin-triggers-core/builders',
      new URL('../../../../packages/plugin-triggers-core/src/builders/mod.ts', import.meta.url)
        .href,
    )
    .replaceAll(
      '@netscript/plugin-triggers-core/domain',
      new URL('../../../../packages/plugin-triggers-core/src/domain/mod.ts', import.meta.url).href,
    );
  const generated: { default: FileWatchDefinition<string, never, never> } = await import(
    `data:application/typescript,${encodeURIComponent(source)}`
  );
  return generated.default;
}

Deno.test('default starter missing watch root remains visible while child startup is ready', async () => {
  const directory = await Deno.makeTempDir();
  const starter = await generatedStarter();
  const health = new TriggerHealthMonitor();
  const controller = new AbortController();
  const completion = startTriggerProcessorRuntime({
    health,
    signal: controller.signal,
    logger,
    definitions: [{ ...starter, paths: starter.paths.map((path) => `${directory}/${path}`) }],
    processor: {
      process: (event) => Promise.resolve({ event, status: 'completed', actionsDispatched: 0 }),
      stop: () => Promise.resolve(),
    },
  });
  try {
    await waitFor(() => health.snapshot().state === 'ready');
    const response = childHealthResponse(new Request('http://localhost/health'), health.snapshot());
    assertEquals(response.status, 200);
    const body: TriggerHealthSnapshot = await response.json();
    assertEquals(body.fileWatches.map(({ triggerId, state }) => ({ triggerId, state })), [
      { triggerId: 'incoming-file-watch', state: 'unavailable' },
    ]);
    assertEquals(body.registryReady, true);
    assertEquals(body.dependencyReady, true);
  } finally {
    controller.abort();
    await completion;
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('trigger health snapshots are immutable and terminal watches cannot revive', () => {
  const health = new TriggerHealthMonitor(() => 0);
  const id = 'incoming' as TriggerId;
  health.registerWatch(id);
  const initial = health.snapshot();
  health.updateWatch({ triggerId: id, state: 'watching', occurredAt: new Date(1).toISOString() });
  assertEquals(initial.fileWatches[0].state, 'unavailable');
  assert(Object.isFrozen(initial.fileWatches));
  assert(Object.isFrozen(initial.fileWatches[0]));
  health.failed();
  health.updateWatch({ triggerId: id, state: 'watching', occurredAt: new Date(2).toISOString() });
  assertEquals(health.snapshot().fileWatches[0].state, 'unavailable');
  health.starting();
  assertEquals(health.snapshot().fileWatches, []);
  health.registerWatch(id);
  health.stopped();
  health.updateWatch({ triggerId: id, state: 'watching', occurredAt: new Date(3).toISOString() });
  assertEquals(health.snapshot().fileWatches[0].state, 'unavailable');
});

Deno.test('generated trigger glue serves the richer health monitor through the existing transport', () => {
  const runtime = collectInstallArtifacts(triggersAdapterPlugin).find((artifact) =>
    artifact.path === 'triggers/runtime.ts'
  );
  assert(runtime);
  const source = artifactText(runtime);
  assert(source.includes('new TriggerHealthMonitor()'));
  assert(source.includes('startCombinedProcess({ health, signal })'));
  assert(source.includes('() => health.snapshot()'));
  assert(new TriggerHealthMonitor() instanceof ChildHealthMonitor);
});
