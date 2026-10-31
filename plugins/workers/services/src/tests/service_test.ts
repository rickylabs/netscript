/**
 * Oracles for the public workers `./service` subpath.
 *
 * S1 scope: `@netscript/plugin-workers/service` resolves to `services/mod.ts`, imports inertly
 * with every capability (including read) denied, and `startWorkersService` asserts the caller's
 * auth posture before any env, KV, storage or listener work. Every product import happens in a
 * `deno run -` child (stdin module; `deno eval` ignores `--deny-*`) with a cleared environment,
 * scratch-only profile/temp roots, the task-owned module cache, a watchdog deadline and a byte
 * cap on captured output, so no real user state is reachable and no child can wait forever.
 */

import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from '@std/path';
import {
  CHILD_OUTPUT_CAP,
  type ChildRun,
  createSandbox,
} from './test_utils/service-test-fixture.ts';

const PUBLIC_SUBPATH = '@netscript/plugin-workers/service';
const PUBLIC_MODULE = new URL('../../mod.ts', import.meta.url).href;
const PLUGIN_ROOT = fromFileUrl(new URL('../../../', import.meta.url));
const NATIVE_POLICY_ERROR =
  'Service auth requires { authn: { authenticator }, authz?: { authorizer } } or { public: true, reason: "nonblank explanation" }; do not combine guarded and public fields.';
const DENIED_PORT_ERROR = 'Requires env access to "PORT", run again with the --allow-env flag';
const BLANK_REASONS: readonly string[] = ['', ' \t\n'];
const VALID_REASON = 'S1 ordering control: valid posture reaches the PORT read';

Deno.test({
  name:
    'permission controls: static module loading survives --deny-read while runtime read, env and net are refused',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    await Deno.writeTextFile(`${sandbox.scratch}/inert.ts`, 'export const inert = true;\n');
    const controls: ReadonlyArray<{ readonly label: string; readonly source: string } & ChildRun> =
      [
        {
          label: 'positive: a static local import loads while read stays denied',
          source: "import './inert.ts';\n" +
            "console.log(Deno.permissions.querySync({ name: 'read' }).state);\n",
          code: 0,
          stdout: 'denied\n',
          stderr: '',
        },
        {
          label: 'negative: a runtime file read at import time is refused',
          source: "await Deno.readTextFile(new URL('./inert.ts', import.meta.url));\n",
          code: 1,
          stdout: '',
          stderr: 'NotCapable: Requires read access',
        },
        {
          label: 'negative: an env read is refused',
          source: "Deno.env.get('PORT');\n",
          code: 1,
          stdout: '',
          stderr: 'NotCapable: Requires env access',
        },
        {
          label: 'negative: a loopback listen is refused',
          source: "Deno.listen({ hostname: '127.0.0.1', port: 0 });\n",
          code: 1,
          stdout: '',
          stderr: 'NotCapable: Requires net access',
        },
      ];
    for (const control of controls) {
      const run = await sandbox.run(control.source);
      assertEquals(run.code, control.code, `${control.label}: exit code\n${run.stderr}`);
      assertEquals(run.stdout, control.stdout, `${control.label}: stdout`);
      assertStringIncludes(run.stderr, control.stderr, `${control.label}: stderr`);
    }
  },
});

Deno.test({
  name: 'child controls: a stuck child and an over-cap stream are failures that still settle',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    await assertRejects(
      () =>
        sandbox.run('await new Promise((resolve) => setTimeout(resolve, 60_000));\n', {
          deadlineMs: 500,
        }),
      Error,
      'exceeded 500ms',
    );
    await assertRejects(
      () => sandbox.run(`console.log('x'.repeat(${CHILD_OUTPUT_CAP}));\n`),
      Error,
      `stdout: exceeded ${CHILD_OUTPUT_CAP} bytes`,
    );
  },
});

Deno.test({
  name:
    `${PUBLIC_SUBPATH} resolves to services/mod.ts and imports inertly with every capability denied under a cleared environment`,
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    const run = await sandbox.run(
      `import '${PUBLIC_SUBPATH}';\nconsole.log(import.meta.resolve('${PUBLIC_SUBPATH}'));\n`,
      { cwd: PLUGIN_ROOT },
    );
    assertEquals(run.stderr, '');
    assertEquals(run.stdout, `${PUBLIC_MODULE}\n`);
    assertEquals(run.code, 0);
  },
});

Deno.test({
  name: 'denied child: the auth assertion precedes every env, KV, storage and listener capability',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    const run = await sandbox.run(createDeniedAuthProbe(), { cwd: PLUGIN_ROOT });
    assertEquals(run.stderr, '');
    assertEquals(run.code, 0);
    const report: unknown = JSON.parse(run.stdout);
    assertEquals(report, {
      envControl: 'NotCapable',
      rows: [
        ...BLANK_REASONS.map((reason) => ({ reason, outcome: ['TypeError', NATIVE_POLICY_ERROR] })),
        { reason: VALID_REASON, outcome: ['NotCapable', DENIED_PORT_ERROR] },
      ],
    });
  },
});

/**
 * Child module source: a plain runtime caller (no types, no casts) under every `--deny-*` flag.
 * A deliberately denied env read proves the permission oracle is active; any env/KV/storage/
 * listen touch before the auth assertion surfaces as `NotCapable` instead of the native
 * `TypeError`, and the valid posture must reach the denied `PORT` read and nothing else.
 */
function createDeniedAuthProbe(): string {
  return `import { startWorkersService } from '${PUBLIC_SUBPATH}';
const reasons = ${JSON.stringify([...BLANK_REASONS, VALID_REASON])};
const context = {
  db: { getClient: () => Promise.reject(new Error('db.getClient ran before the auth assertion')) },
  contracts: {},
  kv: {},
  logger: {},
  env: {},
};
const rows = [];
for (const reason of reasons) {
  rows.push({ reason, outcome: await attempt(() => startWorkersService(context, { auth: { public: true, reason } })) });
}
console.log(JSON.stringify({ envControl: describe(() => Deno.env.get('PORT')), rows }));
function describe(operation) {
  try {
    operation();
    return 'allowed';
  } catch (error) {
    return error instanceof Error ? error.name : String(error);
  }
}
async function attempt(operation) {
  try {
    await operation();
    return 'resolved';
  } catch (error) {
    return error instanceof Error ? [error.name, error.message] : ['non-error', String(error)];
  }
}
`;
}
