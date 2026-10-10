import { discoverTests, type ShardManifest, validateManifest } from './ci-test-shards.ts';

/** Execute one measured shard through the existing structured runner without altering test flags. */
export async function runShard(index: number, report: string): Promise<number> {
  if (!Number.isInteger(index) || index < 1) throw new Error(`Invalid shard index: ${index}`);
  const manifest: ShardManifest = JSON.parse(
    await Deno.readTextFile('.github/scripts/ci-test-shards.json'),
  );
  validateManifest(manifest, await discoverTests());
  if (index > manifest.shardCount) {
    throw new Error(`Invalid shard index: ${index}`);
  }
  const files = manifest.files.filter((file) => file.shard === index).map((file) => file.path);
  if (files.length === 0) throw new Error(`Empty shard: ${index}`);
  console.log(JSON.stringify({ shard: index, modules: files.length, files }));
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      '.llm/tools/run-deno-test.ts',
      '--output',
      report,
      '--',
      '--allow-all',
      ...files,
    ],
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();
  return (await child.status).code;
}

if (import.meta.main) {
  const [index, flag, report] = Deno.args;
  if (flag !== '--report-output' || !report || Deno.args.length !== 3) {
    throw new Error('Usage: run-ci-test-shard.ts <index> --report-output <path>');
  }
  Deno.exit(await runShard(Number(index), report));
}
