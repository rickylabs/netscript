import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  ASPIRE_MCP_BASELINE_TOOLS,
  ASPIRE_MCP_DASHBOARD_TOOLS,
  ASPIRE_MCP_DOCUMENTED_UNOBSERVED,
  ASPIRE_MCP_EXPECTED_TOOLS,
  ASPIRE_MCP_SMOKE_OUTER_TIMEOUT_MS,
  ASPIRE_MCP_SMOKE_TIMEOUTS,
  type AspireMcpSmokeDependencies,
  type AspireMcpSmokeReceipt,
  type AspireMcpTransport,
  diffAspireMcpTools,
  runAspireMcpSmoke,
} from '../../../src/application/gates/scaffold/aspire-mcp-smoke.ts';

interface RecordedFixture {
  readonly initialize: { readonly serverInfo: { readonly name: string; readonly version: string } };
  readonly tools: readonly string[];
  readonly apphosts: unknown;
  readonly doctor: unknown;
  readonly resources: unknown;
  readonly usersConsole: unknown;
  readonly excludedConsole: unknown;
  readonly structuredLogs: unknown;
  readonly dashboardTools: readonly string[];
  readonly transcript: readonly unknown[];
}

interface PersistedEvidence {
  readonly receipt: AspireMcpSmokeReceipt;
  readonly transcriptEntries: readonly unknown[];
}

const fixture: RecordedFixture = JSON.parse(
  await Deno.readTextFile(
    new URL('../../fixtures/aspire-13.5.3-mcp-recorded.json', import.meta.url),
  ),
);

const DASHBOARD_UNAVAILABLE = new Error(
  'tools/call failed: {"code":-32603,"message":"The Aspire Dashboard is not available in the running AppHost. The dashboard must be enabled to use MCP tools. Ensure your AppHost is configured with the dashboard enabled (this is the default configuration)."}',
);

function transport(
  tools: readonly string[],
  calls: Readonly<Record<string, unknown>>,
  transcript: readonly unknown[] = fixture.transcript,
): AspireMcpTransport {
  return {
    initialize: () => Promise.resolve(fixture.initialize.serverInfo),
    listTools: () => Promise.resolve(tools),
    callTool: (name, args = {}) => {
      const resourceName = Reflect.get(args, 'resourceName');
      const keyed = typeof resourceName === 'string' ? calls[`${name}:${resourceName}`] : undefined;
      const result = keyed ?? calls[name];
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    },
    close: () => Promise.resolve({ code: 0, signal: null, graceful: true }),
    transcript: () => transcript,
  };
}

function dependencies(
  primary: AspireMcpTransport,
  dashboard: AspireMcpTransport,
  persisted: PersistedEvidence[] = [],
): AspireMcpSmokeDependencies {
  let index = 0;
  return {
    createTransport: () => Promise.resolve(index++ === 0 ? primary : dashboard),
    describeResources: () => Promise.resolve(['postgres', 'fixture-web', 'users', 'postgres-cli']),
    persist: (receipt, transcriptEntries) => {
      persisted.push({ receipt, transcriptEntries });
      return Promise.resolve();
    },
    now: () => new Date('2026-08-30T00:00:00.000Z'),
    timeouts: {
      initializeMs: 30_000,
      toolsListMs: 10_000,
      toolCallMs: 30_000,
      wholeGateMs: 120_000,
    },
  };
}

function input(secret = 'fixture-secret-never-persist'): Parameters<typeof runAspireMcpSmoke>[0] {
  return {
    cliVersion: '13.5.3+b5f1433',
    scaffoldPin: '13.5.3',
    entryPoint: {
      source: '.mcp.json',
      command: 'aspire',
      args: ['agent', 'mcp'],
      cwd: '/workspace/fixture',
    },
    appHostPath: '/workspace/fixture/aspire/apphost.mts',
    dashboardUrl: 'https://localhost:18888/?t=raw-dashboard-token',
    database: 'postgres',
    appResource: 'fixture-web',
    serviceResource: 'users',
    secretValues: [secret],
    transcript: 'agent.aspire-mcp-smoke.transcript.jsonl',
  };
}

function passingPrimary(secret = 'fixture-secret-never-persist'): AspireMcpTransport {
  return transport(
    fixture.tools,
    {
      list_apphosts: fixture.apphosts,
      doctor: fixture.doctor,
      list_resources: fixture.resources,
      'list_console_logs:postgres-cli': fixture.excludedConsole,
      'list_console_logs:users': fixture.usersConsole,
      list_structured_logs: fixture.structuredLogs,
    },
    [...fixture.transcript, { secretObserved: false, literal: secret.replaceAll(/./g, '*') }],
  );
}

Deno.test('Aspire MCP expected set is the ratified 14-tool 13.5.3 baseline', () => {
  assertEquals(ASPIRE_MCP_BASELINE_TOOLS.length, 14);
  assertEquals(ASPIRE_MCP_EXPECTED_TOOLS.length, 14);
  assert(ASPIRE_MCP_EXPECTED_TOOLS.includes('refresh_tools'));
  assertEquals(ASPIRE_MCP_EXPECTED_TOOLS.includes('get_integration_docs'), false);
  assertEquals(ASPIRE_MCP_DOCUMENTED_UNOBSERVED, ['get_integration_docs']);
  assertEquals(
    diffAspireMcpTools(ASPIRE_MCP_EXPECTED_TOOLS, ASPIRE_MCP_BASELINE_TOOLS),
    { added: [], removed: [] },
  );
});

Deno.test('Aspire MCP smoke records the exact baseline delta and both-tier visibility contract', async () => {
  const receipt = await runAspireMcpSmoke(
    input(),
    dependencies(
      passingPrimary(),
      transport(fixture.dashboardTools, {}),
    ),
  );
  assertEquals(receipt.toolsMissing, []);
  assertEquals(receipt.baselineDiff, { added: [], removed: [] });
  assertEquals(receipt.documentedUnobserved, ['get_integration_docs']);
  assertEquals(receipt.documentedUnobservedObserved, []);
  assertEquals(receipt.dashboardOnlyTools, ASPIRE_MCP_DASHBOARD_TOOLS);
  assertEquals(receipt.visibility.expectedVisible, ['postgres', 'fixture-web', 'users']);
  assertEquals(receipt.visibility.expectedMcpExcluded, ['postgres-cli']);
  assertEquals(receipt.visibility.observedMcpExcluded, ['postgres-cli']);
  assertEquals(receipt.visibility.describeListsExcluded, true);
  assertEquals(receipt.visibility.ok, true);
  assertEquals(receipt.structuredLogs, {
    entryCount: 0,
    isError: false,
    dashboardAvailable: true,
  });
});

Deno.test('Aspire MCP smoke fails list_resources dashboard error with explicit receipt state', async () => {
  const persisted: PersistedEvidence[] = [];
  await assertRejects(
    () =>
      runAspireMcpSmoke(
        input(),
        dependencies(
          transport(fixture.tools, {
            list_apphosts: fixture.apphosts,
            doctor: fixture.doctor,
            list_resources: DASHBOARD_UNAVAILABLE,
          }),
          transport(fixture.dashboardTools, {}),
          persisted,
        ),
      ),
    Error,
    'dashboard must be enabled to use MCP tools',
  );
  assertEquals(persisted.length, 1);
  assertEquals(persisted[0].receipt.toolsMissing, []);
  assertEquals(persisted[0].receipt.baselineDiff, { added: [], removed: [] });
  assertEquals(persisted[0].receipt.structuredLogs, {
    entryCount: null,
    isError: true,
    dashboardAvailable: false,
  });
});

Deno.test('Aspire MCP smoke rejects a different structured-log error', async () => {
  await assertRejects(
    () =>
      runAspireMcpSmoke(
        input(),
        dependencies(
          transport(fixture.tools, {
            list_apphosts: fixture.apphosts,
            doctor: fixture.doctor,
            list_resources: fixture.resources,
            'list_console_logs:postgres-cli': fixture.excludedConsole,
            'list_console_logs:users': fixture.usersConsole,
            list_structured_logs: new Error(
              'tools/call failed: {"code":-32603,"message":"different internal error"}',
            ),
          }),
          transport(fixture.dashboardTools, {}),
        ),
      ),
    Error,
    'different internal error',
  );
});

Deno.test('Aspire MCP outer timeout leaves room to persist an inner-deadline receipt', () => {
  assert(ASPIRE_MCP_SMOKE_OUTER_TIMEOUT_MS > ASPIRE_MCP_SMOKE_TIMEOUTS.wholeGateMs);
  assert(
    ASPIRE_MCP_SMOKE_OUTER_TIMEOUT_MS >
      ASPIRE_MCP_SMOKE_TIMEOUTS.initializeMs + ASPIRE_MCP_SMOKE_TIMEOUTS.toolsListMs +
        ASPIRE_MCP_SMOKE_TIMEOUTS.toolCallMs,
  );
});

Deno.test('durable wrapper budget exceeds the inner whole-gate deadline', async () => {
  const wrapper = await Deno.readTextFile(
    new URL('../../../../../../.llm/tools/gates/run-aspire-mcp-smoke.ts', import.meta.url),
  );
  assert(wrapper.includes("'--timeout-ms',\n    '140000'"));
  assert(140_000 > ASPIRE_MCP_SMOKE_TIMEOUTS.wholeGateMs);
});

Deno.test('missing required baseline tool fails and preserves the observation', async () => {
  const persisted: PersistedEvidence[] = [];
  await assertRejects(
    () =>
      runAspireMcpSmoke(
        input(),
        dependencies(
          transport(fixture.tools.filter((name) => name !== 'refresh_tools'), {
            list_apphosts: fixture.apphosts,
            doctor: fixture.doctor,
          }),
          transport([], {}),
          persisted,
        ),
      ),
    Error,
    'refresh_tools',
  );
  assertEquals(persisted.length, 1);
  const receipt = persisted[0].receipt;
  assertEquals(receipt.toolsObserved.length, 13);
  assertEquals(receipt.toolsMissing, ['refresh_tools']);
  assertEquals(receipt.toolsExtra, []);
  assertEquals(receipt.baselineDiff, { added: [], removed: ['refresh_tools'] });
  assertEquals(receipt.serverInfo, fixture.initialize.serverInfo);
  assertEquals(receipt.doctor.summary, { passed: 6, warnings: 4, failed: 0 });
});

Deno.test('documented-unobserved tool appearance is informational', async () => {
  const receipt = await runAspireMcpSmoke(
    input(),
    dependencies(
      transport([...fixture.tools, 'get_integration_docs'], {
        list_apphosts: fixture.apphosts,
        doctor: fixture.doctor,
        list_resources: fixture.resources,
        'list_console_logs:postgres-cli': fixture.excludedConsole,
        'list_console_logs:users': fixture.usersConsole,
        list_structured_logs: fixture.structuredLogs,
      }),
      transport(fixture.dashboardTools, {}),
    ),
  );
  assertEquals(receipt.toolsMissing, []);
  assertEquals(receipt.toolsExtra, ['get_integration_docs']);
  assertEquals(receipt.documentedUnobservedObserved, ['get_integration_docs']);
});

Deno.test('Aspire MCP smoke proves parameter nulling and excludes plaintext secrets', async () => {
  const receipt = await runAspireMcpSmoke(
    input(),
    dependencies(passingPrimary(), transport(fixture.dashboardTools, {})),
  );
  assertEquals(receipt.redaction, { secretParamsNull: true, plaintextLeak: false });
  assertEquals(JSON.stringify(receipt).includes('fixture-secret-never-persist'), false);
  assertEquals(receipt.entryPoint.cwd.includes('raw-dashboard-token'), false);
});

Deno.test('Aspire MCP timeout rejects after persisting a partial receipt', async () => {
  const persisted: PersistedEvidence[] = [];
  const stalled: AspireMcpTransport = {
    initialize: () => new Promise(() => undefined),
    listTools: () => Promise.resolve([]),
    callTool: () => Promise.resolve({}),
    close: () => Promise.resolve({ code: null, signal: 'SIGKILL', graceful: false }),
    transcript: () => [],
  };
  const deps = dependencies(stalled, transport([], {}), persisted);
  deps.timeouts.initializeMs = 5;
  await assertRejects(() => runAspireMcpSmoke(input(), deps), Error, 'initialize timed out');
  assertEquals(persisted.length, 1);
  assertEquals(persisted[0].receipt.structuredLogs, {
    entryCount: null,
    isError: false,
    dashboardAvailable: null,
  });
  const encoded = JSON.stringify(persisted[0]);
  assert(encoded.includes('aspire-mcp-smoke'));
  assert(encoded.includes('SIGKILL'));
});

Deno.test('recorded 13.5.3 static fixture is the ratified 14-tool baseline', () => {
  assertEquals(
    diffAspireMcpTools(fixture.tools, ASPIRE_MCP_BASELINE_TOOLS),
    { added: [], removed: [] },
  );
  assertEquals(fixture.tools.includes('get_integration_docs'), false);
});
