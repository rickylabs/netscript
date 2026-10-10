import { assertEquals } from '@std/assert';
import {
  CHILD_CRASH_LOOP_THRESHOLD,
  ChildHealthMonitor,
  childHealthResponse,
} from '../health/mod.ts';

Deno.test('child health refuses startup readiness until registry and dependency checks complete', () => {
  const health = new ChildHealthMonitor(() => 123);
  assertEquals(health.snapshot().state, 'starting');
  health.running();
  assertEquals(health.snapshot().state, 'degraded');
  health.registryLoaded();
  assertEquals(
    childHealthResponse(new Request('http://localhost/health'), health.snapshot()).status,
    503,
  );
  health.dependenciesReady();
  assertEquals(health.snapshot().state, 'ready');
  assertEquals(
    childHealthResponse(new Request('http://localhost/health'), health.snapshot()).status,
    200,
  );
  health.stopped();
  assertEquals(health.snapshot().state, 'stopped');
  assertEquals(health.snapshot().dependencyReady, false);
});

Deno.test('child health latches a bounded restart storm and retains a redacted incident', () => {
  let now = 100;
  const health = new ChildHealthMonitor(() => now);
  health.registryLoaded();
  health.dependenciesReady();
  health.running();
  for (let i = 0; i < CHILD_CRASH_LOOP_THRESHOLD.restarts; i++) {
    health.restarting();
    health.dependenciesReady();
    health.running();
    now++;
  }
  assertEquals(health.snapshot().state, 'crash-looping');
  assertEquals(health.snapshot().restartCount, 3);
  assertEquals(health.snapshot().lastFatalError, {
    message: 'Background child failed (details redacted).',
    timestamp: 102,
  });
  for (let i = 0; i < 100_000; i++) health.restarting();
  assertEquals(JSON.stringify(health.snapshot()).length < 300, true);
});

Deno.test('child health does not classify widely spaced restarts as a crash loop', () => {
  let now = 0;
  const health = new ChildHealthMonitor(() => now);
  for (let i = 0; i < 4; i++) {
    health.restarting();
    now += CHILD_CRASH_LOOP_THRESHOLD.windowMs + 1;
  }
  assertEquals(health.snapshot().state, 'degraded');
  health.failed();
  assertEquals(health.snapshot().state, 'failed');
  assertEquals(health.snapshot().registryReady, false);
});

Deno.test('crash-loop health recovers only after an uninterrupted clean running window', () => {
  let now = 0;
  const health = new ChildHealthMonitor(() => now);
  health.registryLoaded();
  for (let i = 0; i < 3; i++) health.restarting();
  health.dependenciesReady();
  health.running();
  now = CHILD_CRASH_LOOP_THRESHOLD.windowMs - 1;
  assertEquals(health.snapshot().state, 'crash-looping');
  health.restarting();
  health.dependenciesReady();
  health.running();
  now += CHILD_CRASH_LOOP_THRESHOLD.windowMs - 1;
  assertEquals(health.snapshot().state, 'crash-looping');
  now++;
  assertEquals(health.snapshot().state, 'ready');
  assertEquals(
    childHealthResponse(new Request('http://localhost/health'), health.snapshot()).status,
    200,
  );
  assertEquals(health.snapshot().restartCount, 4);
  assertEquals(health.snapshot().lastFatalError?.timestamp, 59_999);
  health.restarting();
  assertEquals(health.snapshot().state, 'degraded');
});

Deno.test('a long failed interval cannot satisfy crash-loop recovery', () => {
  let now = 0;
  const health = new ChildHealthMonitor(() => now);
  health.registryLoaded();
  for (let i = 0; i < 3; i++) health.restarting();
  health.failed();
  now += CHILD_CRASH_LOOP_THRESHOLD.windowMs * 2;
  assertEquals(health.snapshot().state, 'crash-looping');
  health.dependenciesReady();
  health.running();
  assertEquals(health.snapshot().state, 'crash-looping');
  now += CHILD_CRASH_LOOP_THRESHOLD.windowMs;
  assertEquals(health.snapshot().state, 'ready');
});
