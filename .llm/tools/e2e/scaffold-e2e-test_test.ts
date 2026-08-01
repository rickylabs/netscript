import { assertEquals, assertStringIncludes } from '@std/assert';
import { defaultOptions, normalizeCommandOptions } from './scaffold-e2e-test.ts';

Deno.test('scaffold diagnostic cleans up by default with explicit opt-out', () => {
  assertEquals(defaultOptions().cleanup, true);
  assertEquals(normalizeCommandOptions({}).cleanup, true);
  assertEquals(normalizeCommandOptions({ noCleanup: true }).cleanup, false);
});

Deno.test('cleanup opt-out retains a run registry destination', () => {
  const options = normalizeCommandOptions({ noCleanup: true, name: 'fixture' });
  assertStringIncludes(options.runResourcesDir, 'fixture');
});
