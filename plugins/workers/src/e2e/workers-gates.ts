import type { PluginE2eGate } from '@netscript/plugin';

export type { PluginE2eGate } from '@netscript/plugin';

/** E2E gate definition for the workers plugin. */
export type WorkersE2eGate = PluginE2eGate;

const WORKERS_E2E_GATES: readonly WorkersE2eGate[] = [
  {
    id: 'workers.health',
    description: 'Workers API service exposes a healthy HTTP endpoint.',
    command: [
      'deno',
      'run',
      '--allow-net',
      '--allow-env',
      'src/e2e/probes/health.ts',
    ],
  },
  {
    id: 'workers.verify-plugin',
    description: 'Workers plugin manifest verifier passes.',
    command: [
      'deno',
      'run',
      '--allow-read',
      'verify-plugin.ts',
    ],
  },
] as const;

/**
 * Return E2E gate definitions owned by the workers plugin.
 *
 * @returns Immutable E2E gate definitions.
 */
export function getWorkersE2eGates(): readonly WorkersE2eGate[] {
  return WORKERS_E2E_GATES;
}
