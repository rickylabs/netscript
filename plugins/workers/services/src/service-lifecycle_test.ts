/** Caller-owned AbortSignal qualification for the public workers `./service` listener. */
import { assertEquals } from 'jsr:@std/assert@^1';
import { stripAnsiCode } from 'jsr:@std/fmt@1/colors';
import { fromFileUrl } from '@std/path';
import { createSandbox } from './service-test-fixture.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const SUCCESS_MARKER = 's3e-caller-abort: assertions and cleanup settled';
const CLEANUP_MARKER = 's3e-caller-abort: listener and owned KV cleanup settled';

Deno.test({
  name:
    'caller AbortSignal releases the workers listener before stop and preserves caller-owned KV',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    for (const withSignal of [true, false]) {
      await using sandbox = await createSandbox();
      const run = await sandbox.run(createAbortProbe(sandbox.scratch, withSignal), {
        cwd: PLUGIN_ROOT,
        http: true,
        deadlineMs: 30_000,
      });
      const evidence = JSON.stringify({ withSignal, ...run });
      console.log(evidence);
      assertEquals(run.code, withSignal ? 0 : 1, evidence);
      assertEquals(run.stdout.split(CLEANUP_MARKER).length - 1, 1, evidence);
      assertEquals(run.stdout.split(SUCCESS_MARKER).length - 1, withSignal ? 1 : 0, evidence);
      if (withSignal) {
        assertEquals(run.stdout.trimEnd().endsWith(SUCCESS_MARKER), true, evidence);
      } else {
        const stderr = stripAnsiCode(run.stderr);
        assertEquals(stderr.match(/^error: .*$/gm), [
          'error: Uncaught (in promise) Error: ABORT_DID_NOT_RELEASE',
        ], evidence);
      }
    }
  },
});

/** Both fresh children differ only in whether the native serve options receive the signal. */
function createAbortProbe(scratch: string, withSignal: boolean): string {
  return `import { closeKv, getRawKv } from '@netscript/kv';
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import type { PluginServiceContext, RunningService } from '@netscript/plugin-workers/service';

const scratch = ${JSON.stringify(scratch)};
const controller = new AbortController();
const context: PluginServiceContext = {
  db: { getClient: () => Promise.reject(new Error('fixture DB must not run')) },
  contracts: {}, kv: {}, logger: {}, env: { PORT: 'not-a-port' },
};
let running: RunningService | undefined;
let kv: Deno.Kv | undefined;
const failures: unknown[] = [];
try {
  Deno.chdir(scratch);
  kv = await getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite', skipServiceDiscovery: true });
  const { startWorkersService } = await import('@netscript/plugin-workers/service');
  running = await startWorkersService(context, {
    auth: { public: true, reason: 'S3e synthetic caller-owned AbortSignal qualification' },
    serve: { hostname: '127.0.0.1', port: 0, handleSignals: false, ${
    withSignal ? 'signal: controller.signal' : ''
  } },
  });
  const port = running.addr.port;
  assertEquals([running.addr.hostname, running.addr.transport], ['127.0.0.1', 'tcp']);
  assert(Number.isInteger(port) && port > 0, 'explicit port 0 must allocate a positive port');
  const response = await fetch(\`http://127.0.0.1:\${port}/api/v1/workers/describe\`);
  const body: unknown = await response.json();
  assertEquals(response.status, 200);
  assert(typeof body === 'object' && body !== null && 'capabilities' in body && Array.isArray(body.capabilities));
  assert(body.capabilities.includes('background-processor'), 'real workers describe document');
  controller.abort();
  const deadline = performance.now() + 2_000;
  while (true) {
    if (performance.now() >= deadline) throw new Error('ABORT_DID_NOT_RELEASE');
    try {
      Deno.listen({ hostname: '127.0.0.1', port }).close();
      break;
    } catch (error) {
      if (!(error instanceof Deno.errors.AddrInUse)) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }
} catch (error) {
  failures.push(error);
}
const primaryFailures = failures.length;
try {
  if (running !== undefined) {
    await running.stop();
    await running.stop();
    Deno.listen({ hostname: '127.0.0.1', port: running.addr.port }).close();
    assert(kv !== undefined, 'started handle has an owned KV');
    await kv.set(['s3e', 'after-stop'], 'caller-owned');
    assertEquals((await kv.get(['s3e', 'after-stop'])).value, 'caller-owned');
  }
} catch (error) {
  failures.push(error);
}
try { await closeKv(); } catch (error) { failures.push(error); }
if (failures.length === primaryFailures) console.log('${CLEANUP_MARKER}');
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures, failures.map(String).join('\\n'));
console.log('${SUCCESS_MARKER}');
`;
}

const DRAIN_MARKER = 's3f-inflight-drain: response, stops and cleanup settled';
const DRAIN_CLEANUP_MARKER = 's3f-inflight-drain: real request, listener and KV cleanup settled';

Deno.test({
  name:
    'two native stops drain an auth-held request; observation-negative control detects early completion',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    for (const observationNegative of [false, true]) {
      await using sandbox = await createSandbox();
      const run = await sandbox.run(createDrainProbe(sandbox.scratch, observationNegative), {
        cwd: PLUGIN_ROOT,
        http: true,
        deadlineMs: 30_000,
      });
      const evidence = JSON.stringify({ observationNegative, ...run });
      console.log(evidence);
      assertEquals(run.code, observationNegative ? 1 : 0, evidence);
      assertEquals(run.stdout.split(DRAIN_CLEANUP_MARKER).length - 1, 1, evidence);
      assertEquals(
        run.stdout.split(DRAIN_MARKER).length - 1,
        observationNegative ? 0 : 1,
        evidence,
      );
      if (observationNegative) {
        assertEquals(stripAnsiCode(run.stderr).match(/^error: .*$/gm), [
          'error: Uncaught (in promise) Error: DRAIN_COMPLETED_BEFORE_RELEASE',
        ], evidence);
      } else {
        assertEquals(run.stdout.trimEnd().endsWith(DRAIN_MARKER), true, evidence);
      }
    }
  },
});

/** The negative changes only an observation promise; both real native stops still run and settle. */
function createDrainProbe(scratch: string, observationNegative: boolean): string {
  return `import { closeKv, getRawKv } from '@netscript/kv';
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import type { AuthenticatorPort, PluginServiceContext, RunningService } from '@netscript/plugin-workers/service';

const scratch = ${JSON.stringify(scratch)};
const entered = Promise.withResolvers<void>();
const release = Promise.withResolvers<void>();
const authenticator: AuthenticatorPort = {
  async authenticate(request) {
    assertEquals([request.method, request.path], ['GET', '/api/v1/workers/describe']);
    entered.resolve();
    await release.promise;
    return { ok: true, principal: { subject: 'fixture:drain', scopes: [], roles: [], scheme: 'custom', claims: {} } };
  },
};
const context: PluginServiceContext = {
  db: { getClient: () => Promise.reject(new Error('fixture DB must not run')) },
  contracts: {}, kv: {}, logger: {}, env: { PORT: 'not-a-port' },
};
let running: RunningService | undefined;
let kv: Deno.Kv | undefined;
let response: Promise<{ status: number; body: unknown }> | undefined;
const stops: Promise<void>[] = [];
const failures: unknown[] = [];
try {
  Deno.chdir(scratch);
  kv = await getRawKv({ provider: 'deno-kv', path: scratch + '/owned.sqlite', skipServiceDiscovery: true });
  const { startWorkersService } = await import('@netscript/plugin-workers/service');
  running = await startWorkersService(context, {
    auth: { authn: { authenticator } },
    serve: { hostname: '127.0.0.1', port: 0, handleSignals: false, drainTimeoutMs: 5_000 },
  });
  const port = running.addr.port;
  assertEquals([running.addr.hostname, running.addr.transport], ['127.0.0.1', 'tcp']);
  assert(Number.isInteger(port) && port > 0);
  response = fetch(\`http://127.0.0.1:\${port}/api/v1/workers/describe\`)
    .then(async (result) => ({ status: result.status, body: await result.json() }));
  await Promise.race([entered.promise, response.then(() => { throw new Error('REQUEST_DID_NOT_WAIT_FOR_AUTH'); })]);
  stops.push(running.stop(), running.stop());
  const observed = stops.map((stop, index) => {
    const state: { status: 'pending' | 'fulfilled' | 'rejected'; error?: unknown } = { status: 'pending' };
    const observation = ${observationNegative} && index === 0 ? Promise.resolve() : stop;
    void observation.then(() => { state.status = 'fulfilled'; }, (error) => { state.status = 'rejected'; state.error = error; });
    return state;
  });
  // Keep rejection handlers on both actual stops, including the observation-negative child.
  const settledStops = Promise.allSettled(stops);
  const deadline = performance.now() + 2_000;
  while (true) {
    if (performance.now() >= deadline) throw new Error('DRAIN_LISTENER_DID_NOT_RELEASE');
    try {
      Deno.listen({ hostname: '127.0.0.1', port }).close();
      break;
    } catch (error) {
      if (!(error instanceof Deno.errors.AddrInUse)) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  for (const state of observed) {
    if (state.status === 'rejected') throw state.error;
    if (state.status === 'fulfilled') throw new Error('DRAIN_COMPLETED_BEFORE_RELEASE');
  }
  release.resolve();
  await settledStops;
} catch (error) {
  failures.push(error);
}
const primaryFailures = failures.length;
release.resolve();
try {
  if (response !== undefined) {
    const result = await response;
    assertEquals(result.status, 200);
    const body = result.body;
    assert(typeof body === 'object' && body !== null && 'capabilities' in body && Array.isArray(body.capabilities));
    assert(body.capabilities.includes('background-processor'), 'real drained describe response');
  }
} catch (error) { failures.push(error); }
for (const stop of stops) {
  try { await stop; } catch (error) { failures.push(error); }
}
try {
  if (running !== undefined) {
    await running.stop();
    Deno.listen({ hostname: '127.0.0.1', port: running.addr.port }).close();
    assert(kv !== undefined);
    await kv.set(['s3f', 'after-drain'], 'caller-owned');
    assertEquals((await kv.get(['s3f', 'after-drain'])).value, 'caller-owned');
  }
} catch (error) { failures.push(error); }
try { await closeKv(); } catch (error) { failures.push(error); }
if (failures.length === primaryFailures) console.log('${DRAIN_CLEANUP_MARKER}');
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures, failures.map(String).join('\\n'));
console.log('${DRAIN_MARKER}');
`;
}
