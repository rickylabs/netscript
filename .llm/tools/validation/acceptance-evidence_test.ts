import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  acceptanceCheckboxes,
  checkAcceptanceBoxes,
  extractClosingIssues,
  parseAcceptanceEvidence,
  validateEvidenceMapping,
} from './acceptance-evidence.ts';

Deno.test('maps verbatim unchecked acceptance boxes and preserves checked boxes', () => {
  const issue = '## Acceptance\n- [ ] exact text\n- [x] already done';
  const boxes = acceptanceCheckboxes(issue);
  const evidence = parseAcceptanceEvidence(
    '## Acceptance evidence\n- [x] exact text — test run URL',
  );
  const mapping = validateEvidenceMapping(boxes, evidence);
  assertEquals(
    checkAcceptanceBoxes(issue, new Set(mapping.keys())),
    '## Acceptance\n- [x] exact text\n- [x] already done',
  );
});

Deno.test('rejects mismatched text and missing boxes', () => {
  const boxes = acceptanceCheckboxes('## Definition of Done\n- [ ] verbatim');
  assertThrows(
    () => validateEvidenceMapping(boxes, [{ text: 'changed', evidence: 'CI' }]),
    Error,
    'Evidence names no unchecked box',
  );
});

Deno.test('rejects extra unchecked issue boxes', () => {
  const boxes = acceptanceCheckboxes('## Gates\n- [ ] one\n- [ ] two');
  assertThrows(
    () => validateEvidenceMapping(boxes, [{ text: 'one', evidence: 'CI' }]),
    Error,
    'Missing evidence: two',
  );
});

Deno.test('already-ticked boxes need no evidence and cannot be mirrored again', () => {
  const boxes = acceptanceCheckboxes('## Acceptance\n- [x] done');
  assertEquals(validateEvidenceMapping(boxes, []).size, 0);
  assertThrows(
    () => validateEvidenceMapping(boxes, [{ text: 'done', evidence: 'old run' }]),
    Error,
    'Evidence names no unchecked box',
  );
});

Deno.test('umbrella reference without closing keyword is untouched', () => {
  assertEquals(extractClosingIssues('Part of #607\nRefs #574'), []);
});
