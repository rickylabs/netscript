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

Deno.test('runtime gates wait for mysql resource when mysql is selected', () => {
  const gateIds = createRuntimeGates(DATABASE.MYSQL).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), true);
});

Deno.test('runtime gates skip database resource wait for sqlite', () => {
  const gateIds = createRuntimeGates(DATABASE.SQLITE).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_GARNET), true);
});
