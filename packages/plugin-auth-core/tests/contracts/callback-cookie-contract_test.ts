import { assertEquals } from '@std/assert';
import { CallbackResponseSchema } from '../../src/contracts/v1/mod.ts';
import type { CallbackResponse } from '../../src/contracts/v1/mod.ts';

Deno.test('callback contract strips session credentials from public JSON', () => {
  const output = CallbackResponseSchema.parse({
    completed: true,
    redirectTo: '/dashboard',
    subject: 'provider:user',
    sessionId: 'server-only-credential',
  });
  assertEquals(output, {
    completed: true,
    redirectTo: '/dashboard',
    subject: 'provider:user',
  });
});

Deno.test('callback type exposes only completion and redirect metadata', () => {
  const output: CallbackResponse = { completed: true };
  // @ts-expect-error Session credentials belong to Set-Cookie, never callback JSON.
  const credential = output.sessionId;
  assertEquals(credential, undefined);
});
