import {
  activateSenderOwnership,
  classifySenderLeaseStaleness,
  decideSenderOwnership,
  newSenderOwnershipRecord,
  SENDER_PID_DEBOUNCE_MS,
  type SenderLeaseStaleness,
  type SenderLeaseStalenessObservation,
} from './sender-ownership.ts';
import {
  LocalSenderOwnershipAdapter,
  parseSenderOwnershipRecord,
} from './adapters/local-sender-ownership-adapter.ts';
import { assert, assertEquals } from '@std/assert';

const worktree = '/home/codex/repos/worktree';
const now = '2026-07-10T20:00:00.000Z';

function staleCandidate(): SenderLeaseStalenessObservation {
  const launching = newSenderOwnershipRecord({
    worktree,
    ownerPid: 40,
    leaseToken: 'lease-stale-candidate',
    now,
  });
  return {
    record: activateSenderOwnership(
      launching,
      launching.leaseToken,
      'thread-stale-candidate',
      now,
    ),
    pid: {
      first: 'dead',
      second: 'dead',
      elapsedMs: SENDER_PID_DEBOUNCE_MS,
    },
    rollout: {
      state: 'idle',
      provenance: 'matched',
      sessionId: 'thread-stale-candidate',
      worktree,
    },
    thread: {
      state: 'idle',
      provenance: 'matched',
      sessionId: 'thread-stale-candidate',
    },
  };
}

interface StalenessCase {
  readonly name: string;
  readonly targetWorktree?: string;
  readonly observation: SenderLeaseStalenessObservation;
  readonly expected: SenderLeaseStaleness;
}

const fullConjunctionCases: readonly StalenessCase[] = [
  {
    name: 'debounced dead PID plus exact terminal rollout plus inactive thread is stale',
    observation: staleCandidate(),
    expected: 'stale',
  },
  {
    name: 'proven absence in the matching session provenance is stale',
    observation: {
      ...staleCandidate(),
      rollout: { state: 'absent', provenance: 'matched' },
      thread: { state: 'absent', provenance: 'matched' },
    },
    expected: 'stale',
  },
  {
    name: 'dead rollout plus not-loaded thread in matching provenance is stale',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, state: 'dead' },
      thread: { ...staleCandidate().thread, state: 'not_loaded' },
    },
    expected: 'stale',
  },
  {
    name: 'refused rollout plus absent thread in matching provenance is stale',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, state: 'refused' },
      thread: { state: 'absent', provenance: 'matched' },
    },
    expected: 'stale',
  },
];

const preservingCases: readonly StalenessCase[] = [
  {
    name: 'debounced dead PID alone preserves',
    observation: {
      ...staleCandidate(),
      rollout: {
        ...staleCandidate().rollout,
        state: 'working',
      },
      thread: {
        ...staleCandidate().thread,
        state: 'active',
      },
    },
    expected: 'preserve',
  },
  {
    name: 'terminal rollout alone preserves',
    observation: {
      ...staleCandidate(),
      pid: { first: 'alive', second: 'alive', elapsedMs: SENDER_PID_DEBOUNCE_MS },
      thread: { ...staleCandidate().thread, state: 'active' },
    },
    expected: 'preserve',
  },
  {
    name: 'inactive thread alone preserves',
    observation: {
      ...staleCandidate(),
      pid: { first: 'alive', second: 'alive', elapsedMs: SENDER_PID_DEBOUNCE_MS },
      rollout: { ...staleCandidate().rollout, state: 'working' },
    },
    expected: 'preserve',
  },
  {
    name: 'either alive PID sample preserves',
    observation: {
      ...staleCandidate(),
      pid: { first: 'dead', second: 'alive', elapsedMs: SENDER_PID_DEBOUNCE_MS },
    },
    expected: 'preserve',
  },
  {
    name: 'working rollout preserves',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, state: 'working' },
    },
    expected: 'preserve',
  },
  {
    name: 'stalled rollout preserves',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, state: 'stalled' },
    },
    expected: 'preserve',
  },
  {
    name: 'active thread writer preserves',
    observation: {
      ...staleCandidate(),
      thread: { ...staleCandidate().thread, state: 'active' },
    },
    expected: 'preserve',
  },
];

const indeterminateCases: readonly StalenessCase[] = [
  {
    name: 'unknown PID evidence is indeterminate',
    observation: {
      ...staleCandidate(),
      pid: { first: 'dead', second: 'unknown', elapsedMs: SENDER_PID_DEBOUNCE_MS },
    },
    expected: 'indeterminate',
  },
  {
    name: 'unknown rollout evidence is indeterminate',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, state: 'unknown' },
    },
    expected: 'indeterminate',
  },
  {
    name: 'unknown thread evidence is indeterminate',
    observation: {
      ...staleCandidate(),
      thread: { ...staleCandidate().thread, state: 'unknown' },
    },
    expected: 'indeterminate',
  },
  {
    name: 'foreign ownership record is indeterminate',
    targetWorktree: '/home/codex/repos/foreign-worktree',
    observation: staleCandidate(),
    expected: 'indeterminate',
  },
  {
    name: 'unbound rollout provenance is indeterminate',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, provenance: 'unknown' },
    },
    expected: 'indeterminate',
  },
  {
    name: 'mismatched thread provenance is indeterminate',
    observation: {
      ...staleCandidate(),
      thread: { ...staleCandidate().thread, provenance: 'mismatched' },
    },
    expected: 'indeterminate',
  },
  {
    name: 'rollout identity mismatch is indeterminate',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, sessionId: 'another-thread' },
    },
    expected: 'indeterminate',
  },
  {
    name: 'rollout worktree mismatch is indeterminate',
    observation: {
      ...staleCandidate(),
      rollout: { ...staleCandidate().rollout, worktree: '/home/codex/repos/another-worktree' },
    },
    expected: 'indeterminate',
  },
  {
    name: 'thread identity mismatch is indeterminate',
    observation: {
      ...staleCandidate(),
      thread: { ...staleCandidate().thread, sessionId: 'another-thread' },
    },
    expected: 'indeterminate',
  },
  {
    name: 'launching ownership without session identity is indeterminate',
    observation: {
      ...staleCandidate(),
      record: newSenderOwnershipRecord({
        worktree,
        ownerPid: 40,
        leaseToken: 'lease-launching',
        now,
      }),
    },
    expected: 'indeterminate',
  },
  {
    name: 'two dead PID samples without the debounce interval are indeterminate',
    observation: {
      ...staleCandidate(),
      pid: { first: 'dead', second: 'dead', elapsedMs: SENDER_PID_DEBOUNCE_MS - 1 },
    },
    expected: 'indeterminate',
  },
  {
    name: 'rollout absence with a present thread is indeterminate',
    observation: {
      ...staleCandidate(),
      rollout: { state: 'absent', provenance: 'matched' },
    },
    expected: 'indeterminate',
  },
];

for (const testCase of [...fullConjunctionCases, ...preservingCases, ...indeterminateCases]) {
  Deno.test(`sender lease staleness: ${testCase.name}`, () => {
    assertEquals(
      classifySenderLeaseStaleness(testCase.targetWorktree ?? worktree, testCase.observation),
      testCase.expected,
    );
  });
}

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
