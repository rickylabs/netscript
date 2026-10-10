import { assertEquals } from '@std/assert';
import { toAuthnRequest } from '../../services/src/routers/v1-helpers.ts';

Deno.test('toAuthnRequest synthesizes only the configured session cookie name', () => {
  const request = toAuthnRequest(undefined, 'session/value', '__Host-custom_session');
  assertEquals(request.cookie('__Host-custom_session'), 'session/value');
  assertEquals(request.cookie('__Host-ns_session'), undefined);
  const incoming = toAuthnRequest(
    {
      url: 'https://app.example.test/api/v1/auth/session',
      headers: new Headers({ cookie: '__Host-custom_session=browser' }),
    },
    'other',
    '__Host-custom_session',
  );
  assertEquals(incoming.cookie('__Host-custom_session'), 'browser');
});
