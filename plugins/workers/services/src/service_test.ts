/**
 * Oracles for the public workers `./service` subpath.
 *
 * S1 scope: `@netscript/plugin-workers/service` resolves to `services/mod.ts`, imports inertly
 * with every capability (including read) denied, and `startWorkersService` asserts the caller's
 * auth posture before any env, KV, storage or listener work. Every child is a `deno run -`
 * module (stdin) because `deno eval` grants all permissions and ignores `--deny-*`; each child
 * runs with a cleared environment, scratch-only profile/temp roots, the task-owned module cache
 * and a watchdog deadline, so no real user state is reachable and no child can wait forever.
 */

import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from '@std/path';
import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { ServiceAuthPolicy } from '@netscript/service/auth';
import { startWorkersService } from '../mod.ts';

const PUBLIC_SUBPATH = '@netscript/plugin-workers/service';
const PUBLIC_MODULE = new URL('../mod.ts', import.meta.url).href;
const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const CHILD_DEADLINE_MS = 10_000;
const DENY_EVERYTHING: readonly string[] = [
  '--cached-only',
  '--deny-read',
  '--deny-env',
  '--deny-net',
  '--deny-write',
  '--deny-run',
  '--deny-sys',
  '--deny-ffi',
];
const NATIVE_POLICY_ERROR =
  'Service auth requires { authn: { authenticator }, authz?: { authorizer } } or { public: true, reason: "nonblank explanation" }; do not combine guarded and public fields.';
const LEGACY_PORT_ERROR = 'Workers API requires the host-provided PORT environment variable.';
const DENIED_PORT_ERROR = 'Requires env access to "PORT", run again with the --allow-env flag';
const BLANK_REASONS: readonly string[] = ['', ' \t\n'];
const VALID_REASON = 'S1 ordering control: valid posture reaches the PORT read';

interface ChildOutput {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

Deno.test({
  name:
    'permission controls: static module loading survives --deny-read while runtime read, env and net are refused',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    const scratch = await Deno.makeTempDir({ prefix: 'workers-service-controls-' });
    try {
      await Deno.writeTextFile(`${scratch}/inert.ts`, 'export const inert = true;\n');
      const denoDir = await resolveDenoDir();
      const controls: ReadonlyArray<{
        readonly label: string;
        readonly source: string;
        readonly code: number;
        readonly stdout: string;
        readonly stderr: string;
      }> = [
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
        const child = await runDeniedChild(control.source, scratch, scratch, denoDir);
        assertEquals(child.code, control.code, `${control.label}: exit code\n${child.stderr}`);
        assertEquals(child.stdout, control.stdout, `${control.label}: stdout`);
        assertStringIncludes(child.stderr, control.stderr, `${control.label}: stderr`);
      }
    } finally {
      await Deno.remove(scratch, { recursive: true });
    }
  },
});

Deno.test({
  name:
    `${PUBLIC_SUBPATH} resolves to services/mod.ts and imports inertly with every capability denied under a cleared environment`,
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    const scratch = await Deno.makeTempDir({ prefix: 'workers-service-inert-' });
    try {
      const child = await runDeniedChild(
        `import '${PUBLIC_SUBPATH}';\n` +
          `console.log(import.meta.resolve('${PUBLIC_SUBPATH}'));\n`,
        PLUGIN_ROOT,
        scratch,
        await resolveDenoDir(),
      );
      assertEquals(child.stderr, '');
      assertEquals(child.stdout, `${PUBLIC_MODULE}\n`);
      assertEquals(child.code, 0);
    } finally {
      await Deno.remove(scratch, { recursive: true });
    }
  },
});

Deno.test({
  name:
    'startWorkersService rejects a blank public reason before reading PORT or touching host resources',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await withoutProcessPort(async () => {
      for (const reason of BLANK_REASONS) {
        const host = createUntouchedHost();
        const auth: ServiceAuthPolicy = { public: true, reason };
        await assertRejects(
          () => startWorkersService(host.context, { auth }),
          TypeError,
          NATIVE_POLICY_ERROR,
          JSON.stringify(reason),
        );
        assertEquals(
          host.touches,
          [],
          `${JSON.stringify(reason)}: host resources must stay untouched`,
        );
      }
    });
  },
});

Deno.test({
  name:
    'startWorkersService keeps the legacy missing-PORT failure after a valid auth posture, before host resources',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await withoutProcessPort(async () => {
      const host = createUntouchedHost();
      await assertRejects(
        () => startWorkersService(host.context, { auth: { public: true, reason: VALID_REASON } }),
        Error,
        LEGACY_PORT_ERROR,
      );
      assertEquals(host.touches, []);
    });
  },
});

Deno.test({
  name: 'denied child: the auth assertion precedes every env, KV, storage and listener capability',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    const scratch = await Deno.makeTempDir({ prefix: 'workers-service-auth-' });
    try {
      const child = await runDeniedChild(
        createDeniedAuthProbe(),
        PLUGIN_ROOT,
        scratch,
        await resolveDenoDir(),
      );
      assertEquals(child.stderr, '');
      assertEquals(child.code, 0);
      const report: unknown = JSON.parse(child.stdout);
      assertEquals(report, {
        envControl: 'NotCapable',
        rows: [
          ...BLANK_REASONS.map((reason) => ({
            reason,
            outcome: ['TypeError', NATIVE_POLICY_ERROR],
          })),
          { reason: VALID_REASON, outcome: ['NotCapable', DENIED_PORT_ERROR] },
        ],
      });
    } finally {
      await Deno.remove(scratch, { recursive: true });
    }
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

/** Runs `fn` with `PORT` removed from the test process, restoring any preseeded value. */
async function withoutProcessPort(fn: () => Promise<void>): Promise<void> {
  const preseeded = Deno.env.get('PORT');
  Deno.env.delete('PORT');
  try {
    await fn();
  } finally {
    if (preseeded !== undefined) Deno.env.set('PORT', preseeded);
  }
}

/** A typed host context whose resolvers record every touch and never resolve. */
function createUntouchedHost(): {
  readonly context: PluginServiceContext;
  readonly touches: string[];
} {
  const touches: string[] = [];
  const context: PluginServiceContext = {
    db: {
      getClient(): Promise<unknown> {
        touches.push('db.getClient');
        return Promise.reject(new Error('db.getClient must not run before the auth assertion'));
      },
    },
    contracts: Object.freeze({}),
    kv: Object.freeze({}),
    logger: Object.freeze({}),
    env: Object.freeze({}),
  };
  return { context, touches };
}

/**
 * Runs `source` as a stdin module (`deno run -`) with every capability denied, a cleared
 * environment and scratch-only profile roots. Static imports load through the module loader,
 * which the permission controls above prove is not a read grant.
 */
function runDeniedChild(
  source: string,
  cwd: string,
  scratch: string,
  denoDir: string,
): Promise<ChildOutput> {
  return runBounded(['run', ...DENY_EVERYTHING, '-'], {
    cwd,
    clearEnv: true,
    env: createIsolatedChildEnv(scratch, denoDir),
    stdin: source,
  });
}

/**
 * Spawns this Deno binary with `args`, keeps the original child handle, captures both streams
 * and kills the child when the deadline elapses. A timeout is always reported as a failure.
 */
async function runBounded(
  args: readonly string[],
  options: {
    readonly cwd?: string;
    readonly clearEnv?: boolean;
    readonly env?: Record<string, string>;
    readonly stdin?: string;
  },
): Promise<ChildOutput> {
  const child = new Deno.Command(Deno.execPath(), {
    args: [...args],
    cwd: options.cwd,
    clearEnv: options.clearEnv,
    env: options.env,
    stdin: options.stdin === undefined ? 'null' : 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let timedOut = false;
  const watchdog = setTimeout(() => {
    timedOut = true;
    killQuietly(child);
  }, CHILD_DEADLINE_MS);
  try {
    if (options.stdin !== undefined) {
      const writer = child.stdin.getWriter();
      await writer.write(new TextEncoder().encode(options.stdin));
      await writer.close();
    }
    const output = await child.output();
    if (timedOut) {
      throw new Error(`deno ${args.join(' ')} exceeded ${CHILD_DEADLINE_MS}ms and was killed`);
    }
    const decoder = new TextDecoder();
    return {
      code: output.code,
      stdout: decoder.decode(output.stdout),
      stderr: decoder.decode(output.stderr),
    };
  } catch (error) {
    killQuietly(child);
    throw error;
  } finally {
    clearTimeout(watchdog);
  }
}

/** Kills a child that may already have exited; the caller reports the failure, not the kill. */
function killQuietly(child: Deno.ChildProcess): void {
  try {
    child.kill();
  } catch {
    // Already exited: nothing left to stop.
  }
}

/** Child environment: task-owned cache plus scratch-only profile and temp roots. */
function createIsolatedChildEnv(scratch: string, denoDir: string): Record<string, string> {
  const env: Record<string, string> = {
    DENO_DIR: denoDir,
    HOME: scratch,
    USERPROFILE: scratch,
    LOCALAPPDATA: scratch,
    TMP: scratch,
    TEMP: scratch,
    TMPDIR: scratch,
    XDG_CACHE_HOME: scratch,
    XDG_CONFIG_HOME: scratch,
    XDG_DATA_HOME: scratch,
    XDG_STATE_HOME: scratch,
  };
  const systemRoot = Deno.env.get('SystemRoot');
  if (systemRoot !== undefined) env.SystemRoot = systemRoot;
  return env;
}

/** The module cache this test process already uses; never a guessed profile path. */
async function resolveDenoDir(): Promise<string> {
  const configured = Deno.env.get('DENO_DIR');
  if (configured !== undefined) return configured;
  const info = await runBounded(['info', '--json'], {});
  const parsed: unknown = JSON.parse(info.stdout);
  const denoDir = typeof parsed === 'object' && parsed !== null
    ? Reflect.get(parsed, 'denoDir')
    : undefined;
  if (typeof denoDir !== 'string' || denoDir.length === 0) {
    throw new Error('deno info did not report a denoDir; refusing to guess a cache location');
  }
  return denoDir;
}
