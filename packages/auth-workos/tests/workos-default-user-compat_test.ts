import { assertEquals } from '@std/assert';
import type {
  WorkosSessionAuthenticationSuccess,
  WorkosSessionRefreshSuccess,
} from '@netscript/auth-workos';

type IsUnknown<T> = unknown extends T ? keyof T extends never ? true : false : false;

function readExtraFields(
  success: WorkosSessionAuthenticationSuccess,
  refresh: WorkosSessionRefreshSuccess,
): readonly unknown[] {
  const email = success.user.email;
  const customField = success.user.applicationSpecificField;
  const refreshedEmail = refresh.user.email;
  const refreshedCustomField = refresh.user.applicationSpecificField;
  const typesRemainUnknown: readonly [
    IsUnknown<typeof email>,
    IsUnknown<typeof customField>,
    IsUnknown<typeof refreshedEmail>,
    IsUnknown<typeof refreshedCustomField>,
  ] = [true, true, true, true];
  assertEquals(typesRemainUnknown, [true, true, true, true]);
  return [email, customField, refreshedEmail, refreshedCustomField];
}

Deno.test('default sealed-session user preserves arbitrary field access as unknown', () => {
  const success: WorkosSessionAuthenticationSuccess = {
    authenticated: true,
    accessToken: 'access-token',
    sessionId: 'sess_123',
    user: { id: 'user_123', email: 'ada@example.com', applicationSpecificField: 42 },
  };
  assertEquals(readExtraFields(success, success), ['ada@example.com', 42, 'ada@example.com', 42]);
});
