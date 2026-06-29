import { assertEquals } from '@std/assert';

import type { PluginE2eGate } from '../../mod.ts';

Deno.test('PluginE2eGate carries the shared gate field contract', () => {
  const gate: PluginE2eGate = {
    id: 'example.health',
    description: 'Example service exposes a healthy HTTP endpoint.',
    command: ['deno', 'run', '--allow-net', 'src/e2e/probes/health.ts'],
  };

  assertEquals(gate.id, 'example.health');
  assertEquals(gate.description, 'Example service exposes a healthy HTTP endpoint.');
  assertEquals(gate.command, ['deno', 'run', '--allow-net', 'src/e2e/probes/health.ts']);
});
