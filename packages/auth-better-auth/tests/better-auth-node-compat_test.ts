import { assertEquals } from '@std/assert';
import { betterAuth } from 'better-auth';

Deno.test('better-auth resolves under Deno node compatibility', () => {
  const auth = betterAuth({
    secret: 'x'.repeat(32),
    baseURL: 'http://localhost:3000',
  });

  assertEquals(typeof auth.api.getSession, 'function');
  assertEquals(typeof auth.handler, 'function');
});
