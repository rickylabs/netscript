import { assertEquals } from '@std/assert';
import { WorkOS } from '@workos-inc/node';

Deno.test('WorkOS sealed-session SDK path resolves under Deno node compatibility', async () => {
  const workos = new WorkOS('sk_test_123', { clientId: 'client_123' });
  const session = workos.userManagement.loadSealedSession({
    sessionData: '',
    cookiePassword: 'x'.repeat(32),
  });

  const result = await session.authenticate();

  assertEquals(result.authenticated, false);
  if (!result.authenticated) {
    assertEquals(String(result.reason), 'no_session_cookie_provided');
  }
});
