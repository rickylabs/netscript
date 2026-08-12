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

Deno.test('closing keywords reject word and hyphen prefixes without tightening punctuation', () => {
  for (const body of [
    'Exact pre-fix #1431 head',
    'un-fixed #555',
    're-resolved #444',
    'hotfix #999 landed',
    'prefixes #888 there',
    'This is a bugfix #777',
    'Refs #111',
    'Part of #222',
    'See #333',
  ]) {
    assertEquals(extractClosingIssues(body), [], body);
  }

  assertEquals(extractClosingIssues('Closes #1234 and fixes #4321'), [1234, 4321]);
  assertEquals(extractClosingIssues('FIXES #12\nResolved #13'), [12, 13]);
  assertEquals(
    extractClosingIssues('resolves https://github.com/rickylabs/netscript/issues/333'),
    [333],
  );
  for (const prefix of ['', '(', '"', '*', ',', ':', '\n']) {
    assertEquals(extractClosingIssues(`${prefix}Fixes #1434`), [1434], JSON.stringify(prefix));
  }
});

Deno.test('not-yet-done evidence is rejected only for a newly ticked box', () => {
  const boxText = 'Independent separate-session IMPL-EVAL passes at the final head.';
  const unchecked = acceptanceCheckboxes(`## Acceptance\n- [ ] ${boxText}`);
  for (const evidence of [
    'Pending milestone-orchestrator separate-session IMPL-EVAL after this draft handoff.',
    '— Pending IMPL-EVAL',
    'TODO: run the gate',
    'TBD',
    'will run after merge',
    'Not yet executed',
    'pending',
  ]) {
    assertThrows(
      () =>
        validateEvidenceMapping(1415, unchecked, [{
          issue: 1415,
          text: boxText,
          evidence,
          legacy: false,
        }]),
      Error,
      `Issue #1415: box "${boxText}" has not-yet-done evidence "${evidence}"; supply real evidence or leave the box unchecked.`,
    );
  }

  const alreadyChecked = acceptanceCheckboxes(`## Acceptance\n- [x] ${boxText}`);
  assertEquals(
    validateEvidenceMapping(1415, alreadyChecked, [{
      issue: 1415,
      text: boxText,
      evidence: '— Pending historical note',
      legacy: false,
    }]).size,
    0,
  );
});

Deno.test('factual evidence is not rejected for marker words in non-asserting positions', () => {
  const box = 'normal evidence still ticks';
  for (const evidence of [
    'supersedes the earlier pending note',
    'IMPL-EVAL PASS at e730b8bfa; supersedes the pending row',
    'Gate run URL … ; the pending-migration note no longer applies',
    'pr-checks_test.ts fixture; report.ok gate',
  ]) {
    assertEquals(
      validateEvidenceMapping(1415, acceptanceCheckboxes(`## Acceptance\n- [ ] ${box}`), [{
        issue: 1415,
        text: box,
        evidence,
        legacy: false,
      }]).size,
      1,
      evidence,
    );
  }
});
