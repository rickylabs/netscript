import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  acceptanceCheckboxes,
  checkAcceptanceBoxes,
  extractClosingIssues,
  issueSnapshot,
  parseAcceptanceEvidence,
  staleSnapshots,
  validateEvidenceMapping,
} from './acceptance-evidence.ts';

const STRUCTURED = `\`\`\`acceptance-evidence
issue: 1170
entries:
  - box: "Exit code is non-zero only when a current failure exists"
    evidence: "pr-checks_test.ts — fixture; report.ok gate"
\`\`\``;

Deno.test('structured evidence treats em dashes in evidence as harmless data', () => {
  const issue = '## Acceptance\n- [ ] Exit code is non-zero only when a current failure exists';
  const parsed = parseAcceptanceEvidence(STRUCTURED);
  const mapping = validateEvidenceMapping(1170, acceptanceCheckboxes(issue), parsed.entries);
  assertEquals(mapping.get(1)?.evidence, 'pr-checks_test.ts — fixture; report.ok gate');
  assertEquals(
    checkAcceptanceBoxes(issue, new Set(mapping.keys())),
    '## Acceptance\n- [x] Exit code is non-zero only when a current failure exists',
  );
});

Deno.test('structured evidence supports one-based box-index fallback', () => {
  const parsed = parseAcceptanceEvidence(`\`\`\`acceptance-evidence
issue: 8
entries:
  - box-index: 1
    evidence: "CI run"
\`\`\``);
  assertEquals(
    validateEvidenceMapping(8, acceptanceCheckboxes('## Gates\n- [ ] a long box'), parsed.entries)
      .size,
    1,
  );
});

Deno.test('unmatched evidence fails with issue, named box, comparison, and repair', () => {
  const boxes = acceptanceCheckboxes('## Definition of Done\n- [ ] verbatim');
  assertThrows(
    () =>
      validateEvidenceMapping(44, boxes, [{
        issue: 44,
        text: 'changed',
        evidence: 'CI',
        legacy: false,
      }]),
    Error,
    'Issue #44: no acceptance box matched exact box text "changed"; add an entry for box "changed"',
  );
});

Deno.test('missing evidence fails with the exact named box and action', () => {
  assertThrows(
    () => validateEvidenceMapping(44, acceptanceCheckboxes('## Gates\n- [ ] one'), []),
    Error,
    'Issue #44: unchecked box "one" has no matching evidence entry; add an entry for box "one"',
  );
});

Deno.test('legacy evidence remains readable and emits a structured-format deprecation', () => {
  const parsed = parseAcceptanceEvidence('## Acceptance evidence\n- [x] exact — old CI');
  assertEquals(parsed.entries[0], {
    text: 'exact',
    evidence: 'old CI',
    legacy: true,
  });
  assertEquals(parsed.warnings.length, 1);
  assertEquals(parsed.warnings[0].includes('```acceptance-evidence'), true);
});

Deno.test('post-merge boxes are excluded from required evidence and stay unchecked', () => {
  const issue = '## Acceptance\n- [ ] merge blocker\n- [ ] [post-merge] verify published tag';
  const boxes = acceptanceCheckboxes(issue);
  assertEquals(boxes[1].postMerge, true);
  const mapping = validateEvidenceMapping(9, boxes, [{
    issue: 9,
    text: 'merge blocker',
    evidence: 'CI',
    legacy: false,
  }]);
  assertEquals(
    checkAcceptanceBoxes(issue, new Set(mapping.keys())),
    '## Acceptance\n- [x] merge blocker\n- [ ] [post-merge] verify published tag',
  );
});

Deno.test('stale verdict snapshot is detected after an issue edit', async () => {
  const before = { number: 7, updated_at: '2026-08-03T10:00:00Z', body: '- [ ] before' };
  const expected = [await issueSnapshot(before)];
  assertEquals(await staleSnapshots(expected, [before]), []);
  assertEquals(
    (await staleSnapshots(expected, [{
      ...before,
      updated_at: '2026-08-03T10:01:00Z',
      body: '- [x] after',
    }]))
      .map((snapshot) => snapshot.number),
    [7],
  );
});

Deno.test('umbrella reference without closing keyword is untouched', () => {
  assertEquals(extractClosingIssues('Part of #607\nRefs #574'), []);
});
