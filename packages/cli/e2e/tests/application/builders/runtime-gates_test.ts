import { assertEquals, assertStringIncludes } from '@std/assert';

import {
  ASPIRE_RESOURCE,
  GATE,
  KV_BACKGROUND_RUNTIME_RESOURCES,
  KV_BACKGROUND_RUNTIME_WAIT_RESOURCES,
} from '../../../src/domain/cli-surface.ts';
import { PORT_RANGES } from '../../../../src/kernel/constants/port-ranges.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import { DATABASE } from '../../../src/domain/extension-axes.ts';
import {
  ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS,
  ASPIRE_RESTORE_MAX_RETRIES,
  createRuntimeGates,
} from '../../../src/application/gates/scaffold/runtime-gates.ts';
import { createRuntimeBehaviorGates } from '../../../src/application/gates/scaffold/runtime/behavior-gates.ts';
import { createTypedDbPhaseBGate } from '../../../src/application/gates/scaffold/runtime/listener-readiness-gates.ts';
import { createProjectBoundaryGates } from '../../../src/application/gates/scaffold/database-gates.ts';
import { formatCommandFailure } from '../../../src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts';

Deno.test('runtime behavior gates register the dynamic route probe id', () => {
  const dynamicRouteGateId = 'behavior.app-dynamic-route';

  assertEquals((Object.values(GATE) as readonly string[]).includes(dynamicRouteGateId), true);
  assertEquals(
    createRuntimeBehaviorGates().map((entry) => String(entry.id)).includes(dynamicRouteGateId),
    true,
  );
});

Deno.test('dynamic route gate runs the HTTP-semantic probe for the project-derived app', () => {
  const gate = createRuntimeBehaviorGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_APP_DYNAMIC_ROUTE
  );
  if (gate?.kind !== 'command') throw new Error('Expected dynamic route command gate.');

  const command = gate.command({
    request: { options: { projectName: 'inventory-console' } },
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext);

  assertEquals(gate.critical, true);
  assertEquals(command, [
    'deno',
    'run',
    '--allow-net=127.0.0.1,localhost',
    '--allow-read',
    '--allow-run=aspire',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-app-dynamic-route.ts',
    '/workspace/app',
    'inventory-console-web',
    '/workspace/app/aspire/apphost.mts',
  ]);
});

Deno.test('runtime Aspire restore has a bounded infrastructure retry budget', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_ASPIRE_RESTORE);

  assertEquals(gate?.kind, 'command');
  if (gate?.kind !== 'command') throw new Error('Expected a command gate.');

  assertEquals(ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS, 180_000);
  assertEquals(ASPIRE_RESTORE_MAX_RETRIES, 2);
  assertEquals(gate.timeoutMs, ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS);
  assertEquals(gate.failureClass, 'infrastructure');
  assertEquals(gate.retry, {
    classes: ['timeout', 'canceled', 'infrastructure'],
    maxRetries: 2,
  });
});

Deno.test('runtime preserves the AppHost after typed migrate and refreshes background runtimes', () => {
  const gate = createRuntimeGates(DATABASE.POSTGRES).find((entry) =>
    entry.id === GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB
  );
  if (gate?.kind !== 'command') throw new Error('Expected a command gate.');
  const command = gate.command(s8RuntimeContext());

  assertEquals(command.at(-1), DATABASE.POSTGRES);
  assertEquals(command[2].includes('`${database}-cli`'), true);
  assertEquals(command[2].includes('"migrate", "--timeout", "60"'), true);
  // #1720: a background processor started before the migration never runs the health-check
  // job, so the success path must refresh the KV-backed runtimes without restarting the
  // AppHost, and keep the full restart as the fallback.
  assertEquals(command[2].includes('restartBackgroundRuntimes'), true);
  assertEquals(command[2].includes('"resource", resource, "restart"'), true);
  assertEquals(command[2].includes('using restart fallback'), true);
  assertEquals(command[2].includes('"stop"'), true);
  assertEquals(command[2].includes('"start"'), true);
});

Deno.test('typed database Phase-B gate stays outside the base runtime gate list', () => {
  const gate = createTypedDbPhaseBGate();
  if (gate.kind !== 'command') throw new Error('Expected a command gate.');
  const context = s8RuntimeContext();

  assertEquals(gate.cwd(context), '/workspace/app');
  assertEquals(gate.command(context), [
    'deno',
    'run',
    '--allow-env=ASPIRE_CLI_START_TIMEOUT',
    '--allow-read',
    '--allow-write',
    '--allow-run=aspire,deno',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts',
    '/workspace/app/aspire/apphost.mts',
    '/workspace/app',
    '/repo/packages/cli/bin/netscript.ts',
    DATABASE.POSTGRES,
  ]);
  assertEquals(
    createRuntimeGates(DATABASE.POSTGRES).some((entry) =>
      entry.id === GATE.RUNTIME_TYPED_DB_PHASE_B
    ),
    false,
  );
});

Deno.test('typed database Phase-B failures surface both captured streams', () => {
  const failure = formatCommandFailure('aspire', ['resource', 'postgres-cli', 'migrate'], {
    code: 16,
    success: false,
    stderr: 'Error: retained typed-command failure',
    stdout: 'bounded tool context',
    durationMs: 25,
  });

  assertStringIncludes(failure, 'stderr:\nError: retained typed-command failure');
  assertStringIncludes(failure, 'stdout:\nbounded tool context');
});

Deno.test('typed database Phase-B faults the controller-owned listener without stopping the resource', async () => {
  const source = await Deno.readTextFile(
    new URL(
      '../../../src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts',
      import.meta.url,
    ),
  );

  assertStringIncludes(source, 'commandListenerFaultController');
  assertStringIncludes(source, 'TEST_ONLY_POSTGRES_HEALTH_KEY');
  assertEquals(source.includes("'resource',\n      database,\n      'stop'"), false);
  assertEquals(source.includes("'resource',\n        database,\n        'start'"), false);
});

function s8RuntimeContext(): RunContext {
  return {
    request: {
      suiteId: 'scaffold.runtime',
      options: {
        repoRoot: '/repo',
        cliEntrypoint: 'packages/cli/bin/netscript.ts',
        smokeRoot: '/workspace',
        projectName: 'generated',
        database: DATABASE.POSTGRES,
        packageSource: 'local',
        plugins: [],
        samples: true,
        cache: true,
        cleanup: true,
        format: 'pretty',
        commandTimeoutMs: 900_000,
        httpTimeoutMs: 30_000,
      },
    },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: 'packages/cli/bin/netscript.ts',
      smokeRoot: '/workspace',
      projectName: 'generated',
      appHost: '/workspace/app/aspire/apphost.mts',
      projectRoot: '/workspace/app',
    },
  };
}

Deno.test('runtime aspire start gate captures detached endpoint metadata', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_ASPIRE_START);

  assertEquals(gate?.kind, 'command');
  if (gate?.kind !== 'command') {
    throw new Error('Expected runtime aspire start gate to be a command gate.');
  }

  assertEquals(gate.outputMode, 'capture');

  const command = gate.command({
    request: { options: { projectName: 'generated' } },
    project: {
      appHost: '/workspace/app/aspire/apphost.mts',
      projectRoot: '/workspace/app',
    },
  } as RunContext);

  assertEquals(command[0], 'deno');
  assertEquals(command[1], 'run');
  assertEquals(command.some((entry) => entry.endsWith('/.llm/tools/gates/run-gate.ts')), true);
  assertEquals(command.includes('cli-e2e-aspire-start'), true);
  assertEquals(command.includes('capture'), true);
  assertEquals(command.includes('/workspace/app/aspire/apphost.mts'), true);
  assertEquals(command.includes('/workspace/app'), true);
  assertEquals(command.at(-1)?.includes('postgres'), true);
});

Deno.test('live DB endpoint gate reads the detached dashboard metadata path', () => {
  const gate = createRuntimeBehaviorGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_LIVE_DB_ENDPOINT
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected live DB endpoint gate to be a command gate.');
  }
  assertEquals(
    gate.title,
    'Users service uses the live second-start Postgres allocation with correlated telemetry',
  );

  const command = gate.command({
    request: {
      options: { projectName: 'generated' },
    },
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext);

  assertEquals(command, [
    'deno',
    'run',
    '--unsafely-ignore-certificate-errors=localhost',
    '--allow-read',
    '--allow-write',
    '--allow-run=aspire',
    '--allow-net=localhost,127.0.0.1',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/verify-live-db-endpoint.ts',
    '/workspace/app/aspire/apphost.mts',
    '/workspace/app',
    'postgres',
  ]);
});

// #954 regression: this gate shipped probing the start of the app range while a pinning
// scaffold published a different port, so all 60 attempts were refused and the failure
// read exactly like an app that could not render.
//
// #952 follow-on: the pristine scaffold now pins nothing, so the gate must also hand over the
// AppHost — that is the only thing that knows the port Aspire allocated. Passing the project
// alone was enough while a port sat in appsettings.json; it is not enough now.
Deno.test('app home gate hands the probe a project and an AppHost to resolve the port from', () => {
  const gate = createRuntimeBehaviorGates().find((entry) => entry.id === GATE.BEHAVIOR_APP_HOME);
  if (gate?.kind !== 'command') {
    throw new Error('Expected app home gate to be a command gate.');
  }

  const command = gate.command({
    request: { options: { projectName: 'generated' } },
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext);

  assertEquals(command, [
    'deno',
    'run',
    '--allow-net=127.0.0.1,localhost',
    '--allow-read',
    '--allow-run=aspire',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/probe-app-home.ts',
    '/workspace/app',
    'generated-web',
    '/workspace/app/aspire/apphost.mts',
  ]);
  assertEquals(command.some((argument) => argument.includes(String(PORT_RANGES.APP.start))), false);
});

// Regression for the CI failure this branch actually hit: `aspire describe` reports endpoints
// as `http://localhost:<port>`, and Deno's --allow-net matches the host *string*. Granting only
// 127.0.0.1 denied every fetch, and the retry loop reported it as if the app never rendered —
// 60 attempts, 60 seconds, and a failure message that blamed the wrong thing.
Deno.test('app home gate can reach a localhost endpoint, not only 127.0.0.1', () => {
  const gate = createRuntimeBehaviorGates().find((entry) => entry.id === GATE.BEHAVIOR_APP_HOME);
  if (gate?.kind !== 'command') throw new Error('Expected app home gate to be a command gate.');

  const command = gate.command({
    request: { options: { projectName: 'generated' } },
    project: { repoRoot: '/repo', projectRoot: '/workspace/app', appHost: '/workspace/app/a.mts' },
  } as RunContext);

  const net = command.find((argument) => argument.startsWith('--allow-net='));
  assertEquals(net?.includes('localhost'), true);
  assertEquals(net?.includes('127.0.0.1'), true);
});

Deno.test('app reference gate runs the real browser probe for the project-derived app', () => {
  const gate = createRuntimeBehaviorGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_APP_REFERENCE
  );
  if (gate?.kind !== 'command') throw new Error('Expected app reference command gate.');
  const command = gate.command({
    request: { options: { projectName: 'inventory-console' } },
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext);

  assertEquals(command, [
    'deno',
    'run',
    '--allow-read',
    '--allow-run',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-app-reference.ts',
    '/workspace/app',
    'inventory-console-web',
    '/workspace/app/aspire/apphost.mts',
  ]);
});

Deno.test('runtime gates wait for postgres resource by default', () => {
  const gateIds = createRuntimeGates().map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), true);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
});

Deno.test('runtime app wait derives the resource name from the scaffold project', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_WAIT_APP);
  if (gate?.kind !== 'command') throw new Error('Expected app wait gate to be a command gate.');

  const command = gate.command({
    request: { options: { projectName: 'inventory-console' } },
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext);
  assertEquals(command.at(-1), 'inventory-console-web');
  assertEquals(command.includes('dashboard'), false);
});

Deno.test('runtime gates include durable workers and sagas CLI parity', () => {
  const gate = createRuntimeBehaviorGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_DURABLE_CLI_PARITY
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected durable CLI parity gate to be a command gate.');
  }
  const context = {
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
    request: { options: { projectName: 'runtime-gates-test' } },
  } as RunContext;
  assertEquals(gate.cwd(context), '/workspace/app');
  assertEquals(gate.command(context), [
    'deno',
    'run',
    '--allow-net=localhost,127.0.0.1',
    '--allow-run=aspire',
    '--allow-env=WORKERS_API_URL,SAGAS_API_URL',
    '--allow-read',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/durable-cli-parity.ts',
    '/workspace/app/aspire/apphost.mts',
  ]);
  assertEquals(gate.failureHint, undefined);
});

Deno.test('plugin behavior gates resolve live resource URLs through Aspire describe', () => {
  const gate = createRuntimeBehaviorGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_WORKERS_HEALTH
  );
  if (gate?.kind !== 'command') throw new Error('Expected workers health command gate.');
  const context = {
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
    request: { options: { projectName: 'runtime-gates-test' } },
  } as RunContext;

  assertEquals(gate.command(context), [
    'deno',
    'run',
    '--allow-run=aspire',
    '--allow-net=localhost,127.0.0.1',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/probe-plugin-resource.ts',
    '/workspace/app/aspire/apphost.mts',
    'workers-api',
    'get',
    '/health/live',
  ]);
});

Deno.test('runtime gates prove MCP Aspire endpoint discovery against the live AppHost', () => {
  const gate = createRuntimeBehaviorGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_MCP_ENDPOINT_DIRECTORY
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected MCP endpoint directory gate to be a command gate.');
  }
  const context = {
    request: { options: { projectName: 'generated' } },
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  } as RunContext;
  assertEquals(gate.cwd(context), '/workspace/app');
  assertEquals(gate.command(context), [
    'deno',
    'run',
    '--config',
    '/repo/packages/mcp/deno.json',
    '--allow-read',
    '--allow-run=aspire',
    '--allow-net=127.0.0.1,localhost',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/verify-mcp-endpoint-directory.ts',
    '/workspace/app',
    '/workspace/app/aspire/apphost.mts',
    'generated-web',
  ]);
});

Deno.test('project boundary gate requires the project-derived app name', () => {
  const gate = createProjectBoundaryGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_PROJECT_BOUNDARY_DEV
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected project boundary gate to be a command gate.');
  }
  const context = {
    request: { options: { projectName: 'inventory-console' } },
    project: {
      repoRoot: '/repo',
      projectRoot: '/workspace/app',
    },
  } as RunContext;

  assertEquals(gate.cwd(context), '/repo');
  assertEquals(gate.command(context), [
    'deno',
    'run',
    '--allow-all',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev.ts',
    '/workspace/app',
    'inventory-console-web',
  ]);
});

Deno.test('workers wait gate requires runtime startup evidence before behavior gates', () => {
  const gate = createRuntimeGates(DATABASE.SQLITE).find((entry) =>
    entry.id === GATE.RUNTIME_WAIT_WORKERS
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected workers wait gate to be a command gate.');
  }

  assertEquals(
    gate.command({
      project: {
        repoRoot: '/repo',
        projectRoot: '/workspace/app',
        appHost: '/workspace/app/aspire/apphost.mts',
      },
    } as RunContext),
    [
      'deno',
      'run',
      '--allow-read',
      '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts',
      'assert',
      '/workspace/app/.netscript/e2e/aspire-describe.ndjson',
      'workers',
    ],
  );
});

Deno.test('runtime gates enumerate every KV-backed first-party background runtime', () => {
  assertEquals(KV_BACKGROUND_RUNTIME_RESOURCES, [
    ASPIRE_RESOURCE.WORKERS,
    ASPIRE_RESOURCE.SAGAS,
    ASPIRE_RESOURCE.TRIGGERS,
  ]);
  assertEquals(KV_BACKGROUND_RUNTIME_WAIT_RESOURCES, [
    ASPIRE_RESOURCE.WORKERS_API,
    ASPIRE_RESOURCE.WORKERS,
    ASPIRE_RESOURCE.SAGAS_API,
    ASPIRE_RESOURCE.SAGAS,
    ASPIRE_RESOURCE.TRIGGERS_API,
    ASPIRE_RESOURCE.TRIGGERS,
  ]);

  const gates = createRuntimeGates(DATABASE.SQLITE);
  for (const resource of KV_BACKGROUND_RUNTIME_RESOURCES) {
    const gate = gates.find((entry) => entry.id === `runtime.wait.${resource}`);
    if (gate?.kind !== 'command') {
      throw new Error(`Expected a runtime wait gate for ${resource}.`);
    }

    const command = gate.command({
      project: {
        repoRoot: '/repo',
        projectRoot: '/workspace/app',
        appHost: '/workspace/app/aspire/apphost.mts',
      },
    } as RunContext);
    assertEquals(command.includes('assert'), true);
    assertEquals(command.includes(resource), true);
  }
});

Deno.test('AI chat route gate captures generated registry import failures', () => {
  const gate = createRuntimeBehaviorGates().find((entry) =>
    entry.id === GATE.BEHAVIOR_AI_CHAT_ROUTE
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected AI chat route gate to be a command gate.');
  }

  assertEquals(gate.outputMode, 'capture');
  assertEquals(gate.failureHint?.includes('captured stderr'), true);
});

Deno.test('runtime gates wait for mysql resource when mysql is selected', () => {
  const gateIds = createRuntimeGates(DATABASE.MYSQL).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), true);
});

Deno.test('runtime gates skip database resource wait for sqlite', () => {
  const gateIds = createRuntimeGates(DATABASE.SQLITE).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MSSQL), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_GARNET), true);
});

Deno.test('readiness fixture receives the selected database axis before Aspire starts', () => {
  for (const database of [DATABASE.POSTGRES, DATABASE.SQLITE, DATABASE.MYSQL, DATABASE.MSSQL]) {
    const gate = createRuntimeGates(database).find((entry) =>
      entry.id === GATE.RUNTIME_READINESS_FIXTURE
    );
    if (gate?.kind !== 'command') {
      throw new Error('Expected readiness fixture gate to be a command gate.');
    }
    const command = gate.command({
      project: { projectRoot: '/workspace/app' },
    } as RunContext);
    assertEquals(command.at(-2), '/workspace/app');
    assertEquals(command.at(-1), database);
  }
});

Deno.test('runtime service health gate asserts only the selected sqlite adapter', () => {
  const gate = createRuntimeBehaviorGates(DATABASE.SQLITE).find((entry) =>
    entry.id === GATE.BEHAVIOR_SERVICE_HEALTH
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected service health gate to be a command gate.');
  }

  const command = gate.command({
    project: { appHost: '/workspace/app/aspire/apphost.mts' },
  } as RunContext);

  assertEquals(command.at(-1), DATABASE.SQLITE);
  assertEquals(command[2].includes('health.checks'), true);
  assertEquals(command[2].includes('databaseChecks.length === 1'), true);
  assertEquals(command[2].includes('database:${expectedDatabase}'), true);
});

Deno.test('runtime gates wait for mssql resource with extended timeout when mssql is selected', () => {
  const gateIds = createRuntimeGates(DATABASE.MSSQL).map((entry) => entry.id);

  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(gateIds.includes(GATE.RUNTIME_WAIT_MSSQL), true);

  const gate = createRuntimeGates(DATABASE.MSSQL).find((entry) =>
    entry.id === GATE.RUNTIME_WAIT_MSSQL
  );
  if (gate?.kind !== 'command') {
    throw new Error('Expected mssql wait gate to be a command gate.');
  }

  assertEquals(
    gate.command({
      project: {
        repoRoot: '/repo',
        projectRoot: '/workspace/app',
        appHost: '/workspace/app/aspire/apphost.mts',
      },
    } as RunContext),
    [
      'deno',
      'run',
      '--allow-read',
      '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts',
      'assert',
      '/workspace/app/.netscript/e2e/aspire-describe.ndjson',
      'mssql',
      'mssql_listener',
    ],
  );
});
