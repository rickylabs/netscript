import { assert, assertEquals, assertStringIncludes } from '@std/assert';

import { extractVerdict } from './extract-verdict.ts';

function assistant(...texts: string[]): string {
  return JSON.stringify({
    type: 'assistant',
    message: { content: texts.map((text) => ({ type: 'text', text })) },
  });
}

function result(payload: Record<string, unknown>): string {
  return JSON.stringify({ type: 'result', subtype: 'success', is_error: false, ...payload });
}

/**
 * THE TRAP. Claude Code's terminal `result` event carries an EMPTY `result` string on the OpenRouter
 * open-model evaluator lane, while reporting `subtype: success` and `is_error: false`. The verdict is
 * in the assistant text blocks.
 *
 * A harness that reads `result` gets an empty string that looks like a successful run — and an
 * evaluator whose "no output" is read as "no findings" is worse than no evaluator at all.
 */
Deno.test('reads the verdict from assistant text blocks, NOT the empty result field', () => {
  const transcript = [
    assistant('## Findings\n\nF1 is genuinely fixed.\n\nFAIL_FIX'),
    result({ result: '' }), // the trap: empty, but success
  ].join('\n');

  const extraction = extractVerdict(transcript);

  assertEquals(extraction.verdict, 'FAIL_FIX');
  assertEquals(extraction.resultField, ''); // the field we must NOT trust
  assertEquals(extraction.reportedSuccess, true); // ...and which claimed success
  assertEquals(extraction.failure, undefined);
  assertStringIncludes(extraction.text, 'F1 is genuinely fixed.');
});

/**
 * An evaluator that produced nothing must FAIL LOUDLY. Never silently pass. This is the single most
 * important assertion in the harness: status (`subtype: success`, `is_error: false`, exit 0) is not
 * evidence — evidence is output you can point at.
 */
Deno.test('EMPTY evaluator output is a hard failure even when the run reports success', () => {
  const transcript = result({ result: '' });

  const extraction = extractVerdict(transcript);

  assertEquals(extraction.verdict, undefined);
  assertEquals(extraction.reportedSuccess, true); // it *said* it succeeded
  assert(extraction.failure, 'empty output must produce a failure');
  assertStringIncludes(extraction.failure, 'EMPTY EVALUATOR OUTPUT');
  assertStringIncludes(extraction.failure, 'not a pass');
});

/** A confident essay with no verdict token is also a failure to evaluate. */
Deno.test('output with no verdict token is a failure to evaluate', () => {
  const transcript = [
    assistant('I looked at the diff and everything seems broadly reasonable to me.'),
    result({ result: '' }),
  ].join('\n');

  const extraction = extractVerdict(transcript);

  assertEquals(extraction.verdict, undefined);
  assert(extraction.failure);
  assertStringIncludes(extraction.failure, 'NO VERDICT TOKEN');
});

Deno.test('concatenates multiple assistant turns and blocks', () => {
  const transcript = [
    assistant('Checked F1 by seeding a crash.', 'Checked F2 against the live help tree.'),
    assistant('Verdict below.\n\nPASS'),
    result({ result: '' }),
  ].join('\n');

  const extraction = extractVerdict(transcript);

  assertEquals(extraction.verdict, 'PASS');
  assertStringIncludes(extraction.text, 'seeding a crash');
  assertStringIncludes(extraction.text, 'live help tree');
});

/** Substring safety: PASSED/PASSTHROUGH must not be mistaken for a bare PASS verdict. */
Deno.test('does not match a verdict token embedded in a longer word', () => {
  const transcript = [
    assistant('All the gates PASSED and the PASSTHROUGH path is fine.'),
    result({ result: '' }),
  ].join('\n');

  const extraction = extractVerdict(transcript);

  assertEquals(extraction.verdict, undefined);
  assert(extraction.failure);
  assertStringIncludes(extraction.failure, 'NO VERDICT TOKEN');
});

Deno.test('tolerates non-JSON noise on the stream', () => {
  const transcript = [
    'warning: something on stderr got interleaved',
    assistant('FAIL_RESCOPE'),
    result({ result: '' }),
  ].join('\n');

  assertEquals(extractVerdict(transcript).verdict, 'FAIL_RESCOPE');
});
