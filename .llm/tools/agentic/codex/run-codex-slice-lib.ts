import type { CodexFailure } from './classify-codex-failure.ts';

export interface SliceBudgets {
  readonly maxTurns: number;
  readonly maxWallClockMs: number;
  readonly baseBackoffMs: number;
  readonly maxBackoffMs: number;
}

export const DEFAULT_SLICE_BUDGETS: SliceBudgets = {
  maxTurns: 12,
  maxWallClockMs: 3_600_000,
  baseBackoffMs: 15_000,
  maxBackoffMs: 300_000,
};

export type DoneContract =
  | { readonly state: 'done' }
  | { readonly state: 'blocked'; readonly reason: string }
  | { readonly state: 'running' };

/** Parses only the final non-empty response line as the slice terminal contract. */
export function parseDoneContract(reply: string): DoneContract {
  const line = reply.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).at(-1) ?? '';
  if (line === 'DONE') return { state: 'done' };
  const blocked = line.match(/^BLOCKED:\s+(.+)$/);
  return blocked ? { state: 'blocked', reason: blocked[1].trim() } : { state: 'running' };
}

/** Computes the retry delay for a classified provider failure. */
export function computeBackoff(
  failure: CodexFailure,
  quotaEventIndex: number,
  nowMs: number,
  baseMs: number = DEFAULT_SLICE_BUDGETS.baseBackoffMs,
  maxMs: number = DEFAULT_SLICE_BUDGETS.maxBackoffMs,
): number | null {
  if (failure.kind === 'other') return null;
  if (failure.kind === 'quota_exhausted' && failure.resetAt) {
    const resetMs = Date.parse(failure.resetAt);
    if (Number.isFinite(resetMs)) return Math.max(0, resetMs - nowMs);
  }
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, quotaEventIndex));
}

/** Clamps a requested sleep to the remaining wall-clock budget. */
export function remainingBudgetDelay(
  requestedMs: number,
  elapsedMs: number,
  maxMs: number,
): number {
  return Math.max(0, Math.min(requestedMs, maxMs - elapsedMs));
}
