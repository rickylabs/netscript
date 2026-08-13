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
