/// <reference lib="dom" />
import type { Result } from 'axe-core';

type Violation = Pick<Result, 'id' | 'impact'> & {
  nodes: ReadonlyArray<Pick<Result['nodes'][number], 'target'>>;
};

/** Match individual serious/critical nodes, never whole rules or subtrees. */
export function fingerprints(violations: readonly Violation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const violation of violations) {
    if (violation.impact !== 'serious' && violation.impact !== 'critical') continue;
    for (const node of violation.nodes) {
      const key = JSON.stringify([violation.id, violation.impact, node.target]);
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

/** Reject regressions and stale allowances so a reviewed baseline can only be lowered explicitly. */
export function verifyAccessibility(
  violations: readonly Violation[],
  expected: Readonly<Record<string, number>>,
): void {
  const actual = fingerprints(violations);
  const changed = [...new Set([...Object.keys(actual), ...Object.keys(expected)])]
    .filter((key) => (actual[key] ?? 0) !== (expected[key] ?? 0))
    .map((key) => ({
      fingerprint: JSON.parse(key),
      expected: expected[key] ?? 0,
      actual: actual[key] ?? 0,
    }));
  if (changed.length) {
    throw new Error(
      `Axe baseline mismatch (new findings or stale allowances): ${
        JSON.stringify(changed, null, 2)
      }`,
    );
  }
}
