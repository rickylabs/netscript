import { assertEquals } from '@std/assert';
import { GITHUB_API_BASE_URL, JSR_API_BASE_URL } from './endpoints.ts';

/** Prevents centralized API endpoints from drifting back into release feature modules. */
Deno.test('release endpoints are centralized in config', async () => {
  const releaseRoot = new URL('../', import.meta.url);
  const offenders: string[] = [];

  for await (const entry of Deno.readDir(releaseRoot)) {
    if (!entry.isFile || !entry.name.endsWith('.ts') || entry.name.endsWith('_test.ts')) continue;
    const source = await Deno.readTextFile(new URL(entry.name, releaseRoot));
    for (const endpoint of [JSR_API_BASE_URL, GITHUB_API_BASE_URL]) {
      if (source.includes(endpoint)) offenders.push(`${entry.name}: ${endpoint}`);
    }
  }

  assertEquals(offenders, []);
});
