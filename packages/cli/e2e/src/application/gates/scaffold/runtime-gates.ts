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
      GATE.RUNTIME_AUTH_SMOKE_ENV,
      'Wire auth smoke environment',
      GATE_PHASE.RUNTIME,
      (context) => ['deno', 'eval', AUTH_SMOKE_ENV_SCRIPT, context.project.projectRoot],
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
    httpGate(
      GATE.BEHAVIOR_WORKERS_HEALTH,
      'Workers API health',
      'http://127.0.0.1:8091/health/live',
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_JOBS,
      'List worker jobs',
      'http://127.0.0.1:8091/api/v1/workers/jobs',
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_TASKS,
      'List worker tasks',
      'http://127.0.0.1:8091/api/v1/workers/tasks',
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_SEED,
      'Seed worker demo data through API',
      'http://127.0.0.1:8091/api/v1/workers/seed',
      'POST',
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB,
      'Trigger workers plugin health job',
      'http://127.0.0.1:8091/api/v1/workers/jobs/workers-plugin-health-check/trigger',
      'POST',
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_EXECUTIONS,
      'List recent worker executions',
      GATE_PHASE.BEHAVIOR,
      () => ['deno', 'eval', VALIDATE_WORKER_EXECUTIONS_SCRIPT],
    ),
    httpGate(GATE.BEHAVIOR_SAGAS_HEALTH, 'Sagas API health', 'http://127.0.0.1:8092/health/live'),
    httpGate(
      GATE.BEHAVIOR_SAGAS_LIST,
      'List saga definitions',
      'http://127.0.0.1:8092/api/v1/sagas/sagas',
    ),
    httpGate(
      GATE.BEHAVIOR_SAGAS_INSTANCES,
      'List saga instances',
      'http://127.0.0.1:8092/api/v1/sagas/instances',
    ),
    httpGate(
      GATE.BEHAVIOR_TRIGGERS_HEALTH,
      'Triggers API health',
      'http://127.0.0.1:8093/health',
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
        'http://127.0.0.1:8093/api/v1/webhooks/inbound/generic',
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
    httpGate(GATE.BEHAVIOR_AUTH_LIVE, 'Auth API liveness', 'http://127.0.0.1:8094/health/live'),
    httpGate(GATE.BEHAVIOR_AUTH_READY, 'Auth API readiness', 'http://127.0.0.1:8094/health/ready'),
    httpGate(
      GATE.BEHAVIOR_AUTH_SESSION,
      'Read auth session route',
      'http://127.0.0.1:8094/api/v1/auth/session',
    ),
  ];
}

const VALIDATE_TRIGGER_EVENTS_SCRIPT = [
  'const url = "http://127.0.0.1:8093/api/v1/events?limit=10";',
  'const response = await fetch(url);',
  'if (!response.ok) throw new Error("HTTP " + response.status + " from " + url);',
  'const body = await response.json() as { events?: unknown[]; total?: number };',
  'if (!Array.isArray(body.events)) throw new Error("events response is missing events[]");',
  'if (typeof body.total !== "number") throw new Error("events response is missing total");',
  'if (body.total < 1) throw new Error("expected at least one trigger event after webhook gate");',
].join('\n');

const AUTH_SMOKE_ENV_SCRIPT = [
  'const projectRoot = Deno.args[0];',
  'if (!projectRoot) throw new Error("project root argument is required");',
  'const helperPath = `${projectRoot}/aspire/.helpers/register-plugins.mts`;',
  'const env = {',
  '  NETSCRIPT_AUTH_BACKEND: "kv-oauth",',
  '  NETSCRIPT_AUTH_CLIENT_ID: "scaffold_runtime_smoke",',
  '  NETSCRIPT_AUTH_CLIENT_SECRET: "scaffold_runtime_smoke_secret",',
  '  NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: "https://issuer.example.test/oauth/authorize",',
  '  NETSCRIPT_AUTH_TOKEN_ENDPOINT: "https://issuer.example.test/oauth/token",',
  '  NETSCRIPT_AUTH_REDIRECT_URI: "http://127.0.0.1:8094/api/v1/auth/callback",',
  '  NETSCRIPT_AUTH_KV_OAUTH_KEY: "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=",',
  '  NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: "true",',
  '};',
  'const source = await Deno.readTextFile(helperPath);',
  'const marker = "  // --- auth ---";',
  'const markerIndex = source.indexOf(marker);',
  'if (markerIndex < 0) throw new Error("register-plugins.mts does not contain auth block");',
  'const nextMarkerIndex = source.indexOf("  // ---", markerIndex + marker.length);',
  'const blockEnd = nextMarkerIndex < 0 ? source.length : nextMarkerIndex;',
  'const bootstrapLine = "    await resource.withEnvironment(\\\'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE\\\', bootstrapModule);";',
  'const bootstrapIndex = source.indexOf(bootstrapLine, markerIndex);',
  'if (bootstrapIndex < 0) throw new Error("auth block does not contain bootstrap env line");',
  'if (bootstrapIndex >= blockEnd) throw new Error("bootstrap env line was not in auth block");',
  'const lines = Object.entries(env).map(([key, value]) =>',
  '  `    await resource.withEnvironment(${JSON.stringify(key)}, ${JSON.stringify(value)});\\n`,',
  ');',
  'const insertAt = bootstrapIndex + bootstrapLine.length;',
  'const updated = source.includes("NETSCRIPT_AUTH_BACKEND")',
  '  ? source',
  '  : source.slice(0, insertAt) + "\\n" + lines.join("") + source.slice(insertAt);',
  'if (!updated.includes("NETSCRIPT_AUTH_BACKEND")) throw new Error("auth smoke env insert did not take effect");',
  'await Deno.writeTextFile(helperPath, updated);',
].join('\n');

const VALIDATE_WORKER_EXECUTIONS_SCRIPT = [
  'const url = "http://127.0.0.1:8091/api/v1/workers/executions?limit=10";',
  'for (let attempt = 1; attempt <= 30; attempt++) {',
  '  const response = await fetch(url);',
  '  if (!response.ok) throw new Error("HTTP " + response.status + " from " + url);',
  '  const body = await response.json() as { executions?: unknown[]; total?: number };',
  '  if (!Array.isArray(body.executions)) throw new Error("executions response is missing executions[]");',
  '  if (typeof body.total !== "number") throw new Error("executions response is missing total");',
  '  if (body.total >= 1) break;',
  '  if (attempt === 30) throw new Error("expected at least one worker execution after trigger gate");',
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
