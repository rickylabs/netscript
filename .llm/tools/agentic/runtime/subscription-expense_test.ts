import { assertEquals } from '@std/assert';
import {
  evaluateSubscriptionExpense,
  type ExpenseUsageSnapshot,
  parseExpenseUsageSnapshot,
} from './subscription-expense.ts';

const now = '2026-09-04T16:00:00.000Z';
const capturedAt = '2026-09-04T15:55:00.000Z';

function decide(snapshot: ExpenseUsageSnapshot, estimatedCostUsd = 1) {
  return evaluateSubscriptionExpense({
    provider: snapshot.provider,
    estimatedCostUsd,
    snapshot,
    now,
  });
}

Deno.test('OpenCode Go enforces rolling five-hour, weekly, and monthly monetary windows', () => {
  const decision = decide({
    provider: 'opencode_go',
    capturedAt,
    rollingFiveHoursUsedUsd: 10,
    weeklyUsedUsd: 20,
    monthlyUsedUsd: 40,
  });
  assertEquals(decision.allowed, true);
  assertEquals(decision.windows.map((entry) => [entry.id, entry.limitUsd]), [
    ['rolling_five_hours', 12],
    ['weekly', 30],
    ['monthly', 60],
  ]);
  assertEquals(
    decide({
      provider: 'opencode_go',
      capturedAt,
      rollingFiveHoursUsedUsd: 11.5,
      weeklyUsedUsd: 20,
      monthlyUsedUsd: 40,
    }).reason,
    'allowance_exhausted',
  );
});

Deno.test('OpenCode Go fails closed when any usage window is absent', () => {
  assertEquals(
    decide({
      provider: 'opencode_go',
      capturedAt,
      rollingFiveHoursUsedUsd: 1,
      weeklyUsedUsd: 2,
    }).reason,
    'usage_unproven',
  );
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
  const decision = decide({
    provider: 'opencode_go',
    capturedAt,
    rollingFiveHoursUsedUsd: 10,
    weeklyUsedUsd: 20,
    monthlyUsedUsd: 40,
  }, 0.9);
  assertEquals(decision.allowed, true);
  assertEquals(decision.warning, true);
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
