import { CODEX_FAILURE_PATTERNS } from '../config/codex-failure-patterns.ts';

export type CodexFailure =
  | { readonly kind: 'quota_exhausted'; readonly resetAt?: string }
  | { readonly kind: 'model_capacity' }
  | { readonly kind: 'other'; readonly raw: string };

function nextLocalOccurrence(
  hourText: string,
  minuteText: string,
  meridiem: string | undefined,
  now: Date,
): string | undefined {
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59) return undefined;
  if (meridiem) {
    if (hour < 1 || hour > 12) return undefined;
    hour = hour % 12 + (meridiem.toLowerCase() === 'pm' ? 12 : 0);
  } else if (hour > 23) return undefined;

  // Codex reports no offset or date. Interpret it in the host's local timezone and choose the
  // next occurrence, rolling to tomorrow when today's clock time has already passed.
  const reset = new Date(now);
  reset.setHours(hour, minute, 0, 0);
  if (reset.getTime() <= now.getTime()) reset.setDate(reset.getDate() + 1);
  return reset.toISOString();
}

/** Classifies bounded Codex process output into the supervisor's failure vocabulary. */
export function classifyCodexFailure(
  output: string,
  now: Date = new Date(),
): CodexFailure {
  if (CODEX_FAILURE_PATTERNS.quotaExhausted.test(output)) {
    const time = output.match(CODEX_FAILURE_PATTERNS.resetTime);
    const resetAt = time ? nextLocalOccurrence(time[1], time[2], time[3], now) : undefined;
    return resetAt ? { kind: 'quota_exhausted', resetAt } : { kind: 'quota_exhausted' };
  }
  if (CODEX_FAILURE_PATTERNS.modelCapacity.test(output)) return { kind: 'model_capacity' };
  return { kind: 'other', raw: output };
}

/** Classifies only error-bearing rollout records, excluding quoted prompts and normal messages. */
export function classifyCodexRolloutFailure(
  rollout: string,
  now: Date = new Date(),
): CodexFailure {
  const errors: string[] = [];
  for (const line of rollout.split('\n')) {
    try {
      const record = JSON.parse(line) as Record<string, unknown>;
      const payload = record.payload as Record<string, unknown> | undefined;
      const type = typeof payload?.type === 'string' ? payload.type : record.type;
      if (type !== 'error' && type !== 'turn_aborted') continue;
      const message = payload?.message ?? payload?.reason ?? record.message ?? record.reason;
      if (typeof message === 'string') errors.push(message);
    } catch {
      // A bounded tail may start mid-record; malformed/non-JSON lines carry no trusted record type.
    }
  }
  return classifyCodexFailure(errors.join('\n'), now);
}
