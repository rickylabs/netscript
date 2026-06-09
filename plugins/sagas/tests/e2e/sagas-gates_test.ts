import { assertEquals } from 'jsr:@std/assert@^1';
import { sagasPlugin } from '../../mod.ts';
import { getSagasE2eGates } from '../../src/e2e/mod.ts';

Deno.test('getSagasE2eGates returns stable saga gate metadata', () => {
  const gates = getSagasE2eGates();

  assertEquals(gates.map((gate) => gate.id), [
    'sagas.health',
    'sagas.roundtrip',
  ]);
  assertEquals(gates.map((gate) => gate.command[0]), ['deno', 'deno']);
  assertEquals(gates[0]?.command, [
    'deno',
    'run',
    '--unstable-kv',
    '--allow-net',
    '--allow-env',
    'src/e2e/probes/health.ts',
  ]);
  assertEquals(gates[1]?.command, [
    'deno',
    'run',
    '--unstable-kv',
    '--allow-net',
    '--allow-env',
    'src/e2e/probes/roundtrip.ts',
  ]);

  assertEquals(sagasPlugin.contributions.e2e, undefined);
  assertEquals(sagasPlugin.contributions.aspire, './src/aspire/mod.ts');
});
