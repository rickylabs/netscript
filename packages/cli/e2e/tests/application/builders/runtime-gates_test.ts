import { assertEquals } from '@std/assert';

import {
  ASPIRE_RESOURCE,
  GATE,
  KV_BACKGROUND_RUNTIME_RESOURCES,
} from '../../../src/domain/cli-surface.ts';
import { PORT_RANGES } from '../../../../src/kernel/constants/port-ranges.ts';
import { allocateScaffoldDefaultPort } from '../../../../src/kernel/domain/scaffold/default-port-allocation.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import { DATABASE } from '../../../src/domain/extension-axes.ts';
import {
  ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS,
  ASPIRE_RESTORE_MAX_RETRIES,
  createRuntimeGates,
} from '../../../src/application/gates/scaffold/runtime-gates.ts';

Deno.test('runtime Aspire restore has a bounded infrastructure retry budget', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_ASPIRE_RESTORE);

  assertEquals(gate?.kind, 'command');
  if (gate?.kind !== 'command') throw new Error('Expected a command gate.');

  assertEquals(ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS, 180_000);
  assertEquals(ASPIRE_RESTORE_MAX_RETRIES, 2);
  assertEquals(gate.timeoutMs, ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS);
  assertEquals(gate.failureClass, 'infrastructure');
  assertEquals(gate.retry, {
    classes: ['timeout', 'canceled', 'infrastructure'],
    maxRetries: 2,
  });
});

Deno.test('runtime aspire start gate captures detached endpoint metadata', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_ASPIRE_START);

  assertEquals(gate?.kind, 'command');
  if (gate?.kind !== 'command') {
    throw new Error('Expected runtime aspire start gate to be a command gate.');
  }

  assertEquals(gate.outputMode, 'capture');

  const command = gate.command({
    project: {
      appHost: '/workspace/app/aspire/apphost.mts',
      projectRoot: '/workspace/app',
    },
  } as RunContext);

  assertEquals(command[0], 'deno');
  assertEquals(command[1], 'eval');
  assertEquals(command.at(-2), '/workspace/app/aspire/apphost.mts');
  assertEquals(command.at(-1), '/workspace/app');
  assertEquals(command[2].includes('"--format"'), true);
  assertEquals(command[2].includes('aspire-start.json'), true);
});

// #954 regression: this gate shipped probing a hardcoded `http://127.0.0.1:8000/` while a
// pinning scaffold published the app on 8010, so all 60 attempts were refused and the failure
// read exactly like an app that could not render.
//
// #952 follow-on: the pristine scaffold now pins nothing, so the gate must also hand over the
// AppHost — that is the only thing that knows the port Aspire allocated. Passing the project
// alone was enough while a port sat in appsettings.json; it is not enough now.
Deno.test('app home gate hands the probe a project and an AppHost to resolve the port from', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.BEHAVIOR_APP_HOME);
  if (gate?.kind !== 'command') {
    throw new Error('Expected app home gate to be a command gate.');
  }

  const command = gate.command({
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext);

  assertEquals(command, [
    'deno',
    'run',
    '--allow-net=127.0.0.1,localhost',
    '--allow-read',
    '--allow-run=aspire',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/probe-app-home.ts',
    '/workspace/app',
    ASPIRE_RESOURCE.APP,
    '/workspace/app/aspire/apphost.mts',
  ]);
  assertEquals(command.some((argument) => argument.includes(String(PORT_RANGES.APP.start))), false);
});

// Regression for the CI failure this branch actually hit: `aspire describe` reports endpoints
// as `http://localhost:<port>`, and Deno's --allow-net matches the host *string*. Granting only
// 127.0.0.1 denied every fetch, and the retry loop reported it as if the app never rendered —
// 60 attempts, 60 seconds, and a failure message that blamed the wrong thing.
Deno.test('app home gate can reach a localhost endpoint, not only 127.0.0.1', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.BEHAVIOR_APP_HOME);
  if (gate?.kind !== 'command') throw new Error('Expected app home gate to be a command gate.');

  const command = gate.command({
    project: { repoRoot: '/repo', projectRoot: '/workspace/app', appHost: '/workspace/app/a.mts' },
  } as RunContext);

  const net = command.find((argument) => argument.startsWith('--allow-net='));
  assertEquals(net?.includes('localhost'), true);
  assertEquals(net?.includes('127.0.0.1'), true);
});

Deno.test('runtime gates wait for postgres resource by default', () => {
  const gateIds = createRuntimeGates().map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), true);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
});

Deno.test('runtime gates include durable workers and sagas CLI parity', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.BEHAVIOR_DURABLE_CLI_PARITY);
  if (gate?.kind !== 'command') {
    throw new Error('Expected durable CLI parity gate to be a command gate.');
  }
  const projectName = 'runtime-gates-test';
  const context = {
    project: { repoRoot: '/repo', projectRoot: '/workspace/app' },
    request: { options: { projectName } },
  } as RunContext;
  const workersPort = allocateScaffoldDefaultPort(projectName, 'plugin:workers-api');
  const sagasPort = allocateScaffoldDefaultPort(projectName, 'plugin:sagas-api');
  assertEquals(gate.cwd(context), '/workspace/app');
  assertEquals(gate.command(context), [
    'deno',
    'run',
    `--allow-net=127.0.0.1:${workersPort},127.0.0.1:${sagasPort}`,
    '--allow-read',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/durable-cli-parity.ts',
  ]);
  assertEquals(gate.failureHint, undefined);
});

Deno.test('runtime gates prove MCP Aspire endpoint discovery against the live AppHost', () => {
  const gate = createRuntimeGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_MCP_ENDPOINT_DIRECTORY
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected MCP endpoint directory gate to be a command gate.');
  }
  const context = {
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext;
  assertEquals(gate.cwd(context), '/workspace/app');
  assertEquals(gate.command(context), [
    'deno',
    'run',
    '--config',
    '/repo/packages/mcp/deno.json',
    '--allow-read',
    '--allow-run=aspire',
    '--allow-net=127.0.0.1,localhost',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/verify-mcp-endpoint-directory.ts',
    '/workspace/app',
    '/workspace/app/aspire/apphost.mts',
  ]);
});

Deno.test('workers wait gate requires runtime startup evidence before behavior gates', () => {
  const gate = createRuntimeGates(DATABASE.SQLITE).find((entry) =>
    entry.id === GATE.RUNTIME_WAIT_WORKERS
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected workers wait gate to be a command gate.');
  }

  assertEquals(
    gate.command({
      project: {
        repoRoot: '/repo',
        appHost: '/workspace/app/aspire/apphost.mts',
      },
    } as RunContext),
    [
      'deno',
      'run',
      '--allow-run=aspire',
      '/repo/packages/cli/e2e/src/application/gates/scaffold/wait-for-workers-runtime.ts',
      '/workspace/app/aspire/apphost.mts',
    ],
  );
});

Deno.test('runtime gates enumerate every KV-backed first-party background runtime', () => {
  assertEquals(KV_BACKGROUND_RUNTIME_RESOURCES, [
    ASPIRE_RESOURCE.WORKERS,
    ASPIRE_RESOURCE.SAGAS,
    ASPIRE_RESOURCE.TRIGGERS,
  ]);

  const gates = createRuntimeGates(DATABASE.SQLITE);
  for (const resource of KV_BACKGROUND_RUNTIME_RESOURCES) {
    const gate = gates.find((entry) => entry.id === `runtime.wait.${resource}`);
    if (gate?.kind !== 'command') {
      throw new Error(`Expected a runtime wait gate for ${resource}.`);
    }

    const command = gate.command({
      project: {
        repoRoot: '/repo',
        appHost: '/workspace/app/aspire/apphost.mts',
      },
    } as RunContext);
    if (resource !== ASPIRE_RESOURCE.WORKERS) {
      assertEquals(command.includes('--status'), true);
      assertEquals(command.includes('healthy'), true);
    }
  }
});

Deno.test('AI chat route gate captures generated registry import failures', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.BEHAVIOR_AI_CHAT_ROUTE);
  if (gate?.kind !== 'command') {
    throw new Error('Expected AI chat route gate to be a command gate.');
  }

  assertEquals(gate.outputMode, 'capture');
  assertEquals(gate.failureHint?.includes('captured stderr'), true);
});

Deno.test('runtime gates wait for mysql resource when mysql is selected', () => {
  const gateIds = createRuntimeGates(DATABASE.MYSQL).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), true);
});

Deno.test('runtime gates skip database resource wait for sqlite', () => {
  const gateIds = createRuntimeGates(DATABASE.SQLITE).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MSSQL), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_GARNET), true);
});

Deno.test('runtime service health gate asserts only the selected sqlite adapter', () => {
  const gate = createRuntimeGates(DATABASE.SQLITE).find((entry) =>
    entry.id === GATE.BEHAVIOR_SERVICE_HEALTH
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected service health gate to be a command gate.');
  }

  const command = gate.command({
    project: { appHost: '/workspace/app/aspire/apphost.mts' },
  } as RunContext);

  assertEquals(command.at(-1), DATABASE.SQLITE);
  assertEquals(command[2].includes('health.checks'), true);
  assertEquals(command[2].includes('databaseChecks.length === 1'), true);
  assertEquals(command[2].includes('database:${expectedDatabase}'), true);
});

Deno.test('runtime gates wait for mssql resource with extended timeout when mssql is selected', () => {
  const gateIds = createRuntimeGates(DATABASE.MSSQL).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MSSQL), true);

  const gate = createRuntimeGates(DATABASE.MSSQL).find((entry) =>
    entry.id === GATE.RUNTIME_WAIT_MSSQL
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected mssql wait gate to be a command gate.');
  }

  assertEquals(
    gate.command({
      project: {
        appHost: '/workspace/app/aspire/apphost.mts',
      },
    } as RunContext),
    [
      'aspire',
      'wait',
      'mssql',
      '--status',
      'healthy',
      '--timeout',
      '600',
      '--apphost',
      '/workspace/app/aspire/apphost.mts',
      '--non-interactive',
      '--nologo',
    ],
  );
});
