import { assertEquals } from '@std/assert';

import { GATE } from '../../../src/domain/cli-surface.ts';
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
