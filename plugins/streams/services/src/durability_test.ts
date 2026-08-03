import { describeStorageDurability } from './durability.ts';

function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed${msg ? ` (${msg})` : ''}: expected ${String(expected)}, got ${
        String(actual)
      }`,
    );
  }
}

Deno.test('describeStorageDurability: file-backed durable branch', () => {
  const result = describeStorageDurability('/var/data/streams');
  assertEquals(result.durable, true);
  assertEquals(result.dataDir, '/var/data/streams');
  assertEquals(
    result.message,
    'Streams service storage is durable (file-backed at /var/data/streams).',
  );
});

Deno.test('describeStorageDurability: in-memory non-durable branch', () => {
  const resultUndefined = describeStorageDurability(undefined);
  assertEquals(resultUndefined.durable, false);
  assertEquals(resultUndefined.dataDir, undefined);
  assertEquals(
    resultUndefined.message,
    'Streams service storage is non-durable (in-memory). Set STREAMS_DATA_DIR=<path> to enable file-backed durable storage.',
  );

  const resultEmpty = describeStorageDurability('   ');
  assertEquals(resultEmpty.durable, false);
  assertEquals(
    resultEmpty.message,
    'Streams service storage is non-durable (in-memory). Set STREAMS_DATA_DIR=<path> to enable file-backed durable storage.',
  );
});
