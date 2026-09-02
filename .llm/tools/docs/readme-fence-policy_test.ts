import { assertEquals } from '@std/assert';
import {
  formatReadmeFenceCensus,
  README_FENCE_RATCHET,
  type ReadmeFenceCensus,
  readmeFenceRatchetFailures,
} from './readme-fence-policy.ts';

const baseline: ReadmeFenceCensus = {
  readmes: README_FENCE_RATCHET.minimumReadmes,
  fences: 168,
  tsLike: README_FENCE_RATCHET.minimumTsLikeFences,
  exempt: 0,
  checked: README_FENCE_RATCHET.minimumChecked,
  syntaxInvalid: README_FENCE_RATCHET.maximumSyntaxInvalid,
  typeErrors: README_FENCE_RATCHET.maximumTypeErrors,
  failingReadmes: README_FENCE_RATCHET.maximumFailingReadmes,
  unattributedFailure: false,
};

Deno.test('the measured baseline passes and every ceiling sits at its exact census', () => {
  assertEquals(readmeFenceRatchetFailures(baseline), []);
});

Deno.test('one more type error, or one more failing README, fails the ratchet', () => {
  assertEquals(
    readmeFenceRatchetFailures({ ...baseline, typeErrors: baseline.typeErrors + 1 }),
    ['type errors 8 > 7'],
  );
  assertEquals(
    readmeFenceRatchetFailures({ ...baseline, failingReadmes: baseline.failingReadmes + 1 }),
    ['failing readmes 6 > 5'],
  );
  assertEquals(
    readmeFenceRatchetFailures({ ...baseline, syntaxInvalid: baseline.syntaxInvalid + 1 }),
    ['syntax-invalid fences 1 > 0'],
  );
});

Deno.test('the corpus cannot shrink to manufacture a pass', () => {
  // Deleting a README, dropping its fences, or excluding blocks from the compiler each undershoot a
  // floor — otherwise the cheapest way to go green would be to stop checking things.
  assertEquals(
    readmeFenceRatchetFailures({ ...baseline, readmes: baseline.readmes - 1 }),
    ['readmes 35 < 36'],
  );
  assertEquals(
    readmeFenceRatchetFailures({ ...baseline, tsLike: baseline.tsLike - 1 }),
    ['ts-like fences 72 < 73'],
  );
  assertEquals(
    readmeFenceRatchetFailures({ ...baseline, checked: baseline.checked - 1 }),
    ['checked 72 < 73'],
  );
});

Deno.test('every violation is reported, not just the first', () => {
  assertEquals(
    readmeFenceRatchetFailures({
      ...baseline,
      readmes: 1,
      typeErrors: 99,
      failingReadmes: 30,
    }),
    ['readmes 1 < 36', 'failing readmes 30 > 5', 'type errors 99 > 7'],
  );
});

Deno.test('the census line is printed on pass and fail alike', () => {
  assertEquals(
    formatReadmeFenceCensus(baseline, 'PASS'),
    'readme fences: PASS readmes=36 fences=168 ts_like=73 exempt=0 checked=73 ' +
      'syntax_invalid=0 type_errors=7 failing_readmes=5 unattributed_failure=false',
  );
  assertEquals(formatReadmeFenceCensus(baseline, 'FAIL').startsWith('readme fences: FAIL'), true);
});

Deno.test('a compiler failure no fence accounts for is reported, not passed over', () => {
  // The sibling gate's #1892 defect in miniature: a diagnostic shape the checker cannot read must
  // fail rather than slip through as "no type errors found".
  assertEquals(
    readmeFenceRatchetFailures({ ...baseline, unattributedFailure: true }),
    ['compiler reported failure that no fence accounts for'],
  );
});
