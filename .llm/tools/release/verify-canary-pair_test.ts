import { assertEquals, assertThrows } from '@std/assert';
import { parseRepo } from './verify-canary-pair.ts';

Deno.test('canary pair verifier parses an explicit repo and rejects malformed input', () => {
  assertEquals(parseRepo([]), 'rickylabs/netscript');
  assertEquals(parseRepo(['--', '--repo', 'owner/repo']), 'owner/repo');
  assertThrows(() => parseRepo(['--repo']), Error, 'requires owner/name');
  assertThrows(() => parseRepo(['--repo', 'invalid']), Error, 'Invalid GitHub repository');
  assertThrows(() => parseRepo(['--bogus']), Error, 'Unknown argument');
});
