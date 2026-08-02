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
    'Evidence names no acceptance box',
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

Deno.test('already-ticked boxes need no evidence and supplied evidence is a no-op', () => {
  const boxes = acceptanceCheckboxes('## Acceptance\n- [x] done');
  assertEquals(validateEvidenceMapping(boxes, []).size, 0);
  assertEquals(
    validateEvidenceMapping(boxes, [{ text: 'done', evidence: 'old run' }]).size,
    0,
  );
});

Deno.test('rejects empty evidence for unchecked and already-checked boxes', () => {
  for (const checked of [' ', 'x']) {
    const boxes = acceptanceCheckboxes(`## Acceptance\n- [${checked}] item`);
    assertThrows(
      () => validateEvidenceMapping(boxes, [{ text: 'item', evidence: '' }]),
      Error,
      'Evidence is empty: item',
    );
  }
});

Deno.test('rejects duplicate evidence for unchecked and already-checked boxes', () => {
  for (const checked of [' ', 'x']) {
    const boxes = acceptanceCheckboxes(`## Acceptance\n- [${checked}] item`);
    assertThrows(
      () =>
        validateEvidenceMapping(boxes, [
          { text: 'item', evidence: 'first run' },
          { text: 'item', evidence: 'second run' },
        ]),
      Error,
      'Duplicate evidence: item',
    );
  }
});

Deno.test('re-running the mirror against already-ticked boxes is a no-op', () => {
  const issue = '## Acceptance\n- [ ] exact acceptance text';
  const evidence = [{ text: 'exact acceptance text', evidence: 'test run URL' }];

  const firstMapping = validateEvidenceMapping(acceptanceCheckboxes(issue), evidence);
  assertEquals(firstMapping.size, 1);
  const tickedIssue = checkAcceptanceBoxes(issue, new Set(firstMapping.keys()));
  assertEquals(tickedIssue, '## Acceptance\n- [x] exact acceptance text');

  const secondMapping = validateEvidenceMapping(acceptanceCheckboxes(tickedIssue), evidence);
  assertEquals(secondMapping.size, 0);
});

Deno.test('umbrella reference without closing keyword is untouched', () => {
  assertEquals(extractClosingIssues('Part of #607\nRefs #574'), []);
});
