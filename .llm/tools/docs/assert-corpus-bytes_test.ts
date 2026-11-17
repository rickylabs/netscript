import { assert, AssertionError, assertRejects } from '@std/assert';
import { assertExactCorpusBytes } from './assert-corpus-bytes.ts';

Deno.test('exact corpus bytes accept identical and empty payloads', async () => {
  await assertExactCorpusBytes(new Uint8Array(), new Uint8Array());
  await assertExactCorpusBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]));
});
Deno.test('length or same-length last-byte mismatch stays red with bounded payload-free diagnostics', async () => {
  const actual = new Uint8Array(2 << 20).fill(65), expected = actual.slice();
  expected[expected.length - 1] = 66;
  for (const pair of [[actual, expected], [actual, expected.subarray(1)]]) {
    const error = await assertRejects(
      () => assertExactCorpusBytes(pair[0], pair[1]),
      AssertionError,
    );
    assert(error.message.length < 256);
    assert(error.message.includes('SHA256'));
    assert(!error.message.includes('AAAA'));
  }
});
