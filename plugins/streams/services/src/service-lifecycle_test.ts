/**
 * Real streams startup failures preserve primary errors and release owned upstreams.
 * Each row uses a fresh checked child and the unchanged bounded native runtime fixture.
 * Caller option access observes the already-bound upstream without replacing its lifecycle.
 * Expected failures return no handle; only real listener rebind establishes release.
 * @module
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';
import { createRuntimeSandbox } from './tests/test_utils/service-runtime-fixture.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const MARKER = 's6d-streams: startup rejection and native cleanup settled';
type FailureMode = 'bind' | 'sentinel' | 'cors';

Deno.test({
  name: 'streams startup: native bind, caller sentinel and CORS failures release upstream',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    const rows: readonly FailureMode[] = ['bind', 'sentinel', 'cors'];
    for (const mode of rows) {
      await using sandbox = await createRuntimeSandbox('startup-' + mode);
      const ports = choosePorts();
      const run = await sandbox.run(probe(sandbox.scratch, ports, mode), {
        cwd: PLUGIN_ROOT,
        preferredPorts: [ports[0]],
      });
      assertEquals(run.code, 0, `${mode}: exit ${run.code}\n${run.stderr}\n${run.stdout}`);
      assertEquals(run.stdout.split(MARKER).length - 1, 1, run.stdout);
      assertEquals(run.stdout.trimEnd().endsWith(MARKER), true, run.stdout);
    }
  },
});

/** Concurrent reservations keep the selected upstream and blocker ports distinct. */
function choosePorts(): readonly [number, number] {
  using upstream = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  using front = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  return [upstream.addr.port, front.addr.port];
}

/** No private upstream handle is exposed; native rebind is the independent cleanup oracle. */
function probe(scratch: string, ports: readonly [number, number], mode: FailureMode): string {
  return `import { assert, assertEquals, assertStrictEquals } from 'jsr:@std/assert@^1';
import type { CorsOptions, RunningService, ServeOptions } from '@netscript/plugin-streams/service';

const scratch = ${JSON.stringify(scratch)};
const [upstream, front] = ${JSON.stringify(ports)};
const mode: string = ${JSON.stringify(mode)};
const sentinel = new Error('S6D_CALLER_HOSTNAME_SENTINEL');
const failures: unknown[] = [];
const reboundPorts: number[] = [];
let blocker: Deno.TcpListener | undefined;
let unexpected: RunningService | undefined;
let observedBound = 0;
let hostnameReads = 0;
let blockerPreserved = false;
let blockerEndpoint: (Deno.NetAddr & { servePort: number | undefined }) | undefined;
let identityPreserved = false;
let rejection: unknown;

function assertOccupied(port: number): void {
  let occupied = false;
  try {
    using probe = Deno.listen({ hostname: '127.0.0.1', port });
    assertEquals(probe.addr.port, port);
  } catch (error) {
    if (!(error instanceof Deno.errors.AddrInUse)) throw error;
    occupied = true;
  }
  assert(occupied, 'EXPECTED_OWNED_PORT_OCCUPIED: ' + port);
}

function observeUpstream(): void {
  assertOccupied(upstream);
  observedBound++;
}

function rebind(port: number): void {
  using listener = Deno.listen({ hostname: '127.0.0.1', port });
  assertEquals(listener.addr.port, port);
  reboundPorts.push(port);
}

try {
  Deno.chdir(scratch);
  Deno.env.set('PORT', 'invalid ambient PORT');
  Deno.env.set('STREAMS_PORT', 'invalid ambient STREAMS_PORT');
  Deno.env.set('STREAMS_INTERNAL_PORT', String(upstream));
  const { startStreamsService } = await import('@netscript/plugin-streams/service');
  if (mode === 'bind') {
    blocker = Deno.listen({ hostname: '127.0.0.1', port: front });
    assertEquals(blocker.addr.port, front);
  }
  const serve: ServeOptions = {
    port: mode === 'bind' ? front : 0,
    handleSignals: false,
    get hostname(): string {
      hostnameReads++;
      observeUpstream();
      if (mode === 'sentinel') throw sentinel;
      return '127.0.0.1';
    },
  };
  const cors: CorsOptions | undefined = mode === 'cors' ? {
    credentials: true,
    get origin(): string {
      observeUpstream();
      return '*';
    },
  } : undefined;
  try {
    unexpected = await startStreamsService({
      auth: { public: true, reason: 'S6d owned startup-failure qualification' },
      serve,
      cors,
    });
  } catch (error) {
    rejection = error;
  }
  console.log(JSON.stringify({ mode, nativeError: rejection instanceof Error
    ? { name: rejection.name, message: rejection.message } : String(rejection) }));
  assertEquals(unexpected, undefined, 'Factory unexpectedly returned a live handle');
  assertEquals(observedBound, 1, 'Upstream must be bound before the selected failure');
  assertEquals(hostnameReads, mode === 'cors' ? 0 : 1);
  if (mode === 'bind') {
    assert(rejection instanceof Deno.errors.AddrInUse, String(rejection));
    assert(blocker !== undefined);
    assertEquals(blocker.addr, { hostname: '127.0.0.1', port: front, transport: 'tcp' });
    assertEquals(serve.port, blocker.addr.port);
    blockerEndpoint = { ...blocker.addr, servePort: serve.port };
    assertOccupied(front);
    blockerPreserved = true;
  } else if (mode === 'sentinel') {
    assertStrictEquals(rejection, sentinel);
    identityPreserved = true;
  } else {
    assert(rejection instanceof TypeError, String(rejection));
    assertEquals(rejection.message, 'CORS wildcard origins cannot be combined with credentials');
  }
  // This happens before closing the blocker or attempting any manual handle cleanup.
  rebind(upstream);
} catch (error) {
  failures.push(error);
}
// Only an unexpected public success could yield a handle; never obtain or stop a private upstream.
if (unexpected !== undefined) {
  try { await unexpected.stop(); } catch (error) { failures.push(error); }
}
if (blocker !== undefined) {
  try { blocker.close(); } catch (error) { failures.push(error); }
  try { rebind(front); } catch (error) { failures.push(error); }
}
if (!reboundPorts.includes(upstream)) {
  try { rebind(upstream); } catch (error) { failures.push(error); }
}
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures, failures.map(String).join('\\n'));
console.log(JSON.stringify({ mode, observedBound, hostnameReads, blockerPreserved, blockerEndpoint,
  identityPreserved, returnedHandle: unexpected !== undefined, reboundPorts }));
console.log('${MARKER}');
`;
}

const LIFECYCLE_CLEANUP = 's6e-streams: response, native stops and both ports settled';
const LIFECYCLE_SUCCESS = 's6e-streams: lifecycle assertion and cleanup settled';
type LifecycleMode = 'abort' | 'drain';

Deno.test({
  name: 'streams caller abort releases both ports before manual stop; omitted signal detects leak',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  fn: () => runLifecycleRows('abort'),
});

Deno.test({
  name: 'streams concurrent native stops drain an auth-held read; early observation is rejected',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  fn: () => runLifecycleRows('drain'),
});

/** Negative children change only signal presence or the explicitly labeled stop observation. */
async function runLifecycleRows(mode: LifecycleMode): Promise<void> {
  for (const negative of [false, true]) {
    const label = mode === 'abort'
      ? (negative ? 'abort-omitted' : 'abort-present')
      : (negative ? 'drain-observation-negative' : 'drain-native');
    await using sandbox = await createRuntimeSandbox(label);
    const [upstream] = choosePorts();
    const run = await sandbox.run(lifecycleProbe(sandbox.scratch, upstream, mode, negative), {
      cwd: PLUGIN_ROOT,
      preferredPorts: [upstream],
    });
    const evidence = `${label}: exit ${run.code}\n${run.stderr}\n${run.stdout}`;
    assertEquals(run.code, negative ? 1 : 0, evidence);
    assertEquals(run.stdout.split(LIFECYCLE_CLEANUP).length - 1, 1, evidence);
    assertEquals(run.stdout.split(LIFECYCLE_SUCCESS).length - 1, negative ? 0 : 1, evidence);
    if (negative) {
      const expected = mode === 'abort'
        ? 'ABORT_DID_NOT_RELEASE'
        : 'DRAIN_COMPLETED_BEFORE_RELEASE';
      assertEquals(run.stderr.match(/^error: .*$/gm), [
        'error: Uncaught (in promise) Error: ' + expected,
      ], evidence);
    } else {
      assertEquals(run.stdout.trimEnd().endsWith(LIFECYCLE_SUCCESS), true, evidence);
    }
  }
}

/** Real factory, requests and native stop promises remain unchanged in observation controls. */
function lifecycleProbe(
  scratch: string,
  upstream: number,
  mode: LifecycleMode,
  negative: boolean,
): string {
  return `import { assert, assertEquals } from 'jsr:@std/assert@^1';
import type { AuthenticatorPort, RunningService } from '@netscript/plugin-streams/service';
const mode: string = ${JSON.stringify(mode)}, negative = ${negative};
const upstream = ${upstream};
const path = '/v1/stream/s6e-' + crypto.randomUUID();
const expectedBody = 's6e-' + mode + '-real-stream';
const entered = Promise.withResolvers<void>(), release = Promise.withResolvers<void>();
const controller = new AbortController();
const failures: unknown[] = [], stops: Promise<void>[] = [];
const ports: number[] = [upstream];
const rebinds: { phase: string; port: number }[] = [];
const observations: Record<string, unknown> = { mode, negative };
let running: RunningService | undefined;
let response: Promise<[number, string]> | undefined;
let holdRead = false, authCalls = 0;
const authenticator: AuthenticatorPort = {
  async authenticate(request) {
    authCalls++;
    assertEquals(request.path, path);
    if (request.header('x-fixture-token') !== 'allowed') {
      return { ok: false, reason: 'missing-credential' };
    }
    if (holdRead && request.method === 'GET') {
      entered.resolve();
      await release.promise;
    }
    return { ok: true, principal: {
      subject: 'fixture:lifecycle', scopes: [], roles: [], scheme: 'custom', claims: {},
    } };
  },
};
async function consume(response: Response): Promise<[number, string]> {
  return [response.status, await response.text()];
}
async function waitReleased(selected: readonly number[], failure: string, phase: string): Promise<void> {
  const pending = new Set(selected), deadline = performance.now() + 2_000;
  while (pending.size > 0) {
    if (performance.now() >= deadline) throw new Error(failure);
    for (const port of pending) {
      try {
        Deno.listen({ hostname: '127.0.0.1', port }).close();
        pending.delete(port);
        rebinds.push({ phase, port });
      } catch (error) {
        if (!(error instanceof Deno.errors.AddrInUse)) throw error;
      }
    }
    if (pending.size > 0) await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
}
function observe(stop: Promise<void>) {
  const state: { status: 'pending' | 'fulfilled' | 'rejected'; error?: unknown } = { status: 'pending' };
  void stop.then(() => { state.status = 'fulfilled'; }, (error) => {
    state.status = 'rejected'; state.error = error;
  });
  return state;
}
try {
  Deno.chdir(${JSON.stringify(scratch)});
  Deno.env.set('STREAMS_INTERNAL_PORT', String(upstream));
  Deno.env.set('PORT', 'invalid ambient PORT');
  Deno.env.set('STREAMS_PORT', 'invalid ambient STREAMS_PORT');
  const { startStreamsService } = await import('@netscript/plugin-streams/service');
  running = await startStreamsService({
    auth: { authn: { authenticator, protect: ['/'], allowAnonymous: ['/health'] } },
    serve: { hostname: '127.0.0.1', port: 0, handleSignals: false, drainTimeoutMs: 5_000,
      ...(mode === 'abort' && !negative ? { signal: controller.signal } : {}) },
  });
  const front = running.addr.port;
  ports.push(front);
  assertEquals([running.addr.hostname, running.addr.transport], ['127.0.0.1', 'tcp']);
  assert(Number.isInteger(front) && front > 0);
  const url = \`http://127.0.0.1:\${front}\${path}\`;
  const headers = { 'x-fixture-token': 'allowed', 'content-type': 'text/plain' };
  const created = await consume(await fetch(url, { method: 'PUT', headers, body: expectedBody }));
  assertEquals(created[0], 201);
  const upstreamRead = await consume(await fetch(\`http://127.0.0.1:\${upstream}\${path}?offset=-1\`));
  assertEquals(upstreamRead, [200, expectedBody]);
  observations.upstreamRead = upstreamRead;
  if (mode === 'abort') {
    const read = await consume(await fetch(url + '?offset=-1', { headers }));
    assertEquals(read, upstreamRead);
    observations.frontRead = read;
    controller.abort();
    await waitReleased(ports, 'ABORT_DID_NOT_RELEASE', 'before-manual-stop');
    observations.releasedBeforeStop = [...ports];
  } else {
    holdRead = true;
    response = fetch(url + '?offset=-1', { headers }).then(consume);
    await Promise.race([entered.promise, response.then(() => {
      throw new Error('REQUEST_DID_NOT_WAIT_FOR_AUTH');
    })]);
    stops.push(running.stop(), running.stop());
    const actual = stops.map(observe);
    const observed = negative ? [observe(Promise.resolve()), actual[1]] : actual;
    await waitReleased([front], 'DRAIN_LISTENER_DID_NOT_RELEASE', 'while-auth-held');
    await Promise.resolve();
    observations.actualBeforeRelease = actual.map((state) => state.status);
    observations.observedBeforeRelease = observed.map((state) => state.status);
    for (const state of [...actual, ...observed]) {
      if (state.status === 'rejected') throw state.error;
      if (state.status === 'fulfilled') throw new Error('DRAIN_COMPLETED_BEFORE_RELEASE');
    }
    release.resolve();
  }
} catch (error) {
  failures.push(error);
}
const primaryFailures = failures.length;
// Release even after observation/setup failure; the real request and both native stops still settle.
release.resolve();
try {
  if (response !== undefined) {
    const read = await response;
    assertEquals(read, [200, expectedBody]);
    observations.frontRead = read;
  }
} catch (error) { failures.push(error); }
for (const stop of stops) {
  try { await stop; } catch (error) { failures.push(error); }
}
observations.nativeStopsSettled = stops.length;
try {
  await running?.stop();
  await running?.stop();
} catch (error) { failures.push(error); }
try { await waitReleased(ports, 'CLEANUP_DID_NOT_RELEASE', 'after-native-stop'); }
catch (error) { failures.push(error); }
console.log(JSON.stringify({ observations, authCalls, rebinds }));
if (failures.length === primaryFailures) console.log('${LIFECYCLE_CLEANUP}');
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures, failures.map(String).join('\\n'));
console.log('${LIFECYCLE_SUCCESS}');
`;
}
