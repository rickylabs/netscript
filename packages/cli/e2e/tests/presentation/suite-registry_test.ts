import { assertEquals } from '@std/assert';
import {
  DEPLOY,
  GATE,
  type GateId,
  QUICKSTART,
  SCAFFOLD,
  type SuiteId,
} from '../../src/domain/cli-surface.ts';
import {
  DATABASE,
  PACKAGE_SOURCE,
  PLUGIN,
  REPORT_FORMAT,
} from '../../src/domain/extension-axes.ts';
import type { RunOptions } from '../../src/domain/run-context.ts';
import type { DeferredGate } from '../../src/domain/suite-definition.ts';
import { runtimeResources } from '../../src/application/gates/scaffold/runtime-gates.ts';
import { builtInSuites, resolveSuite } from '../../src/presentation/cli/suites/registry.ts';
import {
  createScaffoldCapabilitySuite,
  SCAFFOLD_RUNTIME_DEFERRED_GATES,
  type ScaffoldCapabilitySuite,
  scaffoldCapabilitySuites,
} from '../../suites/scaffold/capability-suites.ts';

Deno.test('registry exposes scaffold capability suites from constants', () => {
  assertEquals(builtInSuites.map((suite) => suite.id), [
    SCAFFOLD.SERVICE,
    SCAFFOLD.CONTRACTS,
    SCAFFOLD.INFRASTRUCTURE,
    SCAFFOLD.PLUGIN,
    SCAFFOLD.RUNTIME,
    SCAFFOLD.RUNTIME_SQLITE,
    SCAFFOLD.USERLAND_INSTALL,
    DEPLOY.TARGETS,
    DEPLOY.DESKTOP_NATIVE,
    QUICKSTART.WALK,
  ]);
});

Deno.test('native desktop suite is registered with an honest fixture preflight', () => {
  const desktop = resolveSuite(DEPLOY.DESKTOP_NATIVE);
  assertEquals(desktop.id, DEPLOY.DESKTOP_NATIVE);
  assertEquals(desktop.gates.map((gate) => gate.id), [
    GATE.DEPLOY_DESKTOP_PREFLIGHT,
    GATE.DEPLOY_DESKTOP_FIXTURE,
    GATE.DEPLOY_DESKTOP_LINUX_NATIVE,
    GATE.DEPLOY_DESKTOP_WINDOWS_NATIVE,
    GATE.DEPLOY_DESKTOP_DARWIN_NATIVE,
  ]);
});

Deno.test('capability suites select only their scoped gates', () => {
  const service = resolveSuite(SCAFFOLD.SERVICE);
  assertEquals(service.gates.map((gate) => gate.id), [
    GATE.PREFLIGHT_DENO,
    GATE.SCAFFOLD_INIT,
    GATE.SERVICE_LIST,
    GATE.DATABASE_CODEGEN,
    GATE.GENERATED_SERVICE_CHECK,
  ]);
});

Deno.test('plugin suite includes all official plugin and generated-check gates', () => {
  const plugins = resolveSuite(SCAFFOLD.PLUGIN);
  assertEquals(plugins.gates.map((gate) => gate.id), [
    GATE.PREFLIGHT_DENO,
    GATE.SCAFFOLD_INIT,
    'scaffold.plugin.worker',
    'scaffold.plugin.saga',
    'scaffold.plugin.trigger',
    'scaffold.plugin.stream',
    'scaffold.plugin.auth',
    'scaffold.plugin.ai',
    GATE.SCAFFOLD_PLUGIN_AI_MCP,
    GATE.SCAFFOLD_PLUGIN_AI_LIFECYCLE,
    GATE.SCAFFOLD_PLUGIN_LIST,
    GATE.BEHAVIOR_PLUGINS_UNHEALTHY,
    GATE.GENERATED_PLUGINS_CHECK,
    GATE.GENERATED_WORKERS_REGISTRY,
    GATE.GENERATED_SAGAS_REGISTRY,
    GATE.BEHAVIOR_PLUGINS_HEALTH,
  ]);
});

Deno.test('true userland suite runs init, four no-samples plugin installs, assertion, and cleanup', () => {
  const userland = resolveSuite(SCAFFOLD.USERLAND_INSTALL);
  assertEquals(userland.gates.map((gate) => gate.id), [
    GATE.PREFLIGHT_DENO,
    GATE.SCAFFOLD_INIT,
    'scaffold.plugin.worker',
    'scaffold.plugin.saga',
    'scaffold.plugin.trigger',
    'scaffold.plugin.stream',
    GATE.USERLAND_INSTALL_ASSERTIONS,
    GATE.CLEANUP_USERLAND_SMOKE_ROOT,
  ]);

  const context = {
    request: { suiteId: userland.id, options: userland.defaultOptions },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: '/repo/packages/cli/bin/netscript.ts',
      smokeRoot: '/scratch',
      projectName: 'consumer',
      projectRoot: '/scratch/consumer',
      appHost: '/scratch/consumer/aspire/apphost.mts',
    },
  } as const;
  for (const kind of ['worker', 'saga', 'trigger', 'stream']) {
    const gate = userland.gates.find((candidate) => candidate.id === `scaffold.plugin.${kind}`);
    if (!gate || gate.kind !== 'command') throw new Error(`Missing ${kind} install command gate.`);
    const command = gate.command(context);
    assertEquals(command.includes('--no-samples'), true, `${kind} must receive --no-samples`);
    assertEquals(command.includes('--samples'), false, `${kind} must not receive --samples`);
  }
});

Deno.test('runtime suite includes full scaffold, database, runtime, and behavior gates', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_INIT), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.DATABASE_INIT), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.DATABASE_GENERATE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.DATABASE_SEED), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_DENO_CHECK), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_QUALITY_NEGATIVE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_DENO_LINT), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_DENO_FMT_CHECK), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_UI_ADD_AI), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_UI_LOCAL_SOURCE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_UI_AI_CHECK), true);
  assertEquals(
    runtime.gates.some((gate) => gate.id === GATE.SCAFFOLD_PLUGIN_AI_APPSETTINGS),
    true,
  );
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_RUNTIME_SCHEMAS), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.GENERATED_AI_NAMESPACE_CHECK), true);
  assertEquals(
    runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_PLUGIN_DOCTOR_MISSING_MODULE),
    true,
  );
  const aiInstallIndex = runtime.gates.findIndex((gate) => gate.id === 'scaffold.plugin.ai');
  const appsettingsIndex = runtime.gates.findIndex((gate) =>
    gate.id === GATE.SCAFFOLD_PLUGIN_AI_APPSETTINGS
  );
  const runtimeSchemasIndex = runtime.gates.findIndex((gate) =>
    gate.id === GATE.GENERATED_RUNTIME_SCHEMAS
  );
  const generatedCheckIndex = runtime.gates.findIndex((gate) =>
    gate.id === GATE.GENERATED_DENO_CHECK
  );
  const sixKindInstalls = [
    'scaffold.plugin.worker',
    'scaffold.plugin.saga',
    'scaffold.plugin.trigger',
    'scaffold.plugin.stream',
    'scaffold.plugin.auth',
    'scaffold.plugin.ai',
  ];
  assertEquals(
    sixKindInstalls.every((id) =>
      runtime.gates.findIndex((gate) => gate.id === id) < runtimeSchemasIndex
    ),
    true,
  );
  assertEquals(aiInstallIndex < appsettingsIndex, true);
  assertEquals(appsettingsIndex < runtimeSchemasIndex, true);
  assertEquals(runtimeSchemasIndex < generatedCheckIndex, true);
  assertEquals(
    runtime.gates.findIndex((gate) => gate.id === GATE.GENERATED_SAGAS_REGISTRY) <
      runtime.gates.findIndex((gate) => gate.id === GATE.BEHAVIOR_PLUGIN_DOCTOR_MISSING_MODULE),
    true,
  );
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_AUTH_SMOKE_ENV), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_ASPIRE_START), true);
  assertEquals(
    runtime.gates.findIndex((gate) => gate.id === GATE.RUNTIME_ASPIRE_RESTORE) <
      runtime.gates.findIndex((gate) => gate.id === GATE.GENERATED_QUALITY_NEGATIVE),
    true,
  );
  assertEquals(
    runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_DB_STATUS_PRESERVES_APPHOST),
    true,
  );
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_WORKERS_JOBS), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_WORKERS_SEED), true);
  assertEquals(
    runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_WORKERS_TRIGGER_HEALTH_JOB),
    true,
  );
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_SAGAS_HEALTH), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_SAGAS_LIST), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_TRIGGERS_HEALTH), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_TRIGGERS_WEBHOOK), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_TRIGGERS_EVENTS), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AUTH_LIVE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AUTH_READY), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AUTH_SESSION), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_AI_CHAT_ROUTE), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_UI_RENDER), true);
  assertEquals(
    runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_MCP_WIDGET_ROUNDTRIP),
    true,
  );
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_PLUGINS_HEALTH), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_WEBHOOK), true);
  assertEquals(
    runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_STREAMS_PRODUCER_RECONNECT),
    true,
  );
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_STREAM_CONSUMER), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_TRACES), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_TASK_TRACES), true);
});

Deno.test('runtime suites execute the formerly deferred #1398 OTEL gates', () => {
  assertEquals(SCAFFOLD_RUNTIME_DEFERRED_GATES, []);

  for (const suiteId of [SCAFFOLD.RUNTIME, SCAFFOLD.RUNTIME_SQLITE]) {
    const suite = resolveSuite(suiteId);
    assertEquals(suite.deferredGates, SCAFFOLD_RUNTIME_DEFERRED_GATES, suiteId);
    assertEquals(suite.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_STREAM_CONSUMER), true);
    assertEquals(suite.gates.some((gate) => gate.id === GATE.BEHAVIOR_OTEL_TRACES), true);
  }
});

Deno.test('every registered suite pins its exact deferred-gate set and owning issues', () => {
  const expected = {
    [SCAFFOLD.SERVICE]: [],
    [SCAFFOLD.CONTRACTS]: [],
    [SCAFFOLD.INFRASTRUCTURE]: [],
    [SCAFFOLD.PLUGIN]: [],
    [SCAFFOLD.RUNTIME]: SCAFFOLD_RUNTIME_DEFERRED_GATES,
    [SCAFFOLD.RUNTIME_SQLITE]: SCAFFOLD_RUNTIME_DEFERRED_GATES,
    [SCAFFOLD.USERLAND_INSTALL]: [],
    [DEPLOY.TARGETS]: [],
    [DEPLOY.DESKTOP_NATIVE]: [],
    [QUICKSTART.WALK]: [],
  } satisfies Record<SuiteId, readonly DeferredGate[]>;

  assertEquals(
    builtInSuites.map((suite) => suite.id).sort(),
    Object.keys(expected).sort(),
    'the expectation map must cover every registered suite',
  );
  for (const descriptor of builtInSuites) {
    assertEquals(
      resolveSuite(descriptor.id).deferredGates ?? [],
      expected[descriptor.id],
      `${descriptor.id} deferred gates must match their issue-owned expectation`,
    );
  }
});

// #954: the suite used to start the whole AppHost without ever waiting on the generated app
// or requesting one of its routes, so "Aspire says Healthy while every request returns 500"
// passed. These two gates are that missing assertion — keep them paired.
Deno.test('runtime suite waits for the generated app and requests its home page', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_APP), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_APP_HOME), true);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.BEHAVIOR_APP_REFERENCE), true);

  const waitIndex = runtime.gates.findIndex((gate) => gate.id === GATE.RUNTIME_WAIT_APP);
  const homeIndex = runtime.gates.findIndex((gate) => gate.id === GATE.BEHAVIOR_APP_HOME);
  assertEquals(waitIndex < homeIndex, true);
});

Deno.test('runtime DB mutations run only after the resident AppHost starts', () => {
  const gates = resolveSuite(SCAFFOLD.RUNTIME).gates;
  const startIndex = gates.findIndex((gate) => gate.id === GATE.RUNTIME_ASPIRE_START);
  for (
    const id of [
      GATE.DATABASE_INIT,
      GATE.DATABASE_GENERATE,
      GATE.DATABASE_SEED,
    ]
  ) {
    assertEquals(startIndex < gates.findIndex((gate) => gate.id === id), true);
  }
  const seedIndex = gates.findIndex((gate) => gate.id === GATE.DATABASE_SEED);
  const restartIndex = gates.findIndex((gate) => gate.id === GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB);
  const waitIndex = gates.findIndex((gate) => gate.id === GATE.RUNTIME_WAIT_POSTGRES);
  assertEquals(seedIndex < restartIndex && restartIndex < waitIndex, true);
});

Deno.test('runtime suite omits database resource wait for sqlite', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME, { database: DATABASE.SQLITE });
  assertEquals(runtime.defaultOptions.database, DATABASE.SQLITE);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MSSQL), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_GARNET), true);
});

Deno.test('sqlite runtime suite resolves its reduced-container defaults without mutating cache mode', () => {
  const environmentVariable = 'NETSCRIPT_CACHE_MODE';
  const previous = Deno.env.get(environmentVariable);
  const operatorCacheMode = 'Container';
  try {
    Deno.env.delete(environmentVariable);
    const sqlite = resolveSuite(SCAFFOLD.RUNTIME_SQLITE);
    assertEquals(sqlite.defaultOptions.database, DATABASE.SQLITE);
    assertEquals(sqlite.defaultOptions.cache, false);
    assertEquals(Deno.env.get(environmentVariable), undefined);

    Deno.env.set(environmentVariable, operatorCacheMode);
    resolveSuite(SCAFFOLD.RUNTIME_SQLITE);
    assertEquals(Deno.env.get(environmentVariable), operatorCacheMode);
  } finally {
    if (previous === undefined) Deno.env.delete(environmentVariable);
    else Deno.env.set(environmentVariable, previous);
  }
});

Deno.test('runtime suites declare service environment before start and verify it after (#1447)', () => {
  for (const suiteId of [SCAFFOLD.RUNTIME, SCAFFOLD.RUNTIME_SQLITE]) {
    const ids = resolveSuite(suiteId).gates.map((gate) => gate.id);
    const fixture = ids.indexOf(GATE.RUNTIME_SERVICE_ENV_FIXTURE);
    const start = ids.indexOf(GATE.RUNTIME_ASPIRE_START);
    const verify = ids.indexOf(GATE.BEHAVIOR_SERVICE_ENV);
    const patchesGeneratedHelpers = [
      ids.indexOf(GATE.RUNTIME_FLOW_B_FIXTURE),
      ids.indexOf(GATE.RUNTIME_READINESS_FIXTURE),
    ];

    // The fixture edits appsettings.json and regenerates; a declaration written
    // after the AppHost is already up would prove nothing about the running
    // resource, and the verification only means something once it is up.
    assertEquals(fixture >= 0, true, `${suiteId} is missing the service env fixture`);
    assertEquals(fixture < start, true, `${suiteId} declares service env after AppHost start`);
    assertEquals(start < verify, true, `${suiteId} verifies service env before AppHost start`);

    // Regeneration rewrites every helper, so it must not run after a fixture
    // that hand-patched one — that would silently erase the patch.
    for (const patched of patchesGeneratedHelpers) {
      assertEquals(
        fixture < patched,
        true,
        `${suiteId} regenerates helpers after a fixture that patches them`,
      );
    }
  }
});

Deno.test('runtime database overrides preserve service health and the Postgres gate set', () => {
  const sqlite = resolveSuite(SCAFFOLD.RUNTIME_SQLITE);
  const postgres = resolveSuite(SCAFFOLD.RUNTIME);
  const mysql = resolveSuite(SCAFFOLD.RUNTIME, { database: DATABASE.MYSQL });
  const mssql = resolveSuite(SCAFFOLD.RUNTIME, { database: DATABASE.MSSQL });
  const runtimeCapability = scaffoldCapabilitySuites.find((suite) => suite.id === SCAFFOLD.RUNTIME);
  const sqliteCapability = scaffoldCapabilitySuites.find((suite) =>
    suite.id === SCAFFOLD.RUNTIME_SQLITE
  );
  if (!runtimeCapability || !sqliteCapability) {
    throw new Error('Runtime capability suites are not registered.');
  }

  const postgresOnly = new Set<GateId>([
    GATE.DATABASE_MIGRATION_ARTIFACTS,
    GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST,
    GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
    GATE.BEHAVIOR_LIVE_DB_ENDPOINT,
  ]);
  const databaseWaits = new Set<GateId>([
    GATE.RUNTIME_WAIT_POSTGRES,
    GATE.RUNTIME_WAIT_MYSQL,
    GATE.RUNTIME_WAIT_MSSQL,
  ]);
  const expectedFor = (databaseWait: GateId, omitPostgresOnly: boolean) =>
    runtimeCapability.gates.filter((gate) =>
      (!databaseWaits.has(gate) || gate === databaseWait) &&
      (!omitPostgresOnly || !postgresOnly.has(gate))
    );

  assertEquals(
    postgres.gates.map((gate) => gate.id),
    expectedFor(GATE.RUNTIME_WAIT_POSTGRES, false),
  );
  assertEquals(mysql.gates.map((gate) => gate.id), expectedFor(GATE.RUNTIME_WAIT_MYSQL, true));
  assertEquals(mssql.gates.map((gate) => gate.id), expectedFor(GATE.RUNTIME_WAIT_MSSQL, true));
  for (const suite of [postgres, mysql, mssql]) {
    assertEquals(
      suite.gates.some((gate) => gate.id === GATE.BEHAVIOR_SERVICE_HEALTH),
      true,
      `${suite.defaultOptions.database} must execute service health`,
    );
  }
  assertEquals(sqlite.gates.some((gate) => gate.id === GATE.BEHAVIOR_SERVICE_HEALTH), true);
  assertEquals(
    sqliteCapability.gates,
    runtimeCapability.gates.filter((gate) =>
      !(new Set<GateId>([
        GATE.DATABASE_MIGRATION_ARTIFACTS,
        GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST,
        GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
        GATE.BEHAVIOR_LIVE_DB_ENDPOINT,
      ])).has(gate)
    ),
  );
});

Deno.test('sqlite runtime suite keeps explicit database overrides above suite defaults', () => {
  const sqlite = resolveSuite(SCAFFOLD.RUNTIME_SQLITE, {
    database: DATABASE.POSTGRES,
  });
  assertEquals(sqlite.defaultOptions.database, DATABASE.POSTGRES);
  assertEquals(sqlite.defaultOptions.cache, false);
});

Deno.test('runtime suite wait matrices match runtime resources for postgres and sqlite', () => {
  const cases = [
    [resolveSuite(SCAFFOLD.RUNTIME), DATABASE.POSTGRES],
    [resolveSuite(SCAFFOLD.RUNTIME_SQLITE), DATABASE.SQLITE],
  ] as const;
  for (const [suite, database] of cases) {
    const waitGateIds = suite.gates
      .map((gate) => gate.id)
      .filter((id) => id.startsWith('runtime.wait.'));
    assertEquals(
      waitGateIds,
      [
        ...runtimeResources(database).map((resource) => `runtime.wait.${resource}`),
        GATE.RUNTIME_WAIT_APP,
      ],
      suite.id,
    );
  }

  const sqliteGateIds = cases[1][0].gates.map((gate) => gate.id);
  assertEquals(sqliteGateIds.includes(GATE.RUNTIME_WAIT_GARNET), true);
  assertEquals(sqliteGateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(sqliteGateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(sqliteGateIds.includes(GATE.RUNTIME_WAIT_MSSQL), false);

  const runtimeGateIds = cases[0][0].gates.map((gate) => gate.id);
  assertEquals(runtimeGateIds.includes(GATE.RUNTIME_WAIT_POSTGRES), true);
  assertEquals(runtimeGateIds.includes(GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(runtimeGateIds.includes(GATE.RUNTIME_WAIT_MSSQL), false);
  assertEquals(runtimeGateIds.includes(GATE.DATABASE_MIGRATION_ARTIFACTS), true);
  assertEquals(runtimeGateIds.includes(GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST), true);
  assertEquals(runtimeGateIds.includes(GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND), true);
  assertEquals(runtimeGateIds.includes(GATE.BEHAVIOR_LIVE_DB_ENDPOINT), true);

  assertEquals(sqliteGateIds.includes(GATE.DATABASE_MIGRATION_ARTIFACTS), false);
  assertEquals(sqliteGateIds.includes(GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST), false);
  assertEquals(sqliteGateIds.includes(GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND), false);
  assertEquals(sqliteGateIds.includes(GATE.BEHAVIOR_LIVE_DB_ENDPOINT), false);
});

Deno.test('runtime suite selects mssql database resource wait for mssql', () => {
  const runtime = resolveSuite(SCAFFOLD.RUNTIME, { database: DATABASE.MSSQL });
  assertEquals(runtime.defaultOptions.database, DATABASE.MSSQL);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_POSTGRES), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MYSQL), false);
  assertEquals(runtime.gates.some((gate) => gate.id === GATE.RUNTIME_WAIT_MSSQL), true);
});

Deno.test('capability defaults are a baseline and caller overrides select database gates', () => {
  const capability: ScaffoldCapabilitySuite = {
    id: SCAFFOLD.RUNTIME,
    title: 'Synthetic runtime default precedence',
    gates: [
      GATE.RUNTIME_WAIT_POSTGRES,
      GATE.RUNTIME_WAIT_MYSQL,
      GATE.RUNTIME_WAIT_MSSQL,
      GATE.RUNTIME_WAIT_GARNET,
    ],
    defaults: { database: DATABASE.SQLITE },
  };

  const defaulted = createScaffoldCapabilitySuite(capability);
  assertEquals(defaulted.defaultOptions.database, DATABASE.SQLITE);
  assertEquals(defaulted.gates.map((gate) => gate.id), [GATE.RUNTIME_WAIT_GARNET]);

  const overridden = createScaffoldCapabilitySuite(capability, {
    database: DATABASE.POSTGRES,
  });
  assertEquals(overridden.defaultOptions.database, DATABASE.POSTGRES);
  assertEquals(overridden.gates.map((gate) => gate.id), [
    GATE.RUNTIME_WAIT_POSTGRES,
    GATE.RUNTIME_WAIT_GARNET,
  ]);
});

Deno.test('existing built-in suites preserve their exact resolved options', () => {
  assertEquals(
    scaffoldCapabilitySuites
      .filter((suite) => suite.id !== SCAFFOLD.RUNTIME_SQLITE)
      .map((suite) => suite.defaults),
    [undefined, undefined, undefined, undefined, undefined],
  );

  const overrides: Partial<RunOptions> = {
    repoRoot: '/repo',
    cliEntrypoint: '/cli.ts',
    smokeRoot: '/smoke',
    projectName: 'existing-suite-baseline',
    logFile: '/log.ndjson',
  };
  const common: RunOptions = {
    ...overrides,
    repoRoot: '/repo',
    cliEntrypoint: '/cli.ts',
    smokeRoot: '/smoke',
    projectName: 'existing-suite-baseline',
    database: DATABASE.POSTGRES,
    packageSource: PACKAGE_SOURCE.LOCAL,
    plugins: [PLUGIN.WORKER, PLUGIN.SAGA, PLUGIN.TRIGGER, PLUGIN.STREAM, PLUGIN.AUTH],
    samples: true,
    cache: true,
    cleanup: false,
    format: REPORT_FORMAT.NDJSON,
    reportPath: undefined,
    logFile: '/log.ndjson',
    commandTimeoutMs: 900_000,
    httpTimeoutMs: 30_000,
  };
  const expected = new Map<string, RunOptions>([
    [SCAFFOLD.SERVICE, common],
    [SCAFFOLD.CONTRACTS, common],
    [SCAFFOLD.INFRASTRUCTURE, common],
    [SCAFFOLD.PLUGIN, common],
    [SCAFFOLD.RUNTIME, common],
    [
      SCAFFOLD.RUNTIME_SQLITE,
      {
        ...common,
        database: DATABASE.SQLITE,
        cache: false,
      },
    ],
    [
      SCAFFOLD.USERLAND_INSTALL,
      {
        ...common,
        packageSource: PACKAGE_SOURCE.AUTO,
        plugins: [PLUGIN.WORKER, PLUGIN.SAGA, PLUGIN.TRIGGER, PLUGIN.STREAM],
        samples: false,
      },
    ],
    [DEPLOY.TARGETS, { ...common, plugins: [...common.plugins, PLUGIN.AI], samples: false }],
    [DEPLOY.DESKTOP_NATIVE, {
      ...common,
      plugins: [...common.plugins, PLUGIN.AI],
      samples: false,
    }],
    [QUICKSTART.WALK, { ...common, packageSource: PACKAGE_SOURCE.JSR }],
  ]);

  for (const suite of builtInSuites) {
    const options = expected.get(suite.id);
    if (!options) throw new Error(`Missing options baseline for "${suite.id}".`);
    assertEquals(resolveSuite(suite.id, overrides).defaultOptions, options, suite.id);
  }
});
