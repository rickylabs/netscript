import { assertEquals, assertStringIncludes } from '@std/assert';

import type { GateReceipt } from './contract.ts';
import { evaluateEvidenceSet } from './evidence-set.ts';

function receipt(
  gateId: string,
  outcome: GateReceipt['outcome'] = 'PASS',
  head = 'abc',
): GateReceipt {
  return {
    schemaVersion: 1,
    gateId,
    invocationId: `${gateId}-1`,
    argv: ['deno'],
    cwd: '/repo',
    gitHead: head,
    actualGitHead: head,
    timeoutMs: 1,
    runnerIdentity: 'test',
    attempt: 1,
    requestHash: 'hash',
    lifecycleId: 'life',
    outcome,
    claimedAt: 'now',
  };
}

Deno.test('one passing command does not certify a framework surface', () => {
  const set = evaluateEvidenceSet({
    immutableHead: 'abc',
    surface: 'packages/service',
    expectedGateIds: ['check'],
    receipts: [receipt('check')],
    frameworkSurface: true,
  });
  assertEquals(set.sufficiency, 'INSUFFICIENT');
  assertStringIncludes(set.reasons.join('\n'), 'missing receipt for quality-gate');
});

Deno.test('duplicate gate receipts fail closed without last-wins shadowing', () => {
  const pass = receipt('check', 'PASS');
  const fail = { ...receipt('check', 'FAIL'), invocationId: 'check-2', requestHash: 'other' };
  const set = evaluateEvidenceSet({
    immutableHead: 'abc',
    surface: 'internal',
    expectedGateIds: ['check'],
    receipts: [pass, fail],
  });
  assertEquals(set.sufficiency, 'INSUFFICIENT');
  assertStringIncludes(set.reasons.join('\n'), 'duplicate or contradictory receipts');
});

Deno.test('duplicate receipt ids and expected gates fail deterministically', () => {
  const check = receipt('check', 'PASS');
  const lint = { ...receipt('lint', 'PASS'), invocationId: check.invocationId };
  const left = evaluateEvidenceSet({
    immutableHead: 'abc',
    surface: 'internal',
    expectedGateIds: ['lint', 'check', 'check'],
    receipts: [lint, check],
  });
  const right = evaluateEvidenceSet({
    immutableHead: 'abc',
    surface: 'internal',
    expectedGateIds: ['check', 'lint', 'check'],
    receipts: [check, lint],
  });
  assertEquals(left.sufficiency, 'INSUFFICIENT');
  assertEquals(left.reasons, right.reasons);
  assertStringIncludes(left.reasons.join('\n'), 'receipt id check-1 is duplicated');
  assertStringIncludes(left.reasons.join('\n'), 'expected gate check is duplicated');
});

Deno.test('declared-head overrides are diagnostic only and cannot satisfy evidence', () => {
  const overridden = {
    ...receipt('check', 'PASS'),
    actualGitHead: 'actual',
    gitHeadOverrideReason: 'test fixture for a queued event',
  };
  const set = evaluateEvidenceSet({
    immutableHead: 'abc',
    surface: 'internal',
    expectedGateIds: ['check'],
    receipts: [overridden],
  });
  assertEquals(set.sufficiency, 'INSUFFICIENT');
  assertStringIncludes(set.reasons.join('\n'), 'attests abc but ran at actual');
});

Deno.test('NOT_RUN, nonterminal and SHA mismatch all fail closed', () => {
  const set = evaluateEvidenceSet({
    immutableHead: 'abc',
    surface: 'internal',
    expectedGateIds: ['check', 'lint', 'test'],
    receipts: [
      receipt('check', 'NOT_RUN'),
      receipt('lint', 'RUNNING'),
      receipt('test', 'PASS', 'stale'),
    ],
  });
  assertEquals(set.sufficiency, 'INSUFFICIENT');
  assertStringIncludes(set.reasons.join('\n'), 'NOT_RUN');
  assertStringIncludes(set.reasons.join('\n'), 'nonterminal');
  assertStringIncludes(set.reasons.join('\n'), 'targets stale');
});
