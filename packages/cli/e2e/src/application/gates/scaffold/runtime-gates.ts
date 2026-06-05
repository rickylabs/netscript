import {
  ASPIRE_RESOURCE,
  type AspireResource,
  GATE,
  GATE_PHASE,
} from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { commandGate, httpGate } from './gate-factory.ts';

function runtimeWaitGate(resource: AspireResource): GateDefinition {
  return commandGate(
    `runtime.wait.${resource}`,
    `Wait for ${resource}`,
    GATE_PHASE.RUNTIME,
    (context) => [
      'aspire',
      'wait',
      resource,
      '--apphost',
      context.project.appHost,
      '--non-interactive',
      '--nologo',
    ],
  );
}

/** Create runtime and health-check gates for the generated application. */
export function createRuntimeGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.RUNTIME_ASPIRE_RESTORE,
      'Restore Aspire TypeScript SDK',
      GATE_PHASE.RUNTIME,
      (context) => [
        'aspire',
        'restore',
        '--apphost',
        context.project.appHost,
        '--non-interactive',
        '--nologo',
      ],
    ),
    commandGate(
      GATE.RUNTIME_ASPIRE_START,
      'Start generated Aspire AppHost',
      GATE_PHASE.RUNTIME,
      (
        context,
      ) => [
        'aspire',
        'start',
        '--apphost',
        context.project.appHost,
        '--isolated',
        '--non-interactive',
        '--nologo',
      ],
      undefined,
      'discard',
      'Aspire start ran with discarded output. Check the detached-child log under ~/.aspire/logs or rerun the command manually for full diagnostics.',
    ),
    ...Object.values(ASPIRE_RESOURCE).map(runtimeWaitGate),
    commandGate(
      GATE.RUNTIME_ASPIRE_DESCRIBE,
      'Describe generated topology',
      GATE_PHASE.RUNTIME,
      (context) => [
        'aspire',
        'describe',
        '--apphost',
        context.project.appHost,
        '--format',
        'Json',
      ],
    ),
    httpGate(GATE.BEHAVIOR_WORKERS_HEALTH, 'Workers API health', 'http://localhost:8091/health'),
    httpGate(GATE.BEHAVIOR_SAGAS_HEALTH, 'Sagas API health', 'http://localhost:8092/health/live'),
  ];
}

/** Create cleanup gates that stop generated runtime resources. */
export function createCleanupGates(): readonly GateDefinition[] {
  return [
    commandGate(GATE.CLEANUP_ASPIRE_STOP, 'Stop generated Aspire AppHost', GATE_PHASE.CLEANUP, (
      context,
    ) => [
      'aspire',
      'stop',
      '--apphost',
      context.project.appHost,
      '--non-interactive',
      '--nologo',
    ]),
  ];
}
