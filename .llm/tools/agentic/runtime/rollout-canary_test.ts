import {
  aggregateRolloutOutcome,
  type CanaryResult,
  ROLLOUT_CANARY_IDS,
  validateCanaryResult,
} from './rollout-canary.ts';

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `values differ: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`,
    );
  }
}
function assertThrows(fn: () => unknown, message: string): void {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error && error.message.includes(message)) return;
    throw error;
  }
  throw new Error(`expected error containing: ${message}`);
}

function row(id: CanaryResult['id'], overrides: Partial<CanaryResult> = {}): CanaryResult {
  return {
    id,
    command: `reproduce ${id}`,
    expected: 'bounded evidence matches the canary contract',
    actual: 'bounded evidence matched',
    evidenceMode: 'synthetic',
    classification: 'none',
    status: 'pass',
    evidence: { summary: 'semantic assertions passed', exitCodes: [0] },
    residualRisks: [],
    ...overrides,
  };
}

Deno.test('aggregate requires exactly nine ordered stable canary ids', () => {
  const unordered = [...ROLLOUT_CANARY_IDS].reverse().map((id) => row(id));
  const outcome = aggregateRolloutOutcome(unordered, '2026-07-10T00:00:00.000Z', 'b438f16d');
  assertEquals(outcome.canaries.map((entry) => entry.id), ROLLOUT_CANARY_IDS);
  assertThrows(
    () => aggregateRolloutOutcome(unordered.slice(1), '2026-07-10T00:00:00.000Z', 'b438f16d'),
    'missing=',
  );
  assertThrows(
    () =>
      aggregateRolloutOutcome([...unordered, unordered[0]], '2026-07-10T00:00:00.000Z', 'b438f16d'),
    'duplicates=',
  );
});

Deno.test('conditional evidence remains explicit and drives conditional recommendation', () => {
  const canaries = ROLLOUT_CANARY_IDS.map((id) =>
    id === 'provider_compatibility'
      ? row(id, {
        evidenceMode: 'live',
        classification: 'credential_absent',
        status: 'conditional_pass',
        actual: 'read-only canary reported credentials unavailable',
        residualRisks: ['credentialed provider behavior remains owner-conditional'],
      })
      : row(id)
  );
  const outcome = aggregateRolloutOutcome(canaries, '2026-07-10T00:00:00.000Z', 'b438f16d');
  assertEquals(outcome.overallStatus, 'conditional_pass');
  assertEquals(outcome.promotionRecommendation, 'promote_with_conditions');
});

Deno.test('conditional classifications can never become fabricated passes', () => {
  assertThrows(
    () =>
      validateCanaryResult(row('antigravity_grounded_search', {
        evidenceMode: 'live',
        classification: 'auth_blocked',
        status: 'pass',
      })),
    'cannot be an unconditional pass',
  );
  assertThrows(
    () =>
      validateCanaryResult(row('claude_mobile_reconnect', {
        evidenceMode: 'live',
        classification: 'owner_accepted_working',
        status: 'conditional_pass',
        residualRisks: ['interactive proof is owner supplied'],
      })),
    'owner acceptance requires owner_accepted',
  );
});

Deno.test('sensitive and raw evidence is refused before persistence', () => {
  assertThrows(
    () => validateCanaryResult(row('native_wsl_health', { actual: 'Authorization: Bearer abc' })),
    'forbidden sensitive material',
  );
  assertThrows(
    () =>
      validateCanaryResult(row('native_wsl_health', {
        evidence: { summary: 'one\ntwo\nthree\nfour\nfive' },
      })),
    'raw command output',
  );
});

Deno.test('a failed row blocks promotion recommendation', () => {
  const canaries = ROLLOUT_CANARY_IDS.map((id) =>
    id === 'native_wsl_health'
      ? row(id, {
        evidenceMode: 'live',
        classification: 'command_failed',
        status: 'fail',
        actual: 'doctor command failed before producing structured evidence',
      })
      : row(id)
  );
  const outcome = aggregateRolloutOutcome(canaries, '2026-07-10T00:00:00.000Z', 'b438f16d');
  assertEquals(outcome.overallStatus, 'fail');
  assertEquals(outcome.promotionRecommendation, 'do_not_promote');
});
