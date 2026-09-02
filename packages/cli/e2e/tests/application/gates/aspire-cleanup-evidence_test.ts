import { assertEquals, assertThrows } from '@std/assert';
import {
  assertNoOwnedSurvivors,
  evaluatePostStopProbe,
  pathContained,
  stopCommand,
} from '../../../src/application/gates/scaffold/runtime/evidence/cleanup.ts';

const FIXTURES = new URL('./fixtures/', import.meta.url);

Deno.test('post-stop probe mirrors S7 mount env argv and process-name ownership evidence', async () => {
  const fixture = JSON.parse(
    await Deno.readTextFile(new URL('aspire-post-stop-probe.json', FIXTURES)),
  );
  const result = evaluatePostStopProbe(fixture, fixture.projectRoot);
  assertEquals(result.ownedContainers.map((entry) => entry.id), ['owned-container']);
  assertEquals(result.ownedProcesses.map((entry) => entry.pid), [41, 42]);
  assertEquals(result.foreignContainers.map((entry) => entry.id), ['foreign-container']);
  assertEquals(result.foreignProcesses.map((entry) => entry.pid), [43]);
  assertEquals(result.unprovenContainers.map((entry) => entry.id), [
    'creator-only-container',
    'unproven-container',
  ]);
  assertThrows(
    () => assertNoOwnedSurvivors(result),
    Error,
    'post-stop probe found owned containers: owned-container',
  );
});

Deno.test('post-stop ownership containment is path-boundary safe', () => {
  assertEquals(pathContained('/workspace/app/.data/postgres', '/workspace/app'), true);
  assertEquals(pathContained('/workspace/application/.data/postgres', '/workspace/app'), false);
  assertEquals(pathContained('../app/.data/postgres', '/workspace/app'), false);
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

Deno.test('a matching process with no path evidence is reported as unproven, not dropped', async () => {
  // Containers already have an `unproven` bucket; processes did not. A matching aspire/dcp process
  // that exposes neither `--apphost` argv nor ASPIRE_DCP_APPHOST_PATH therefore fell through both
  // branches and vanished from the evaluation entirely — so a survivor could leak past
  // assertNoOwnedSurvivors while the report showed nothing. Classification must be total.
  const fixture = JSON.parse(
    await Deno.readTextFile(new URL('aspire-post-stop-probe.json', FIXTURES)),
  );
  const result = evaluatePostStopProbe(fixture, fixture.projectRoot);

  assertEquals(result.unprovenProcesses.map((entry) => entry.pid), [45]);

  // Every matching process lands in exactly one bucket.
  const classified = [
    ...result.ownedProcesses,
    ...result.foreignProcesses,
    ...result.unprovenProcesses,
  ].map((entry) => entry.pid).sort((a, b) => a - b);
  assertEquals(classified, [41, 42, 43, 45]);

  // Unproven is reported, never mutated — same treatment containers already get.
  assertThrows(
    () => assertNoOwnedSurvivors(result),
    Error,
    'post-stop probe found owned containers',
  );
});
