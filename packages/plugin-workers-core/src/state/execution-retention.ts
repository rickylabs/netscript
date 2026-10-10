import type { RegistryKvStore } from '../registry/registry-options.ts';

type RetainedExecution = Readonly<{ jobId: string; status: string; completedAt: string | null }>;

/** Internal policy shared by execution state and the registry's execution write port. */
export async function executionRetentionRemaining(
  record: RetainedExecution,
  kv: RegistryKvStore,
  now: Date,
  overrideDays?: number,
  policyCache?: Map<string, number>,
): Promise<number | undefined> {
  if (
    !['completed', 'failed', 'cancelled', 'timeout'].includes(record.status) ||
    record.completedAt === null
  ) return undefined;
  const completedAt = Date.parse(record.completedAt);
  if (!Number.isFinite(completedAt)) return undefined;
  const cachedDays = overrideDays ?? policyCache?.get(record.jobId);
  const job = cachedDays === undefined
    ? await kv.get<{ retention?: { kvRetentionDays?: number } }>(['workers', 'jobs', record.jobId])
    : null;
  const days = cachedDays ?? job?.value?.retention?.kvRetentionDays ?? 3;
  policyCache?.set(record.jobId, days);
  validateRetentionDays(days);
  return completedAt + days * 86_400_000 - now.getTime();
}

/** Invalid explicit retention cannot silently create an immortal execution record. */
export function validateRetentionDays(days: number): void {
  if (!Number.isFinite(days) || days <= 0) {
    throw new RangeError('Worker kvRetentionDays must be positive and finite.');
  }
}
