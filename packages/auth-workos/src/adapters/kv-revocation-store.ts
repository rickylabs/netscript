import type { AtomicCheck, AtomicMutation, KvKey, KvStore } from '@netscript/kv';
import type {
  WorkosRevocationDelivery,
  WorkosRevocationJob,
  WorkosRevocationStore,
} from '../ports/revocation-store.ts';

interface SubjectFence {
  readonly revokedAt: string;
  readonly jobId: string;
  readonly pending: boolean;
}

/**
 * Create a durable WorkOS fence/outbox on the host's existing atomic KV store.
 *
 * Fence and job are committed together. Deliveries are at least once; checkpoints use CAS.
 * No record has a TTL: still-unexpired access tokens must never outlive their tombstone.
 */
export function createWorkosRevocationStore(kv: KvStore): WorkosRevocationStore {
  if (!kv.atomic) throw new TypeError('WorkOS revocation requires atomic KV.');
  const atomic = kv.atomic.bind(kv);
  const prefix = ['auth-workos', 'revocation'];
  const fenceKey = (subject: string): KvKey => [...prefix, 'subject', subject];
  const jobKey = (job: WorkosRevocationJob): KvKey => [...prefix, 'pending', job.dueAt, job.id];

  return {
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
    async isRevoked(subject, sessionId, issuedAt): Promise<boolean> {
      const fence = await kv.get<SubjectFence>(fenceKey(subject));
      if (!fence) return false;
      // Fail closed through the cleanup window: a refresh can issue a newer JWT for an old sid.
      if (
        fence.value.pending || !sessionId || issuedAt === undefined || !Number.isFinite(issuedAt)
      ) {
        return true;
      }
      if (issuedAt <= Date.parse(fence.value.revokedAt)) return true;
      return await kv.has([...prefix, 'session', subject, sessionId]);
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
    async revokeSession(subject, sessionId): Promise<void> {
      await kv.set([...prefix, 'session', subject, sessionId], true);
    },
    async checkpoint(delivery, next): Promise<boolean> {
      const key = jobKey(delivery.job);
      const checks: AtomicCheck[] = [{ key, versionstamp: delivery.versionstamp }];
      const mutations: AtomicMutation[] = [{ type: 'delete', key }];
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
    async fail(delivery, reason): Promise<boolean> {
      const key = jobKey(delivery.job);
      return (await atomic([{ key, versionstamp: delivery.versionstamp }], [
        { type: 'delete', key },
        {
          type: 'set',
          key: [...prefix, 'failed', delivery.job.id],
          value: { ...delivery.job, reason },
        },
      ])).ok;
    },
  };
}
