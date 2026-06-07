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
    httpGate(
      GATE.BEHAVIOR_WORKERS_JOBS,
      'List worker jobs',
      'http://localhost:8091/api/v1/workers/jobs',
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_TASKS,
      'List worker tasks',
      'http://localhost:8091/api/v1/workers/tasks',
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_SEED,
      'Seed worker demo data through API',
      'http://localhost:8091/api/v1/workers/seed',
      'POST',
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB,
      'Trigger workers plugin health job',
      'http://localhost:8091/api/v1/workers/jobs/workers-plugin-health-check/trigger',
      'POST',
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_EXECUTIONS,
      'List recent worker executions',
      GATE_PHASE.BEHAVIOR,
      () => ['deno', 'eval', VALIDATE_WORKER_EXECUTIONS_SCRIPT],
    ),
    httpGate(GATE.BEHAVIOR_SAGAS_HEALTH, 'Sagas API health', 'http://localhost:8092/health/live'),
    httpGate(
      GATE.BEHAVIOR_SAGAS_LIST,
      'List saga definitions',
      'http://localhost:8092/api/v1/sagas/sagas',
    ),
    httpGate(
      GATE.BEHAVIOR_SAGAS_INSTANCES,
      'List saga instances',
      'http://localhost:8092/api/v1/sagas/instances',
    ),
    httpGate(
      GATE.BEHAVIOR_TRIGGERS_HEALTH,
      'Triggers API health',
      'http://localhost:8093/health',
    ),
    commandGate(
      GATE.BEHAVIOR_TRIGGERS_WEBHOOK,
      'Accept generic trigger webhook',
      GATE_PHASE.BEHAVIOR,
      () => [
        'curl',
        '-sf',
        '-X',
        'POST',
        'http://localhost:8093/api/v1/webhooks/inbound/generic',
        '-H',
        'Content-Type: application/json',
        '-d',
        JSON.stringify({
          message: 'e2e-trigger-gate',
          timestamp: new Date().toISOString(),
        }),
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_TRIGGERS_EVENTS,
      'List trigger events',
      GATE_PHASE.BEHAVIOR,
      () => ['deno', 'eval', VALIDATE_TRIGGER_EVENTS_SCRIPT],
    ),
  ];
}

const VALIDATE_TRIGGER_EVENTS_SCRIPT = [
  'const url = "http://localhost:8093/api/v1/events?limit=10";',
  'const response = await fetch(url);',
  'if (!response.ok) throw new Error("HTTP " + response.status + " from " + url);',
  'const body = await response.json() as { events?: unknown[]; total?: number };',
  'if (!Array.isArray(body.events)) throw new Error("events response is missing events[]");',
  'if (typeof body.total !== "number") throw new Error("events response is missing total");',
  'if (body.total < 1) throw new Error("expected at least one trigger event after webhook gate");',
].join('\n');

const VALIDATE_WORKER_EXECUTIONS_SCRIPT = [
  'const url = "http://localhost:8091/api/v1/workers/executions?limit=10";',
  'for (let attempt = 1; attempt <= 10; attempt++) {',
  '  const response = await fetch(url);',
  '  if (!response.ok) throw new Error("HTTP " + response.status + " from " + url);',
  '  const body = await response.json() as { executions?: unknown[]; total?: number };',
  '  if (!Array.isArray(body.executions)) throw new Error("executions response is missing executions[]");',
  '  if (typeof body.total !== "number") throw new Error("executions response is missing total");',
  '  if (body.total >= 1) break;',
  '  if (attempt === 10) throw new Error("expected at least one worker execution after trigger gate");',
  '  await new Promise((resolve) => setTimeout(resolve, 1_000));',
  '}',
].join('\n');

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
