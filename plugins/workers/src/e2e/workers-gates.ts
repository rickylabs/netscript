/** E2E gate definition for the workers plugin. */
export interface WorkersE2eGate {
  /** Stable gate identifier. */
  readonly id: string;
  /** Human-readable gate summary. */
  readonly description: string;
  /** Command used by the evaluator or CLI E2E runner. */
  readonly command: readonly string[];
}

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
