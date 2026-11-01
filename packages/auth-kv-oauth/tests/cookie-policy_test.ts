import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { buildCookieHeader, KvOAuthError, parseCookieHeader } from '../mod.ts';

Deno.test('cookie issuance rejects insecure policy and invalid __Host attributes', () => {
  const request = new Request('https://app.example.test/');
  for (
    const options of [
      { secure: false },
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
  for (const allowInsecureDev of [false, true]) {
    assertThrows(() => {
      // @ts-expect-error The public cookie contract rejects false; untyped callers also fail.
      return buildCookieHeader('session', request, { httpOnly: false, allowInsecureDev });
    }, KvOAuthError);
  }
});

Deno.test('#2115 cookie parsing preserves the session beside an undecodable foreign cookie', () => {
  const cookies = parseCookieHeader('other=%E0%A4%A; __Host-ns_session=abc');
  assertEquals(cookies.get('__Host-ns_session'), 'abc');
  assertEquals(cookies.has('other'), false);
});

Deno.test('#2115 cookie parsing skips malformed escapes and UTF-8 in any position', () => {
  for (const value of ['%', '%2', '%GG', '%FF', '%E0%A4%A', '%ED%A0%80']) {
    for (const header of [`other=${value}; session=abc`, `session=abc; other=${value}`]) {
      assertEquals([...parseCookieHeader(header)], [['session', 'abc']]);
    }
  }
  assertEquals(
    [...parseCookieHeader('first=ok; bad=%; session=abc; alsoBad=%FF; last=ok')],
    [['first', 'ok'], ['session', 'abc'], ['last', 'ok']],
  );
  assertEquals(parseCookieHeader('__Host-ns_session=%FF').has('__Host-ns_session'), false);
});

Deno.test('cookie parsing preserves valid decoding and existing header semantics', () => {
  assertEquals([...parseCookieHeader(undefined)], []);
  assertEquals([...parseCookieHeader('')], []);
  assertEquals(
    [...parseCookieHeader(
      ' ; =ignored; space=hello%20world; unicode=%E2%9C%93; token=a=b==; empty=; bare; plus=a+b; percent=%25FF; ',
    )],
    [
      ['space', 'hello world'],
      ['unicode', '✓'],
      ['token', 'a=b=='],
      ['empty', ''],
      ['bare', ''],
      ['plus', 'a+b'],
      ['percent', '%FF'],
    ],
  );
});

Deno.test('#2115 cookie parsing retains the last valid duplicate value', () => {
  assertEquals(parseCookieHeader('session=first; session=%FF').get('session'), 'first');
  assertEquals(parseCookieHeader('session=%FF; session=last').get('session'), 'last');
  assertEquals(parseCookieHeader('session=first; session=last').get('session'), 'last');
});
