import { assert, assertEquals } from '@std/assert';
import { getSetCookies } from '@std/http';
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  readCsrfToken,
  setCsrfCookie,
  verifyCsrfToken,
} from './csrf.ts';

Deno.test('generateCsrfToken returns a non-empty token', () => {
  const token = generateCsrfToken();

  assert(typeof token === 'string' && token.length > 0);
});

Deno.test('verifyCsrfToken accepts matching tokens and rejects mismatches', () => {
  assert(verifyCsrfToken('csrf-1', 'csrf-1'));
  assert(!verifyCsrfToken('csrf-1', 'csrf-2'));
  assert(!verifyCsrfToken('csrf-1', 'csrf-10'));
  assert(!verifyCsrfToken('csrf-10', 'csrf-1'));
  assert(!verifyCsrfToken(undefined, 'csrf-1'));
  assert(!verifyCsrfToken('csrf-1', undefined));
});

Deno.test('setCsrfCookie writes the expected cookie attributes', () => {
  const headers = new Headers();
  setCsrfCookie(headers, 'csrf-1', new URL('https://example.com/forms'));

  const cookies = getSetCookies(headers);
  assertEquals(cookies.length, 1);
  assertEquals(cookies[0]?.name, CSRF_COOKIE_NAME);
  assertEquals(cookies[0]?.value, 'csrf-1');
  assertEquals(cookies[0]?.path, '/');
  assertEquals(cookies[0]?.sameSite, 'Lax');
  assertEquals(cookies[0]?.secure, true);
  assertEquals(cookies[0]?.httpOnly, true);
});

Deno.test('readCsrfToken reads the token from request cookies', () => {
  const request = new Request('https://example.com/forms', {
    headers: new Headers({
      cookie: `${CSRF_COOKIE_NAME}=csrf-1`,
    }),
  });

  assertEquals(readCsrfToken(request), 'csrf-1');
});
