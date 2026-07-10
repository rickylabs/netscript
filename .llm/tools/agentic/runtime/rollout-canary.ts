/** Finite rollout canary contract and secret-safe outcome aggregation. */

export const ROLLOUT_CANARY_IDS = [
  'native_wsl_health',
  'claude_mobile_reconnect',
  'claude_isolated_sessions',
  'codex_remote_lifecycle',
  'antigravity_grounded_search',
  'provider_compatibility',
  'quota_fallback_restoration',
  'opposite_family_epic_run',
  'windows_native_rollback',
] as const;

export const EVIDENCE_MODES = ['live', 'owner_accepted', 'synthetic', 'provenance'] as const;
export const CANARY_STATUSES = ['pass', 'conditional_pass', 'fail'] as const;
export const FAILURE_CLASSIFICATIONS = [
  'none',
  'owner_accepted_working',
  'credential_absent',
  'auth_blocked',
  'capability_incompatible',
  'runtime_degraded',
  'unsafe_to_repair',
  'evidence_missing',
  'command_failed',
] as const;
export const PROMOTION_RECOMMENDATIONS = [
  'promote',
  'promote_with_conditions',
  'do_not_promote',
] as const;

export type RolloutCanaryId = typeof ROLLOUT_CANARY_IDS[number];
export type EvidenceMode = typeof EVIDENCE_MODES[number];
export type CanaryStatus = typeof CANARY_STATUSES[number];
export type FailureClassification = typeof FAILURE_CLASSIFICATIONS[number];
export type PromotionRecommendation = typeof PROMOTION_RECOMMENDATIONS[number];

export interface CanaryEvidence {
  readonly summary: string;
  readonly exitCodes?: readonly number[];
  readonly references?: readonly string[];
}

export interface CanaryResult {
  readonly id: RolloutCanaryId;
  readonly command: string;
  readonly expected: string;
  readonly actual: string;
  readonly evidenceMode: EvidenceMode;
  readonly classification: FailureClassification;
  readonly status: CanaryStatus;
  readonly evidence: CanaryEvidence;
  readonly residualRisks: readonly string[];
}

export interface RolloutOutcome {
  readonly schemaVersion: '1.0';
  readonly generatedAt: string;
  readonly baseline: string;
  readonly canaries: readonly CanaryResult[];
  readonly overallStatus: CanaryStatus;
  readonly residualRisks: readonly string[];
  readonly rollbackStatus: string;
  readonly promotionRecommendation: PromotionRecommendation;
  readonly promotionBoundary: string;
}

const SENSITIVE_PATTERN =
  /(?:api[_-]?key|authorization|bearer\s+|password|secret|token|environmentid|servername|session[_-]?payload)/i;
const CONDITIONAL_CLASSIFICATIONS: readonly FailureClassification[] = [
  'owner_accepted_working',
  'credential_absent',
  'auth_blocked',
  'runtime_degraded',
  'unsafe_to_repair',
];

/** Refuses evidence strings that could contain credentials, host identity, or raw session payloads. */
export function assertSafeEvidence(value: string, field: string): void {
  if (SENSITIVE_PATTERN.test(value)) {
    throw new Error(`${field} contains forbidden sensitive material`);
  }
  if (value.includes('\n') && value.split('\n').length > 4) {
    throw new Error(`${field} appears to contain raw command output`);
  }
}

/** Validates one row without weakening explicit conditional classifications into fabricated passes. */
export function validateCanaryResult(result: CanaryResult): void {
  for (
    const [field, value] of [
      ['command', result.command],
      ['expected', result.expected],
      ['actual', result.actual],
      ['evidence.summary', result.evidence.summary],
      ...result.evidence.references?.map((value) => ['evidence.reference', value] as const) ?? [],
      ...result.residualRisks.map((value) => ['residualRisk', value] as const),
    ] as const
  ) assertSafeEvidence(value, `${result.id}.${field}`);

  if (!result.command || !result.expected || !result.actual || !result.evidence.summary) {
    throw new Error(`${result.id} has incomplete acceptance evidence`);
  }
  if (result.classification === 'none' && result.status !== 'pass') {
    throw new Error(`${result.id} classification none requires pass`);
  }
  if (CONDITIONAL_CLASSIFICATIONS.includes(result.classification) && result.status === 'pass') {
    throw new Error(`${result.id} conditional classification cannot be an unconditional pass`);
  }
  if (
    result.classification === 'owner_accepted_working' && result.evidenceMode !== 'owner_accepted'
  ) {
    throw new Error(`${result.id} owner acceptance requires owner_accepted evidence mode`);
  }
  if (result.status === 'conditional_pass' && result.residualRisks.length === 0) {
    throw new Error(`${result.id} conditional pass requires a residual risk`);
  }
}

/** Builds the complete outcome and fails closed when any required canary is missing or duplicated. */
export function aggregateRolloutOutcome(
  canaries: readonly CanaryResult[],
  generatedAt: string,
  baseline: string,
): RolloutOutcome {
  const ids = canaries.map((entry) => entry.id);
  const missing = ROLLOUT_CANARY_IDS.filter((id) => !ids.includes(id));
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (missing.length || duplicates.length || canaries.length !== ROLLOUT_CANARY_IDS.length) {
    throw new Error(
      `invalid canary matrix: missing=${missing.join(',') || 'none'} duplicates=${
        [...new Set(duplicates)].join(',') || 'none'
      }`,
    );
  }
  canaries.forEach(validateCanaryResult);
  assertSafeEvidence(generatedAt, 'generatedAt');
  assertSafeEvidence(baseline, 'baseline');

  const ordered = ROLLOUT_CANARY_IDS.map((id) => canaries.find((entry) => entry.id === id)!);
  const overallStatus: CanaryStatus = ordered.some((entry) => entry.status === 'fail')
    ? 'fail'
    : ordered.some((entry) => entry.status === 'conditional_pass')
    ? 'conditional_pass'
    : 'pass';
  const residualRisks = [...new Set(ordered.flatMap((entry) => entry.residualRisks))];
  const promotionRecommendation: PromotionRecommendation = overallStatus === 'fail'
    ? 'do_not_promote'
    : overallStatus === 'conditional_pass'
    ? 'promote_with_conditions'
    : 'promote';
  return {
    schemaVersion: '1.0',
    generatedAt,
    baseline,
    canaries: ordered,
    overallStatus,
    residualRisks,
    rollbackStatus: 'documented_and_provenance_cited',
    promotionRecommendation,
    promotionBoundary: 'Recommendation only. Owner approval and coordinator action are required.',
  };
}
