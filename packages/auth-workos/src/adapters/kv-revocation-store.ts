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
  const jobKey = (job: WorkosRevocationJob): KvKey => [...prefix, 'pending', job.dueAt, job.id];

  async function confirm(subject: string, sessionId: string, jobId: string): Promise<void> {
    const key: KvKey = [...prefix, 'session', subject, sessionId];
    const entry = await kv.get<SessionTombstone>(key);
    if (!entry || entry.value.jobId !== jobId || entry.value.expiresAt !== undefined) return;
    const expireIn = lifetime + skew;
    const result = await atomic([{ key, versionstamp: entry.versionstamp }], [{
      type: 'set',
      key,
      value: { ...entry.value, expiresAt: now() + expireIn },
      expireIn,
    }]);
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
      for await (
        const entry of kv.list<WorkosRevocationJob>({
          prefix: [...prefix, 'pending'],
          limit: 1,
        })
      ) {
        return entry.value.dueAt <= now
          ? { job: entry.value, versionstamp: entry.versionstamp }
          : undefined;
      }
      return undefined;
    },
    async revokeSession(subject, sessionId, jobId): Promise<void> {
      await kv.set([...prefix, 'session', subject, sessionId], { jobId });
    },
    confirmSessionRevoked: confirm,
    async checkpoint(delivery, next): Promise<boolean> {
      const key = jobKey(delivery.job);
      const checks: AtomicCheck[] = [{ key, versionstamp: delivery.versionstamp }];
      const mutations: AtomicMutation[] = [{ type: 'delete', key }];
      if (!next) {
        // If upstream success was followed by a KV failure, the provider may omit that session on
        // replay. Repair retained tombstones before admitting fresh credentials, in bounded pages.
        const sessionPrefix: KvKey = [...prefix, 'session', delivery.job.subject];
        let count = 0;
        let last: string | undefined;
        for await (
          const entry of kv.list<SessionTombstone>({
            prefix: sessionPrefix,
            start: delivery.job.tombstoneAfter
              ? [...sessionPrefix, delivery.job.tombstoneAfter]
              : undefined,
            limit: 51,
          })
        ) {
          const sessionId = entry.key.at(-1);
          if (typeof sessionId !== 'string') throw new Error('Invalid WorkOS tombstone key.');
          if (sessionId === delivery.job.tombstoneAfter) continue;
          if (entry.value.jobId === delivery.job.id && entry.value.expiresAt === undefined) {
            await confirm(delivery.job.subject, sessionId, delivery.job.id);
          }
          last = sessionId;
          if (++count === 50) break;
        }
        if (count === 50) {
          next = { ...delivery.job, tombstoneAfter: last, attempt: 0, dueAt: now() };
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
