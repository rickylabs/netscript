import { assertEquals, assertThrows } from '@std/assert';
import { createReadmeQuickstartSuite } from '../../suites/quickstart/readme-quickstart-suite.ts';
import { GATE, QUICKSTART } from '../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../src/domain/extension-axes.ts';

const EXACT_CLI = 'jsr:@netscript/cli@0.0.7-canary.1';

Deno.test('README Quickstart suite exposes eleven ordered no-retry command receipts', () => {
  const suite = createReadmeQuickstartSuite({
    repoRoot: '/repo',
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });

  assertEquals(suite.id, QUICKSTART.README);
  assertEquals(suite.defaultOptions.projectName, 'my-app');
  assertEquals(suite.defaultOptions.smokeRoot, '/repo/.llm/tmp/cli-e2e');
  assertEquals(suite.gates.map((gate) => gate.id), [
    GATE.README_QUICKSTART_INSTALL,
    GATE.README_QUICKSTART_INIT,
    GATE.README_QUICKSTART_CD_ASPIRE,
    GATE.README_QUICKSTART_ASPIRE_RESTORE,
    GATE.README_QUICKSTART_ASPIRE_START,
    GATE.README_QUICKSTART_ASPIRE_WAIT,
    GATE.README_QUICKSTART_CD_ROOT,
    GATE.README_QUICKSTART_DB_INIT,
    GATE.README_QUICKSTART_DB_GENERATE,
    GATE.README_QUICKSTART_DB_SEED,
    GATE.README_QUICKSTART_CURL_HEALTH,
    GATE.CLEANUP_ASPIRE_STOP,
  ]);
  for (const gate of suite.gates) {
    if (gate.kind === 'command') assertEquals(gate.retry, undefined, gate.id);
  }
});

Deno.test('README Quickstart gates dispatch one indexed runtime-edge command each', () => {
  const suite = createReadmeQuickstartSuite({
    repoRoot: '/repo',
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  const context = {
    request: { suiteId: QUICKSTART.README, options: suite.defaultOptions },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: EXACT_CLI,
      smokeRoot: '/repo',
      projectName: 'my-app',
      projectRoot: '/repo/my-app',
      appHost: '/repo/my-app/aspire/apphost.mts',
    },
  } as const;

  const commands = suite.gates.slice(0, 11).map((gate) => {
    if (gate.kind !== 'command') throw new Error(`${gate.id} is not a command gate`);
    return gate.command(context);
  });
  assertEquals(commands.map((command) => command.at(-7)), Array(11).fill('/repo'));
  assertEquals(commands.map((command) => command.at(-6)), Array(11).fill('/repo'));
  assertEquals(
    commands.map((command) => command.at(-5)),
    Array(11).fill('/repo/my-app/aspire/apphost.mts'),
  );
  assertEquals(commands.map((command) => command.at(-4)), [...Array(11).keys()].map(String));
  assertEquals(commands.every((command) => command.includes('--allow-run')), true);
});

Deno.test('README Quickstart command, gate-id, and phase tuples stay aligned', () => {
  const suite = createReadmeQuickstartSuite({ repoRoot: '/repo' });
  const commandGates = suite.gates.slice(0, -1);
  assertEquals(commandGates.length, 11);
  assertEquals(commandGates.every((gate) => gate.id.startsWith('readme.quickstart.')), true);
  assertEquals(commandGates.every((gate) => gate.phase !== undefined), true);
});

Deno.test('README Quickstart rejects a local CLI before command execution', () => {
  const suite = createReadmeQuickstartSuite({
    repoRoot: '/repo',
    packageSource: PACKAGE_SOURCE.LOCAL,
    cliEntrypoint: 'packages/cli/bin/netscript.ts',
  });
  const gate = suite.gates[0];
  if (gate.kind !== 'command') throw new Error('README install gate is not a command gate');
  assertThrows(
    () =>
      gate.command({
        request: { suiteId: QUICKSTART.README, options: suite.defaultOptions },
        project: {
          repoRoot: '/repo',
          cliEntrypoint: 'packages/cli/bin/netscript.ts',
          smokeRoot: '/repo',
          projectName: 'my-app',
          projectRoot: '/repo/my-app',
          appHost: '/repo/my-app/aspire/apphost.mts',
        },
      }),
    Error,
    'requires --source jsr',
  );
});
