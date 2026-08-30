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
  logCount,
  matchingAppHosts,
  realPath,
  resourceEvidence,
} from './evidence.ts';
import { partialReceipt, redactTranscript } from './receipt.ts';
import {
  ASPIRE_MCP_BASELINE_TOOLS,
  ASPIRE_MCP_DASHBOARD_TOOLS,
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
  const wholeDeadline = performance.now() + dependencies.timeouts.wholeGateMs;
  const stageTimeout = (timeoutMs: number): number =>
    Math.max(1, Math.min(timeoutMs, Math.round(wholeDeadline - performance.now())));
  try {
    const initialized = await timed(
      'initialize',
      stageTimeout(dependencies.timeouts.initializeMs),
      async () => {
        const started = performance.now();
        const serverInfo = await primary.initialize();
        initializeMs = Math.round(performance.now() - started);
        return serverInfo;
      },
    );
    assertVersion('serverInfo.version', initialized.version, input.scaffoldPin);
    assertVersion('aspire --version', input.cliVersion, input.scaffoldPin);

    const toolsObserved = await timed(
      'tools/list',
      stageTimeout(dependencies.timeouts.toolsListMs),
      async () => {
        const started = performance.now();
        const tools = [...await primary.listTools()];
        toolsListMs = Math.round(performance.now() - started);
        return tools;
      },
    );
    const toolsMissing = ASPIRE_MCP_EXPECTED_TOOLS.filter((name) => !toolsObserved.includes(name));
    if (toolsMissing.length > 0) {
      throw new Error(`Aspire MCP tools missing: ${toolsMissing.join(', ')}`);
    }

    const apphosts = appHostEvidence(
      await call(primary, 'list_apphosts', {}, stageTimeout(dependencies.timeouts.toolCallMs)),
    );
    const expectedPath = await realPath(input.appHostPath, dependencies);
    const inScope = await matchingAppHosts(apphosts.inScope, expectedPath, dependencies);
    if (inScope.length === 0) throw new Error(`AppHost is not in MCP scope: ${expectedPath}`);
    if (apphosts.inScope.length > 1) {
      await call(
        primary,
        'select_apphost',
        { appHostPath: expectedPath },
        stageTimeout(dependencies.timeouts.toolCallMs),
      );
    }

    const doctor = doctorEvidence(
      await call(primary, 'doctor', {}, stageTimeout(dependencies.timeouts.toolCallMs)),
    );
    if (doctor.cliVersion !== 'pass') throw new Error('Aspire MCP doctor cli-version did not pass');
    assertVersion('doctor currentVersion', doctor.currentVersion, input.scaffoldPin);

    const resources = resourceEvidence(
      await call(primary, 'list_resources', {}, stageTimeout(dependencies.timeouts.toolCallMs)),
    );
    const expectedVisible = [input.database, input.appResource, input.serviceResource];
    const expectedMcpExcluded = [`${input.database}-cli`];
    const observedMcpVisible = expectedVisible.filter((name) => resources.names.includes(name));
    const observedMcpExcluded = expectedMcpExcluded.filter((name) =>
      !resources.names.includes(name)
    );
    const excludedLogs = await call(
      primary,
      'list_console_logs',
      { resourceName: expectedMcpExcluded[0] },
      stageTimeout(dependencies.timeouts.toolCallMs),
    );
    if (!emptyOrNotFound(excludedLogs)) {
      throw new Error(`${expectedMcpExcluded[0]} unexpectedly exposed console logs through MCP`);
    }
    const usersLogs = await call(
      primary,
      'list_console_logs',
      { resourceName: input.serviceResource },
      stageTimeout(dependencies.timeouts.toolCallMs),
    );
    if (logCount(usersLogs) < 1) {
      throw new Error(`${input.serviceResource} returned no console logs`);
    }
    await call(primary, 'list_structured_logs', {}, stageTimeout(dependencies.timeouts.toolCallMs));
    const described = await dependencies.describeResources();
    const describeListsExcluded = expectedMcpExcluded.every((name) => described.includes(name));
    const visibilityOk = observedMcpVisible.length === expectedVisible.length &&
      observedMcpExcluded.length === expectedMcpExcluded.length && describeListsExcluded;
    if (!visibilityOk) throw new Error('Aspire MCP resource visibility contract failed');

    transcript = primary.transcript();
    const plaintextLeak = input.secretValues.some((secret) =>
      secret.length > 0 && JSON.stringify(transcript).includes(secret)
    );
    const secretParamsNull = input.secretValues.length === 0 || resources.secretParamsNull;
    if (!secretParamsNull || plaintextLeak) {
      throw new Error('Aspire MCP secret redaction contract failed');
    }

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
    const dashboardTools = [
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
    exit = await primary.close();

    const receipt: AspireMcpSmokeReceipt = {
      receipt: 'aspire-mcp-smoke',
      capturedAt: dependencies.now().toISOString(),
      cliVersion: input.cliVersion,
      scaffoldPin: input.scaffoldPin,
      entryPoint: input.entryPoint,
      serverInfo: initialized,
      appHost: { path: expectedPath, inScope: true, selected: true },
      toolsExpected: ASPIRE_MCP_EXPECTED_TOOLS,
      toolsObserved,
      toolsMissing,
      toolsExtra: toolsObserved.filter((name) => !ASPIRE_MCP_EXPECTED_TOOLS.includes(name)),
      baselineDiff: diffAspireMcpTools(toolsObserved, ASPIRE_MCP_BASELINE_TOOLS),
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
      lifecycle: { initializeMs, toolsListMs, exit },
      dashboardOnlyTools: dashboardTools,
      transcript: input.transcript,
    };
    await dependencies.persist(receipt, redactTranscript(transcript, input));
    return receipt;
  } catch (error) {
    if (dashboard) await dashboard.close().catch(() => undefined);
    exit = await primary.close().catch(() => exit);
    transcript = primary.transcript();
    await dependencies.persist(
      partialReceipt(input, dependencies, initializeMs, toolsListMs, exit),
      redactTranscript(transcript, input),
    );
    throw error;
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
  let timeout: number | undefined;
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
