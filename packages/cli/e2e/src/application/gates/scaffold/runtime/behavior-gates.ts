import { GATE, GATE_PHASE } from '../../../../domain/cli-surface.ts';
import { DATABASE, type DatabaseEngine } from '../../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../../domain/gate-definition.ts';
import type { RunContext } from '../../../../domain/run-context.ts';
import { commandGate, denoCommand } from '../gate-factory.ts';
import { generatedAppName } from './generated-app-name.ts';
import { PROBE_SERVICE_HEALTH_SCRIPT, VALIDATE_AI_CHAT_ROUTE_SCRIPT } from './behavior-scripts.ts';

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

const APP_DYNAMIC_ROUTE_FAILURE_HINT =
  'The generated app did not bind its dynamic order path through definePage().withRoute(...). ' +
  'Inspect the plain/partial request mode and the missing status, data-order-id, or href marker.';

const APP_REFERENCE_FAILURE_HINT =
  'The generated app did not render its canonical resource and design states in a real headless ' +
  'browser at desktop and mobile viewports. Inspect the named path, viewport, and missing semantic marker.';

const ISLAND_SERVED_SURFACE_FAILURE_HINT =
  'The generated service example did not emit its Fresh island marker or serve every referenced ' +
  'JavaScript entry. Inspect the structured served-surface receipt.';

const ISLAND_HYDRATION_FAILURE_HINT =
  'The generated service example did not hydrate into an interactive island. Inspect the ' +
  'structured hydration receipt and the headless-browser failure.';

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
    `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-plugin-resource.ts`,
    context.project.appHost,
    resourceName,
    action,
    ...(path === undefined ? [] : [path]),
  ];
}

/** Create behavior gates that probe the running generated application. */
export function createRuntimeBehaviorGates(
  database: DatabaseEngine = DATABASE.POSTGRES,
): readonly GateDefinition[] {
  return [
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
      'Users service uses the live second-start Postgres allocation with correlated telemetry',
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
      GATE.BEHAVIOR_APP_DYNAMIC_ROUTE,
      'Generated app binds a dynamic route in plain and partial requests',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-net=127.0.0.1,localhost',
        '--allow-read',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-app-dynamic-route.ts`,
        context.project.projectRoot,
        generatedAppName(context),
        context.project.appHost,
      ],
      undefined,
      'capture',
      APP_DYNAMIC_ROUTE_FAILURE_HINT,
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
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-app-reference.ts`,
        context.project.projectRoot,
        generatedAppName(context),
        context.project.appHost,
      ],
      undefined,
      'capture',
      APP_REFERENCE_FAILURE_HINT,
    ),
    commandGate(
      GATE.BEHAVIOR_ISLAND_SERVED_SURFACE,
      'Serve the generated route-local island marker and client modules',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-net=127.0.0.1,localhost',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-island-served-surface.ts`,
        context.project.projectRoot,
        generatedAppName(context),
        context.project.appHost,
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/behavior.island-served-surface.json`,
      ],
      undefined,
      'capture',
      ISLAND_SERVED_SURFACE_FAILURE_HINT,
    ),
    commandGate(
      GATE.BEHAVIOR_ISLAND_HYDRATION,
      'Hydrate the generated route-local island and complete Rename',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-net=127.0.0.1,localhost',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-island-hydration.ts`,
        context.project.projectRoot,
        generatedAppName(context),
        context.project.appHost,
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/behavior.island-hydration.json`,
      ],
      undefined,
      'capture',
      ISLAND_HYDRATION_FAILURE_HINT,
    ),
    commandGate(
      GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH,
      'Prove settled users update invalidates and refetches its list once',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '-A',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/service-client-runtime-probe.ts`,
        'browser',
        context.project.projectRoot,
        generatedAppName(context),
        context.project.appHost,
      ],
      (context) => context.project.projectRoot,
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
