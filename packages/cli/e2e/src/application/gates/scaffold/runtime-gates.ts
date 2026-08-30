import {
  ASPIRE_RESOURCE,
  type AspireResource,
  GATE,
  GATE_PHASE,
  KV_BACKGROUND_RUNTIME_RESOURCES,
  KV_BACKGROUND_RUNTIME_WAIT_RESOURCES,
} from '../../../domain/cli-surface.ts';
import { DATABASE, type DatabaseEngine, PACKAGE_SOURCE } from '../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import { resolve } from '@std/path';
import { commandGate, denoCommand } from './gate-factory.ts';
import { generatedAppName } from './generated-app-name.ts';

const ASPIRE_RESOURCE_WAIT_TIMEOUT_SECONDS: Partial<
  Record<AspireResource, number>
> = {
  [ASPIRE_RESOURCE.MSSQL]: 600,
};

const KV_BACKGROUND_RUNTIME_WAIT_TIMEOUT_SECONDS = 300;

/** A feed stall gets three short chances instead of consuming two suite-wide 15-minute budgets. */
export const ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS = 180_000;
export const ASPIRE_RESTORE_MAX_RETRIES = 2;

/**
 * Why the probe takes a project root and an AppHost instead of a URL: since #952 the pristine
 * scaffold pins **no** host port, so that two workspaces on one machine — and
 * `aspire start --isolated` — do not collide. Aspire allocates the port at run time and no
 * file on disk holds it, so the probe resolves it from the running AppHost through
 * `aspire describe`, and only reads `appsettings.json` when a project explicitly pins one.
 * A gate that hardcodes a port probes something nothing listens on, and a connection-refused
 * loop is indistinguishable from an app that cannot render.
 */
const APP_HOME_FAILURE_HINT =
  'The generated app did not serve its home page. The probe resolves the port from the ' +
  "running AppHost (or the project's appsettings.json when one is pinned), so a failure " +
  'here means the app itself is not rendering — check the app resource logs in the Aspire ' +
  'dashboard.';

const APP_REFERENCE_FAILURE_HINT =
  'The generated app did not render its canonical resource and design states in a real headless ' +
  'browser at desktop and mobile viewports. Inspect the named path, viewport, and missing semantic marker.';

const AI_CHAT_ROUTE_FAILURE_HINT =
  'The generated AI chat route or composition could not be imported, or the self-wired ' +
  '`e2e-tool` was absent or not callable after plugin registry generation. Inspect the captured ' +
  'stderr for the failing generated module and registry path.';

function pluginProbeCommand(
  context: RunContext,
  resourceName: string,
  action: string,
  path?: string,
): readonly string[] {
  return [
    'deno',
    'run',
    '--allow-run=aspire',
    '--allow-net=localhost,127.0.0.1',
    `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/probe-plugin-resource.ts`,
    context.project.appHost,
    resourceName,
    action,
    ...(path === undefined ? [] : [path]),
  ];
}

function runtimeWaitGate(resource: AspireResource): GateDefinition {
  if (resource === ASPIRE_RESOURCE.WORKERS) {
    return commandGate(
      `runtime.wait.${resource}`,
      `Wait for ${resource}`,
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/wait-for-workers-runtime.ts`,
        context.project.appHost,
      ],
    );
  }

  return commandGate(
    `runtime.wait.${resource}`,
    `Wait for ${resource}`,
    GATE_PHASE.RUNTIME,
    (context) => {
      const command = [
        'aspire',
        'wait',
        resource,
        '--apphost',
        context.project.appHost,
        '--non-interactive',
        '--nologo',
      ];
      const timeoutSeconds = isKvBackgroundRuntime(resource)
        ? KV_BACKGROUND_RUNTIME_WAIT_TIMEOUT_SECONDS
        : ASPIRE_RESOURCE_WAIT_TIMEOUT_SECONDS[resource];
      if (timeoutSeconds !== undefined) {
        command.splice(
          3,
          0,
          '--status',
          'healthy',
          '--timeout',
          String(timeoutSeconds),
        );
      }
      return command;
    },
  );
}

function runtimeAppWaitGate(): GateDefinition {
  return commandGate(
    GATE.RUNTIME_WAIT_APP,
    'Wait for the project-derived Fresh app',
    GATE_PHASE.RUNTIME,
    (context) => [
      'aspire',
      'wait',
      generatedAppName(context),
      '--status',
      'healthy',
      '--timeout',
      '300',
      '--apphost',
      context.project.appHost,
      '--non-interactive',
      '--nologo',
    ],
  );
}

/** Create runtime and health-check gates for the generated application. */
export function createRuntimeGates(
  database: DatabaseEngine = DATABASE.POSTGRES,
): readonly GateDefinition[] {
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
      undefined,
      undefined,
      undefined,
      {
        classes: ['timeout', 'canceled', 'infrastructure'],
        maxRetries: ASPIRE_RESTORE_MAX_RETRIES,
      },
      ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS,
      'infrastructure',
    ),
    commandGate(
      GATE.RUNTIME_AUTH_SMOKE_ENV,
      'Wire auth smoke environment',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'eval',
        AUTH_SMOKE_ENV_SCRIPT,
        context.project.projectRoot,
        context.project.repoRoot,
      ],
    ),
    commandGate(
      GATE.RUNTIME_FLOW_B_FIXTURE,
      'Wire real Flow-B callback fixture',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=deno',
        '--allow-env',
        'packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts',
        context.project.projectRoot,
        context.request.options.packageSource === PACKAGE_SOURCE.JSR ? 'published' : 'local',
        context.project.cliEntrypoint.startsWith('jsr:')
          ? context.project.cliEntrypoint
          : resolve(context.project.repoRoot, context.project.cliEntrypoint),
      ],
    ),
    commandGate(
      GATE.RUNTIME_READINESS_FIXTURE,
      'Wire dead-port readiness fixture',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        'packages/cli/e2e/src/application/gates/scaffold/prepare-readiness-fixture.ts',
        context.project.projectRoot,
      ],
    ),
    commandGate(
      GATE.RUNTIME_ASPIRE_START,
      'Start generated Aspire AppHost',
      GATE_PHASE.RUNTIME,
      (
        context,
      ) => [
        'deno',
        'eval',
        ASPIRE_START_SCRIPT,
        context.project.appHost,
        context.project.projectRoot,
      ],
    ),
    commandGate(
      GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST,
      'Capture first live database allocation',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/capture-db-endpoint-allocation.ts`,
        context.project.appHost,
        context.project.projectRoot,
        'first',
      ],
    ),
    commandGate(
      GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB,
      'Restart resident AppHost after database preparation',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'eval',
        ASPIRE_RESTART_SCRIPT,
        context.project.appHost,
        context.project.projectRoot,
      ],
    ),
    commandGate(
      GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
      'Capture second live database allocation',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/capture-db-endpoint-allocation.ts`,
        context.project.appHost,
        context.project.projectRoot,
        'second',
      ],
    ),
    ...runtimeResources(database).map(runtimeWaitGate),
    runtimeAppWaitGate(),
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
    commandGate(
      GATE.BEHAVIOR_DB_STATUS_PRESERVES_APPHOST,
      'DB status preserves resident AppHost identity',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-run=aspire,deno',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/verify-db-status-preserves-apphost.ts`,
        context.project.projectRoot,
        context.project.repoRoot,
        context.project.appHost,
        database,
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.BEHAVIOR_ENDPOINT_READINESS,
      'Endpoint-bearing process requires readiness evidence',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/verify-endpoint-readiness.ts`,
        context.project.appHost,
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.BEHAVIOR_MCP_ENDPOINT_DIRECTORY,
      'Follow the documented MCP OpenAPI discovery path',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--config',
        `${context.project.repoRoot}/packages/mcp/deno.json`,
        '--allow-read',
        '--allow-run=aspire',
        '--allow-net=127.0.0.1,localhost',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/verify-mcp-endpoint-directory.ts`,
        context.project.projectRoot,
        context.project.appHost,
        generatedAppName(context),
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.BEHAVIOR_SERVICE_HEALTH,
      'Users service health',
      GATE_PHASE.BEHAVIOR,
      (
        context,
      ) => [
        'deno',
        'eval',
        PROBE_SERVICE_HEALTH_SCRIPT,
        context.project.appHost,
        'users',
        database,
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_LIVE_DB_ENDPOINT,
      'Users service uses the second live Postgres allocation with correlated telemetry',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--unsafely-ignore-certificate-errors=localhost',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        '--allow-net=localhost,127.0.0.1',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts`,
        context.project.appHost,
        context.project.projectRoot,
        database,
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_HEALTH,
      'Workers API health',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'workers-api', 'get', '/health/live'),
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_JOBS,
      'List worker jobs',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'workers-api', 'get', '/api/v1/workers/jobs'),
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_TASKS,
      'List worker tasks',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'workers-api', 'get', '/api/v1/workers/tasks'),
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_SEED,
      'Seed worker demo data through API',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'workers-api', 'post', '/api/v1/workers/seed'),
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB,
      'Trigger workers plugin health job',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'workers-api', 'workers-trigger'),
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_EXECUTIONS,
      'List recent worker executions',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'workers-api', 'workers-executions'),
    ),
    commandGate(
      GATE.BEHAVIOR_SAGAS_HEALTH,
      'Sagas API health',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'sagas-api', 'get', '/health/live'),
    ),
    commandGate(
      GATE.BEHAVIOR_SAGAS_LIST,
      'List saga definitions',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'sagas-api', 'get', '/api/v1/sagas/sagas'),
    ),
    commandGate(
      GATE.BEHAVIOR_SAGAS_INSTANCES,
      'List saga instances',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'sagas-api', 'get', '/api/v1/sagas/instances'),
    ),
    commandGate(
      GATE.BEHAVIOR_DURABLE_CLI_PARITY,
      'Drive workers and sagas through durable CLI verbs',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-net=localhost,127.0.0.1',
        '--allow-run=aspire',
        '--allow-env=WORKERS_API_URL,SAGAS_API_URL',
        '--allow-read',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/durable-cli-parity.ts`,
        context.project.appHost,
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.BEHAVIOR_TRIGGERS_HEALTH,
      'Triggers API health',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'triggers-api', 'get', '/health'),
    ),
    commandGate(
      GATE.BEHAVIOR_TRIGGERS_WEBHOOK,
      'Accept generic trigger webhook',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'triggers-api', 'trigger-webhook'),
    ),
    commandGate(
      GATE.BEHAVIOR_TRIGGERS_EVENTS,
      'List trigger events',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'triggers-api', 'trigger-events'),
    ),
    commandGate(
      GATE.BEHAVIOR_AUTH_LIVE,
      'Auth API liveness',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'auth', 'get', '/health/live'),
    ),
    commandGate(
      GATE.BEHAVIOR_AUTH_READY,
      'Auth API readiness',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'auth', 'get', '/health/ready'),
    ),
    commandGate(
      GATE.BEHAVIOR_AUTH_SESSION,
      'Read auth session route',
      GATE_PHASE.BEHAVIOR,
      (context) => pluginProbeCommand(context, 'auth', 'get', '/api/v1/auth/session'),
    ),
    commandGate(
      GATE.BEHAVIOR_APP_HOME,
      'Generated app serves its home page',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        // `localhost` as well as `127.0.0.1`: Deno's allowlist matches the host *string*, and
        // `aspire describe` reports endpoints as `http://localhost:<port>`. Granting only
        // 127.0.0.1 denies every fetch, which the retry loop then reports as if the app never
        // rendered — the exact failure this gate is supposed to distinguish.
        '--allow-net=127.0.0.1,localhost',
        '--allow-read',
        // The pristine scaffold pins no host port, so the probe resolves the allocated one
        // through `aspire describe` against the running AppHost.
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/probe-app-home.ts`,
        context.project.projectRoot,
        generatedAppName(context),
        context.project.appHost,
      ],
      undefined,
      'capture',
      APP_HOME_FAILURE_HINT,
    ),
    commandGate(
      GATE.BEHAVIOR_APP_REFERENCE,
      'Render canonical app reference states in desktop and mobile browsers',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-run',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/probe-app-reference.ts`,
        context.project.projectRoot,
        generatedAppName(context),
        context.project.appHost,
      ],
      undefined,
      'capture',
      APP_REFERENCE_FAILURE_HINT,
    ),
    commandGate(
      GATE.BEHAVIOR_AI_CHAT_ROUTE,
      'Import generated AI chat route',
      GATE_PHASE.BEHAVIOR,
      (context) =>
        denoCommand(
          context,
          'eval',
          VALIDATE_AI_CHAT_ROUTE_SCRIPT,
          context.project.projectRoot,
        ),
      (context) => context.project.projectRoot,
      'capture',
      AI_CHAT_ROUTE_FAILURE_HINT,
    ),
  ];
}

const ASPIRE_START_SCRIPT = [
  'const appHost = Deno.args[0];',
  'const projectRoot = Deno.args[1];',
  'if (!appHost) throw new Error("apphost argument is required");',
  'if (!projectRoot) throw new Error("project root argument is required");',
  'const command = new Deno.Command("aspire", {',
  '  args: [',
  '    "start",',
  '    "--apphost",',
  '    appHost,',
  '    "--isolated",',
  '    "--non-interactive",',
  '    "--nologo",',
  '    "--format",',
  '    "Json",',
  '  ],',
  '  stdout: "piped",',
  '  stderr: "piped",',
  '});',
  'const output = await command.output();',
  'const stdout = new TextDecoder().decode(output.stdout);',
  'const stderr = new TextDecoder().decode(output.stderr);',
  'if (!output.success) {',
  '  throw new Error(`aspire start failed with code ${output.code}: ${stderr || stdout}`);',
  '}',
  'const metadata = JSON.parse(extractJson(stdout));',
  'if (!metadata.dashboardUrl) throw new Error("aspire start did not report dashboardUrl");',
  'const stateDir = `${projectRoot}/.netscript/e2e`;',
  'await Deno.mkdir(stateDir, { recursive: true });',
  'await Deno.writeTextFile(`${stateDir}/aspire-start.json`, JSON.stringify(metadata, null, 2));',
  'console.info(`Aspire dashboard: ${metadata.dashboardUrl}`);',
  'if (metadata.logFile) console.info(`Aspire log: ${metadata.logFile}`);',
  '',
  'function extractJson(text) {',
  '  const trimmed = text.trim();',
  '  const objectIndex = trimmed.indexOf("{");',
  '  if (objectIndex < 0) throw new Error("aspire start did not emit JSON");',
  '  return trimmed.slice(objectIndex);',
  '}',
].join('\n');

const ASPIRE_RESTART_SCRIPT = [
  'const stop = await new Deno.Command("aspire", {',
  '  args: ["stop", "--apphost", Deno.args[0], "--non-interactive", "--nologo"],',
  '  stdout: "inherit",',
  '  stderr: "inherit",',
  '}).spawn().status;',
  'if (!stop.success) throw new Error(`aspire stop failed with code ${stop.code}`);',
  ASPIRE_START_SCRIPT,
].join('\n');
/** List the Aspire resources that a runtime suite waits for. */
export function runtimeResources(database: DatabaseEngine): readonly AspireResource[] {
  return [
    ...databaseRuntimeResources(database),
    ASPIRE_RESOURCE.GARNET,
    ...KV_BACKGROUND_RUNTIME_WAIT_RESOURCES,
    ASPIRE_RESOURCE.AUTH,
    ASPIRE_RESOURCE.STREAMS,
  ];
}

function isKvBackgroundRuntime(resource: AspireResource): boolean {
  return (KV_BACKGROUND_RUNTIME_RESOURCES as readonly AspireResource[]).includes(resource);
}

const VALIDATE_AI_CHAT_ROUTE_SCRIPT = [
  'const projectRoot = Deno.args[0];',
  'if (!projectRoot) throw new Error("project root argument is required");',
  'const route = await import(`file://${projectRoot}/ai/routes/chat-stream.ts`);',
  'const composition = await import(`file://${projectRoot}/ai/ai.ts`);',
  'if (typeof route.handler !== "function") throw new Error("AI chat-stream handler is not exported");',
  'if (typeof route.aiRouter !== "object" || route.aiRouter === null) {',
  '  throw new Error("AI chat-stream route did not export a contract-bound aiRouter");',
  '}',
  'if (typeof route.aiRouteContract !== "object" || route.aiRouteContract === null) {',
  '  throw new Error("AI chat-stream route did not export aiContractV1 handle");',
  '}',
  'const handler = composition.ai().tools.resolveHandler("e2e-tool");',
  'if (typeof handler !== "function") throw new Error("plugin ai add tool did not self-wire e2e-tool");',
  'const result = await handler({ id: "e2e", name: "e2e-tool", arguments: JSON.stringify({ query: "ping" }), state: "input-complete" });',
  'if (!result || result.state === "error") throw new Error("self-wired e2e-tool was not callable");',
  'console.info("AI chat route contract import smoke passed");',
].join('\n');

function databaseRuntimeResources(
  database: DatabaseEngine,
): readonly AspireResource[] {
  switch (database) {
    case DATABASE.POSTGRES:
      return [ASPIRE_RESOURCE.POSTGRES];
    case DATABASE.MYSQL:
      return [ASPIRE_RESOURCE.MYSQL];
    case DATABASE.MSSQL:
      return [ASPIRE_RESOURCE.MSSQL];
    case DATABASE.SQLITE:
      return [];
  }
}

export const PROBE_SERVICE_HEALTH_SCRIPT = [
  'const appHost = Deno.args[0];',
  'const resourceName = Deno.args[1] ?? "users";',
  'const database = Deno.args[2];',
  'if (!appHost) throw new Error("apphost argument is required");',
  'const command = new Deno.Command("aspire", {',
  '  args: ["describe", "--apphost", appHost, "--format", "Json"],',
  '  stdout: "piped",',
  '  stderr: "piped",',
  '});',
  'const output = await command.output();',
  'const stdout = new TextDecoder().decode(output.stdout);',
  'const stderr = new TextDecoder().decode(output.stderr);',
  'if (!output.success) {',
  '  throw new Error(`aspire describe failed with code ${output.code}: ${stderr || stdout}`);',
  '}',
  'const topology = JSON.parse(extractJson(stdout));',
  'const resource = findResource(topology, resourceName);',
  'if (!resource) {',
  '  throw new Error(`resource ${resourceName} was not present in aspire describe output`);',
  '}',
  'const urls = collectHttpUrls(resource);',
  'if (urls.length === 0) {',
  '  throw new Error(`resource ${resourceName} did not expose an HTTP endpoint in aspire describe output`);',
  '}',
  'const errors = [];',
  'for (const baseUrl of urls) {',
  '  const healthUrl = new URL("/health", baseUrl).toString();',
  '  const result = await probe(healthUrl);',
  '  if (result.ok && aggregateHealthMatches(result.body, database)) {',
  '    console.info(`service health probe passed: ${healthUrl} -> ${result.status}`);',
  '    Deno.exit(0);',
  '  }',
  '  errors.push(`${healthUrl} -> ${result.status}: ${result.body.slice(0, 200)}`);',
  '}',
  'throw new Error(`service health probe failed for ${resourceName}: ${errors.join("; ")}`);',
  '',
  'function aggregateHealthMatches(body, expectedDatabase) {',
  '  let health;',
  '  try {',
  '    health = JSON.parse(body);',
  '  } catch {',
  '    return false;',
  '  }',
  '  if (!isRecord(health) || health.status !== "healthy" || !Array.isArray(health.checks)) {',
  '    return false;',
  '  }',
  '  if (expectedDatabase === undefined) return true;',
  '  const databaseChecks = health.checks',
  '    .filter(isRecord)',
  '    .map((check) => check.name)',
  '    .filter((name) => typeof name === "string" && name.startsWith("database"));',
  '  const expectedNames = new Set(["database", `database:${expectedDatabase}`]);',
  '  return databaseChecks.length === 1 && expectedNames.has(databaseChecks[0]);',
  '}',
  '',
  'function extractJson(text) {',
  '  const trimmed = text.trim();',
  '  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;',
  '  const objectIndex = trimmed.indexOf("{");',
  '  const arrayIndex = trimmed.indexOf("[");',
  '  const indexes = [objectIndex, arrayIndex].filter((index) => index >= 0);',
  '  if (indexes.length === 0) throw new Error("aspire describe did not emit JSON");',
  '  return trimmed.slice(Math.min(...indexes));',
  '}',
  '',
  'function findResource(value, name) {',
  '  if (!isRecord(value)) return undefined;',
  '  if (resourceNameMatches(value, name)) return value;',
  '  for (const child of Object.values(value)) {',
  '    if (Array.isArray(child)) {',
  '      for (const item of child) {',
  '        const match = findResource(item, name);',
  '        if (match) return match;',
  '      }',
  '      continue;',
  '    }',
  '    const match = findResource(child, name);',
  '    if (match) return match;',
  '  }',
  '  return undefined;',
  '}',
  '',
  'function resourceNameMatches(value, name) {',
  '  for (const key of ["name", "displayName", "resourceName"]) {',
  '    const candidate = value[key];',
  '    if (typeof candidate === "string" && candidate.toLowerCase() === name.toLowerCase()) {',
  '      return true;',
  '    }',
  '  }',
  '  return false;',
  '}',
  '',
  'function collectHttpUrls(value) {',
  '  const urls = new Set();',
  '  collect(value, urls);',
  '  return [...urls];',
  '}',
  '',
  'function collect(value, urls) {',
  '  if (typeof value === "string") {',
  '    if (/^https?:\\/\\//i.test(value)) urls.add(value);',
  '    return;',
  '  }',
  '  if (Array.isArray(value)) {',
  '    for (const item of value) collect(item, urls);',
  '    return;',
  '  }',
  '  if (!isRecord(value)) return;',
  '  for (const child of Object.values(value)) collect(child, urls);',
  '}',
  '',
  'function isRecord(value) {',
  '  return typeof value === "object" && value !== null && !Array.isArray(value);',
  '}',
  '',
  'async function probe(url) {',
  '  for (let attempt = 1; attempt <= 30; attempt++) {',
  '    try {',
  '      const response = await fetch(url);',
  '      const body = await response.text();',
  '      if (response.ok) return { ok: true, status: response.status, body };',
  '      if (attempt === 30) return { ok: false, status: response.status, body: body.slice(0, 200) };',
  '    } catch (error) {',
  '      if (attempt === 30) {',
  '        return { ok: false, status: 0, body: error instanceof Error ? error.message : String(error) };',
  '      }',
  '    }',
  '    await new Promise((resolve) => setTimeout(resolve, 1_000));',
  '  }',
  '  return { ok: false, status: 0, body: "probe exhausted without a request" };',
  '}',
].join('\n');

const AUTH_SMOKE_ENV_SCRIPT = [
  'const projectRoot = Deno.args[0];',
  'const repoRoot = Deno.args[1];',
  'if (!projectRoot) throw new Error("project root argument is required");',
  'if (!repoRoot) throw new Error("repo root argument is required");',
  'const cli = `${repoRoot}/packages/cli/bin/netscript-dev.ts`;',
  'async function run(args: string[]): Promise<string> {',
  '  const result = await new Deno.Command("deno", { args: ["run", "-A", cli, ...args], cwd: projectRoot }).output();',
  '  const stdout = new TextDecoder().decode(result.stdout).trim();',
  '  const stderr = new TextDecoder().decode(result.stderr).trim();',
  '  if (!result.success) throw new Error(`auth CLI failed: ${args.join(" ")}: ${stderr}`);',
  '  return stdout;',
  '}',
  'await run(["plugin", "auth", "backend", "set", "kv-oauth", "--project-root", projectRoot]);',
  'const key = await run(["plugin", "auth", "secret", "generate", "kv-oauth-key"]);',
  'await run([',
  '  "plugin", "auth", "provider", "set", "--preset", "github",',
  '  "--client-id", "scaffold_runtime_smoke",',
  '  "--client-secret", "scaffold_runtime_smoke_secret",',
  '  "--redirect-uri", "http://localhost/api/v1/auth/callback",',
  '  "--kv-oauth-key", key, "--project-root", projectRoot,',
  ']);',
  'const configured = JSON.parse(await Deno.readTextFile(`${projectRoot}/appsettings.json`));',
  'if (configured.Auth?.Backend !== "kv-oauth") throw new Error("auth backend CLI did not persist appsettings");',
  'if (configured.NetScript?.Plugins?.auth?.Environment?.NETSCRIPT_AUTH_PROVIDER_ID !== "github") throw new Error("auth provider CLI did not persist plugin environment");',
].join('\n');

/** Create cleanup gates that stop generated runtime resources. */
export function createCleanupGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.CLEANUP_ASPIRE_STOP,
      'Stop generated Aspire AppHost',
      GATE_PHASE.CLEANUP,
      (
        context,
      ) => [
        'aspire',
        'stop',
        '--apphost',
        context.project.appHost,
        '--non-interactive',
        '--nologo',
      ],
    ),
  ];
}
