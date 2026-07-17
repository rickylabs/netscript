import { assertEquals } from '@std/assert';

import { GATE } from '../../../src/domain/cli-surface.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import { DATABASE } from '../../../src/domain/extension-axes.ts';
import { createRuntimeGates } from '../../../src/application/gates/scaffold/runtime-gates.ts';

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
  const context = {
    project: { repoRoot: '/repo', projectRoot: '/workspace/app' },
  } as RunContext;
  assertEquals(gate.cwd(context), '/workspace/app');
  assertEquals(gate.command(context), [
    'deno',
    'run',
    '--allow-net=127.0.0.1:8091,127.0.0.1:8092',
    '--allow-read',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/durable-cli-parity.ts',
  ]);
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
