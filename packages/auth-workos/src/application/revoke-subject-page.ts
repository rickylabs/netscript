import type {
  WorkosRevocationClient,
  WorkosRevocationDelivery,
  WorkosRevocationStore,
} from '../ports/revocation-store.ts';

/**
 * Execute one upstream page, persist its tombstones, then checkpoint the durable job.
 *
 * At most `pageSize` sequential revocations and one list call per delivery. Throws on upstream
 * failure so the worker supervisor can retry; a crash replays the page safely. Sessions created
 * after the logout cutoff and sessions of another subject are never revoked.
 */
export async function revokeWorkosSubjectPage(
  store: WorkosRevocationStore,
  workos: WorkosRevocationClient,
  delivery: WorkosRevocationDelivery,
  signal: AbortSignal,
  pageSize = 50,
): Promise<void> {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError('WorkOS pageSize must be an integer from 1 to 100.');
  }
  signal.throwIfAborted();
  const { job } = delivery;
  const page = await workos.userManagement.listSessions(job.subject, {
    limit: pageSize,
    after: job.after,
    order: 'asc',
  });
  signal.throwIfAborted();
  if (page.data.length > pageSize) throw new Error('WorkOS exceeded the bounded page size.');
  const after = page.listMetadata.after ?? undefined;
  if (after && after === job.after) throw new Error('WorkOS pagination cursor did not advance.');
  for (const session of page.data) {
    signal.throwIfAborted();
    if (session.userId !== job.subject) {
      throw new Error('WorkOS returned a foreign subject session.');
    }
    const createdAt = Date.parse(session.createdAt);
    if (!Number.isFinite(createdAt)) {
      throw new Error('WorkOS returned an invalid session creation time.');
    }
    if (createdAt > Date.parse(job.revokedAt)) continue;
    await store.revokeSession(job.subject, session.id);
    signal.throwIfAborted();
    await workos.userManagement.revokeSession({ sessionId: session.id });
  }
  signal.throwIfAborted();
  await store.checkpoint(delivery, after ? { ...job, after, attempt: 0 } : undefined);
}
