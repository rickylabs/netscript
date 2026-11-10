/**
 * Repro: does `workers.subscribe` (KV watch SSE) deliver execution events when the KV is Garnet?
 * Starts the bundled stack, opens the subscribe stream, spies on Garnet (PSUBSCRIBE * and a key
 * scan), triggers jobs, and reports what each layer saw.
 *
 *   deno run -A bench/garnet-watch-repro.ts --stack=build/stack-linux-x64
 *
 * @module
 */
import Redis from 'npm:ioredis@5.4.1';
import { startGraph } from '../realstack/supervisor.ts';

const stackArg = Deno.args.find((arg) => arg.startsWith('--stack='))?.slice(8) ?? 'build/stack-linux-x64';
const B = Deno.realPathSync(stackArg);
const data = await Deno.makeTempDir();
const graph = await startGraph({
  workspace: `${B}/workspace`, dataDir: data, seedDatabase: `${B}/seed.db`, deno: `${B}/deno`,
  denoFlags: ['--cached-only'], env: { DENO_DIR: `${B}/deno-dir` },
  garnet: { command: `${B}/garnet/GarnetServer`, args: [] },
});
const [host, port] = graph.garnet.split(':');
const spy = new Redis({ host, port: Number(port), lazyConnect: false });
const kv = new Redis({ host, port: Number(port) });
const published: Record<string, number> = {};
await spy.psubscribe('*');
spy.on('pmessage', (_pattern: string, channel: string) => published[channel] = (published[channel] ?? 0) + 1);

const scanCount = async (pattern: string) => {
  let cursor = '0', n = 0;
  do {
    const [next, keys] = await kv.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
    cursor = next; n += keys.length;
  } while (cursor !== '0');
  return n;
};

const base = graph.urls['workers-api'];
const abort = new AbortController();
const sse = await fetch(`${base}/api/v1/workers/subscribe?concept=job`, { signal: abort.signal });
let text = '';
const pump = (async () => {
  const reader = sse.body!.getReader();
  try { while (true) { const { value, done } = await reader.read(); if (done) break; text += new TextDecoder().decode(value); } } catch { /* aborted */ }
})();
await new Promise((r) => setTimeout(r, 1000));
const before = { kvdexExecutionKeys: await scanCount('*__kvdex__*executions*'), allKeys: await kv.dbsize() };
const triggered: number[] = [];
for (let i = 0; i < 5; i++) {
  const r = await fetch(`${base}/api/rpc/v1/workers/triggerJob`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: { id: 'health-check' } }) });
  triggered.push(r.status); await r.body?.cancel();
  await new Promise((res) => setTimeout(res, 500));
}
await new Promise((r) => setTimeout(r, 4000));
const after = { kvdexExecutionKeys: await scanCount('*__kvdex__*executions*'), allKeys: await kv.dbsize() };
const list = await fetch(`${base}/api/rpc/v1/workers/listExecutions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ json: { limit: 20, offset: 0 } }) });
const executions = ((await list.json()).json?.executions ?? []).length;
abort.abort(); await pump;
const sseTypes = text.split('\n\n').map((e) => /"type":"([^"]+)"/.exec(e)?.[1]).filter(Boolean);
const sampleKeys = (await kv.scan('0', 'MATCH', '*execution*', 'COUNT', 1000))[1].slice(0, 5);
console.log(JSON.stringify({ triggered, executionsListed: executions, garnet: { before, after, publishedByChannel: published, sampleExecutionKeys: sampleKeys }, sseEventTypes: sseTypes }, null, 2));
spy.disconnect(); kv.disconnect();
await graph.stop();
