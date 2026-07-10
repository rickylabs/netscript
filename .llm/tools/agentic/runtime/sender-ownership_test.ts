import {
  activateSenderOwnership,
  decideSenderOwnership,
  newSenderOwnershipRecord,
} from './sender-ownership.ts';
import {
  LocalSenderOwnershipAdapter,
  parseSenderOwnershipRecord,
} from './adapters/local-sender-ownership-adapter.ts';
import { assert } from '@std/assert';

const worktree = '/home/codex/repos/worktree';
const now = '2026-07-10T20:00:00.000Z';

Deno.test('live sender ownership deterministically blocks a rival and directs resume', () => {
  const launching = newSenderOwnershipRecord({
    worktree,
    ownerPid: 41,
    leaseToken: 'lease-a',
    now,
  });
  const active = activateSenderOwnership(launching, 'lease-a', 'thread-1', now);
  const decision = decideSenderOwnership(worktree, {
    record: active,
    ownerProcessAlive: true,
    sessionActive: true,
  });
  assert(decision.kind === 'blocked');
  assert(decision.diagnostic.code === 'duplicate_sender_risk');
  assert(decision.diagnostic.operatorAction === 'resume existing session thread-1');
});

Deno.test('age never makes a live owner stale and dead evidence permits reclaim', () => {
  const record = newSenderOwnershipRecord({
    worktree,
    ownerPid: 42,
    leaseToken: 'lease-old',
    now: '2000-01-01T00:00:00.000Z',
  });
  assert(
    decideSenderOwnership(worktree, {
      record,
      ownerProcessAlive: true,
      sessionActive: false,
    }).kind === 'blocked',
  );
  assert(
    decideSenderOwnership(worktree, {
      record,
      ownerProcessAlive: false,
      sessionActive: false,
    }).kind === 'stale',
  );
});

Deno.test('atomic local create permits exactly one sender and stores no payload fields', async () => {
  const directory = await Deno.makeTempDir();
  try {
    const adapter = new LocalSenderOwnershipAdapter(directory);
    const first = newSenderOwnershipRecord({
      worktree,
      ownerPid: 43,
      leaseToken: 'lease-first',
      now,
    });
    const rival = newSenderOwnershipRecord({
      worktree,
      ownerPid: 44,
      leaseToken: 'lease-rival',
      now,
    });
    const results = await Promise.all([adapter.create(first), adapter.create(rival)]);
    assert(results.filter(Boolean).length === 1, 'more than one atomic create succeeded');
    const stored = await adapter.read(worktree);
    assert(stored !== null);
    assert(!Object.hasOwn(stored, 'prompt'));
    assert(!Object.hasOwn(stored, 'credentials'));
    const active = activateSenderOwnership(stored, stored.leaseToken, 'thread-2', now);
    await adapter.replace(active, stored.leaseToken);
    assert((await adapter.read(worktree))?.sessionId === 'thread-2');
    await adapter.release(worktree, stored.leaseToken);
    assert(await adapter.read(worktree) === null);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('strict record parser rejects unknown fields and cross-worktree ownership conflicts', () => {
  const record = newSenderOwnershipRecord({ worktree, ownerPid: 45, leaseToken: 'lease', now });
  let rejected = false;
  try {
    parseSenderOwnershipRecord({ ...record, prompt: 'must-not-persist' });
  } catch {
    rejected = true;
  }
  assert(rejected, 'payload-bearing record was accepted');
  const decision = decideSenderOwnership('/home/codex/repos/other', {
    record,
    ownerProcessAlive: false,
    sessionActive: false,
  });
  assert(decision.kind === 'blocked');
  assert(decision.diagnostic.code === 'ownership_conflict');
});
