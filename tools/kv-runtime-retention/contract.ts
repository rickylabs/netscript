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
  const policy = value as RetentionBackfillPolicy;
  for (const section of [policy.sagas, policy.triggers]) {
    if (typeof section !== 'object' || section === null) {
      throw new TypeError('Missing policy section.');
    }
    const days = [
      section.defaultDays,
      ...Object.values(
        'bySaga' in section
          ? section.bySaga ?? {}
          : 'byTrigger' in section
          ? section.byTrigger ?? {}
          : {},
      ),
    ];
    if (days.some((day) => typeof day !== 'number' || !Number.isFinite(day) || day <= 0)) {
      throw new RangeError('Every retention policy must be positive finite days.');
    }
  }
  return policy;
}
