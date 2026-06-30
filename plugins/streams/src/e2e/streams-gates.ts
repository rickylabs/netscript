import type { PluginE2eGate } from '@netscript/plugin';

/** E2E gate definition for the streams plugin. */
export type StreamsE2eGate = PluginE2eGate;

const STREAMS_E2E_GATES: readonly StreamsE2eGate[] = [
  {
    id: 'streams.health',
    description: 'Streams service exposes a healthy HTTP endpoint.',
    command: [
      'deno',
      'run',
      '--allow-net',
      '--allow-env',
      'src/e2e/probes/health.ts',
    ],
  },
  {
    id: 'streams.publish',
    description: 'Streams producer can publish a State Protocol event.',
    command: [
      'deno',
      'run',
      '--allow-all',
      'src/e2e/probes/publish.ts',
    ],
  },
  {
    id: 'streams.subscribe',
    description: 'Streams client can subscribe to a durable stream.',
    command: [
      'deno',
      'run',
      '--allow-net',
      '--allow-env',
      'src/e2e/probes/subscribe.ts',
    ],
  },
] as const;

/**
 * Return E2E gate definitions owned by the streams plugin.
 *
 * @returns Immutable E2E gate definitions.
 */
export function getStreamsE2eGates(): readonly StreamsE2eGate[] {
  return STREAMS_E2E_GATES;
}
