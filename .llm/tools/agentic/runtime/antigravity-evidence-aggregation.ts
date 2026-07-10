/** Conditional handoff from proven Antigravity evidence to run-local resource aggregation. */

import type { AntigravityEvidenceResult } from './antigravity-evidence.ts';
import type { AntigravityCitationAggregationPort } from './ports.ts';

/** Writes normalized citations only when acquisition and persistence were empirically supported. */
export async function aggregateAntigravityEvidence(
  result: AntigravityEvidenceResult,
  port: AntigravityCitationAggregationPort,
): Promise<boolean> {
  if (!result.aggregationEligible) return false;
  await port.writeAntigravityCitations(result.evidence.citations);
  return true;
}
