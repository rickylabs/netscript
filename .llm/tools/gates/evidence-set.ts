import type { EvidenceSet, GateReceipt } from './contract.ts';
import { isTerminal } from './contract.ts';

export function evaluateEvidenceSet(options: {
  immutableHead: string;
  surface: string;
  expectedGateIds: string[];
  receipts: GateReceipt[];
  frameworkSurface?: boolean;
}): EvidenceSet {
  const reasons: string[] = [];
  const byGate = new Map(options.receipts.map((receipt) => [receipt.gateId, receipt]));
  const required = new Set(options.expectedGateIds);
  if (options.frameworkSurface) {
    for (
      const gate of [
        'check',
        'lint',
        'fmt-check',
        'quality-gate',
        'dependency-evidence',
        'jsr-audit',
      ]
    ) {
      required.add(gate);
    }
  }
  for (const gateId of required) {
    const receipt = byGate.get(gateId);
    if (!receipt) {
      reasons.push(`missing receipt for ${gateId}`);
      continue;
    }
    if (!isTerminal(receipt.outcome)) reasons.push(`${gateId} is nonterminal (${receipt.outcome})`);
    if (receipt.outcome !== 'PASS') reasons.push(`${gateId} did not pass (${receipt.outcome})`);
    if (receipt.gitHead !== options.immutableHead) {
      reasons.push(`${gateId} targets ${receipt.gitHead}`);
    }
  }
  return {
    schemaVersion: 1,
    immutableHead: options.immutableHead,
    surface: options.surface,
    expectedGateIds: [...required],
    receiptIds: options.receipts.map((receipt) => receipt.invocationId),
    sufficiency: reasons.length === 0 ? 'SUFFICIENT' : 'INSUFFICIENT',
    reasons,
  };
}
