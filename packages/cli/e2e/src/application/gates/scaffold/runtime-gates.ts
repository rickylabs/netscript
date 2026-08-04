import {
  ASPIRE_RESOURCE,
  type AspireResource,
  GATE,
  GATE_PHASE,
} from '../../../domain/cli-surface.ts';
import { DATABASE, type DatabaseEngine, PACKAGE_SOURCE } from '../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import { commandGate, denoCommand, httpGate } from './gate-factory.ts';
import { allocateScaffoldDefaultPort } from '../../../../../src/kernel/domain/scaffold/default-port-allocation.ts';

const ASPIRE_RESOURCE_WAIT_TIMEOUT_SECONDS: Partial<
  Record<AspireResource, number>
> = {
  [ASPIRE_RESOURCE.MSSQL]: 600,
  // The app's health probe renders a real SSR route, so this wait covers the Vite dev
  // server's cold start and first render — not just the process reaching `Running`.
  [ASPIRE_RESOURCE.APP]: 300,
};

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

const AI_CHAT_ROUTE_FAILURE_HINT =
  'The generated AI chat route or composition could not be imported, or the self-wired ' +
  '`e2e-tool` was absent or not callable after plugin registry generation. Inspect the captured ' +
  'stderr for the failing generated module and registry path.';

function pluginUrl(resourceName: string, path: string): (context: RunContext) => string {
  return (context) =>
    `http://127.0.0.1:${
      allocateScaffoldDefaultPort(
        context.request.options.projectName,
        `plugin:${resourceName}`,
      )
    }${path}`;
}

function pluginPort(context: RunContext, resourceName: string): number {
  return allocateScaffoldDefaultPort(
    context.request.options.projectName,
    `plugin:${resourceName}`,
  );
}

function withPluginPort(script: string, previousPort: number, port: number): string {
  return script.replaceAll(String(previousPort), String(port));
}

function runtimeWaitGate(resource: AspireResource): GateDefinition {
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
      const timeoutSeconds = ASPIRE_RESOURCE_WAIT_TIMEOUT_SECONDS[resource];
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
      { classes: ['timeout', 'canceled'], maxRetries: 1 },
    ),
    commandGate(
      GATE.RUNTIME_AUTH_SMOKE_ENV,
      'Wire auth smoke environment',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'eval',
        withPluginPort(
          AUTH_SMOKE_ENV_SCRIPT,
          8094,
          pluginPort(context, 'auth'),
        ),
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
    ...runtimeResources(database).map(runtimeWaitGate),
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
    httpGate(
      GATE.BEHAVIOR_WORKERS_HEALTH,
      'Workers API health',
      pluginUrl('workers-api', '/health/live'),
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_JOBS,
      'List worker jobs',
      pluginUrl('workers-api', '/api/v1/workers/jobs'),
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_TASKS,
      'List worker tasks',
      pluginUrl('workers-api', '/api/v1/workers/tasks'),
    ),
    httpGate(
      GATE.BEHAVIOR_WORKERS_SEED,
      'Seed worker demo data through API',
      pluginUrl('workers-api', '/api/v1/workers/seed'),
      'POST',
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB,
      'Trigger workers plugin health job',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        `--allow-net=127.0.0.1:${pluginPort(context, 'workers-api')}`,
        'packages/cli/e2e/src/application/gates/scaffold/configure-flow-b-job.ts',
        context.project.projectRoot,
        String(pluginPort(context, 'workers-api')),
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_WORKERS_EXECUTIONS,
      'List recent worker executions',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'eval',
        withPluginPort(
          VALIDATE_WORKER_EXECUTIONS_SCRIPT,
          8091,
          pluginPort(context, 'workers-api'),
        ),
      ],
    ),
    httpGate(
      GATE.BEHAVIOR_SAGAS_HEALTH,
      'Sagas API health',
      pluginUrl('sagas-api', '/health/live'),
    ),
    httpGate(
      GATE.BEHAVIOR_SAGAS_LIST,
      'List saga definitions',
      pluginUrl('sagas-api', '/api/v1/sagas/sagas'),
    ),
    httpGate(
      GATE.BEHAVIOR_SAGAS_INSTANCES,
      'List saga instances',
      pluginUrl('sagas-api', '/api/v1/sagas/instances'),
    ),
    commandGate(
      GATE.BEHAVIOR_DURABLE_CLI_PARITY,
      'Drive workers and sagas through durable CLI verbs',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        `--allow-net=127.0.0.1:${pluginPort(context, 'workers-api')},127.0.0.1:${
          pluginPort(context, 'sagas-api')
        }`,
        '--allow-read',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/durable-cli-parity.ts`,
      ],
      (context) => context.project.projectRoot,
    ),
    httpGate(
      GATE.BEHAVIOR_TRIGGERS_HEALTH,
      'Triggers API health',
      pluginUrl('triggers-api', '/health'),
    ),
    commandGate(
      GATE.BEHAVIOR_TRIGGERS_WEBHOOK,
      'Accept generic trigger webhook',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'eval',
        withPluginPort(
          ACCEPT_TRIGGER_WEBHOOK_SCRIPT,
          8093,
          pluginPort(context, 'triggers-api'),
        ),
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_TRIGGERS_EVENTS,
      'List trigger events',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'eval',
        withPluginPort(
          VALIDATE_TRIGGER_EVENTS_SCRIPT,
          8093,
          pluginPort(context, 'triggers-api'),
        ),
      ],
    ),
    httpGate(
      GATE.BEHAVIOR_AUTH_LIVE,
      'Auth API liveness',
      pluginUrl('auth', '/health/live'),
    ),
    httpGate(
      GATE.BEHAVIOR_AUTH_READY,
      'Auth API readiness',
      pluginUrl('auth', '/health/ready'),
    ),
    httpGate(
      GATE.BEHAVIOR_AUTH_SESSION,
      'Read auth session route',
      pluginUrl('auth', '/api/v1/auth/session'),
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
        ASPIRE_RESOURCE.APP,
        context.project.appHost,
      ],
      undefined,
      'capture',
      APP_HOME_FAILURE_HINT,
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
function runtimeResources(database: DatabaseEngine): readonly AspireResource[] {
  return [
    ...databaseRuntimeResources(database),
    ASPIRE_RESOURCE.GARNET,
    ASPIRE_RESOURCE.WORKERS_API,
    ASPIRE_RESOURCE.WORKERS,
    ASPIRE_RESOURCE.SAGAS_API,
    ASPIRE_RESOURCE.SAGAS,
    ASPIRE_RESOURCE.TRIGGERS_API,
    ASPIRE_RESOURCE.TRIGGERS,
    ASPIRE_RESOURCE.AUTH,
    ASPIRE_RESOURCE.STREAMS,
    // Last: the app depends on everything above and is the slowest to first render.
    ASPIRE_RESOURCE.APP,
  ];
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

const PROBE_SERVICE_HEALTH_SCRIPT = [
  'const appHost = Deno.args[0];',
  'const resourceName = Deno.args[1] ?? "users";',
  'const database = Deno.args[2] ?? "postgres";',
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

const VALIDATE_TRIGGER_EVENTS_SCRIPT = [
  'const url = "http://127.0.0.1:8093/api/v1/events?limit=10";',
  'const response = await fetch(url);',
  'if (!response.ok) throw new Error("HTTP " + response.status + " from " + url);',
  'const body = await response.json() as { events?: unknown[]; total?: number };',
  'if (!Array.isArray(body.events)) throw new Error("events response is missing events[]");',
  'if (typeof body.total !== "number") throw new Error("events response is missing total");',
  'if (body.total < 1) throw new Error("expected at least one trigger event after webhook gate");',
].join('\n');

const ACCEPT_TRIGGER_WEBHOOK_SCRIPT = [
  'const url = "http://127.0.0.1:8093/api/v1/webhooks/inbound/generic";',
  'let lastStatus = 0;',
  'let lastBody = "";',
  'for (let attempt = 1; attempt <= 30; attempt++) {',
  '  const response = await fetch(url, {',
  '    method: "POST",',
  '    headers: { "Content-Type": "application/json" },',
  '    body: JSON.stringify({',
  '      message: "e2e-trigger-gate",',
  '      timestamp: new Date().toISOString(),',
  '    }),',
  '  });',
  '  lastStatus = response.status;',
  '  lastBody = await response.text();',
  '  if (response.ok) {',
  '    console.info(`trigger webhook accepted: HTTP ${response.status}`);',
  '    Deno.exit(0);',
  '  }',
  '  await new Promise((resolve) => setTimeout(resolve, 500));',
  '}',
  'throw new Error(`trigger webhook was not accepted after retries: HTTP ${lastStatus}: ${lastBody}`);',
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
  '  "--redirect-uri", "http://127.0.0.1:8094/api/v1/auth/callback",',
  '  "--kv-oauth-key", key, "--project-root", projectRoot,',
  ']);',
  'const configured = JSON.parse(await Deno.readTextFile(`${projectRoot}/appsettings.json`));',
  'if (configured.Auth?.Backend !== "kv-oauth") throw new Error("auth backend CLI did not persist appsettings");',
  'if (configured.NetScript?.Plugins?.auth?.Environment?.NETSCRIPT_AUTH_PROVIDER_ID !== "github") throw new Error("auth provider CLI did not persist plugin environment");',
].join('\n');

const VALIDATE_WORKER_EXECUTIONS_SCRIPT = [
  'const url = "http://127.0.0.1:8091/api/v1/workers/executions?limit=10";',
  'const expectedJobId = "health-check";',
  'let lastBody = "";',
  'for (let attempt = 1; attempt <= 30; attempt++) {',
  '  const response = await fetch(url);',
  '  lastBody = await response.text();',
  '  if (!response.ok) throw new Error("HTTP " + response.status + " from " + url + ": " + lastBody);',
  '  const body = JSON.parse(lastBody);',
  '  if (!Array.isArray(body.executions)) throw new Error("executions response is missing executions[]");',
  '  if (typeof body.total !== "number") throw new Error("executions response is missing total");',
  '  const execution = body.executions.find((item) => isExecutionForJob(item, expectedJobId));',
  '  if (execution && isRecord(execution) && execution.status === "completed") {',
  '    console.info(`worker health job completed after ${attempt} attempt(s)`);',
  '    Deno.exit(0);',
  '  }',
  '  if (execution && isRecord(execution) && ["failed", "timeout", "cancelled"].includes(String(execution.status))) {',
  '    throw new Error(`worker health job reached terminal failure state: ${JSON.stringify(execution)}`);',
  '  }',
  '  await new Promise((resolve) => setTimeout(resolve, 1_000));',
  '}',
  'throw new Error(`expected completed ${expectedJobId} execution after trigger gate; last body: ${lastBody}`);',
  '',
  'function isExecutionForJob(value, jobId) {',
  '  return isRecord(value) && value.jobId === jobId;',
  '}',
  '',
  'function isRecord(value) {',
  '  return typeof value === "object" && value !== null && !Array.isArray(value);',
  '}',
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
