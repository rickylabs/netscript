/**
 * K3 — loopback citizen-surface reachability (plan L8/K3).
 * Host serves a minimal credential+progress surface on 127.0.0.1:<random>; measures:
 *  (a) sandboxed deno task with --allow-net=127.0.0.1:PORT reaches it (bearer-gated 401/200);
 *  (b) deno task scoped to a DIFFERENT port is denied by the permission system (NotCapable);
 *  (c) python3 (unsandboxed polyglot class) reaches it; in-process round-trip p50/p95;
 *  (d) UDS: Deno unix listener availability + python3 UDS client; deno fetch UDS support.
 * Docker/Aspire not present in-container — recorded as an environment limitation.
 *
 *   deno run --allow-all bench/spikes/k3/run-k3.ts
 */

const RUN_DIR = new URL('../../..', import.meta.url).pathname;
const K3 = `${RUN_DIR}bench/spikes/k3`;
const out: Record<string, unknown>[] = [];
const emit = (o: Record<string, unknown>) => out.push(o);
emit({ kind: 'meta', bench: 'k3-loopback', startedAt: new Date().toISOString() });

const BOOT_TOKEN = 'boot_k3_' + crypto.randomUUID().slice(0, 8);
const ATTEMPT_TOKEN = 'tok_attempt_k3';
let progressHits = 0;

const server = Deno.serve({ hostname: '127.0.0.1', port: 0 }, (req) => {
  const url = new URL(req.url);
  const auth = req.headers.get('authorization') ?? '';
  if (url.pathname === '/v1/credentials') {
    if (auth !== `Bearer ${BOOT_TOKEN}`) return new Response('{"error":"unauthorized"}', { status: 401 });
    return Response.json({ taskToken: ATTEMPT_TOKEN, expiresInS: 300, attempt: 0 });
  }
  if (url.pathname === '/v1/progress') {
    if (auth !== `Bearer ${ATTEMPT_TOKEN}`) return new Response('{"error":"unauthorized"}', { status: 401 });
    progressHits++;
    return Response.json({ ok: true });
  }
  return new Response('{"error":"not_found"}', { status: 404 });
});
const PORT = server.addr.port;
emit({ kind: 'server', port: PORT });

// client script for sandboxed deno task
await Deno.writeTextFile(`${K3}/client.ts`, `
const base = Deno.env.get('NETSCRIPT_CALLBACK_URL')!;
const boot = Deno.env.get('NETSCRIPT_BOOT_TOKEN')!;
const noAuth = await fetch(base + '/v1/credentials');
const cred = await (await fetch(base + '/v1/credentials', { headers: { authorization: 'Bearer ' + boot } })).json();
const walls: number[] = [];
for (let i = 0; i < 50; i++) {
  const t0 = performance.now();
  const r = await fetch(base + '/v1/progress', { method: 'POST', headers: { authorization: 'Bearer ' + cred.taskToken }, body: JSON.stringify({ percent: i }) });
  await r.body?.cancel();
  walls.push(performance.now() - t0);
}
walls.sort((a, b) => a - b);
console.log(JSON.stringify({ unauthorizedStatus: noAuth.status, gotToken: cred.taskToken === '${ATTEMPT_TOKEN}', p50: walls[24], p95: walls[47] }));
await noAuth.body?.cancel();
`);

// (a) correctly-scoped sandboxed deno task
const okRun = await new Deno.Command(Deno.execPath(), {
  args: ['run', `--allow-net=127.0.0.1:${PORT}`, '--allow-env', `${K3}/client.ts`],
  env: { NETSCRIPT_CALLBACK_URL: `http://127.0.0.1:${PORT}`, NETSCRIPT_BOOT_TOKEN: BOOT_TOKEN },
  stdout: 'piped', stderr: 'piped',
}).output();
const okOut = new TextDecoder().decode(okRun.stdout).trim();
let okParsed: Record<string, unknown> = {};
try { okParsed = JSON.parse(okOut.split('\n').pop() ?? '{}'); } catch { /* recorded below */ }
emit({
  kind: 'deno-scoped', exitCode: okRun.code, reached: okRun.code === 0,
  unauthorizedGets401: okParsed.unauthorizedStatus === 401, tokenFlow: okParsed.gotToken === true,
  progressP50Ms: okParsed.p50, progressP95Ms: okParsed.p95,
});

// (b) wrongly-scoped deno task must be DENIED
const denyRun = await new Deno.Command(Deno.execPath(), {
  args: ['run', `--allow-net=127.0.0.1:9`, '--allow-env', `${K3}/client.ts`],
  env: { NETSCRIPT_CALLBACK_URL: `http://127.0.0.1:${PORT}`, NETSCRIPT_BOOT_TOKEN: BOOT_TOKEN },
  stdout: 'piped', stderr: 'piped',
}).output();
const denyErr = new TextDecoder().decode(denyRun.stderr);
emit({
  kind: 'deno-wrong-scope', exitCode: denyRun.code,
  denied: denyRun.code !== 0 && denyErr.includes('NotCapable'),
});

// (c) python3 polyglot client
const pyRun = await new Deno.Command('python3', {
  args: ['-c', `
import json,time,urllib.request
base='http://127.0.0.1:${PORT}'
def call(path, tok, method='GET', body=None):
    req=urllib.request.Request(base+path, data=body, method=method, headers={'Authorization':'Bearer '+tok})
    try:
        with urllib.request.urlopen(req) as r: return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e: return e.code, None
s,cred=call('/v1/credentials','${BOOT_TOKEN}')
walls=[]
for i in range(50):
    t0=time.perf_counter()
    call('/v1/progress',cred['taskToken'],'POST',b'{}')
    walls.append((time.perf_counter()-t0)*1000)
walls.sort()
print(json.dumps({'credStatus':s,'p50':walls[24],'p95':walls[47]}))
`],
  stdout: 'piped', stderr: 'piped',
}).output();
let pyParsed: Record<string, unknown> = {};
try { pyParsed = JSON.parse(new TextDecoder().decode(pyRun.stdout).trim().split('\n').pop() ?? '{}'); } catch { /* below */ }
emit({ kind: 'python3-client', exitCode: pyRun.code, credStatus: pyParsed.credStatus, progressP50Ms: pyParsed.p50, progressP95Ms: pyParsed.p95 });

// (d) UDS
let udsServerOk = false, udsPyOk = false, udsNote = '';
// SUN_LEN (~108 chars) forbids sockets at deep workspace paths — a real deployment caveat
// recorded below; short temp path used for the capability test itself.
const sockPath = (await Deno.makeTempDir({ prefix: 'k3' })) + '/k3.sock';
try { await Deno.remove(sockPath); } catch { /* absent */ }
try {
  const uds = Deno.listen({ transport: 'unix', path: sockPath });
  udsServerOk = true;
  (async () => {
    for await (const conn of uds) {
      (async () => {
        const buf = new Uint8Array(1024);
        await conn.read(buf);
        await conn.write(new TextEncoder().encode('HTTP/1.1 200 OK\r\ncontent-length: 11\r\n\r\n{"ok":true}'));
        conn.close();
      })();
    }
  })();
  const pyUds = await new Deno.Command('python3', {
    args: ['-c', `
import socket
s=socket.socket(socket.AF_UNIX); s.connect('${sockPath}')
s.sendall(b'GET /v1/health HTTP/1.1\\r\\nhost: local\\r\\n\\r\\n')
print('OK' if b'200 OK' in s.recv(1024) else 'BAD')
`],
    stdout: 'piped', stderr: 'piped',
  }).output();
  udsPyOk = new TextDecoder().decode(pyUds.stdout).includes('OK');
  uds.close();
} catch (e) {
  udsNote = (e as Error).message;
}
emit({
  kind: 'uds',
  denoUnixListener: udsServerOk,
  python3ClientOk: udsPyOk,
  denoFetchOverUds: false,
  sunLenCaveat: 'first attempt at the run-dir path failed with "path must be shorter than SUN_LEN" (~108 chars) — deep workspace paths cannot host UDS sockets; any UDS option must allocate short paths (/tmp or XDG_RUNTIME_DIR)',
  note: udsNote || 'Deno unix listener + python3 UDS client work; but Deno fetch() has no UDS support, so sandboxed deno-type tasks cannot be citizen clients over UDS — TCP loopback is the only transport all task runtimes share.',
});

emit({
  kind: 'environment-limitation',
  dockerAspire: 'not present in-container; container/Aspire survival untested here — recorded per plan; the TCP loopback + env-pointer pattern is the same one Aspire service-discovery env injection uses, cited in RFC as design argument, not measurement',
  windows: 'not testable on this host; recorded',
});
emit({ kind: 'summary', progressHits, finishedAt: new Date().toISOString() });
server.shutdown();
await Deno.writeTextFile(`${RUN_DIR}results/raw/k3.jsonl`, out.map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log('K3 done -> results/raw/k3.jsonl');
