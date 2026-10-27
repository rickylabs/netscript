/**
 * Conformance oracles for the public workers `./service` subpath (S3b: runtime rows + compiler).
 *
 * One denied-all stdin JS child feeds `startWorkersService` the postures the native
 * `assertServiceAuthPolicy` rejects (the redacted native `TypeError`) and the ones it permits (the
 * factory reaches exactly the denied `PORT` read). Type-only facade fixtures run through
 * `deno run --check --frozen` on stdin: the positive evaluates to a marker, each negative fails on
 * its intended TS code and field. Nothing here starts a listener or opens KV.
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
