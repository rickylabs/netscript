import { assertEquals } from '@std/assert';

import { GATE } from '../../../src/domain/cli-surface.ts';
import { DATABASE } from '../../../src/domain/extension-axes.ts';
import { createRuntimeGates } from '../../../src/application/gates/scaffold/runtime-gates.ts';

Deno.test('runtime aspire start gate discards detached command output', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_ASPIRE_START);

  assertEquals(gate?.kind, 'command');
  if (gate?.kind !== 'command') {
    throw new Error('Expected runtime aspire start gate to be a command gate.');
  }

  assertEquals(gate.outputMode, 'discard');
  assertEquals(
    gate.failureHint,
    'Aspire start ran with discarded output. Check the detached-child log under ~/.aspire/logs or rerun the command manually for full diagnostics.',
  );
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
