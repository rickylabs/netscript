/** E2E gate definition for the sagas plugin. */
export interface SagasE2eGate {
  /** Stable gate identifier. */
  readonly id: string;
  /** Human-readable gate summary. */
  readonly description: string;
  /** Command used by the evaluator or CLI E2E runner. */
  readonly command: readonly string[];
}

const SAGAS_E2E_GATES: readonly SagasE2eGate[] = [
  {
    id: 'sagas.health',
    description: 'Sagas API service exposes a healthy HTTP endpoint.',
    command: [
      'deno',
      'run',
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      'src/e2e/probes/health.ts',
    ],
  },
  {
    id: 'sagas.roundtrip',
    description: 'Sagas API accepts a publish request for a roundtrip probe message.',
    command: [
      'deno',
      'run',
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      'src/e2e/probes/roundtrip.ts',
    ],
  },
] as const;

/**
 * Return E2E gate definitions owned by the sagas plugin.
 *
 * @returns Immutable E2E gate definitions.
 */
export function getSagasE2eGates(): readonly SagasE2eGate[] {
  return SAGAS_E2E_GATES;
}
