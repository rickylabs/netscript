/**
 * Dev CLI: bring the real graph up without Aspire, print timings, probe a few
 * endpoints, then stop (or stay up with `--hold`).
 *
 *   deno run -A realstack/dev.ts --workspace <ws> --data <dir> [--hold] [--json out.json]
 *
 * @module
 */

import { parseArgs } from 'jsr:@std/cli@1.0.24/parse-args';
import { startGraph } from './supervisor.ts';

const args = parseArgs(Deno.args, { string: ['workspace', 'data', 'json', 'garnet', 'deno'], boolean: ['hold'] });
const workspace = args.workspace ?? Deno.env.get('NETSCRIPT_WORKSPACE')!;
const dataDir = args.data ?? `${Deno.env.get('TMPDIR') ?? '/tmp'}/netscript-realstack`;
const garnetDll = args.garnet ?? `${Deno.env.get('HOME')}/.nuget/packages/garnet-server/2.2.1/tools/net10.0/any/GarnetServer.dll`;

const graph = await startGraph({
  workspace,
  dataDir,
  seedDatabase: `${workspace}/database/sqlite/workspace.db`,
  deno: args.deno ?? Deno.execPath(),
  garnet: garnetDll.endsWith('.dll') ? { command: 'dotnet', args: [garnetDll] } : { command: garnetDll, args: [] },
  onEvent: (event) => console.error(`[${String(event.at).padStart(6)} ms] ${event.node.padEnd(13)} ${event.state}${event.detail ? ` (${event.detail})` : ''}`),
});

console.error(`graph ready in ${graph.readyMs} ms`);
const report = { readyMs: graph.readyMs, urls: graph.urls, garnet: graph.garnet, nodes: graph.nodes() };
console.log(JSON.stringify(report, null, 2));
if (args.json) await Deno.writeTextFile(args.json, JSON.stringify(report, null, 2));

if (args.hold) {
  const done = Promise.withResolvers<void>();
  for (const signal of ['SIGINT', 'SIGTERM'] as const) Deno.addSignalListener(signal, () => done.resolve());
  await done.promise;
}
await graph.stop();
console.error('stopped');
