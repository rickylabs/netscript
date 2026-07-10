import { assertEquals } from '@std/assert';
import { JSR_API_BASE_URL } from './endpoints.ts';

/** Prevents the centralized JSR API endpoint from drifting back into release feature modules. */
Deno.test('release endpoint is centralized in config', async () => {
  const releaseRoot = new URL('../', import.meta.url);
  const offenders: string[] = [];

  for await (const entry of Deno.readDir(releaseRoot)) {
    if (!entry.isFile || !entry.name.endsWith('.ts') || entry.name.endsWith('_test.ts')) continue;
    const source = await Deno.readTextFile(new URL(entry.name, releaseRoot));
    if (source.includes(JSR_API_BASE_URL)) offenders.push(entry.name);
  }

  assertEquals(offenders, []);
});
