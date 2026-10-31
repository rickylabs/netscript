import { assertEquals, assertThrows } from '@std/assert';
import { ChildHealthMonitor } from './child-health-monitor.ts';
import type { ChildRestartHistory } from '../domain/child-health.ts';
import type { ChildRestartHistoryPort } from '../ports/child-restart-history-port.ts';

function history(): ChildRestartHistoryPort {
  let value: ChildRestartHistory | undefined;
  return {
    read: () => value,
    write: (next) => {
      value = structuredClone(next);
    },
  };
}

function ready(health: ChildHealthMonitor): void {
  health.registryLoaded();
  health.dependenciesReady();
  health.running();
}

Deno.test('process history counts failed watch reloads but excludes healthy reloads and clean stops', () => {
  const store = history();
  for (let reload = 0; reload < 5; reload++) {
    const health = new ChildHealthMonitor(() => 100);
    health.trackProcess(store, 1);
    ready(health);
    assertEquals(health.snapshot().state, 'ready');
    assertEquals(health.snapshot().restartCount, 0);
  }
  for (let restart = 0; restart <= 3; restart++) {
    const health = new ChildHealthMonitor(() => 100);
    health.trackProcess(store, 1);
    health.failed();
    assertEquals(health.snapshot().restartCount, restart);
    assertEquals(health.snapshot().state, restart === 3 ? 'crash-looping' : 'failed');
  }
  const clean = history();
  for (let processId = 1; processId <= 5; processId++) {
    const health = new ChildHealthMonitor();
    health.trackProcess(clean, processId);
    ready(health);
    assertEquals(health.snapshot().restartCount, 0);
    health.stopped();
  }
});

Deno.test('process replacement honors custom threshold boundaries and requires live recovery', () => {
  let now = 100;
  const store = history();
  const options = { crashLoopThreshold: { restarts: 2, windowMs: 10 } };
  const first = new ChildHealthMonitor(() => now, options);
  first.trackProcess(store, 1);
  ready(first);
  const second = new ChildHealthMonitor(() => now, options);
  second.trackProcess(store, 2);
  ready(second);
  assertEquals(second.snapshot().state, 'ready');
  now += 10;
  const third = new ChildHealthMonitor(() => now, options);
  third.trackProcess(store, 3);
  ready(third);
  assertEquals(third.snapshot().restartCount, 2);
  assertEquals(third.snapshot().state, 'crash-looping');
  third.failed();
  now += 100;
  const fourth = new ChildHealthMonitor(() => now, options);
  fourth.trackProcess(store, 4);
  ready(fourth);
  assertEquals(fourth.snapshot().state, 'crash-looping');
  now += 9;
  assertEquals(fourth.snapshot().state, 'crash-looping');
  now++;
  assertEquals(fourth.snapshot().state, 'ready');
  assertEquals(store.read()?.crashLooping, false);
  assertEquals(store.read()?.restarts, []);
});

Deno.test('widely spaced process restarts never reach the threshold and history remains bounded', () => {
  let now = 0;
  const store = history();
  for (let processId = 1; processId < 20; processId++) {
    const health = new ChildHealthMonitor(() => now);
    health.trackProcess(store, processId);
    ready(health);
    assertEquals(health.snapshot().state, 'ready');
    now += 60_001;
  }
  assertEquals(store.read()?.restarts.length, 1);
  now = 2_000_000;
  for (let processId = 20; processId < 40; processId++) {
    const health = new ChildHealthMonitor(() => now);
    health.trackProcess(store, processId);
  }
  assertEquals(store.read()?.restarts.length, 3);
});

Deno.test('history IO failure is sticky unhealthy even after the runtime marks itself ready', () => {
  const health = new ChildHealthMonitor();
  assertThrows(() =>
    health.trackProcess({
      read: () => {
        throw new Error('unreadable');
      },
      write: () => undefined,
    }, 1)
  );
  ready(health);
  assertEquals(health.snapshot().state, 'failed');
  assertEquals(health.snapshot().dependencyReady, false);

  let writable = true;
  const writing = new ChildHealthMonitor();
  writing.trackProcess({
    read: () => undefined,
    write: () => {
      if (!writable) throw new Error('unwritable');
    },
  }, 1);
  writable = false;
  assertThrows(() => writing.failed());
  ready(writing);
  assertEquals(writing.snapshot().state, 'failed');
  assertEquals(
    writing.snapshot().lastFatalError?.message,
    'Background child failed (details redacted).',
  );
});

Deno.test('invalid thresholds are rejected before a monitor starts', () => {
  for (const restarts of [0, -1, 1.5, Infinity, NaN]) {
    assertThrows(() =>
      new ChildHealthMonitor(Date.now, {
        crashLoopThreshold: { restarts, windowMs: 100 },
      }), RangeError);
  }
  for (const windowMs of [0, -1, Infinity, NaN]) {
    assertThrows(() =>
      new ChildHealthMonitor(Date.now, {
        crashLoopThreshold: { restarts: 3, windowMs },
      }), RangeError);
  }
});
