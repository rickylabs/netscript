import { assertEquals } from '@std/assert';

/**
 * Regression for the sqlite-tier failure `Dashboard traces read failed: HTTP 401`.
 *
 * Aspire hands the dashboard's auth token to callers inside the URL's query string
 * (`https://localhost:PORT?t=<token>`). `new URL(path, base)` resolves against the base's
 * *origin* and drops its query, so building the traces URL that way silently strips the
 * token and the dashboard answers 401. Setting `pathname` on a parsed copy keeps it.
 *
 * The token never appears in assertion messages here: the test compares booleans and the
 * pathname, never printing the URL itself.
 */
Deno.test('new URL(path, base) drops the dashboard token, which is why the traces URL must not use it', () => {
  const dashboardUrl = 'https://localhost:18888?t=REDACTED_FIXTURE_TOKEN';

  const viaBaseResolution = new URL('/api/telemetry/traces', dashboardUrl);
  assertEquals(viaBaseResolution.searchParams.has('t'), false);

  const viaPathname = new URL(dashboardUrl);
  viaPathname.pathname = '/api/telemetry/traces';
  assertEquals(viaPathname.searchParams.has('t'), true);
  assertEquals(viaPathname.pathname, '/api/telemetry/traces');
  assertEquals(viaPathname.origin, viaBaseResolution.origin);
});

Deno.test('a dashboard URL with no query is unchanged by the pathname form', () => {
  const url = new URL('https://localhost:18888');
  url.pathname = '/api/telemetry/traces';
  assertEquals(url.toString(), 'https://localhost:18888/api/telemetry/traces');
});
