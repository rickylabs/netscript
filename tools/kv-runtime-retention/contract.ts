/** Operator policy mirrors configured saga completedDays and trigger kvDays. */
export type RetentionBackfillPolicy = Readonly<{
  sagas: Readonly<{ defaultDays: number; bySaga?: Readonly<Record<string, number>> }>;
  triggers: Readonly<{ defaultDays: number; byTrigger?: Readonly<Record<string, number>> }>;
}>;

/** Validate all policy entries before touching either runtime store. */
export function readBackfillPolicy(value: unknown): RetentionBackfillPolicy {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Expected retention policy.');
  }
  const policy = value as Record<string, unknown>;
  const sagas = readSection(policy.sagas, 'bySaga');
  const triggers = readSection(policy.triggers, 'byTrigger');
  return {
    sagas: { defaultDays: sagas.defaultDays, bySaga: sagas.overrides },
    triggers: { defaultDays: triggers.defaultDays, byTrigger: triggers.overrides },
  };
}

function readSection(value: unknown, overrideKey: string): {
  defaultDays: number;
  overrides: Readonly<Record<string, number>>;
} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Missing policy section.');
  }
  const section = value as Record<string, unknown>;
  const overrides = section[overrideKey] ?? {};
  if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
    throw new TypeError('Retention overrides must be an object.');
  }
  const days = [section.defaultDays, ...Object.values(overrides)];
  if (days.some((day) => typeof day !== 'number' || !Number.isFinite(day) || day <= 0)) {
    throw new RangeError('Every retention policy must be positive finite days.');
  }
  return {
    defaultDays: section.defaultDays as number,
    overrides: overrides as Record<string, number>,
  };
}
