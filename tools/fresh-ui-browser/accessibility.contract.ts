import assert from 'node:assert/strict';
import { fingerprints, verifyAccessibility } from './accessibility.ts';

const original = {
  id: 'color-contrast',
  impact: 'serious' as const,
  nodes: [{ target: ['.known'] }],
};
const baseline = fingerprints([original]);

Deno.test('axe baseline matches the exact known nodes', () => {
  verifyAccessibility([original], baseline);
  verifyAccessibility([], {});
});

Deno.test('axe rejects a new rule and a new target under a known rule', () => {
  assert.throws(() =>
    verifyAccessibility([
      original,
      { id: 'button-name', impact: 'critical', nodes: [{ target: ['#unnamed'] }] },
    ], baseline), /button-name/);
  assert.throws(() =>
    verifyAccessibility([
      original,
      { ...original, nodes: [{ target: ['.new-target'] }] },
    ], baseline), /new-target/);
});

Deno.test('axe rejects an extra copy of a baselined node', () => {
  assert.throws(() =>
    verifyAccessibility([
      { ...original, nodes: [...original.nodes, ...original.nodes] },
    ], baseline), /"actual": 2/);
});

Deno.test('axe rejects stale allowances until the baseline is lowered', () => {
  assert.throws(() => verifyAccessibility([], baseline), /"actual": 0/);
  const two = fingerprints([{ ...original, nodes: [...original.nodes, ...original.nodes] }]);
  assert.throws(() => verifyAccessibility([original], two), /"expected": 2/);
});
