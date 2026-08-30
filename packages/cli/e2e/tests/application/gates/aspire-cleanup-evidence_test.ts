import { assertEquals } from '@std/assert';
import {
  evaluatePostStopProbe,
  stopCommand,
} from '../../../src/application/gates/scaffold/runtime/evidence/cleanup.ts';

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

Deno.test('cleanup adds force only after the exact-apphost graceful stop', () => {
  const appHost = '/workspace/app/aspire/apphost.mts';
  assertEquals(stopCommand(appHost, false), [
    'aspire',
    'stop',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
  assertEquals(stopCommand(appHost, true), [
    'aspire',
    'stop',
    '--force',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
});
