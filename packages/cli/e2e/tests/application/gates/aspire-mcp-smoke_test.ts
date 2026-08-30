import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  ASPIRE_MCP_BASELINE_TOOLS,
  ASPIRE_MCP_DASHBOARD_TOOLS,
  ASPIRE_MCP_EXPECTED_TOOLS,
  type AspireMcpSmokeDependencies,
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

const fixture: RecordedFixture = JSON.parse(
  await Deno.readTextFile(
    new URL('../../fixtures/aspire-13.5.3-mcp-recorded.json', import.meta.url),
  ),
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
      return Promise.resolve(keyed ?? calls[name]);
    },
    close: () => Promise.resolve({ code: 0, signal: null, graceful: true }),
    transcript: () => transcript,
  };
}

function dependencies(
  primary: AspireMcpTransport,
  dashboard: AspireMcpTransport,
  persisted: unknown[] = [],
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
    [...fixture.tools, 'get_integration_docs'],
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

Deno.test('Aspire MCP expected set is the recorded 13.4.6 baseline plus get_integration_docs', () => {
  assertEquals(ASPIRE_MCP_BASELINE_TOOLS.length, 14);
  assertEquals(ASPIRE_MCP_EXPECTED_TOOLS.length, 15);
  assert(ASPIRE_MCP_EXPECTED_TOOLS.includes('refresh_tools'));
  assert(ASPIRE_MCP_EXPECTED_TOOLS.includes('get_integration_docs'));
  assertEquals(
    diffAspireMcpTools(ASPIRE_MCP_EXPECTED_TOOLS, ASPIRE_MCP_BASELINE_TOOLS),
    { added: ['get_integration_docs'], removed: [] },
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
  assertEquals(receipt.baselineDiff, { added: ['get_integration_docs'], removed: [] });
  assertEquals(receipt.dashboardOnlyTools, ASPIRE_MCP_DASHBOARD_TOOLS);
  assertEquals(receipt.visibility.expectedVisible, ['postgres', 'fixture-web', 'users']);
  assertEquals(receipt.visibility.expectedMcpExcluded, ['postgres-cli']);
  assertEquals(receipt.visibility.observedMcpExcluded, ['postgres-cli']);
  assertEquals(receipt.visibility.describeListsExcluded, true);
  assertEquals(receipt.visibility.ok, true);
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
  const persisted: unknown[] = [];
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
  const encoded = JSON.stringify(persisted[0]);
  assert(encoded.includes('aspire-mcp-smoke'));
  assert(encoded.includes('SIGKILL'));
});

Deno.test('recorded 13.5.3 static fixture remains a truthful 14-tool red case', () => {
  assertEquals(
    diffAspireMcpTools(fixture.tools, ASPIRE_MCP_BASELINE_TOOLS),
    { added: [], removed: [] },
  );
  assertEquals(fixture.tools.includes('get_integration_docs'), false);
});
