import { assertEquals } from 'jsr:@std/assert@^1';
import { getStreamsE2eGates } from '../../src/e2e/mod.ts';

Deno.test('getStreamsE2eGates returns stable stream probe metadata', () => {
  const gates = getStreamsE2eGates();

  assertEquals(gates.map((gate) => gate.id), [
    'streams.health',
    'streams.publish',
    'streams.subscribe',
  ]);
  assertEquals(gates.map((gate) => gate.command[0]), ['deno', 'deno', 'deno']);
  assertEquals(gates[0]?.command, [
    'deno',
    'run',
    '--allow-net',
    '--allow-env',
    'src/e2e/probes/health.ts',
  ]);
  assertEquals(gates[1]?.command.includes('--allow-all'), true);
  assertEquals(gates[2]?.command.includes('src/e2e/probes/subscribe.ts'), true);
});
