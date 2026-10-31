/** Real streams host policy, exact CORS and protocol defaults over native listeners. @module */
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { createRuntimeSandbox } from './tests/test_utils/service-runtime-fixture.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const MARKER = 'streams host policy: protocol, origins and cleanup complete';

Deno.test({
  name:
    'streams host policy guards raw routes and health while retaining protocol CORS and workspace defaults',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createRuntimeSandbox('host-policy');
    const ports = choosePorts();
    const run = await sandbox.run(source(sandbox.scratch, ports), {
      cwd: PLUGIN_ROOT,
      preferredPorts: ports,
    });
    assertEquals(run.code, 0, run.stderr + run.stdout);
    assertStringIncludes(run.stdout, MARKER);
    assert(!run.stdout.includes('synthetic-stream-credential'), 'credential must not enter logs');
  },
});

/** Hold both allocations until their distinct port numbers have been selected. */
function choosePorts(): number[] {
  using first = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  using second = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  return [first.addr.port, second.addr.port];
}

/** Native policy and CORS are exercised by requests, without replacing the proxy or listener. */
function source(scratch: string, ports: readonly number[]): string {
  return `import { assert, assertEquals } from '@std/assert';
import { startStreamsService, type RunningService } from '@netscript/plugin-streams/service';
import { createStaticCredentialAuthenticator } from '@netscript/service/auth';
const scratch = ${JSON.stringify(scratch)};
const ports = ${JSON.stringify(ports)};
const allowedOrigin = 'https://allowed.example';
const workspaceOrigin = 'https://workspace.example';
const handles: RunningService[] = [];
const failures: unknown[] = [];
const credential = { authorization: 'Bearer synthetic-stream-credential' };
const serve = { hostname: '127.0.0.1', port: 0, handleSignals: false };
function tokens(value: string | null): string[] {
  return (value ?? '').split(',').map((item) => item.trim().toLowerCase());
}
function rebind(port: number): void { Deno.listen({ hostname: '127.0.0.1', port }).close(); }
try {
  Deno.chdir(scratch);
  Deno.env.set('PORT', 'process-port-must-not-win');
  Deno.env.set('STREAMS_PORT', 'fallback-port-must-not-win');
  Deno.env.set('NETSCRIPT_CORS_ORIGINS', workspaceOrigin);
  Deno.env.set('STREAMS_LIVE_CREATE_WAIT_MS', '0');
  Deno.env.set('STREAMS_INTERNAL_PORT', String(ports[0]));
  const running = await startStreamsService({
    auth: { authn: {
      authenticator: createStaticCredentialAuthenticator({
        credentials: { 'synthetic-stream-credential': { subject: 'host:streams', scopes: [], roles: [] } },
      }),
      protect: ['/'],
      allowAnonymous: [{ method: 'GET', path: '/health/live' }],
    } },
    cors: { origin: allowedOrigin, credentials: true }, serve,
  });
  handles.push(running);
  assertEquals([running.addr.hostname, running.addr.transport], ['127.0.0.1', 'tcp']);
  assert(running.addr.port > 0);
  const origin = 'http://127.0.0.1:' + running.addr.port;
  async function request(path: string, init?: RequestInit) {
    const response = await fetch(origin + path, init);
    return { response, body: await response.text() };
  }
  const path = '/v1/stream/netscript/host-policy';
  assertEquals((await request(path)).response.status, 401);
  assertEquals((await request(path, { headers: { authorization: 'Bearer wrong' } })).response.status, 401);
  assertEquals((await request('/')).response.status, 200, 'native immediate service info stays public');
  assertEquals((await request('/health/live')).response.status, 200);
  assertEquals((await request('/health/live', { method: 'HEAD' })).response.status, 401);
  assertEquals((await request('/health')).response.status, 401);
  assertEquals((await request('/health/ready')).response.status, 401);
  assertEquals((await request('/health', { headers: credential })).response.status, 200);
  assertEquals((await request(path, {
    method: 'PUT', headers: { ...credential, 'content-type': 'text/plain' }, body: 'before-',
  })).response.status, 201);
  assertEquals((await request(path, {
    method: 'POST', headers: { ...credential, 'content-type': 'text/plain' }, body: 'after',
  })).response.status, 204);
  const read = await request(path + '?offset=-1', { headers: { ...credential, origin: allowedOrigin } });
  assertEquals([read.response.status, read.body], [200, 'before-after']);
  assertEquals(read.response.headers.get('content-encoding'), null, 'proxy describes the actual bytes');
  assertEquals(read.response.headers.get('access-control-allow-origin'), allowedOrigin);
  for (const header of ['Stream-Next-Offset', 'Stream-Cursor', 'Stream-Up-To-Date', 'Stream-Closed',
    'Producer-Epoch', 'Producer-Seq', 'Producer-Expected-Seq', 'Producer-Received-Seq',
    'etag', 'content-type', 'content-encoding', 'vary']) {
    assert(tokens(read.response.headers.get('access-control-expose-headers')).includes(header.toLowerCase()), header);
  }
  for (const candidate of [workspaceOrigin, 'https://unrelated.example', 'https://allowed.example.evil', 'null', 'http://[']) {
    const denied = await request(path + '?offset=-1', { headers: { ...credential, origin: candidate } });
    assertEquals(denied.response.status, 200);
    assertEquals(denied.response.headers.get('access-control-allow-origin'), null, candidate);
  }
  for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']) {
    const preflight = await request(path, { method: 'OPTIONS', headers: {
      origin: allowedOrigin, 'access-control-request-method': method,
      'access-control-request-headers': 'authorization,content-type,producer-seq',
    } });
    assertEquals(preflight.response.status, 204);
    assertEquals(preflight.response.headers.get('access-control-allow-origin'), allowedOrigin);
    assert(tokens(preflight.response.headers.get('access-control-allow-methods')).includes(method.toLowerCase()), method);
    for (const header of ['Content-Type', 'Authorization', 'Stream-Seq', 'Stream-TTL', 'Stream-Expires-At',
      'Stream-Closed', 'Producer-Id', 'Producer-Epoch', 'Producer-Seq']) {
      assert(tokens(preflight.response.headers.get('access-control-allow-headers')).includes(header.toLowerCase()), header);
    }
  }
  const missing = await request('/v1/stream/netscript/missing-host-policy?offset=-1&live=long-poll', { headers: credential });
  assertEquals(missing.response.status, 204);
  assertEquals(missing.body, '');
  assertEquals(missing.response.headers.get('stream-up-to-date'), 'true');
  await running.stop();
  rebind(running.addr.port);
  rebind(ports[0]);
  Deno.env.set('STREAMS_INTERNAL_PORT', String(ports[1]));
  const defaults = await startStreamsService({
    auth: { public: true, reason: 'Explicit public workspace-origin fixture' }, serve,
  });
  handles.push(defaults);
  const response = await fetch('http://127.0.0.1:' + defaults.addr.port + '/health/live', {
    headers: { origin: workspaceOrigin },
  });
  await response.text();
  assertEquals(response.status, 200);
  assertEquals(response.headers.get('access-control-allow-origin'), workspaceOrigin);
  await defaults.stop();
  rebind(defaults.addr.port);
  rebind(ports[1]);
} catch (error) {
  failures.push(error);
}
for (const handle of handles) {
  try { await handle.stop(); } catch (error) { failures.push(error); }
}
if (failures.length === 1) throw failures[0];
if (failures.length > 1) throw new AggregateError(failures);
console.log(${JSON.stringify(MARKER)});
`;
}
