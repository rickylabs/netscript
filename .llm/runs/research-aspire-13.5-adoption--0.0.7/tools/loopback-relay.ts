/**
 * Owner-scoped loopback relay for Aspire/DCP against a remote dind (D-71b/D-73).
 *
 * DCP publishes container ports on the Docker host's 127.0.0.1 and dials 127.0.0.1 from the
 * AppHost on ai-agents. This relay keeps that contract by adding two run-owned hops per port:
 *   hop A  socat container on the dind host network: <dindIp>:<port> -> 127.0.0.1:<port>
 *   hop B  Deno listener on ai-agents:               127.0.0.1:<port> -> <dindHost>:<port>
 *
 *   deno run -A loopback-relay.ts watch   --owner <token> --registry <file> [--since <iso>] [--interval 2000]
 *   deno run -A loopback-relay.ts cleanup --owner <token> --registry <file>
 *
 * Ownership: only containers created at/after --since (default: process start) whose names do not
 * start with `relay-` are relayed; hop-A containers carry label netscript.relay.owner=<owner>.
 * SIGTERM/SIGINT on `watch` runs the same cleanup as `cleanup`.
 *
 * Availability tracking (D-97): each poll cycle recomputes the set of currently-published
 * `127.0.0.1:<port>` mappings from live (non-`relay-`) containers. Any port this relay owns that
 * is no longer published — e.g. `aspire resource <name> stop` removed the container/its port —
 * is torn down immediately (hopB listener closed, hopA socat container removed), so a stopped
 * backing service is truly unreachable through the relay rather than staying falsely connectable.
 * When the same port is republished (e.g. after `aspire resource <name> start`), it is relayed
 * again fresh on the next cycle via the normal creation path below.
 */
const MISE = '/home/agent/.local/bin/mise';
const args = parse(Deno.args.slice(1));
const mode = Deno.args[0];
const owner = req('owner');
const registryPath = req('registry');
const dindHost = args.get('dind-host') ?? 'netscript-dind';
const interval = Number(args.get('interval') ?? '2000');
const since = new Date(args.get('since') ?? new Date().toISOString());

type Relay = { port: number; container: string; source: string; startedAt: string };
type Registry = { owner: string; pid: number; dindHost: string; dindIp: string; since: string; relays: Relay[]; closed?: string };

async function docker(...a: string[]): Promise<string> {
  const out = await new Deno.Command(MISE, { args: ['exec', '--', 'docker', ...a], stdout: 'piped', stderr: 'piped' }).output();
  const text = new TextDecoder().decode(out.stdout).trim();
  if (!out.success) throw new Error(`docker ${a.join(' ')}: ${new TextDecoder().decode(out.stderr).trim()}`);
  return text;
}
async function resolveIp(host: string): Promise<string> {
  const rec = await Deno.resolveDns(host, 'A');
  if (rec.length === 0) throw new Error(`cannot resolve ${host}`);
  return rec[0];
}
function parse(list: string[]): Map<string, string> {
  const m = new Map<string, string>();
  for (let i = 0; i < list.length; i++) if (list[i].startsWith('--')) m.set(list[i].slice(2), list[i + 1] ?? ''), i++;
  return m;
}
function req(k: string): string {
  const v = args.get(k);
  if (!v) { console.error(`--${k} is required`); Deno.exit(2); }
  return v;
}
async function writeRegistry(r: Registry) {
  await Deno.writeTextFile(registryPath, JSON.stringify(r, null, 2) + '\n');
}

async function cleanup(r: Registry, listeners: Map<number, Deno.Listener>) {
  for (const l of listeners.values()) { try { l.close(); } catch { /* closed */ } }
  const names = (await docker('ps', '-aq', '--filter', `label=netscript.relay.owner=${owner}`)).split('\n').filter(Boolean);
  if (names.length > 0) await docker('rm', '-f', ...names);
  r.closed = new Date().toISOString();
  await writeRegistry(r);
  console.log(`[relay] cleanup: closed ${listeners.size} listener(s), removed ${names.length} hop-A container(s)`);
}

function listen(port: number, dindHost: string, registry: Map<number, Deno.Listener>) {
  const l = Deno.listen({ hostname: '127.0.0.1', port });
  registry.set(port, l);
  (async () => {
    for await (const c of l) {
      (async () => {
        try {
          const u = await Deno.connect({ hostname: dindHost, port });
          await Promise.all([
            c.readable.pipeTo(u.writable).catch(() => {}),
            u.readable.pipeTo(c.writable).catch(() => {}),
          ]);
        } catch { try { c.close(); } catch { /* closed */ } }
      })();
    }
  })().catch(() => {});
}

if (mode === 'cleanup') {
  let r: Registry;
  try { r = JSON.parse(await Deno.readTextFile(registryPath)); } catch { r = { owner, pid: 0, dindHost, dindIp: '', since: since.toISOString(), relays: [] }; }
  if (r.pid && r.pid !== Deno.pid) { try { Deno.kill(r.pid, 'SIGTERM'); } catch { /* gone */ } }
  await cleanup(r, new Map());
  Deno.exit(0);
}
if (mode !== 'watch') { console.error('mode must be watch|cleanup'); Deno.exit(2); }

const dindIp = await resolveIp(dindHost);
const reg: Registry = { owner, pid: Deno.pid, dindHost, dindIp, since: since.toISOString(), relays: [] };
await writeRegistry(reg);
const listeners = new Map<number, Deno.Listener>();
let stopping = false;
const stop = async () => { if (stopping) return; stopping = true; await cleanup(reg, listeners); Deno.exit(0); };
Deno.addSignalListener('SIGTERM', stop);
Deno.addSignalListener('SIGINT', stop);
console.log(`[relay] watching owner=${owner} dind=${dindHost}(${dindIp}) since=${reg.since} pid=${Deno.pid}`);

async function teardownPort(port: number) {
  const l = listeners.get(port);
  if (l) { try { l.close(); } catch { /* already closed */ } listeners.delete(port); }
  const container = `relay-${owner}-${port}`;
  try { await docker('rm', '-f', container); } catch { /* already gone */ }
  reg.relays = reg.relays.filter((r) => r.port !== port);
  await writeRegistry(reg);
  console.log(`[relay] ${container} torn down — upstream port ${port} no longer published`);
}

while (!stopping) {
  try {
    const rows = (await docker('ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}')).split('\n').filter(Boolean);
    const livePorts = new Set<number>();
    for (const row of rows) {
      const [id, name, ports] = row.split('\t');
      if (!id || !name || name.startsWith('relay-')) continue;
      if (!(ports ?? '').includes('127.0.0.1:')) continue;
      // Fail closed: creation time comes from `docker inspect .Created` (RFC 3339); anything
      // unparseable is skipped and logged, never relayed.
      const createdIso = await docker('inspect', '--format', '{{.Created}}', id);
      const created = new Date(createdIso);
      if (!Number.isFinite(created.getTime())) { console.error(`[relay] skip ${name}: unparseable Created "${createdIso}"`); continue; }
      if (created < since) continue;
      for (const m of (ports ?? '').matchAll(/127\.0\.0\.1:(\d+)->/g)) {
        const port = Number(m[1]);
        livePorts.add(port);
        if (listeners.has(port)) continue;
        const container = `relay-${owner}-${port}`;
        await docker('run', '-d', '--rm', '--network', 'host', '--name', container,
          '--label', `netscript.relay.owner=${owner}`, 'alpine/socat',
          `TCP-LISTEN:${port},bind=${dindIp},fork,reuseaddr`, `TCP:127.0.0.1:${port}`);
        listen(port, dindHost, listeners);
        reg.relays.push({ port, container, source: name, startedAt: new Date().toISOString() });
        await writeRegistry(reg);
        console.log(`[relay] ${name} 127.0.0.1:${port} => hopA ${container} (${dindIp}:${port}) => hopB 127.0.0.1:${port}@ai-agents`);
      }
    }
    for (const port of [...listeners.keys()]) {
      if (!livePorts.has(port)) await teardownPort(port);
    }
  } catch (e) { console.error(`[relay] poll error: ${(e as Error).message}`); }
  await new Promise((r) => setTimeout(r, interval));
}
