import { assertEquals } from 'jsr:@std/assert@^1';
import { workersPlugin } from '../../mod.ts';
import { getWorkersE2eGates } from '../../src/e2e/mod.ts';

Deno.test('getWorkersE2eGates returns stable worker gate metadata', () => {
  const gates = getWorkersE2eGates();

  assertEquals(gates.map((gate) => gate.id), [
    'workers.health',
    'workers.verify-plugin',
  ]);
  assertEquals(gates.map((gate) => gate.command[0]), ['deno', 'deno']);
  assertEquals(gates[0]?.command, [
    'deno',
    'run',
    '--allow-net',
    '--allow-env',
    'src/e2e/probes/health.ts',
  ]);
  assertEquals(gates[1]?.command, [
    'deno',
    'run',
    '--allow-read',
    'verify-plugin.ts',
  ]);

  assertEquals(workersPlugin.contributions.e2e, [{
    name: 'workers-health',
    command: 'deno task workers:e2e',
  }]);
});
