import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { discoverTests, type ShardManifest, validateManifest } from './ci-test-shards.ts';

const ROOT = new URL('../../', import.meta.url);

async function workflow(): Promise<string> {
  // The override runs these exact assertions against origin/main as a negative control.
  return await Deno.readTextFile(
    Deno.env.get('CI_SHARD_WORKFLOW') ?? new URL('.github/workflows/ci.yml', ROOT),
  );
}

function job(source: string, name: string): string {
  const block = source.match(
    new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9-]*:|$(?![\\s\\S]))`, 'm'),
  )?.[1];
  assert(block, `missing job ${name}`);
  return block;
}

Deno.test('checked-in manifest covers the complete current root suite exactly once', async () => {
  const manifest: ShardManifest = JSON.parse(
    await Deno.readTextFile(new URL('.github/scripts/ci-test-shards.json', ROOT)),
  );
  validateManifest(manifest, await discoverTests(new URL(ROOT).pathname));
  const matrix = job(await workflow(), 'check-test-shard');
  const indices = [...matrix.matchAll(/^\s+index: (-?\d+)$/gm)].map((match) => Number(match[1]));
  assertEquals(indices, [0, -1, ...Array.from({ length: manifest.shardCount }, (_, i) => i + 1)]);
});

Deno.test('required check-test executes an always-run fail-closed matrix aggregator', async () => {
  const source = await workflow();
  const aggregate = job(source, 'check-test');
  assertStringIncludes(aggregate, 'name: check-test');
  assertStringIncludes(aggregate, 'needs: check-test-shard');
  assertStringIncludes(aggregate, 'always()');
  assertStringIncludes(aggregate, 'github.event.pull_request.draft == false');
  assertStringIncludes(aggregate, 'SHARDS_RESULT: ${{ needs.check-test-shard.result }}');
  const command = aggregate.match(/^\s+run: (.+)$/m)?.[1];
  assert(command);
  for (const result of ['success', 'failure', 'cancelled', 'skipped', '']) {
    const output = await new Deno.Command('bash', {
      args: ['-c', command],
      env: { SHARDS_RESULT: result },
    }).output();
    assertEquals(output.code, result === 'success' ? 0 : 1, result);
  }
  for (const required of ['quality', 'deps-report']) assert(job(source, required));
});

Deno.test('CI cache keys include OS, Deno version and lock hash with versioned restore keys', async () => {
  const source = await workflow();
  assertStringIncludes(source, 'DENO_DIR=${RUNNER_TEMP}/deno-dir');
  for (const name of ['check-test-shard', 'quality', 'deps-report']) {
    const block = job(source, name);
    assertStringIncludes(block, 'uses: actions/cache@v4');
    assertStringIncludes(block, 'path: ${{ env.DENO_DIR }}');
    assertStringIncludes(
      block,
      "key: ${{ runner.os }}-deno-${{ env.DENO_VERSION }}-${{ hashFiles('deno.lock') }}",
    );
    assertStringIncludes(block, '${{ runner.os }}-deno-${{ env.DENO_VERSION }}-');
  }
});

Deno.test('matrix preserves type checks, browser policy, receipts and required Redis tests', async () => {
  const block = job(await workflow(), 'check-test-shard');
  assertStringIncludes(block, 'fail-fast: false');
  assertEquals(block.includes('continue-on-error'), false);
  assertStringIncludes(block, 'matrix.index == 0');
  assertStringIncludes(block, 'matrix.index == -1');
  assertStringIncludes(block, '--id check-test-browser-policy');
  assertStringIncludes(block, '--gate check --id check-test-check');
  assertStringIncludes(block, '--gate test-shard');
  assertStringIncludes(block, 'env.RUN_FRESH_BROWSER');
  assertStringIncludes(block, '${{ matrix.lane }}-gate-receipts');
  assertStringIncludes(block, 'if-no-files-found: error');
  assertStringIncludes(block, "needs.classify.result != 'success'");
  assertStringIncludes(
    block,
    "NETSCRIPT_TEST_REDIS_URL: ${{ matrix.index > 0 && 'redis://127.0.0.1:6379' || '' }}",
  );
  assertStringIncludes(block, 'docker load --input "$image_cache"');
  assertStringIncludes(block, 'docker pull "$CI_REDIS_IMAGE"');
  assertStringIncludes(block, 'docker save --output "$image_cache" "$CI_REDIS_IMAGE"');
  assertStringIncludes(block, 'key: ${{ runner.os }}-ci-image-${{ env.CI_REDIS_IMAGE }}-v1');
});
