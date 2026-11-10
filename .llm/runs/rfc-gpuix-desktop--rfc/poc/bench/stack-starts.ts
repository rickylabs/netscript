/**
 * Start the bundled real-stack graph repeatedly (sequentially, then N at once) and report
 * per-node readiness, keeping the logs of any slow or failed start. Diagnoses intermittent stalls.
 *
 *   deno run -A bench/stack-starts.ts --stack=build/stack-linux-x64 --runs=8 --concurrent=4 --out=<dir>
 *
 * @module
 */
import { startGraph } from '../realstack/supervisor.ts';

const args = new Map(Deno.args.map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'] as const;
}));
const stack = Deno.realPathSync(args.get('stack') ?? 'build/stack-linux-x64');
const runs = Number(args.get('runs') ?? 8);
const concurrent = Number(args.get('concurrent') ?? 4);
const out = args.get('out') ?? 'build/stack-starts';
const slowMs = Number(args.get('slow') ?? 10_000);
await Deno.mkdir(out, { recursive: true });
const exe = Deno.build.os === 'windows' ? '.exe' : '';

interface StartResult {
  tag: string;
  ok: boolean;
  readyMs?: number;
  error?: string;
  nodes: Array<{ name: string; ms?: number; state: string }>;
}

async function once(tag: string): Promise<StartResult> {
  const dataDir = await Deno.makeTempDir({ prefix: `stack-${tag}-` });
  const events: Array<{ node: string; state: string; at: number; detail?: string }> = [];
  try {
    const graph = await startGraph({
      workspace: `${stack}/workspace`,
      dataDir,
      seedDatabase: `${stack}/seed.db`,
      deno: `${stack}/deno${exe}`,
      denoFlags: ['--cached-only'],
      env: { DENO_DIR: `${stack}/deno-dir` },
      garnet: { command: `${stack}/garnet/GarnetServer${exe}`, args: [] },
      readyTimeoutMs: 150_000,
      onEvent: (event) => events.push(event),
    });
    const nodes = graph.nodes().map((node) => ({ name: node.name, ms: node.readyAt !== undefined && node.spawnedAt !== undefined ? node.readyAt - node.spawnedAt : undefined, state: node.state }));
    const slow = nodes.filter((node) => (node.ms ?? 0) > slowMs);
    for (const node of slow) await Deno.copyFile(`${dataDir}/logs/${node.name}.log`, `${out}/${tag}-${node.name}.log`).catch(() => {});
    await graph.stop();
    return { tag, ok: true, readyMs: graph.readyMs, nodes };
  } catch (error) {
    for await (const entry of Deno.readDir(`${dataDir}/logs`)) await Deno.copyFile(`${dataDir}/logs/${entry.name}`, `${out}/${tag}-${entry.name}`).catch(() => {});
    await Deno.writeTextFile(`${out}/${tag}-events.json`, JSON.stringify(events, null, 2));
    return { tag, ok: false, error: String(error), nodes: [] };
  } finally {
    await Deno.remove(dataDir, { recursive: true }).catch(() => {});
  }
}

const results: StartResult[] = [];
const line = (result: StartResult) =>
  result.ok
    ? `${result.tag}: ready ${result.readyMs} ms · slowest ${result.nodes.toSorted((a, b) => (b.ms ?? 0) - (a.ms ?? 0)).slice(0, 2).map((node) => `${node.name} ${node.ms} ms`).join(', ')}`
    : `${result.tag}: FAILED ${result.error}`;
for (let run = 0; run < runs; run++) {
  const result = await once(`seq${run}`);
  results.push(result);
  console.log(line(result));
}
if (concurrent > 1) {
  const batch = await Promise.all(Array.from({ length: concurrent }, (_, index) => once(`par${index}`)));
  for (const result of batch) {
    results.push(result);
    console.log(line(result));
  }
}
await Deno.writeTextFile(`${out}/results.json`, JSON.stringify(results, null, 2));
