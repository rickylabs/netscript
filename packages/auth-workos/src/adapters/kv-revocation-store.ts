import type { AtomicCheck, AtomicMutation, KvKey } from '@netscript/kv';
import type {
  WorkosRevocationDelivery,
  WorkosRevocationJob,
  WorkosRevocationRetention,
  WorkosRevocationStore,
} from '../ports/revocation-store.ts';

interface SubjectFence {
  readonly revokedAt: string;
  readonly jobId: string;
  readonly pending: boolean;
}

interface SessionTombstone {
  readonly jobId: string;
  readonly expiresAt?: number;
}

/**
 * Create a durable WorkOS fence/outbox on the host's existing atomic KV store.
 *
 * Fence and job are committed together. Deliveries are at least once; checkpoints use CAS.
 * Session tombstones expire one maximum token lifetime plus clock skew after upstream success.
 * Incomplete revocations retain their tombstones and durable subject fence.
 */
export function createWorkosRevocationStore(
  kv: import('@netscript/kv').KvStore,
  retention: WorkosRevocationRetention = {},
): WorkosRevocationStore {
  const lifetime = retention.maxAccessTokenLifetimeMs ?? 86_400_000;
  const skew = retention.clockSkewMs ?? 60_000;
  if (
    !Number.isSafeInteger(lifetime) || lifetime <= 0 || !Number.isSafeInteger(skew) || skew < 0 ||
    !Number.isSafeInteger(lifetime + skew)
  ) {
    throw new RangeError(
      'WorkOS revocation retention requires a positive lifetime and nonnegative skew.',
    );
  }
  const now = retention.now ?? Date.now;
  if (!kv.atomic) throw new TypeError('WorkOS revocation requires atomic KV.');
  const atomic = kv.atomic.bind(kv);
  const prefix = ['auth-workos', 'revocation'];
  const fenceKey = (subject: string): KvKey => [...prefix, 'subject', subject];
  // Colons delimit Redis key parts; a compact ISO string preserves lexical time order.
  const dueKey = (time: number): string => new Date(time).toISOString().replaceAll(':', '');
  const jobKey = (job: WorkosRevocationJob): KvKey => [
    ...prefix,
    'pending',
    dueKey(job.dueAt),
    job.id,
  ];
  const repairKey = (jobId: string, sessionId: string): KvKey => [
    ...prefix,
    'repair',
    jobId,
    sessionId,
  ];

  async function confirm(subject: string, sessionId: string, jobId: string): Promise<void> {
    const key: KvKey = [...prefix, 'session', subject, sessionId];
    const entry = await kv.get<SessionTombstone>(key);
    if (!entry || entry.value.jobId !== jobId) {
      const result = await atomic([{ key, versionstamp: entry?.versionstamp ?? null }], [
        { type: 'delete', key: repairKey(jobId, sessionId) },
      ]);
      if (!result.ok) throw new Error('WorkOS tombstone repair contention; replay required.');
      return;
    }
    const expiresAt = entry.value.expiresAt ?? now() + lifetime + skew;
    const expireIn = Math.max(1, expiresAt - now());
    const result = await atomic([{ key, versionstamp: entry.versionstamp }], [{
      type: 'set',
      key,
      value: { ...entry.value, expiresAt },
      expireIn,
    }, { type: 'delete', key: repairKey(jobId, sessionId) }]);
    if (!result.ok) throw new Error('WorkOS tombstone retention contention; replay required.');
  }

  return {
    clockSkewMs: skew,
    async revokeSubject(subject, revokedAt): Promise<WorkosRevocationJob> {
      if (!subject || !Number.isFinite(Date.parse(revokedAt))) {
        throw new TypeError('WorkOS revocation requires a subject and valid cutoff.');
      }
      const key = fenceKey(subject);
      const id = crypto.randomUUID();
      for (let attempt = 0; attempt < 8; attempt++) {
        const previous = await kv.get<SubjectFence>(key);
        const cutoff = new Date(Math.max(
          Date.parse(revokedAt),
          Date.parse(previous?.value.revokedAt ?? revokedAt),
        )).toISOString();
        const job: WorkosRevocationJob = {
          id,
          subject,
          revokedAt: cutoff,
          dueAt: Date.parse(cutoff),
          attempt: 0,
        };
        const committed = await atomic([{ key, versionstamp: previous?.versionstamp ?? null }], [
          { type: 'set', key, value: { revokedAt: cutoff, jobId: id, pending: true } },
          { type: 'set', key: jobKey(job), value: job },
        ]);
        if (committed.ok) return job;
      }
      throw new Error('WorkOS subject revocation contention budget exceeded.');
    },
    async isRevoked(subject, sessionId, issuedAt, expiresAt): Promise<boolean> {
      const fence = await kv.get<SubjectFence>(fenceKey(subject));
      if (!fence) return false;
      // Verified credentials exceeding the retention bound must never outlive a tombstone.
      if (
        expiresAt !== undefined && (!Number.isFinite(expiresAt) || issuedAt === undefined ||
          expiresAt <= issuedAt || expiresAt - issuedAt > lifetime)
      ) return true;
      // Fail closed through the cleanup window: a refresh can issue a newer JWT for an old sid.
      if (
        fence.value.pending || !sessionId || issuedAt === undefined || !Number.isFinite(issuedAt)
      ) {
        return true;
      }
      if (issuedAt <= Date.parse(fence.value.revokedAt)) return true;
      const tombstone = await kv.get<SessionTombstone>([...prefix, 'session', subject, sessionId]);
      return tombstone !== null &&
        (tombstone.value.expiresAt === undefined || tombstone.value.expiresAt > now());
    },
    async nextDelivery(now): Promise<WorkosRevocationDelivery | undefined> {
      let selected: WorkosRevocationDelivery | undefined;
      for await (
        const entry of kv.list<WorkosRevocationJob>({
          prefix: [...prefix, 'pending'],
          end: [...prefix, 'pending', dueKey(now + 1), ''],
          limit: 50,
        })
      ) {
        if (entry.value.dueAt <= now && (!selected || entry.value.dueAt < selected.job.dueAt)) {
          selected = { job: entry.value, versionstamp: entry.versionstamp };
        }
      }
      return selected;
    },
    async revokeSession(subject, sessionId, jobId): Promise<void> {
      const result = await atomic([], [
        { type: 'set', key: [...prefix, 'session', subject, sessionId], value: { jobId } },
        { type: 'set', key: repairKey(jobId, sessionId), value: sessionId },
      ]);
      if (!result.ok) throw new Error('WorkOS tombstone commit failed; replay required.');
    },
    confirmSessionRevoked: confirm,
    async checkpoint(delivery, next): Promise<boolean> {
      const key = jobKey(delivery.job);
      const checks: AtomicCheck[] = [{ key, versionstamp: delivery.versionstamp }];
      const mutations: AtomicMutation[] = [{ type: 'delete', key }];
      if (!next) {
        // If upstream success was followed by a KV failure, the provider may omit that session on
        // replay. Repair retained tombstones before admitting fresh credentials, in bounded pages.
        let count = 0;
        for await (
          const entry of kv.list<string>({
            prefix: [...prefix, 'repair', delivery.job.id],
            limit: 50,
          })
        ) {
          await confirm(delivery.job.subject, entry.value, delivery.job.id);
          count++;
        }
        if (count === 50) {
          next = { ...delivery.job, tombstoneAfter: 'repair', attempt: 0, dueAt: now() };
        }
      }
      if (next) {
        mutations.push({ type: 'set', key: jobKey(next), value: next });
      } else {
        const subjectKey = fenceKey(delivery.job.subject);
        const fence = await kv.get<SubjectFence>(subjectKey);
        if (fence?.value.jobId === delivery.job.id) {
          checks.push({ key: subjectKey, versionstamp: fence.versionstamp });
          mutations.push({
            type: 'set',
            key: subjectKey,
            value: { ...fence.value, pending: false },
          });
        }
      }
      return (await atomic(checks, mutations)).ok;
    },
  };
}
