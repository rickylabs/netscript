import { assertEquals, assertRejects } from '@std/assert';
import {
  claimPhaseEvaluation,
  dispatchClaimedPhaseEvaluation,
  phaseEvalClaimRef,
  REFERENCE_ALREADY_EXISTS_MESSAGE,
} from './phase-eval-claim.mjs';

type ClaimKey = {
  generation: number;
  phase: 'plan' | 'impl';
  head: string;
};

const HEAD_A = 'a'.repeat(40);
const HEAD_B = 'b'.repeat(40);

function rendezvous(parties: number) {
  let arrivals = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => release = resolve);
  return async () => {
    arrivals += 1;
    if (arrivals === parties) release();
    await ready;
  };
}

function atomicRefOperations(waitAtCreate?: () => Promise<void>) {
  const refs = new Map<string, string>();
  return {
    refs,
    operations: {
      async createRef({ ref, sha }: { ref: string; sha: string }) {
        await waitAtCreate?.();
        if (refs.has(ref)) {
          throw {
            status: 422,
            response: { data: { message: REFERENCE_ALREADY_EXISTS_MESSAGE } },
          };
        }
        refs.set(ref, sha);
      },
      getRef({ ref }: { ref: string }) {
        const sha = refs.get(`refs/${ref}`);
        if (!sha) return Promise.reject(new Error(`Missing ref: ${ref}`));
        return Promise.resolve({ sha });
      },
      deleteRef({ ref }: { ref: string }) {
        if (!refs.delete(`refs/${ref}`)) return Promise.reject(new Error(`Missing ref: ${ref}`));
        return Promise.resolve();
      },
    },
  };
}

Deno.test('negative control: concurrent read-then-write claims both spend', async () => {
  const comments: string[] = [];
  const paidRuns: string[] = [];
  const waitAfterRead = rendezvous(2);

  async function brokenAttempt(id: string) {
    const existing = comments.includes('same-tuple');
    await waitAfterRead();
    if (existing) return false;
    comments.push('same-tuple');
    paidRuns.push(id);
    return true;
  }

  const outcomes = await Promise.all([brokenAttempt('one'), brokenAttempt('two')]);
  assertEquals(outcomes, [true, true]);
  assertEquals(comments.length, 2);
  assertEquals(paidRuns.length, 2);
  console.log('negative control: 2 concurrent attempts -> 2 trigger comments, 2 paid starts');
});

Deno.test('atomic claim: concurrent attempts on one tuple create one trigger and one spend', async () => {
  const key: ClaimKey = { generation: 1594001, phase: 'impl', head: HEAD_A };
  const { operations, refs } = atomicRefOperations(rendezvous(2));
  const comments: string[] = [];
  const paidRuns: string[] = [];

  async function attempt(id: string) {
    const outcome = await dispatchClaimedPhaseEvaluation(operations, key, () => {
      comments.push(id);
      paidRuns.push(id);
      return Promise.resolve(id);
    });
    return outcome.claimed
      ? { id, claimed: true, commented: true, spent: true }
      : { id, claimed: false, commented: false, spent: false };
  }

  const outcomes = await Promise.all([attempt('one'), attempt('two')]);
  assertEquals(outcomes.filter((outcome) => outcome.claimed).length, 1);
  assertEquals(outcomes.filter((outcome) => !outcome.claimed), [{
    id: outcomes.find((outcome) => !outcome.claimed)!.id,
    claimed: false,
    commented: false,
    spent: false,
  }]);
  assertEquals(comments.length, 1);
  assertEquals(paidRuns.length, 1);
  assertEquals(refs.size, 1);
  console.log('atomic claim: 2 concurrent attempts -> 1 trigger comment, loser paid starts=0');
});

Deno.test('atomic claim: head, phase, and generation each identify a distinct claim', async () => {
  const { operations, refs } = atomicRefOperations();
  const keys: ClaimKey[] = [
    { generation: 1594001, phase: 'impl', head: HEAD_A },
    { generation: 1594001, phase: 'impl', head: HEAD_B },
    { generation: 1594001, phase: 'plan', head: HEAD_A },
    { generation: 1594002, phase: 'impl', head: HEAD_A },
  ];

  const outcomes: Array<{ claimed: boolean; ref: string }> = await Promise.all(
    keys.map((key) => dispatchClaimedPhaseEvaluation(operations, key, () => Promise.resolve(key))),
  );
  assertEquals(outcomes.map((outcome: { claimed: boolean }) => outcome.claimed), [
    true,
    true,
    true,
    true,
  ]);
  assertEquals(new Set(outcomes.map((outcome: { ref: string }) => outcome.ref)).size, 4);
  assertEquals(refs.size, 4);
  console.log('distinct tuples: base + varied head + varied phase + varied generation -> 4 claims');
});

Deno.test('trigger failure releases the claim and the same tuple can retry', async () => {
  const key: ClaimKey = { generation: 1594001, phase: 'impl', head: HEAD_A };
  const { operations, refs } = atomicRefOperations();

  await assertRejects(
    () =>
      dispatchClaimedPhaseEvaluation(
        operations,
        key,
        () => Promise.reject(new Error('transient comment failure')),
      ),
    Error,
    'transient comment failure',
  );
  assertEquals(refs.size, 0);

  const retry = await dispatchClaimedPhaseEvaluation(
    operations,
    key,
    () => Promise.resolve('trigger-created'),
  );
  assertEquals(retry.claimed, true);
  assertEquals(retry.claimed && retry.trigger, 'trigger-created');
  assertEquals(refs.size, 1);
  console.log('trigger failure: claim released; same tuple retry -> claimed');
});

Deno.test('claim validation and non-collision failures fail closed', async () => {
  const { operations } = atomicRefOperations();
  await assertRejects(() =>
    claimPhaseEvaluation(operations, { generation: 0, phase: 'impl', head: HEAD_A })
  );
  await assertRejects(() =>
    claimPhaseEvaluation(operations, { generation: 1, phase: 'other', head: HEAD_A })
  );
  await assertRejects(() =>
    claimPhaseEvaluation(operations, { generation: 1, phase: 'impl', head: 'bad' })
  );
  await assertRejects(() =>
    claimPhaseEvaluation({
      createRef: () => Promise.reject(new Error('permission denied')),
      getRef: () => Promise.resolve({ sha: HEAD_A }),
    }, { generation: 1, phase: 'impl', head: HEAD_A })
  );
});

Deno.test('claim collision pointing at another commit fails closed', async () => {
  const key: ClaimKey = { generation: 1594001, phase: 'impl', head: HEAD_A };
  const ref = phaseEvalClaimRef(key);
  await assertRejects(
    () =>
      claimPhaseEvaluation({
        createRef: () =>
          Promise.reject({
            status: 422,
            response: { data: { message: REFERENCE_ALREADY_EXISTS_MESSAGE } },
          }),
        getRef: ({ ref: shortRef }: { ref: string }) => {
          assertEquals(shortRef, ref.slice('refs/'.length));
          return Promise.resolve({ sha: HEAD_B });
        },
      }, key),
    Error,
    'points to unexpected SHA',
  );
});
