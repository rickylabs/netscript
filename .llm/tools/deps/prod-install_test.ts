import { assertEquals, assertFalse } from 'jsr:@std/assert@^1';
import { buildDenoCiArgs, parseArgs } from './prod-install.ts';

Deno.test('prod-install uses deno ci --prod without rejected frozen flag', () => {
  const args = buildDenoCiArgs(parseArgs([]));
  assertEquals(args, ['ci', '--prod']);
  assertFalse(args.includes('--frozen'));
});

Deno.test('prod-install preserves skip-types without adding frozen flag', () => {
  const args = buildDenoCiArgs(parseArgs(['--skip-types']));
  assertEquals(args, ['ci', '--prod', '--skip-types']);
  assertFalse(args.includes('--frozen'));
});
