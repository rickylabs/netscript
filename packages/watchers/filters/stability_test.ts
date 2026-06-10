import { assertEquals } from '@std/assert';
import { StabilityFilter } from '../src/filters/stability.ts';
import type { WatchEvent } from '../src/types.ts';

function makeEvent(path: string): WatchEvent {
  return {
    path,
    kind: 'create',
    contentHash: null,
    fileInfo: {
      size: 100,
      modifiedAt: new Date(),
      createdAt: new Date(),
      isFile: true,
      isSymlink: false,
    },
    timestamp: new Date(),
  };
}

Deno.test('StabilityFilter — stable file passes through', async () => {
  // Create a temp file with stable content
  const tmpDir = await Deno.makeTempDir();
  const tmpFile = `${tmpDir}/stable.csv`;
  await Deno.writeTextFile(tmpFile, 'hello,world\n');

  const filter = new StabilityFilter({ checkIntervalMs: 50, stableChecks: 2 });

  async function* gen() {
    yield makeEvent(tmpFile);
  }

  const results: WatchEvent[] = [];
  for await (const e of filter.apply(gen())) {
    results.push(e);
  }

  assertEquals(results.length, 1);
  assertEquals(results[0].kind, 'create');

  await Deno.remove(tmpDir, { recursive: true });
});

Deno.test('StabilityFilter — remove events pass through without check', async () => {
  const filter = new StabilityFilter({ checkIntervalMs: 50, stableChecks: 2 });

  const event: WatchEvent = {
    path: '/nonexistent/file.csv',
    kind: 'remove',
    contentHash: null,
    fileInfo: null,
    timestamp: new Date(),
  };

  async function* gen() {
    yield event;
  }

  const results: WatchEvent[] = [];
  for await (const e of filter.apply(gen())) {
    results.push(e);
  }

  assertEquals(results.length, 1);
  assertEquals(results[0].kind, 'remove');
});

Deno.test('StabilityFilter — nonexistent file is skipped', async () => {
  const filter = new StabilityFilter({ checkIntervalMs: 50, stableChecks: 2 });

  async function* gen() {
    yield makeEvent('/nonexistent/file.csv');
  }

  const results: WatchEvent[] = [];
  for await (const e of filter.apply(gen())) {
    results.push(e);
  }

  assertEquals(results.length, 0);
});

Deno.test('StabilityFilter — respects abort signal', async () => {
  const controller = new AbortController();
  const filter = new StabilityFilter({ checkIntervalMs: 500, stableChecks: 10 }, controller.signal);

  const tmpDir = await Deno.makeTempDir();
  const tmpFile = `${tmpDir}/growing.csv`;
  await Deno.writeTextFile(tmpFile, 'data');

  // Abort quickly
  setTimeout(() => controller.abort(), 50);

  const result = await filter.waitForStability(tmpFile);
  assertEquals(result, null);

  await Deno.remove(tmpDir, { recursive: true });
});
