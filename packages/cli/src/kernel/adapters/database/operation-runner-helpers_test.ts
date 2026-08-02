import { assertEquals } from 'jsr:@std/assert@^1';

import { isNoRunningAppHostOutput } from './operation-runner-helpers.ts';

Deno.test('isNoRunningAppHostOutput accepts the documented line with allowed prefixes', () => {
  assertEquals(
    isNoRunningAppHostOutput('', "No AppHost is currently running for 'apphost.mts'."),
    true,
  );
  assertEquals(
    isNoRunningAppHostOutput('', "  error: No AppHost is currently running for 'apphost.mts'."),
    true,
  );
});

Deno.test('isNoRunningAppHostOutput rejects a failure that only quotes the phrase', () => {
  assertEquals(
    isNoRunningAppHostOutput(
      '',
      "Dashboard failed after reporting: No AppHost is currently running for 'apphost.mts'.",
    ),
    false,
  );
});
