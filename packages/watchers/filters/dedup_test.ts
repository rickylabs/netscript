import { assertEquals, assertNotEquals } from '@std/assert';
import { computeContentHash, DedupFilter } from '../src/filters/dedup.ts';
import type { WatchEvent } from '../src/types.ts';

Deno.test('computeContentHash — produces consistent SHA-256 hex', async () => {
  const tmpDir = await Deno.makeTempDir();
  const tmpFile = `${tmpDir}/test.csv`;
  await Deno.writeTextFile(tmpFile, 'hello,world\n');

  const hash1 = await computeContentHash(tmpFile);
  const hash2 = await computeContentHash(tmpFile);

  assertNotEquals(hash1, null);
  assertEquals(hash1, hash2);
  assertEquals(hash1!.length, 64); // SHA-256 = 32 bytes = 64 hex chars

  await Deno.remove(tmpDir, { recursive: true });
});

Deno.test('computeContentHash — different content yields different hash', async () => {
  const tmpDir = await Deno.makeTempDir();
  const file1 = `${tmpDir}/a.csv`;
  const file2 = `${tmpDir}/b.csv`;
  await Deno.writeTextFile(file1, 'hello');
  await Deno.writeTextFile(file2, 'world');

  const hash1 = await computeContentHash(file1);
  const hash2 = await computeContentHash(file2);

  assertNotEquals(hash1, hash2);

  await Deno.remove(tmpDir, { recursive: true });
});

Deno.test('DedupFilter — deduplicates identical files', async () => {
  const tmpDir = await Deno.makeTempDir();
  const tmpFile = `${tmpDir}/data.csv`;
  await Deno.writeTextFile(tmpFile, 'same-content\n');

  const filter = new DedupFilter({ windowMs: 10_000 });

  function makeEvent(): WatchEvent {
    return {
      path: tmpFile,
      kind: 'create',
      contentHash: null,
      fileInfo: {
        size: 13,
        modifiedAt: new Date(),
        createdAt: new Date(),
        isFile: true,
        isSymlink: false,
      },
      timestamp: new Date(),
    };
  }

  async function* gen() {
    yield makeEvent();
    yield makeEvent(); // duplicate
  }

  const results: WatchEvent[] = [];
  for await (const e of filter.apply(gen())) {
    results.push(e);
  }

  assertEquals(results.length, 1);
  assertNotEquals(results[0].contentHash, null);

  filter.clear();
  await Deno.remove(tmpDir, { recursive: true });
});

Deno.test('DedupFilter — remove events pass through', async () => {
  const filter = new DedupFilter();

  const event: WatchEvent = {
    path: '/some/file.csv',
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
  filter.clear();
});
