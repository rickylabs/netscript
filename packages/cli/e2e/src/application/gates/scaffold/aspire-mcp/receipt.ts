import type {
  AspireMcpExit,
  AspireMcpSmokeDependencies,
  AspireMcpSmokeInput,
  AspireMcpSmokeReceipt,
} from './contract.ts';
import { ASPIRE_MCP_EXPECTED_TOOLS } from './tools.ts';

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
): AspireMcpSmokeReceipt {
  const excluded = `${input.database}-cli`;
  return {
    receipt: 'aspire-mcp-smoke',
    capturedAt: dependencies.now().toISOString(),
    cliVersion: input.cliVersion,
    scaffoldPin: input.scaffoldPin,
    entryPoint: input.entryPoint,
    serverInfo: { name: '', version: '' },
    appHost: { path: input.appHostPath, inScope: false, selected: false },
    toolsExpected: ASPIRE_MCP_EXPECTED_TOOLS,
    toolsObserved: [],
    toolsMissing: ASPIRE_MCP_EXPECTED_TOOLS,
    toolsExtra: [],
    baselineDiff: { added: [], removed: [] },
    doctor: { cliVersion: '', currentVersion: '', summary: { passed: 0, warnings: 0, failed: 0 } },
    visibility: {
      expectedVisible: [input.database, input.appResource, input.serviceResource],
      expectedMcpExcluded: [excluded],
      observedMcpVisible: [],
      observedMcpExcluded: [],
      describeListsExcluded: false,
      ok: false,
    },
    redaction: { secretParamsNull: false, plaintextLeak: false },
    lifecycle: { initializeMs, toolsListMs, exit },
    dashboardOnlyTools: [],
    transcript: input.transcript,
  };
}
