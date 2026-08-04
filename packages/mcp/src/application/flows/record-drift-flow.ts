import type { DiagnosticEvidencePort } from '../../domain/diagnostic-evidence-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';

/** Receipts older than this cannot authorize a drift entry. */
export const DIAGNOSTIC_RECEIPT_TTL_MS: number = 15 * 60 * 1000;

/** Input accepted by the shared drift gate. */
export interface RecordDriftInput {
  /** Resource whose diagnosis authorizes the entry. */
  readonly resource: string;
  /** Short drift or defect summary. */
  readonly summary: string;
  /** Optional reproduction or evidence detail. */
  readonly details?: string;
}

/** One refusal shared verbatim by the CLI and MCP surfaces. */
export function diagnosticEvidenceRefusal(resource: string): string {
  return `Cannot record drift for "${resource}" without a fresh successful diagnostic receipt. Run ` +
    `"netscript plugin doctor --resource ${resource}" or call the MCP "doctor" or telemetry tools ` +
    `or API introspection tools for resource "${resource}", then retry within 15 minutes.`;
}

/** Gate and append one drift entry. */
export async function recordDrift(
  input: RecordDriftInput,
  evidence: DiagnosticEvidencePort,
  now: Date = new Date(),
): Promise<ToolExecutionResult> {
  const receipt = await evidence.read(input.resource);
  const timestamp = receipt ? Date.parse(receipt.timestamp) : Number.NaN;
  if (
    !receipt || receipt.exitStatus !== 0 || !Number.isFinite(timestamp) ||
    timestamp > now.getTime() || now.getTime() - timestamp > DIAGNOSTIC_RECEIPT_TTL_MS
  ) {
    return {
      ok: false,
      error: {
        code: 'diagnostic_evidence_required',
        message: diagnosticEvidenceRefusal(input.resource),
      },
    };
  }
  const entry = JSON.stringify({
    timestamp: now.toISOString(),
    resource: input.resource,
    summary: input.summary,
    ...(input.details ? { details: input.details } : {}),
    evidence: receipt,
  });
  await evidence.appendDrift(entry);
  return { ok: true, value: { recorded: true, resource: input.resource, receipt } };
}

/** Compose the MCP record_drift flow over the same gate. */
export function createRecordDriftFlow(evidence: DiagnosticEvidencePort): ToolFlow {
  return (input) => recordDrift(input as RecordDriftInput, evidence);
}
