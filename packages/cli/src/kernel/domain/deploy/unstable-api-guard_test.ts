import { assertEquals } from 'jsr:@std/assert@^1';

import { scanUnstableApis } from './unstable-api-guard.ts';

Deno.test('scanUnstableApis: clean project reports ok with no violations', () => {
  const result = scanUnstableApis({
    denoJson: { tasks: {}, imports: {} },
    sources: [{ path: 'main.ts', content: 'Deno.serve(() => new Response("ok"));' }],
  });

  assertEquals(result.ok, true);
  assertEquals(result.violations, []);
});

Deno.test('scanUnstableApis: flags Deno.openKv usage in an entrypoint', () => {
  const result = scanUnstableApis({
    denoJson: {},
    sources: [{ path: 'src/main.ts', content: 'const kv = await Deno.openKv();' }],
  });

  assertEquals(result.ok, false);
  assertEquals(result.violations.length, 1);
  assertEquals(result.violations[0]?.api, 'Deno.openKv');
  assertEquals(result.violations[0]?.requiresFlag, '--unstable-kv');
  assertEquals(result.violations[0]?.source, 'src/main.ts');
});

Deno.test('scanUnstableApis: flags features declared in deno.json unstable list', () => {
  const result = scanUnstableApis({
    denoJson: { unstable: ['kv', 'cron'] },
    sources: [],
  });

  assertEquals(result.ok, false);
  assertEquals(result.violations.map((v) => v.requiresFlag), [
    '--unstable-kv',
    '--unstable-cron',
  ]);
  assertEquals(result.violations.every((v) => v.source === 'deno.json#unstable'), true);
});

Deno.test('scanUnstableApis: dedupes the same API across the declared list and sources', () => {
  const result = scanUnstableApis({
    denoJson: { unstable: ['kv'] },
    sources: [
      { path: 'a.ts', content: 'await Deno.openKv();' },
      { path: 'a.ts', content: 'await Deno.openKv();' },
    ],
  });

  // deno.json 'kv' + one src violation for a.ts (the duplicate a.ts entry dedupes).
  assertEquals(result.violations.length, 2);
  assertEquals(result.ok, false);
});

Deno.test('scanUnstableApis: detects Temporal, cron, and BroadcastChannel tokens', () => {
  const result = scanUnstableApis({
    sources: [
      { path: 'cron.ts', content: 'Deno.cron("nightly", "0 0 * * *", () => {});' },
      { path: 'time.ts', content: 'const now = Temporal.Now.instant();' },
      { path: 'bus.ts', content: 'const ch = new BroadcastChannel("events");' },
    ],
  });

  assertEquals(result.ok, false);
  assertEquals(result.violations.map((v) => v.api).sort(), [
    'BroadcastChannel',
    'Deno.cron',
    'Temporal',
  ]);
});

Deno.test('scanUnstableApis: tolerates missing/invalid deno.json and sources', () => {
  assertEquals(scanUnstableApis({}).ok, true);
  assertEquals(scanUnstableApis({ denoJson: null }).ok, true);
  assertEquals(scanUnstableApis({ denoJson: { unstable: 'kv' } }).ok, true);
});
