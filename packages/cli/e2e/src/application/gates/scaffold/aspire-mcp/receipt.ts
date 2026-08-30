import type {
  AspireMcpExit,
  AspireMcpSmokeDependencies,
  AspireMcpSmokeInput,
  AspireMcpSmokeReceipt,
} from './contract.ts';
import { ASPIRE_MCP_DOCUMENTED_UNOBSERVED, ASPIRE_MCP_EXPECTED_TOOLS } from './tools.ts';

export interface AspireMcpPartialObservation {
  readonly serverInfo: AspireMcpSmokeReceipt['serverInfo'];
  readonly toolsObserved: readonly string[];
  readonly toolsMissing: readonly string[];
  readonly toolsExtra: readonly string[];
  readonly baselineDiff: AspireMcpSmokeReceipt['baselineDiff'];
  readonly doctor: AspireMcpSmokeReceipt['doctor'];
  readonly structuredLogs: AspireMcpSmokeReceipt['structuredLogs'];
}

/** Redact secret literals and dashboard tokens before transcript persistence. */
export function redactTranscript(
  transcript: readonly unknown[],
  input: AspireMcpSmokeInput,
): readonly unknown[] {
  let text = JSON.stringify(transcript);
  for (const secret of input.secretValues) {
    if (secret) text = text.replaceAll(secret, '[REDACTED]');
  }
  text = text.replaceAll(/([?&]t=)[^&"\\]+/g, '$1[REDACTED]');
  const parsed: unknown = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [];
}

/** Build the exact partial receipt persisted when any lifecycle stage fails. */
export function partialReceipt(
  input: AspireMcpSmokeInput,
  dependencies: AspireMcpSmokeDependencies,
  initializeMs: number,
  toolsListMs: number,
  exit: AspireMcpExit,
  observation: AspireMcpPartialObservation,
): AspireMcpSmokeReceipt {
  const excluded = `${input.database}-cli`;
  return {
    receipt: 'aspire-mcp-smoke',
    capturedAt: dependencies.now().toISOString(),
    cliVersion: input.cliVersion,
    scaffoldPin: input.scaffoldPin,
    entryPoint: input.entryPoint,
    serverInfo: observation.serverInfo,
    appHost: { path: input.appHostPath, inScope: false, selected: false },
    toolsExpected: ASPIRE_MCP_EXPECTED_TOOLS,
    toolsObserved: observation.toolsObserved,
    toolsMissing: observation.toolsMissing,
    toolsExtra: observation.toolsExtra,
    documentedUnobserved: ASPIRE_MCP_DOCUMENTED_UNOBSERVED,
    documentedUnobservedObserved: observation.toolsObserved.filter((name) =>
      ASPIRE_MCP_DOCUMENTED_UNOBSERVED.includes(name)
    ),
    baselineDiff: observation.baselineDiff,
    doctor: observation.doctor,
    visibility: {
      expectedVisible: [input.database, input.appResource, input.serviceResource],
      expectedMcpExcluded: [excluded],
      observedMcpVisible: [],
      observedMcpExcluded: [],
      describeListsExcluded: false,
      ok: false,
    },
    redaction: { secretParamsNull: false, plaintextLeak: false },
    structuredLogs: observation.structuredLogs,
    lifecycle: { initializeMs, toolsListMs, exit },
    dashboardOnlyTools: [],
    transcript: input.transcript,
  };
}
