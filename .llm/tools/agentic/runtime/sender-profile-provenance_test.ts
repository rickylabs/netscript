import { assert, assertEquals, assertRejects } from '@std/assert';
import { LocalSenderLeaseRepairAdapter } from './adapters/local-sender-lease-repair-adapter.ts';
import {
  LocalSenderOwnershipAdapter,
  parseSenderOwnershipRecord,
} from './adapters/local-sender-ownership-adapter.ts';
import {
  activateSenderOwnership,
  classifySenderLeaseStaleness,
  newSenderOwnershipRecord,
  type SenderOwnershipRecord,
} from './sender-ownership.ts';

const sessionId = '019f4b72-2ea4-7050-917e-6d6918371265';

async function activeRecord(
  ownership: LocalSenderOwnershipAdapter,
  worktree: string,
  profileHome?: string,
): Promise<SenderOwnershipRecord> {
  const launching = newSenderOwnershipRecord({
    worktree,
    ownerPid: 91751,
    leaseToken: crypto.randomUUID(),
    now: '2026-08-31T10:00:00.000Z',
    profileHome,
  });
  const active = activateSenderOwnership(
    launching,
    launching.leaseToken,
    sessionId,
    '2026-08-31T10:01:00.000Z',
  );
  assert(await ownership.create(active));
  return active;
}

async function writeInactiveRollout(profileHome: string, worktree: string): Promise<void> {
  const sessionRoot = `${profileHome}/sessions`;
  await Deno.mkdir(sessionRoot, { recursive: true });
  await Deno.writeTextFile(
    `${sessionRoot}/rollout-2026-08-31-${sessionId}.jsonl`,
    `${JSON.stringify({ type: 'session_meta', payload: { id: sessionId, cwd: worktree } })}\n${
      JSON.stringify({ type: 'event_msg', payload: { type: 'task_started' } })
    }\n${JSON.stringify({ type: 'event_msg', payload: { type: 'task_complete' } })}\n`,
  );
}

async function observeFromRecordedProfile(profileKind: 'production' | 'isolated'): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: `netscript-profile-${profileKind}-` });
  try {
    const ownership = new LocalSenderOwnershipAdapter(`${root}/senders`);
    const worktree = `${root}/worktree`;
    const profileHome = profileKind === 'production'
      ? `${root}/home/.codex`
      : `${root}/profiles/isolated-codex-home`;
    const record = await activeRecord(ownership, worktree, profileHome);
    assertEquals((await ownership.read(worktree))?.profileHome, profileHome);
    await writeInactiveRollout(profileHome, worktree);
    const adapter = new LocalSenderLeaseRepairAdapter({
      ownership,
      evidenceDirectory: `${root}/evidence`,
      processAlive: () => false,
      debounce: () => Promise.resolve(),
      readThread: () => Promise.resolve({ state: 'idle' }),
    });

    const observation = await adapter.observe(worktree, record);

    assertEquals(observation.rollout.provenance, 'matched');
    assertEquals(observation.rollout.sessionId, sessionId);
    assertEquals(observation.thread.provenance, 'matched');
    assertEquals(classifySenderLeaseStaleness(worktree, observation), 'stale');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('production profile provenance resolves the recorded default CODEX_HOME', async () => {
  await observeFromRecordedProfile('production');
});

Deno.test('isolated profile provenance resolves its own CODEX_HOME rather than the default', async () => {
  await observeFromRecordedProfile('isolated');
});

Deno.test('legacy records load but missing profile provenance fails closed without probing default', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-profile-legacy-' });
  try {
    const ownership = new LocalSenderOwnershipAdapter(`${root}/senders`);
    const worktree = `${root}/worktree`;
    const record = await activeRecord(ownership, worktree);
    const parsed = parseSenderOwnershipRecord(JSON.parse(JSON.stringify(record)));
    assertEquals(parsed.profileHome, undefined);
    let threadProbes = 0;
    const adapter = new LocalSenderLeaseRepairAdapter({
      ownership,
      evidenceDirectory: `${root}/evidence`,
      processAlive: () => false,
      debounce: () => Promise.resolve(),
      readThread: () => {
        threadProbes++;
        return Promise.resolve({ state: 'idle' });
      },
    });

    const observation = await adapter.observe(worktree, parsed);

    assertEquals(threadProbes, 0);
    assertEquals(observation.rollout, { state: 'unknown', provenance: 'unknown' });
    assertEquals(observation.thread.state, 'unknown');
    assertEquals(classifySenderLeaseStaleness(worktree, observation), 'indeterminate');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('apply-time profile provenance changes abort as an ownership mismatch', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-profile-race-' });
  try {
    const ownership = new LocalSenderOwnershipAdapter(`${root}/senders`);
    const worktree = `${root}/worktree`;
    const record = await activeRecord(ownership, worktree, `${root}/profiles/original`);
    await ownership.replace(
      { ...record, profileHome: `${root}/profiles/replacement` },
      record.leaseToken,
    );
    const adapter = new LocalSenderLeaseRepairAdapter({
      ownership,
      evidenceDirectory: `${root}/evidence`,
      processAlive: () => false,
      debounce: () => Promise.resolve(),
    });

    await assertRejects(
      () => adapter.observe(worktree, record),
      Error,
      'sender lease mismatch',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
