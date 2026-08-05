import { assertEquals, assertThrows } from '@std/assert';
import { GATE, QUICKSTART } from '../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../src/domain/extension-axes.ts';
import { createQuickstartWalkSuite } from '../../suites/quickstart/quickstart-walk-suite.ts';

const EXACT_CLI = 'jsr:@netscript/cli@0.0.5-canary.1';

Deno.test('quickstart walk exposes exactly seven independently named verdicts before cleanup', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  assertEquals(suite.id, QUICKSTART.WALK);
  assertEquals(suite.gates.filter((gate) => gate.phase !== 'cleanup').map((gate) => gate.id), [
    GATE.QUICKSTART_INSTALL,
    GATE.QUICKSTART_INIT,
    GATE.QUICKSTART_SERVICE_ADD,
    GATE.QUICKSTART_ASPIRE,
    GATE.QUICKSTART_DATABASE,
    GATE.QUICKSTART_CHECK,
    GATE.QUICKSTART_SERVICE_RESPONSE,
  ]);
  assertEquals(
    suite.gates.filter((gate) => gate.phase !== 'cleanup').map((gate) => gate.title),
    [1, 2, 3, 4, 5, 6, 7].map((step) =>
      suite.gates.find((gate) => gate.title.includes(`step ${step}/7`))?.title
    ),
  );
});

Deno.test('quickstart service-add verdict initializes first, adds users, and checks immediately', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  const context = contextFor(suite.defaultOptions);
  const init = command(suite, GATE.QUICKSTART_INIT, context);
  const add = command(suite, GATE.QUICKSTART_SERVICE_ADD, context);
  assertEquals(init.includes('--service'), false);
  assertEquals(add.join(' ').includes('service'), true);
  assertEquals(add.join(' ').includes('add'), true);
  assertEquals(add.join(' ').includes('deno'), true);
  assertEquals(add.join(' ').includes('check'), true);
});

Deno.test('quickstart project-check verdict runs the documented command exactly', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });

  assertEquals(
    command(suite, GATE.QUICKSTART_CHECK, contextFor(suite.defaultOptions)),
    ['deno', 'task', 'check'],
  );
});

Deno.test('quickstart service-response verdict accepts service health without a database assertion', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  const response = command(
    suite,
    GATE.QUICKSTART_SERVICE_RESPONSE,
    contextFor(suite.defaultOptions),
  );
  assertEquals(response.slice(-2), ['/repo/.llm/tmp/my-app/aspire/apphost.mts', 'users']);
});

Deno.test('quickstart Aspire gates hydrate the pinned project-local package cache', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  const context = contextFor(suite.defaultOptions);
  const aspire = command(suite, GATE.QUICKSTART_ASPIRE, context);
  const database = command(suite, GATE.QUICKSTART_DATABASE, context);
  assertEquals(aspire.includes('/repo'), true);
  assertEquals(database.includes('/repo'), true);
  assertEquals(aspire.includes('--allow-read'), true);
  assertEquals(database.includes('--allow-read'), true);
});

Deno.test('quickstart commands reject a local CLI entrypoint', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.LOCAL,
    cliEntrypoint: 'packages/cli/bin/netscript.ts',
  });
  const install = suite.gates.find((gate) => gate.id === GATE.QUICKSTART_INSTALL);
  if (!install || install.kind !== 'command') throw new Error('install gate missing');
  assertThrows(
    () => install.command(contextFor(suite.defaultOptions)),
    Error,
    'requires --source jsr',
  );
});

function command(
  suite: ReturnType<typeof createQuickstartWalkSuite>,
  id: string,
  context: ReturnType<typeof contextFor>,
): readonly string[] {
  const gate = suite.gates.find((candidate) => candidate.id === id);
  if (!gate || gate.kind !== 'command') throw new Error(`${id} command gate missing`);
  return gate.command(context);
}

function contextFor(options: ReturnType<typeof createQuickstartWalkSuite>['defaultOptions']) {
  return {
    request: { suiteId: QUICKSTART.WALK, options },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: options.cliEntrypoint,
      smokeRoot: '/repo/.llm/tmp',
      projectName: 'my-app',
      projectRoot: '/repo/.llm/tmp/my-app',
      appHost: '/repo/.llm/tmp/my-app/aspire/apphost.mts',
    },
  } as const;
}
