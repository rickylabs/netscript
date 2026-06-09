import { assertEquals } from '@std/assert';
import { createWatcher, GlobFilter, type KnownWatchStrategy } from '../../mod.ts';

Deno.test('README quick-start example constructs and stops a watcher', () => {
  const watcher = createWatcher({
    paths: ['./incoming'],
    patterns: ['*.csv'],
    events: ['create', 'modify'],
    stabilityThreshold: {
      checkIntervalMs: 250,
      stableChecks: 2,
    },
  });

  watcher.stop();
  assertEquals(watcher.running, false);
});

Deno.test('README network-share example opts into polling', () => {
  const watcher = createWatcher({
    paths: ['//fileserver/erp-share/sales/incoming'],
    patterns: ['*.csv'],
    forcePolling: true,
    pollIntervalMs: 3000,
    stabilityThreshold: {
      checkIntervalMs: 1000,
      stableChecks: 3,
    },
  });

  watcher.stop();
  assertEquals(watcher.running, false);
});

Deno.test('README AbortSignal example wires external cancellation', () => {
  const controller = new AbortController();
  const watcher = createWatcher({
    paths: ['./incoming'],
    patterns: ['*.json'],
    signal: controller.signal,
  });

  controller.abort();
  watcher.stop();
  assertEquals(watcher.running, false);
});

Deno.test('README strategy and filter examples use the public surface', () => {
  const strategy: KnownWatchStrategy = 'polling';
  const filter = new GlobFilter(['*.csv', '*.xlsx']);

  assertEquals(strategy, 'polling');
  assertEquals(filter.matches('/data/sales.csv'), true);
});
