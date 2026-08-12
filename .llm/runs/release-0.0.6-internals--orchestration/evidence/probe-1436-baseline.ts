/**
 * Baseline probe for #1436, executed at 01aa12b67 before any fix.
 *
 * Records the executed truth that the issue's own diagnosis is imprecise: the word boundary it asks
 * for is already present, and `\b` is why the defect survives — `-` is a non-word character, so
 * `\bfix\b` matches inside `pre-fix`. Run from the repository root:
 *
 *   deno run --allow-read .llm/runs/release-0.0.6-internals--orchestration/evidence/probe-1436-baseline.ts
 *
 * Expected at 01aa12b67 (pre-fix): `pre-fix #1431` -> [1431] and `un-fixed #555` -> [555].
 * Expected after PR-A: both -> [].
 */
import { extractClosingIssues } from '../../../tools/validation/acceptance-evidence.ts';

const CASES = [
  'Exact pre-fix #1431 head',
  'pre-repair #1431 head',
  'Fixes #1434',
  'hotfix #999 landed',
  'prefixes #888 there',
  'This is a bugfix #777',
  'un-fixed #555',
  'Closes #1234 and fixes #4321',
  'Refs #111',
  'Part of #222',
  'resolves https://github.com/rickylabs/netscript/issues/333',
];

for (const input of CASES) {
  console.log(`${JSON.stringify(input)} -> ${JSON.stringify(extractClosingIssues(input))}`);
}
