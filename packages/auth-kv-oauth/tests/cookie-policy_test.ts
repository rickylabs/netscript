import { assertStringIncludes, assertThrows } from '@std/assert';
import { buildCookieHeader, KvOAuthError } from '../mod.ts';

Deno.test('cookie issuance rejects insecure policy and invalid __Host attributes', () => {
  const request = new Request('https://app.example.test/');
  for (
    const options of [
      { secure: false },
      { httpOnly: false },
      { domain: 'example.test' },
      { path: '/auth' },
      { domain: 'example.test', allowInsecureDev: true },
      { path: '/auth', allowInsecureDev: true },
      { name: 'custom_session', secure: false },
    ]
  ) {
    assertThrows(() => buildCookieHeader('session', request, options), KvOAuthError);
  }
  assertStringIncludes(buildCookieHeader('session', request), '__Host-ns_session=');
  assertStringIncludes(
    buildCookieHeader('session', request, { secure: false, allowInsecureDev: true }),
    'HttpOnly',
  );
  assertThrows(
    () => buildCookieHeader('session', request, { httpOnly: false, allowInsecureDev: true }),
    KvOAuthError,
  );
});
