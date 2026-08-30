import { assertEquals } from '@std/assert';
import { evaluatePostStopProbe } from '../../../src/application/gates/scaffold/runtime/aspire-cleanup-evidence.ts';

const FIXTURES = new URL('./fixtures/', import.meta.url);

Deno.test('post-stop probe mirrors S7 mount env argv and process-name ownership evidence', async () => {
  const fixture = JSON.parse(
    await Deno.readTextFile(new URL('aspire-post-stop-probe.json', FIXTURES)),
  );
  const result = evaluatePostStopProbe(fixture, fixture.appHost);
  assertEquals(result.ownedContainers.map((entry) => entry.id), ['owned-container']);
  assertEquals(result.ownedProcesses.map((entry) => entry.pid), [41, 42]);
  assertEquals(result.foreignContainers.map((entry) => entry.id), ['foreign-container']);
  assertEquals(result.foreignProcesses.map((entry) => entry.pid), [43]);
  assertEquals(result.unprovenContainers.map((entry) => entry.id), ['unproven-container']);
});
