import { assertEquals, assertThrows } from '@std/assert';
import {
  assertNoOwnedSurvivors,
  evaluatePostStopProbe,
  hasOwnedSurvivors,
  pathContained,
  resolveOwnedSurvivors,
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

Deno.test('a survivor that Docker is still removing is re-probed, forced, and cleared', async () => {
  // Exact observed failure: run 33626174632 Postgres tier, cleanup.aspire-stop after 1.73s found one
  // owned survivor. `aspire stop --force` returns once teardown is requested; Docker removes the
  // container afterwards, so probing immediately can report a container already on its way out.
  const survivor = {
    ownedContainers: [{ id: '5c23e3eb0000' }],
    foreignContainers: [],
    unprovenContainers: [],
    ownedProcesses: [],
    foreignProcesses: [],
    unprovenProcesses: [],
  };
  const clear = {
    ownedContainers: [],
    foreignContainers: [],
    unprovenContainers: [],
    ownedProcesses: [],
    foreignProcesses: [],
    unprovenProcesses: [],
  };
  const observations = [survivor, clear];
  const waited: number[] = [];
  let forced = 0;

  const { evaluation, attempts } = await resolveOwnedSurvivors(
    () => Promise.resolve(observations.shift() ?? clear),
    () => {
      forced += 1;
      return Promise.resolve();
    },
    (ms) => {
      waited.push(ms);
      return Promise.resolve();
    },
  );

  assertEquals(hasOwnedSurvivors(evaluation), false);
  assertEquals(forced, 1, 'exactly one forced stop should have been needed');
  assertEquals(waited, [2000, 2000], 'wait before and after the forced stop');
  // The survivor id is retained as evidence rather than only the final verdict.
  assertEquals(attempts.map((a) => a.ownedContainers), [['5c23e3eb0000'], []]);
  assertEquals(attempts.map((a) => a.forcedBefore), [false, true]);
});

Deno.test('a genuine leak still fails after every bounded attempt', async () => {
  const survivor = {
    ownedContainers: [{ id: 'persistent' }],
    foreignContainers: [],
    unprovenContainers: [],
    ownedProcesses: [],
    foreignProcesses: [],
    unprovenProcesses: [],
  };
  let forced = 0;
  const { evaluation, attempts } = await resolveOwnedSurvivors(
    () => Promise.resolve(survivor),
    () => {
      forced += 1;
      return Promise.resolve();
    },
    () => Promise.resolve(),
  );
  // Bounded: two retry waits are configured, so two forced stops and three observations.
  assertEquals(forced, 2);
  assertEquals(attempts.length, 3);
  assertEquals(hasOwnedSurvivors(evaluation), true);
  assertThrows(
    () => assertNoOwnedSurvivors(evaluation),
    Error,
    'post-stop probe found owned containers',
  );
});

Deno.test('a clean first probe neither waits nor forces', async () => {
  const clear = {
    ownedContainers: [],
    foreignContainers: [],
    unprovenContainers: [],
    ownedProcesses: [],
    foreignProcesses: [],
    unprovenProcesses: [],
  };
  let forced = 0;
  let waits = 0;
  const { attempts } = await resolveOwnedSurvivors(
    () => Promise.resolve(clear),
    () => {
      forced += 1;
      return Promise.resolve();
    },
    () => {
      waits += 1;
      return Promise.resolve();
    },
  );
  assertEquals([forced, waits, attempts.length], [0, 0, 1]);
});
