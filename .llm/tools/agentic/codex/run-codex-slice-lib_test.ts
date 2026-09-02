import { assert, assertEquals } from '@std/assert';
import {
  computeBackoff,
  enforceTeardown,
  parseDoneContract,
  remainingBudgetDelay,
} from './run-codex-slice-lib.ts';
import type { LeakReport } from '../teardown/leak-check.ts';

Deno.test('done contract accepts only the final exact marker', () => {
  assertEquals(parseDoneContract('work complete\nDONE\n'), { state: 'done' });
  assertEquals(parseDoneContract('DONE\nstill working'), { state: 'running' });
});

Deno.test('done contract requires a blocked reason', () => {
  assertEquals(parseDoneContract('BLOCKED: missing authority'), {
    state: 'blocked',
    reason: 'missing authority',
  });
  assertEquals(parseDoneContract('BLOCKED:'), { state: 'running' });
});

function leaks(ownership: 'owned' | 'foreign' | 'unproven'): LeakReport {
  return {
    schemaVersion: 1,
    generatedAt: '2026-08-02T00:00:00Z',
    worktreeRoot: '/worktree',
    probes: {
      aspire: { state: 'ok' },
      docker: { state: 'ok' },
      volumes: { state: 'ok' },
      networks: { state: 'ok' },
    },
    survivors: [{
      kind: 'apphost',
      identity: '/worktree/apphost.mts (pid 1)',
      ownership,
      owner: '/worktree',
      ageMs: 1,
      stale: false,
      command: "aspire stop --apphost '/worktree/apphost.mts' --non-interactive --nologo",
      atRiskFromUpstream: false,
      resource: { kind: 'apphost', appHostPath: '/worktree/apphost.mts', appHostPid: 1 },
    }],
  };
}

Deno.test('teardown enforcement makes owned survival load-bearing', () => {
  const result = enforceTeardown({ state: 'done' }, leaks('owned'));
  assert(result.state === 'blocked');
  if (result.state === 'blocked') {
    assert(result.reason.startsWith('teardown:'));
    assert(result.reason.includes("aspire stop --apphost '/worktree/apphost.mts'"));
  }
});

Deno.test('foreign and unproven survival never fail a sibling run', () => {
  assertEquals(enforceTeardown({ state: 'done' }, leaks('foreign')), { state: 'done' });
  assertEquals(enforceTeardown({ state: 'done' }, leaks('unproven')), { state: 'done' });
});

Deno.test('backoff uses reset time then bounded exponential schedule', () => {
  const now = Date.parse('2026-07-11T10:00:00.000Z');
  assertEquals(
    computeBackoff({ kind: 'quota_exhausted', resetAt: '2026-07-11T10:02:00.000Z' }, 0, now),
    120_000,
  );
  assertEquals(computeBackoff({ kind: 'model_capacity' }, 0, now, 100, 350), 100);
  assertEquals(computeBackoff({ kind: 'model_capacity' }, 3, now, 100, 350), 350);
  assertEquals(computeBackoff({ kind: 'other', raw: 'boom' }, 0, now), null);
});

Deno.test('wall-clock clamp never crosses or underflows the budget', () => {
  assertEquals(remainingBudgetDelay(500, 800, 1_000), 200);
  assertEquals(remainingBudgetDelay(500, 1_000, 1_000), 0);
  assert(remainingBudgetDelay(50, 0, 1_000) === 50);
});
