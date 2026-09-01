import type {
  AspireMcpEntryPoint,
  AspireMcpExit,
  AspireMcpSmokeDependencies,
  AspireMcpSmokeInput,
  AspireMcpSmokeReceipt,
  AspireMcpTransport,
} from './contract.ts';
import {
  appHostEvidence,
  doctorEvidence,
  emptyOrNotFound,
  isDashboardUnavailableError,
  logCount,
  matchingAppHosts,
  realPath,
  resourceEvidence,
  structuredLogEvidence,
} from './evidence.ts';
import { partialReceipt, redactTranscript } from './receipt.ts';
import {
  ASPIRE_MCP_BASELINE_TOOLS,
  ASPIRE_MCP_DASHBOARD_TOOLS,
  ASPIRE_MCP_DOCUMENTED_UNOBSERVED,
  ASPIRE_MCP_EXPECTED_TOOLS,
  diffAspireMcpTools,
} from './tools.ts';

/** Run the locked Aspire MCP smoke through injected transports and evidence sinks. */
export async function runAspireMcpSmoke(
  input: AspireMcpSmokeInput,
  dependencies: AspireMcpSmokeDependencies,
): Promise<AspireMcpSmokeReceipt> {
  const primary = await dependencies.createTransport(input.entryPoint);
  let dashboard: AspireMcpTransport | undefined;
  let initializeMs = 0;
  let toolsListMs = 0;
  let exit: AspireMcpExit = { code: null, signal: null, graceful: false };
  let transcript: readonly unknown[] = [];
  let serverInfo: AspireMcpSmokeReceipt['serverInfo'] = { name: '', version: '' };
  let toolsObserved: readonly string[] = [];
  let toolsMissing: readonly string[] = ASPIRE_MCP_EXPECTED_TOOLS;
  let toolsExtra: readonly string[] = [];
  let baselineDiff: AspireMcpSmokeReceipt['baselineDiff'] = { added: [], removed: [] };
  let doctor: AspireMcpSmokeReceipt['doctor'] = {
    cliVersion: '',
    currentVersion: '',
    summary: { passed: 0, warnings: 0, failed: 0 },
  };
  let structuredLogs: AspireMcpSmokeReceipt['structuredLogs'] = {
    entryCount: null,
    isError: false,
    dashboardAvailable: null,
  };
  let dashboardDegradation: AspireMcpSmokeReceipt['dashboardDegradation'] = {
    documented: false,
    tool: null,
  };
  const expectedVisible = [input.database, input.appResource, input.serviceResource];
  const expectedMcpExcluded = [`${input.database}-cli`];
  let expectedPath = input.appHostPath;
  let appHostInScope = false;
  let observedMcpVisible: readonly string[] = [];
  let observedMcpExcluded: readonly string[] = [];
  let describeListsExcluded = false;
  let visibilityOk = false;
  let secretParamsNull = input.secretValues.length === 0;
  let plaintextLeak = false;
  let dashboardTools: readonly string[] = [];
  const wholeDeadline = performance.now() + dependencies.timeouts.wholeGateMs;
  const stageTimeout = (timeoutMs: number): number =>
    Math.max(1, Math.min(timeoutMs, Math.round(wholeDeadline - performance.now())));
  const callPrimary = async (
    name: string,
    args: Readonly<Record<string, unknown>>,
  ): Promise<unknown> => {
    try {
      return await call(
        primary,
        name,
        args,
        stageTimeout(dependencies.timeouts.toolCallMs),
      );
    } catch (error) {
      if (isDashboardUnavailableError(name, error)) {
        structuredLogs = { entryCount: null, isError: true, dashboardAvailable: false };
        dashboardDegradation = { documented: true, tool: name };
        throw new DashboardUnavailableDegradation(name);
      }
      throw error;
    }
  };
  const readTranscriptRedaction = (): void => {
    transcript = primary.transcript();
    plaintextLeak = input.secretValues.some((secret) =>
      secret.length > 0 && JSON.stringify(transcript).includes(secret)
    );
    if (plaintextLeak) throw new Error('Aspire MCP secret redaction contract failed');
  };
  const readDashboardToolSurface = async (): Promise<void> => {
    const dashboardEntry: AspireMcpEntryPoint = {
      ...input.entryPoint,
      args: [...input.entryPoint.args, '--dashboard-url', input.dashboardUrl],
    };
    const dashboardTransport = await dependencies.createTransport(dashboardEntry);
    dashboard = dashboardTransport;
    await timed(
      'dashboard initialize',
      stageTimeout(dependencies.timeouts.initializeMs),
      () => dashboardTransport.initialize(),
    );
    dashboardTools = [
      ...await timed(
        'dashboard tools/list',
        stageTimeout(dependencies.timeouts.toolsListMs),
        () => dashboardTransport.listTools(),
      ),
    ];
    if (!sameSet(dashboardTools, ASPIRE_MCP_DASHBOARD_TOOLS)) {
      throw new Error(`Unexpected dashboard-only tools: ${dashboardTools.join(', ')}`);
    }
    await dashboardTransport.close();
    dashboard = undefined;
  };
  const receipt = (): AspireMcpSmokeReceipt => ({
    receipt: 'aspire-mcp-smoke',
    capturedAt: dependencies.now().toISOString(),
    cliVersion: input.cliVersion,
    scaffoldPin: input.scaffoldPin,
    entryPoint: input.entryPoint,
    serverInfo,
    appHost: { path: expectedPath, inScope: appHostInScope, selected: appHostInScope },
    toolsExpected: ASPIRE_MCP_EXPECTED_TOOLS,
    toolsObserved,
    toolsMissing,
    toolsExtra,
    documentedUnobserved: ASPIRE_MCP_DOCUMENTED_UNOBSERVED,
    documentedUnobservedObserved: toolsObserved.filter((name) =>
      ASPIRE_MCP_DOCUMENTED_UNOBSERVED.includes(name)
    ),
    baselineDiff,
    doctor,
    visibility: {
      expectedVisible,
      expectedMcpExcluded,
      observedMcpVisible,
      observedMcpExcluded,
      describeListsExcluded,
      ok: visibilityOk,
    },
    redaction: { secretParamsNull, plaintextLeak },
    structuredLogs,
    dashboardDegradation,
    lifecycle: { initializeMs, toolsListMs, exit },
    dashboardOnlyTools: dashboardTools,
    transcript: input.transcript,
  });
  try {
    serverInfo = await timed(
      'initialize',
      stageTimeout(dependencies.timeouts.initializeMs),
      async () => {
        const started = performance.now();
        const serverInfo = await primary.initialize();
        initializeMs = Math.round(performance.now() - started);
        return serverInfo;
      },
    );
    assertVersion('serverInfo.version', serverInfo.version, input.scaffoldPin);
    assertVersion('aspire --version', input.cliVersion, input.scaffoldPin);

    toolsObserved = await timed(
      'tools/list',
      stageTimeout(dependencies.timeouts.toolsListMs),
      async () => {
        const started = performance.now();
        const tools = [...await primary.listTools()];
        toolsListMs = Math.round(performance.now() - started);
        return tools;
      },
    );
    toolsMissing = ASPIRE_MCP_EXPECTED_TOOLS.filter((name) => !toolsObserved.includes(name));
    toolsExtra = toolsObserved.filter((name) => !ASPIRE_MCP_EXPECTED_TOOLS.includes(name));
    baselineDiff = diffAspireMcpTools(toolsObserved, ASPIRE_MCP_BASELINE_TOOLS);

    const apphosts = appHostEvidence(
      await callPrimary('list_apphosts', {}),
    );
    expectedPath = await realPath(input.appHostPath, dependencies);
    const inScope = await matchingAppHosts(apphosts.inScope, expectedPath, dependencies);
    if (inScope.length === 0) throw new Error(`AppHost is not in MCP scope: ${expectedPath}`);
    appHostInScope = true;
    if (apphosts.inScope.length > 1) {
      await callPrimary('select_apphost', { appHostPath: expectedPath });
    }

    doctor = doctorEvidence(
      await callPrimary('doctor', {}),
    );
    if (doctor.cliVersion !== 'pass') throw new Error('Aspire MCP doctor cli-version did not pass');
    assertVersion('doctor currentVersion', doctor.currentVersion, input.scaffoldPin);
    if (toolsMissing.length > 0) {
      throw new Error(`Aspire MCP tools missing: ${toolsMissing.join(', ')}`);
    }

    const resources = resourceEvidence(
      await callPrimary('list_resources', {}),
    );
    observedMcpVisible = expectedVisible.filter((name) => resources.names.includes(name));
    observedMcpExcluded = expectedMcpExcluded.filter((name) => !resources.names.includes(name));
    secretParamsNull = input.secretValues.length === 0 || resources.secretParamsNull;
    const excludedLogs = await callPrimary(
      'list_console_logs',
      { resourceName: expectedMcpExcluded[0] },
    );
    if (!emptyOrNotFound(excludedLogs)) {
      throw new Error(`${expectedMcpExcluded[0]} unexpectedly exposed console logs through MCP`);
    }
    const usersLogs = await callPrimary(
      'list_console_logs',
      { resourceName: input.serviceResource },
    );
    if (logCount(usersLogs) < 1) {
      throw new Error(`${input.serviceResource} returned no console logs`);
    }
    structuredLogs = structuredLogEvidence(
      await callPrimary('list_structured_logs', {}),
    );
    const described = await dependencies.describeResources();
    describeListsExcluded = expectedMcpExcluded.every((name) => described.includes(name));
    visibilityOk = observedMcpVisible.length === expectedVisible.length &&
      observedMcpExcluded.length === expectedMcpExcluded.length && describeListsExcluded;
    if (!visibilityOk) throw new Error('Aspire MCP resource visibility contract failed');

    readTranscriptRedaction();
    if (!secretParamsNull || plaintextLeak) {
      throw new Error('Aspire MCP secret redaction contract failed');
    }

    await readDashboardToolSurface();
    exit = await primary.close();

    const completed = receipt();
    await dependencies.persist(completed, redactTranscript(transcript, input));
    return completed;
  } catch (error) {
    let failure = error;
    if (failure instanceof DashboardUnavailableDegradation) {
      try {
        readTranscriptRedaction();
        const described = await dependencies.describeResources();
        describeListsExcluded = expectedMcpExcluded.every((name) => described.includes(name));
        visibilityOk = observedMcpVisible.length === expectedVisible.length &&
          observedMcpExcluded.length === expectedMcpExcluded.length && describeListsExcluded;
        await readDashboardToolSurface();
        exit = await primary.close();
        const degraded = receipt();
        await dependencies.persist(degraded, redactTranscript(transcript, input));
        return degraded;
      } catch (completionError) {
        failure = completionError;
      }
    }
    if (dashboard) await dashboard.close().catch(() => undefined);
    exit = await primary.close().catch(() => exit);
    transcript = primary.transcript();
    await dependencies.persist(
      partialReceipt(input, dependencies, initializeMs, toolsListMs, exit, {
        serverInfo,
        toolsObserved,
        toolsMissing,
        toolsExtra,
        baselineDiff,
        doctor,
        structuredLogs,
        dashboardDegradation,
      }),
      redactTranscript(transcript, input),
    );
    throw failure;
  }
}

class DashboardUnavailableDegradation extends Error {
  constructor(readonly toolName: string) {
    super(`Aspire Dashboard unavailable for ${toolName}`);
    this.name = 'DashboardUnavailableDegradation';
  }
}

async function call(
  transport: AspireMcpTransport,
  name: string,
  args: Readonly<Record<string, unknown>>,
  timeoutMs: number,
): Promise<unknown> {
  return await timed(name, timeoutMs, () => transport.callTool(name, args));
}

function assertVersion(label: string, actual: string, pin: string): void {
  if (!actual.startsWith(pin)) throw new Error(`${label} ${actual} does not start with ${pin}`);
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item) => right.includes(item));
}

async function timed<T>(label: string, timeoutMs: number, operation: () => Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
