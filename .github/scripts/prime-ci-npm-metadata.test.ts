import { assertEquals, assertThrows } from '@std/assert';
import { metadataArgs, type MetadataCommand, primeMetadata } from './prime-ci-npm-metadata.ts';

Deno.test('metadata preparation retains scoped underscores and deduplicates peer variants', () => {
  assertEquals(
    metadataArgs({
      npm: {
        'zod@4.4.3': {},
        '@types/babel__core@7.20.5': {},
        '@tanstack/ai@0.66.0_zod@4.4.3': {},
        '@tanstack/ai@0.66.0_zod@3.25.76': {},
      },
    }),
    [
      'install',
      '--entrypoint',
      '--lockfile-only',
      '--no-config',
      '--no-lock',
      'npm:@tanstack/ai@0.66.0',
      'npm:@types/babel__core@7.20.5',
      'npm:zod@4.4.3',
    ],
  );
});

Deno.test('metadata preparation refuses missing, malformed and empty npm maps', () => {
  for (const lock of [null, [], {}, { npm: [] }, { npm: {} }, { npm: { invalid: {} } }]) {
    assertThrows(() => metadataArgs(lock));
  }
});

Deno.test('metadata preparation uses one native call, preserves the lock and propagates failure', async () => {
  const path = await Deno.makeTempFile({ suffix: '.lock' });
  const content = JSON.stringify({ npm: { 'preact@10.29.2': {} } });
  const captured: string[][] = [];
  const command: MetadataCommand = (args) => {
    captured.push([...args]);
    return Promise.resolve(7);
  };
  try {
    await Deno.writeTextFile(path, content);
    assertEquals(await primeMetadata(path, command), 7);
    assertEquals(captured, [metadataArgs(JSON.parse(content))]);
    assertEquals(await Deno.readTextFile(path), content);
  } finally {
    await Deno.remove(path);
  }
});
