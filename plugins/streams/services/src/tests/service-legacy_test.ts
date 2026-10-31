/** Legacy streams CLI keeps public startup/CORS and uses native signal shutdown. @module */
import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { createRuntimeSandbox } from './test_utils/service-runtime-fixture.ts';

const PLUGIN_ROOT = fromFileUrl(new URL('../../../', import.meta.url));
const MARKER = 'legacy streams: public protocol and signal shutdown';

Deno.test({
  name:
    'legacy streams entrypoint delegates with public wildcard policy and releases both listeners',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createRuntimeSandbox('legacy');
    const ports = choosePorts();
    const source = `import { assertEquals } from '@std/assert';
Deno.chdir(${JSON.stringify(sandbox.scratch)});
Deno.env.set('PORT', ${JSON.stringify(String(ports[0]))});
Deno.env.set('STREAMS_PORT', 'fallback-must-not-win');
Deno.env.set('STREAMS_INTERNAL_PORT', ${JSON.stringify(String(ports[1]))});
Deno.env.set('NETSCRIPT_CORS_ORIGINS', 'https://workspace.example');
await import('@netscript/plugin-streams/services');
const origin = 'http://127.0.0.1:' + ${ports[0]};
const health = await fetch(origin + '/health');
await health.text();
assertEquals(health.status, 200);
const path = '/v1/stream/netscript/legacy-host-policy';
const created = await fetch(origin + path, {
  method: 'PUT', headers: { 'content-type': 'text/plain' }, body: 'legacy-bytes',
});
await created.text();
assertEquals(created.status, 201);
const read = await fetch(origin + path + '?offset=-1', { headers: { origin: 'https://unrelated.example' } });
assertEquals(await read.text(), 'legacy-bytes');
assertEquals(read.headers.get('access-control-allow-origin'), '*');
console.log(${JSON.stringify(MARKER)});
Deno.kill(Deno.pid, 'SIGINT');
`;
    const run = await sandbox.run(source, {
      cwd: PLUGIN_ROOT,
      preferredPorts: ports,
      allowSelfSignal: true,
    });
    assertEquals(run.code, 0, run.stderr + run.stdout);
    assertStringIncludes(run.stdout, MARKER);
    for (const port of ports) {
      Deno.listen({ hostname: '127.0.0.1', port }).close();
    }
  },
});

/** Allocate distinct front/upstream selections without hardcoded or shared listener values. */
function choosePorts(): number[] {
  using front = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  using upstream = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  return [front.addr.port, upstream.addr.port];
}
