/**
 * Oracles for the public workers `./service` factory.
 *
 * S1 scope: the new `./service.ts` module is inert at import time, and
 * `startWorkersService` asserts the caller's auth posture before any env, KV,
 * runtime or listener work. Every subprocess runs with a cleared environment
 * and task-owned profile/temp directories so no real user state is reachable.
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { fromFileUrl } from '@std/path';
import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { ServiceAuthPolicy } from '@netscript/service/auth';
import { startWorkersService } from './service.ts';

const SERVICE_MODULE = new URL('./service.ts', import.meta.url);
const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const NATIVE_POLICY_ERROR =
  'Service auth requires { authn: { authenticator }, authz?: { authorizer } } or { public: true, reason: "nonblank explanation" }; do not combine guarded and public fields.';
const LEGACY_PORT_ERROR = 'Workers API requires the host-provided PORT environment variable.';

Deno.test({
  name:
    './service imports with env, net, write, run, sys and ffi denied under a cleared environment',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    const scratch = await Deno.makeTempDir({ prefix: 'workers-service-inert-' });
    try {
      const child = await new Deno.Command(Deno.execPath(), {
        args: [
          'eval',
          '--cached-only',
          '--deny-env',
          '--deny-net',
          '--deny-write',
          '--deny-run',
          '--deny-sys',
          '--deny-ffi',
          `--allow-read=${PLUGIN_ROOT}`,
          `await import(${JSON.stringify(SERVICE_MODULE.href)});`,
        ],
        cwd: PLUGIN_ROOT,
        clearEnv: true,
        env: createIsolatedChildEnv(scratch, await resolveDenoDir()),
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
      }).output();

      assertEquals(new TextDecoder().decode(child.stderr), '');
      assertEquals(new TextDecoder().decode(child.stdout), '');
      assertEquals(child.code, 0);
    } finally {
      await Deno.remove(scratch, { recursive: true });
    }
  },
});

Deno.test({
  name:
    'startWorkersService rejects an invalid auth posture before reading PORT or touching host resources',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    const rows: ReadonlyArray<{ readonly label: string; readonly auth: ServiceAuthPolicy }> = [
      { label: 'blank public reason', auth: { public: true, reason: '' } },
      { label: 'whitespace-only public reason', auth: { public: true, reason: ' \t\n' } },
    ];

    await withoutProcessPort(async () => {
      for (const row of rows) {
        const host = createUntouchedHost();
        await assertRejects(
          () => startWorkersService(host.context, { auth: row.auth }),
          TypeError,
          NATIVE_POLICY_ERROR,
          row.label,
        );
        assertEquals(host.touches, [], `${row.label}: host resources must stay untouched`);
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
        () =>
          startWorkersService(host.context, {
            auth: { public: true, reason: 'S1 ordering control: valid posture, missing PORT' },
          }),
        Error,
        LEGACY_PORT_ERROR,
      );
      assertEquals(host.touches, []);
    });
  },
});

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
  const info = await new Deno.Command(Deno.execPath(), {
    args: ['info', '--json'],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'null',
  }).output();
  const parsed: unknown = JSON.parse(new TextDecoder().decode(info.stdout));
  const denoDir = typeof parsed === 'object' && parsed !== null
    ? Reflect.get(parsed, 'denoDir')
    : undefined;
  if (typeof denoDir !== 'string' || denoDir.length === 0) {
    throw new Error('deno info did not report a denoDir; refusing to guess a cache location');
  }
  return denoDir;
}
