import { assertEquals } from '@std/assert';
import { ROUTING_MODEL_IDS } from '../config/models.ts';
import {
  evaluateSubscriptionExpense,
  type ExpenseUsageSnapshot,
  parseExpenseUsageSnapshot,
} from './subscription-expense.ts';

const now = '2026-09-04T16:00:00.000Z';
const capturedAt = '2026-09-04T15:55:00.000Z';

function decide(
  snapshot: ExpenseUsageSnapshot,
  estimatedCostUsd = 1,
  model: string | undefined = snapshot.provider === 'opencode_go'
    ? ROUTING_MODEL_IDS.grok46Go
    : undefined,
) {
  return evaluateSubscriptionExpense({
    provider: snapshot.provider,
    model,
    estimatedCostUsd,
    snapshot,
    now,
  });
}

function goSnapshot(
  rollingPercent: number,
  weeklyPercent = 40,
  monthlyPercent = 20,
  rollingStatus = 'ok',
): ExpenseUsageSnapshot {
  return {
    provider: 'opencode_go',
    capturedAt,
    percentageWindows: {
      rolling_five_hours: { percent: rollingPercent, status: rollingStatus },
      weekly: { percent: weeklyPercent, status: 'ok' },
      monthly: { percent: monthlyPercent, status: 'ok' },
    },
  };
}

Deno.test('OpenCode Go enforces rolling five-hour, weekly, and monthly monetary windows', () => {
  const decision = decide(goSnapshot(50), 0.1);
  assertEquals(decision.allowed, true);
  assertEquals(decision.windows.map((entry) => [entry.id, entry.limitUsd]), [
    ['rolling_five_hours', 3],
    ['weekly', 7.5],
    ['monthly', 15],
  ]);
  assertEquals(
    decide(goSnapshot(99), 0.1).reason,
    'allowance_exhausted',
  );
});

Deno.test('OpenCode Go fails closed when any usage window is absent', () => {
  assertEquals(
    decide({
      provider: 'opencode_go',
      capturedAt,
      percentageWindows: {
        rolling_five_hours: { percent: 1, status: 'ok' },
        weekly: { percent: 2, status: 'ok' },
      },
    }).reason,
    'usage_unproven',
  );
});

Deno.test('OpenCode Go blocks live rate limits and 100-plus-percent usage', () => {
  assertEquals(decide(goSnapshot(100)).reason, 'provider_rate_limited');
  assertEquals(decide(goSnapshot(104.5)).reason, 'provider_rate_limited');
  assertEquals(decide(goSnapshot(99, 40, 20, 'rate-limited')).reason, 'provider_rate_limited');
});

Deno.test('OpenCode Go refuses models without published weighting metadata', () => {
  assertEquals(decide(goSnapshot(10), 0.1, 'opencode-go/unknown').reason, 'usage_unproven');
});

Deno.test('Ollama resolves plan credits and concurrency without guessing a tier', () => {
  assertEquals(
    decide({
      provider: 'ollama',
      capturedAt,
      monthlyUsedUsd: 1,
      concurrentRequests: 0,
    }).reason,
    'subscription_tier_unresolved',
  );
  const pro = decide({
    provider: 'ollama',
    capturedAt,
    tier: 'pro',
    monthlyUsedUsd: 50,
    concurrentRequests: 2,
  });
  assertEquals(pro.allowed, true);
  assertEquals(pro.windows[0]?.limitUsd, 60);
  assertEquals(pro.concurrency, { current: 2, limit: 3 });
  assertEquals(
    decide({
      provider: 'ollama',
      capturedAt,
      tier: 'max',
      monthlyUsedUsd: 1,
      concurrentRequests: 10,
    }).reason,
    'concurrency_exhausted',
  );
});

Deno.test('OpenRouter final fallback requires proven available balance', () => {
  assertEquals(decide({ provider: 'openrouter', capturedAt }).reason, 'usage_unproven');
  assertEquals(
    decide({
      provider: 'openrouter',
      capturedAt,
      availableBalanceUsd: 2,
    }, 2.1).reason,
    'allowance_exhausted',
  );
});

Deno.test('stale, future, mismatched, and zero-cost requests fail closed', () => {
  const snapshot = {
    provider: 'openrouter' as const,
    capturedAt: '2026-09-04T15:00:00.000Z',
    availableBalanceUsd: 10,
  };
  assertEquals(decide(snapshot).reason, 'usage_stale');
  assertEquals(
    evaluateSubscriptionExpense({
      provider: 'openrouter',
      estimatedCostUsd: 1,
      snapshot: { ...snapshot, provider: 'ollama', capturedAt },
      now,
    }).reason,
    'provider_mismatch',
  );
  assertEquals(
    evaluateSubscriptionExpense({
      provider: 'openrouter',
      estimatedCostUsd: 0,
      snapshot: { ...snapshot, capturedAt },
      now,
    }).reason,
    'invalid_request',
  );
});

Deno.test('warning becomes true at 90 percent consumption without blocking', () => {
  const decision = decide(goSnapshot(87), 0.1);
  assertEquals(decision.allowed, true);
  assertEquals(decision.warning, true);
  assertEquals(decision.windows[0]?.projectedPercent! >= 90, true);
});

Deno.test('snapshot parser accepts structured usage and rejects non-objects', () => {
  assertEquals(
    parseExpenseUsageSnapshot(
      JSON.stringify({ provider: 'openrouter', capturedAt, availableBalanceUsd: 3 }),
    ).provider,
    'openrouter',
  );
  let message = '';
  try {
    parseExpenseUsageSnapshot('[]');
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertEquals(message, 'usage snapshot requires a supported provider and capturedAt');
});
import { evaluateCopilotExpense } from './subscription-expense.ts';

Deno.test('Copilot ledger rejects missing malformed stale cap and envelope anomalies', () => {
  const now = '2026-09-04T20:00:00Z';
  const ledger = { schemaVersion: 1, month: '2026-09', updatedAt: now, usedCredits: 6900 };
  assertEquals(evaluateCopilotExpense(ledger, 100, now).allowed, true);
  assertEquals(evaluateCopilotExpense(ledger, 101, now).reason, 'allowance_exhausted');
  for (const cap of [0, -1, 1.5, NaN, Infinity]) {
    assertEquals(evaluateCopilotExpense(ledger, cap, now).reason, 'invalid_request');
  }
  for (
    const value of [null, {}, { ...ledger, usedCredits: -1 }, { ...ledger, month: 'invalid' }, {
      ...ledger,
      updatedAt: '2026-09-05T00:00:00Z',
    }]
  ) {
    assertEquals(evaluateCopilotExpense(value, 100, now).reason, 'usage_unproven');
  }
  assertEquals(
    evaluateCopilotExpense({ ...ledger, updatedAt: '2026-09-04T19:00:00Z' }, 100, now).reason,
    'usage_stale',
  );
  assertEquals(
    evaluateCopilotExpense(
      { ...ledger, month: '2026-08', updatedAt: '2026-08-31T23:59:00Z', usedCredits: 7000 },
      100,
      now,
    ).allowed,
    true,
  );
});
