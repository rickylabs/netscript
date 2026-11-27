/** Exact byte comparison with bounded failure diagnostics, never an expanded corpus diff. */
import { AssertionError } from '@std/assert';

async function digest(value: Uint8Array): Promise<string> {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', copy))]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function assertExactCorpusBytes(
  actual: Uint8Array,
  expected: Uint8Array,
): Promise<void> {
  let equal = actual.byteLength === expected.byteLength;
  for (let i = 0; equal && i < actual.byteLength; i++) equal = actual[i] === expected[i];
  if (equal) return;
  throw new AssertionError(
    `Corpus bytes differ: length ${actual.byteLength}/${expected.byteLength}; ` +
      `SHA256 ${await digest(actual)}/${await digest(expected)}`,
  );
}
