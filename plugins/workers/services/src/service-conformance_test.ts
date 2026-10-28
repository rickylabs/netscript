/**
 * Conformance oracles for the public workers `./service` policy, compiler and HTTP/TLS behavior.
 *
 * One denied-all stdin JS child feeds `startWorkersService` the postures the native
 * `assertServiceAuthPolicy` rejects (the redacted native `TypeError`) and the ones it permits (the
 * factory reaches exactly the denied `PORT` read). Type-only facade fixtures run through
 * `deno run --check --frozen` on stdin: the positive evaluates to a marker, each negative fails on
 * its intended TS code and field. HTTP/TLS children also exercise real listeners and owned KV.
 */

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from '@std/path';
import { createSandbox } from './service-test-fixture.ts';

const PUBLIC_SUBPATH = '@netscript/plugin-workers/service';
const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const NATIVE_POLICY_ERROR =
  'Service auth requires { authn: { authenticator }, authz?: { authorizer } } or { public: true, reason: "nonblank explanation" }; do not combine guarded and public fields.';
const DENIED_PORT_ERROR = 'Requires env access to "PORT", run again with the --allow-env flag';

/** Child-side `auth` expressions the native assertion rejects (`guarded` = `{ authenticator }`). */
const INVALID_POLICIES: readonly string[] = [
  'null',
  '[]',
  '{ public: true }',
  "{ public: false, reason: 'opted out' }",
  "{ public: true, reason: ' ' }",
  "{ public: true, reason: 'mixed', authn: guarded }",
  "{ authn: guarded, reason: 'guarded with reason' }",
  '{ authz: { authorizer } }',
  '{ authn: {} }',
  '{ authn: { authenticator: () => undefined } }',
  "{ authn: { authenticator: { authenticate: 'nope' } } }",
  '{ authn: guarded, authz: null }',
  '{ authn: guarded, authz: { authorizer: { authorize: 42 } } }',
];
/** Expressions the native assertion permits, so the factory proceeds to the denied `PORT` read. */
const PERMITTED_POLICIES: readonly string[] = [
  '{ authn: guarded }',
  '{ authn: guarded, authz: undefined }',
  '{ authn: guarded, authz: { authorizer } }',
  "{ public: true, reason: 'S3b ordering control: a valid posture reaches the PORT read' }",
];

Deno.test({
  name:
    'denied child: rejected postures are the redacted native TypeError and permitted ones reach the denied PORT read',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    const run = await sandbox.run(createPolicyProbe(), { cwd: PLUGIN_ROOT });
    assertEquals(run.stderr, '');
    assertEquals(run.code, 0);
    const report: unknown = JSON.parse(run.stdout);
    assertEquals(report, [
      ...['missing options', 'missing auth', ...INVALID_POLICIES]
        .map((policy) => ({ policy, outcome: ['TypeError', NATIVE_POLICY_ERROR] })),
      ...PERMITTED_POLICIES
        .map((policy) => ({ policy, outcome: ['NotCapable', DENIED_PORT_ERROR] })),
    ]);
  },
});

/** Child module source: plain JS, no types or casts; the ports are inert stubs, never called. */
function createPolicyProbe(): string {
  const policyRows = [...INVALID_POLICIES, ...PERMITTED_POLICIES]
    .map((policy) => `  [${JSON.stringify(policy)}, { auth: ${policy} }],`).join('\n');
  return `import { startWorkersService } from '${PUBLIC_SUBPATH}';
const context = { db: {}, contracts: {}, kv: {}, logger: {}, env: {} };
const authenticator = { authenticate() {} };
const authorizer = { authorize() {} };
const guarded = { authenticator };
const rows = [];
for (const [policy, options] of [
  ['missing options', undefined],
  ['missing auth', {}],
${policyRows}
]) rows.push({ policy, outcome: await attempt(() => startWorkersService(context, options)) });
console.log(JSON.stringify(rows));
async function attempt(operation) {
  try { await operation(); return 'resolved'; } catch (error) { return error instanceof Error ? [error.name, error.message] : ['non-error', String(error)]; }
}
`;
}

const FACADE_TYPES = `import type {
  AuthenticatorPort,
  AuthorizerPort,
  PluginServiceContext,
  RunningService,
  ServiceAuthPolicy,
  startWorkersService,
  WorkersServiceOptions,
} from '${PUBLIC_SUBPATH}';
`;

/** Type-only facade fixtures; `diagnostics` is empty for the positive, else every required part. */
const COMPILE_CASES: ReadonlyArray<
  { readonly name: string; readonly source: string; readonly diagnostics: readonly string[] }
> = [
  {
    name: 'positive: guarded and public postures type-check and the uncalled signatures evaluate',
    source: `${FACADE_TYPES}
export function guarded(
  context: PluginServiceContext,
  start: typeof startWorkersService,
  authenticator: AuthenticatorPort,
  authorizer: AuthorizerPort,
): Promise<RunningService> {
  return start(context, {
    auth: { authn: { authenticator }, authz: { authorizer } },
    serve: { hostname: '127.0.0.1', port: 0, handleSignals: false },
  });
}
export function publicPosture(): WorkersServiceOptions {
  return { auth: { public: true, reason: 'Compile fixture: ingress authenticates upstream.' } };
}
console.log('typed');
`,
    diagnostics: [],
  },
  {
    name: 'negative: options without auth',
    source: `${FACADE_TYPES}
export const missingAuth: WorkersServiceOptions = { serve: { port: 0 } };
console.log('typed');
`,
    diagnostics: ['TS2741', "Property 'auth' is missing", 'WorkersServiceOptions'],
  },
  {
    name: 'negative: public and guarded fields combined',
    source: `${FACADE_TYPES}
export function mixed(authenticator: AuthenticatorPort): ServiceAuthPolicy {
  return { public: true, reason: 'posture', authn: { authenticator } };
}
console.log('typed');
`,
    diagnostics: ['TS2322', "property 'authn'", 'ServiceAuthPolicy'],
  },
  {
    name: 'negative: non-callable authenticate',
    source: `${FACADE_TYPES}
export function malformed(): ServiceAuthPolicy {
  return { authn: { authenticator: { authenticate: 'nope' } } };
}
console.log('typed');
`,
    diagnostics: ['TS2322', "property 'authenticate'", 'AuthnRequest'],
  },
];

Deno.test({
  name: 'compiler: facade types accept valid postures; missing, mixed and malformed auth fail',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    for (const { name, source, diagnostics } of COMPILE_CASES) {
      const run = await sandbox.run(source, { cwd: PLUGIN_ROOT, check: true });
      const rejected = diagnostics.length > 0;
      const expected = rejected ? [1, ''] : [0, 'typed\n'];
      assertEquals([run.code, run.stdout], expected, `${name}\n${run.stderr}`);
      // The positive's "Check" banner is cache-dependent; the negatives prove the checker is on.
      const required = rejected ? ['$deno$stdin.mts', 'Type checking failed.', ...diagnostics] : [];
      for (const part of required) assertStringIncludes(run.stderr, part, name);
    }
  },
});

const DESCRIBE_PATH = '/api/v1/workers/describe';
const HTTP_MARKER = 's3c-plain-http: assertions and cleanup settled';
/** The HTTP child type-checks the whole factory graph first, so it gets the explicit long deadline. */
const HTTP_DEADLINE_MS = 30_000;

Deno.test({
  name:
    'plain HTTP: guarded and public factories on 127.0.0.1:0 enforce native auth, stop idempotently and never close the shared KV',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    const run = await sandbox.run(createPlainHttpProbe(sandbox.scratch), {
      cwd: PLUGIN_ROOT,
      http: true,
      deadlineMs: HTTP_DEADLINE_MS,
    });
    assertEquals(run.code, 0, `child failed\nstdout:\n${run.stdout}\nstderr:\n${run.stderr}`);
    assertEquals(run.stdout.split(HTTP_MARKER).length - 1, 1, `marker once\n${run.stdout}`);
    assertEquals(run.stdout.trimEnd().endsWith(HTTP_MARKER), true, run.stdout);
  },
});

/**
 * Child module source (checked TS, no casts). The owned scratch becomes the synthetic project
 * root (`Deno.chdir`) before the owned Deno KV is bound through the public `@netscript/kv` entry
 * and the product factory is imported, so the generated job registry is legitimately absent
 * there. The custom ports record `this` and every request they receive. Handles are stopped and
 * the test-owned KV closed even when initialization or an assertion fails; the primary failure is
 * rethrown first (aggregated with any cleanup failures), and the marker is printed only once
 * everything settled cleanly.
 */
function createPlainHttpProbe(scratch: string): string {
  return `import { closeKv, getRawKv } from '@netscript/kv';
import { assert, assertEquals, assertStrictEquals } from 'jsr:@std/assert@^1';
import type {
  AuthenticatorPort, AuthnRequest, AuthnResult, AuthorizerPort, AuthzDecision, AuthzRequest,
  PluginServiceContext, Principal, RunningService,
} from '${PUBLIC_SUBPATH}';

const scratch = ${JSON.stringify(scratch)};
const PATH = '${DESCRIBE_PATH}';
const context: PluginServiceContext = {
  db: { getClient: () => Promise.reject(new Error('fixture DB must not run')) },
  contracts: {}, kv: {}, logger: {}, env: { PORT: 'not-a-port' },
};
const allowed: Principal = {
  subject: 'fixture:allowed', scopes: ['workers:read'], roles: ['fixture'], scheme: 'custom', claims: { fixture: 'allowed' },
};
const denied: Principal = { ...allowed, subject: 'fixture:denied', scopes: [], claims: { fixture: 'denied' } };
const issued: Principal[] = [];
const authnCalls: { self: unknown; method: string; path: string }[] = [];
const authzCalls: { self: unknown; request: AuthzRequest }[] = [];
const authenticator: AuthenticatorPort = {
  authenticate(request: AuthnRequest): AuthnResult {
    authnCalls.push({ self: this, method: request.method, path: request.path });
    const token = request.header('x-fixture-token');
    if (token === 'outage') throw new Error('fixture authenticator outage');
    if (token === undefined) return { ok: false, reason: 'missing-credential' };
    const principal = token === 'allowed' ? allowed : token === 'denied' ? denied : undefined;
    if (principal === undefined) return { ok: false, reason: 'invalid-credential' };
    issued.push(principal);
    return { ok: true, principal };
  },
};
const authorizer: AuthorizerPort = {
  authorize(request: AuthzRequest): AuthzDecision {
    authzCalls.push({ self: this, request });
    return request.principal.scopes.includes('workers:read') ? { allow: true } : { allow: false, reason: 'scope-missing' };
  },
};
const serve = { hostname: '127.0.0.1', port: 0, handleSignals: false };
async function call(port: number, token?: string): Promise<[number, unknown]> {
  const response = await fetch(\`http://127.0.0.1:\${port}\${PATH}\`, {
    headers: token === undefined ? {} : { 'x-fixture-token': token },
  });
  return [response.status, await response.json()];
}
async function roundTrip(kv: Deno.Kv, key: string): Promise<void> {
  await kv.set(['s3c', key], key);
  assertEquals((await kv.get(['s3c', key])).value, key);
}

let guarded: RunningService | undefined;
let open: RunningService | undefined;
const failures: unknown[] = [];
try {
  Deno.chdir(scratch);
  const kv = await getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite', skipServiceDiscovery: true });
  const { startWorkersService } = await import('${PUBLIC_SUBPATH}');
  guarded = await startWorkersService(context, { auth: { authn: { authenticator }, authz: { authorizer } }, serve });
  const firstPort = guarded.addr.port;
  assertEquals([guarded.addr.hostname, guarded.addr.transport], ['127.0.0.1', 'tcp']);
  assert(Number.isInteger(firstPort) && firstPort > 0, 'explicit port 0 must allocate a positive port');
  assertEquals(await call(firstPort), [401, { error: 'UNAUTHORIZED', message: 'missing-credential' }]);
  assertEquals(await call(firstPort, 'wrong'), [401, { error: 'UNAUTHORIZED', message: 'invalid-credential' }]);
  assertEquals(await call(firstPort, 'outage'), [503, { error: 'SERVICE_UNAVAILABLE', message: 'Authentication service unavailable' }]);
  assertEquals(await call(firstPort, 'denied'), [403, { error: 'FORBIDDEN', message: 'scope-missing' }]);
  const [status, body] = await call(firstPort, 'allowed');
  assertEquals(status, 200);
  assert(typeof body === 'object' && body !== null && 'capabilities' in body && Array.isArray(body.capabilities));
  assert(body.capabilities.includes('background-processor'), 'describe document');
  assertEquals(authnCalls.map((c) => [c.self === authenticator, c.method, c.path]), Array(5).fill([true, 'GET', PATH]));
  assertEquals(authzCalls.map((c) => [c.self === authorizer, c.request.method, c.request.path, c.request.principal.claims.fixture]), [[true, 'GET', PATH, 'denied'], [true, 'GET', PATH, 'allowed']]);
  assertEquals(authzCalls.map((c, i) => c.request.principal === issued[i]), [true, true]);
  assertStrictEquals(issued[0], denied);
  assertStrictEquals(issued[1], allowed);

  open = await startWorkersService(context, { auth: { public: true, reason: 'S3c control: second public instance, no credential' }, serve });
  assert(open.addr.port > 0 && open.addr.port !== firstPort, 'second instance gets its own port');
  assertEquals((await call(open.addr.port))[0], 200);
  await guarded.stop();
  await guarded.stop();
  Deno.listen({ hostname: '127.0.0.1', port: firstPort }).close();
  assertEquals((await call(open.addr.port))[0], 200, 'second instance serves after the first stopped');
  await roundTrip(kv, 'after-first-stop');
  await open.stop();
  await open.stop();
  await roundTrip(kv, 'after-both-stops');
} catch (error) {
  failures.push(error);
}
for (const handle of [guarded, open]) {
  try { await handle?.stop(); } catch (error) { failures.push(error); }
}
try { await closeKv(); } catch (error) { failures.push(error); }
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures, failures.map(String).join('\\n'));
console.log('${HTTP_MARKER}');
`;
}

/**
 * Public test-only TLS material (protects nothing): generated offline through the platform
 * `CertificateRequest` API with ephemeral ECDSA P-256/SHA-256 keys; no store, openssl or
 * dependency. CA valid 2026-10-26..2036-10-26; `127.0.0.1` IP-SAN serverAuth leaf through
 * 2036-10-25. Provenance receipt: `.llm/tmp/u1-s3/tls/out/receipt.json` (accepted S3a bundle).
 */
const TLS_TEST_CA = `-----BEGIN CERTIFICATE-----
MIIBmDCCAT6gAwIBAgIIIAysTZOxbxQwCgYIKoZIzj0EAwIwMDEuMCwGA1UEAxMl
TmV0U2NyaXB0IFdvcmtlcnMgQ29uZm9ybWFuY2UgVGVzdCBDQTAeFw0yNjEwMjYw
MDAwMDBaFw0zNjEwMjYwMDAwMDBaMDAxLjAsBgNVBAMTJU5ldFNjcmlwdCBXb3Jr
ZXJzIENvbmZvcm1hbmNlIFRlc3QgQ0EwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC
AAQU+FCHLE3tOvofkppWZpkSS2fncW2pcFwS9paD4DzwrISLnyVDK/kAowu1NR+a
MlItTX0Rt6u+NE7LHsmycznGo0IwQDAPBgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB
/wQEAwIBBjAdBgNVHQ4EFgQUof09+hTWofXVLCM36DuPYvpVR7kwCgYIKoZIzj0E
AwIDSAAwRQIgWNntyzMArb+dATq7zdp1Am0r08Fc3Yc6B/B3IqOz+eUCIQDKWmTx
1EFBptwS7IYtNeQYdJxICb8JSUDL223WioQkRg==
-----END CERTIFICATE-----
`;
const TLS_TEST_LEAF_CERT = `-----BEGIN CERTIFICATE-----
MIIBqDCCAU2gAwIBAgIQFQwzjH9/QZpPK+q55yRq5jAKBggqhkjOPQQDAjAwMS4w
LAYDVQQDEyVOZXRTY3JpcHQgV29ya2VycyBDb25mb3JtYW5jZSBUZXN0IENBMB4X
DTI2MTAyNjAwMDAwMFoXDTM2MTAyNTAwMDAwMFowFDESMBAGA1UEAxMJMTI3LjAu
MC4xMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmQHiNT+b7mWh4rH7gpWwAG/i
uR5rjMI5pTURajaaB/d9UjiUbOrudMr3x9N3kGEeOmRuZlmLUOB7w+QrA6jIq6Nl
MGMwDAYDVR0TAQH/BAIwADAOBgNVHQ8BAf8EBAMCB4AwEwYDVR0lBAwwCgYIKwYB
BQUHAwEwDwYDVR0RBAgwBocEfwAAATAdBgNVHQ4EFgQUnaUqqQUIIEDTscU3l7XG
GDwraCQwCgYIKoZIzj0EAwIDSQAwRgIhAPraaUk6bFq0BmgTdydEyHxPo1TUX4Hy
BJo4puhAoXrWAiEAjOiRcHH4tqX47sshpUKBXDBt9TAn3H9YbSAUuJsNfJI=
-----END CERTIFICATE-----
`;
const TLS_TEST_LEAF_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgMqM6ImTpxkSxqDK1
s/C12GultII0sQ6W/zMYEpYDDJChRANCAASZAeI1P5vuZaHisfuClbAAb+K5HmuM
wjmlNRFqNpoH931SOJRs6u50yvfH03eQYR46ZG5mWYtQ4HvD5CsDqMir
-----END PRIVATE KEY-----
`;
const TLS_MARKER = 's3d-trusted-tls: assertions and cleanup settled';

Deno.test({
  name:
    'trusted TLS: inline serve.tls on 127.0.0.1:0 serves 401/200 to a CA-trusting client through native auth and rejects an untrusted client',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    const run = await sandbox.run(createTrustedTlsProbe(sandbox.scratch), {
      cwd: PLUGIN_ROOT,
      http: true,
      deadlineMs: HTTP_DEADLINE_MS,
    });
    assertEquals(run.code, 0, `child failed\nstdout:\n${run.stdout}\nstderr:\n${run.stderr}`);
    assertEquals(run.stdout.split(TLS_MARKER).length - 1, 1, `marker once\n${run.stdout}`);
    assertEquals(run.stdout.trimEnd().endsWith(TLS_MARKER), true, run.stdout);
  },
});

/**
 * Child module source (checked TS, no casts) with the plain HTTP probe's owned-scratch, KV and
 * import discipline. The factory gets the public leaf cert/key inline; a native `HttpClient`
 * trusting the fixture CA makes the real guarded requests, and a second client without that
 * trust must fail the handshake with a `TypeError` (an unexpected response is consumed first).
 * Both clients close before the idempotent stop; the marker prints only after settled cleanup.
 */
function createTrustedTlsProbe(scratch: string): string {
  return `import { closeKv, getRawKv } from '@netscript/kv';
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import type {
  AuthenticatorPort, AuthnRequest, AuthnResult, AuthorizerPort, AuthzDecision, AuthzRequest,
  PluginServiceContext, Principal, RunningService,
} from '${PUBLIC_SUBPATH}';

const scratch = ${JSON.stringify(scratch)};
const PATH = '${DESCRIBE_PATH}';
const CA = ${JSON.stringify(TLS_TEST_CA)};
const context: PluginServiceContext = {
  db: { getClient: () => Promise.reject(new Error('fixture DB must not run')) },
  contracts: {}, kv: {}, logger: {}, env: { PORT: 'not-a-port' },
};
const principal: Principal = {
  subject: 'fixture:tls', scopes: ['workers:read'], roles: ['fixture'], scheme: 'custom', claims: { fixture: 'tls' },
};
const authenticator: AuthenticatorPort = {
  authenticate(request: AuthnRequest): AuthnResult {
    const token = request.header('x-fixture-token');
    if (token === undefined) return { ok: false, reason: 'missing-credential' };
    return token === 'allowed' ? { ok: true, principal } : { ok: false, reason: 'invalid-credential' };
  },
};
const authorizer: AuthorizerPort = {
  authorize(request: AuthzRequest): AuthzDecision {
    return request.principal === principal ? { allow: true } : { allow: false, reason: 'unknown-principal' };
  },
};
const clients: Deno.HttpClient[] = [];
/** The configured \`dom\` lib types \`fetch\` without Deno's stable \`client\` extension; name it. */
function request(url: string, client: Deno.HttpClient, token?: string): Promise<Response> {
  const init: RequestInit & { client: Deno.HttpClient } = {
    client, headers: token === undefined ? {} : { 'x-fixture-token': token },
  };
  return fetch(url, init);
}
let running: RunningService | undefined;
const failures: unknown[] = [];
try {
  Deno.chdir(scratch);
  await getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite', skipServiceDiscovery: true });
  const { startWorkersService } = await import('${PUBLIC_SUBPATH}');
  running = await startWorkersService(context, {
    auth: { authn: { authenticator }, authz: { authorizer } },
    serve: {
      hostname: '127.0.0.1', port: 0, handleSignals: false,
      tls: { cert: ${JSON.stringify(TLS_TEST_LEAF_CERT)}, key: ${
    JSON.stringify(TLS_TEST_LEAF_KEY)
  } },
    },
  });
  const port = running.addr.port;
  assert(Number.isInteger(port) && port > 0, 'explicit port 0 must allocate a positive port');
  const url = \`https://127.0.0.1:\${port}\${PATH}\`;
  const trusted = Deno.createHttpClient({ caCerts: [CA] });
  clients.push(trusted);
  const anonymous = await request(url, trusted);
  assertEquals([anonymous.status, await anonymous.json()], [401, { error: 'UNAUTHORIZED', message: 'missing-credential' }]);
  const granted = await request(url, trusted, 'allowed');
  const body: unknown = await granted.json();
  assertEquals(granted.status, 200);
  assert(typeof body === 'object' && body !== null && 'capabilities' in body && Array.isArray(body.capabilities));
  assert(body.capabilities.includes('background-processor'), 'describe document over TLS');
  const untrusted = Deno.createHttpClient({});
  clients.push(untrusted);
  const leaked = await request(url, untrusted).catch((error: unknown) => {
    assert(error instanceof TypeError, \`untrusted client must fail with TypeError, got \${String(error)}\`);
    return undefined;
  });
  if (leaked !== undefined) {
    await leaked.body?.cancel();
    throw new Error(\`untrusted client was not rejected: HTTP \${leaked.status}\`);
  }
  for (const client of clients.splice(0)) client.close();
  await running.stop();
  await running.stop();
  Deno.listen({ hostname: '127.0.0.1', port }).close();
} catch (error) {
  failures.push(error);
}
for (const client of clients.splice(0)) {
  try { client.close(); } catch (error) { failures.push(error); }
}
try { await running?.stop(); } catch (error) { failures.push(error); }
try { await closeKv(); } catch (error) { failures.push(error); }
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures, failures.map(String).join('\\n'));
console.log('${TLS_MARKER}');
`;
}
