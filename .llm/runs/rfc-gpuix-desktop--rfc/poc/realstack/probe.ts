/**
 * M2 probe: real typed calls against the supervised graph (no UI).
 *
 *   deno run -A realstack/probe.ts --workspace <ws> --data <dir> [--json out.json]
 *
 * @module
 */
import { parseArgs } from 'jsr:@std/cli@1.0.24/parse-args';
import { startGraph } from './supervisor.ts';
import { ACTIVITY_STREAM_PATH, createStackClients, projectDiscovery, streamUrl } from './clients.ts';

const args = parseArgs(Deno.args, { string: ['workspace', 'data', 'json', 'deno', 'garnet', 'seed', 'flags', 'deno-dir'] });
const workspace = args.workspace!;
const garnet = args.garnet ?? `${Deno.env.get('HOME')}/.nuget/packages/garnet-server/2.2.1/tools/net10.0/any/GarnetServer.dll`;
const graph = await startGraph({
  workspace,
  dataDir: args.data!,
  seedDatabase: args.seed ?? `${workspace}/database/sqlite/workspace.db`,
  deno: args.deno ?? Deno.execPath(),
  denoFlags: args.flags ? args.flags.split(' ') : [],
  env: args['deno-dir'] ? { DENO_DIR: args['deno-dir'] } : undefined,
  garnet: garnet.endsWith('.dll') ? { command: 'dotnet', args: [garnet] } : { command: garnet, args: [] },
});
const results: Record<string, unknown> = { readyMs: graph.readyMs };
const time = async <T>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
  const t = performance.now();
  try {
    const value = await fn();
    results[label] = { ok: true, ms: Math.round(performance.now() - t), sample: JSON.stringify(value).slice(0, 300) };
    return value;
  } catch (error) {
    results[label] = { ok: false, ms: Math.round(performance.now() - t), error: String(error).slice(0, 400) };
  }
};
try {
  projectDiscovery(graph.urls);
  const c = createStackClients();
  await time('users.list', () => c.users.list({ page: 1, limit: 5 }));
  const created = await time('users.create', () =>
    c.users.create({
      name: 'Desktop probe', ownerName: 'Probe', ownerEmail: 'probe@example.com',
      status: 'pending', amount: 1234, currency: 'CHF',
    }));
  if (created) await time('users.update', () => c.users.update({ id: created.id, data: { status: 'paid' } }));
  await new Promise((r) => setTimeout(r, 300));
  const jobs = await time('workers.listJobs', () => c.workers.listJobs({ limit: 20, offset: 0 } as never)) as { jobs?: { id: string }[] } | undefined;
  if (jobs?.jobs?.[0]) await time('workers.triggerJob', () => c.workers.triggerJob({ id: jobs.jobs![0].id } as never));
  await new Promise((r) => setTimeout(r, 1500));
  await time('workers.listExecutions', () => c.workers.listExecutions({ limit: 10, offset: 0 } as never));
  await time('sagas.listSagas', () => c.sagas.listSagas({} as never));
  await time('sagas.listInstances', () => c.sagas.listInstances({} as never));
  await time('triggers.listTriggers', () => c.triggers.listTriggers({} as never));
  await time('triggers.listEvents', () => c.triggers.listEvents({} as never));
  await time('streams.activity', async () => {
    const url = new URL(streamUrl(ACTIVITY_STREAM_PATH));
    url.searchParams.set('offset', '-1');
    const response = await fetch(url);
    const body = await response.text();
    return { status: response.status, next: response.headers.get('Stream-Next-Offset'), body: body.slice(0, 200) };
  });
  results.nodes = graph.nodes();
} finally {
  await graph.stop();
  results.stop = graph.stopReport();
}
console.log(JSON.stringify(results, null, 2));
if (args.json) await Deno.writeTextFile(args.json, JSON.stringify(results, null, 2));
