import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { discoverTests, type ShardManifest, validateManifest } from './ci-test-shards.ts';
import { gateArgv } from '../../.llm/tools/gates/catalog.ts';

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

Deno.test('regression: required quality freezes the production graph before workspace install', async () => {
  const block = job(await workflow(), 'quality');
  const production = block.match(
    /\s{6}- name: Frozen production dependency install\n([\s\S]*?)(?=\s{6}- name:)/,
  )?.[1];
  assert(production, 'required PR quality must reject production lock drift');
  assertStringIncludes(production, "if: env.RUN_DENO == 'true'");
  assertStringIncludes(production, '.llm/tools/gates/run-gate.ts --gate prod-install');
  assertStringIncludes(production, '--output .llm/tmp/gate-receipts/quality/prod-install.json');
  assertEquals(gateArgv('prod-install'), ['deno', 'task', 'deps:prod-install']);
  assertEquals(production.includes('continue-on-error'), false);
  assert(
    block.indexOf('name: Frozen production dependency install') <
      block.indexOf('name: Install workspace dependencies'),
    'a mutable install must not repair the lock before the frozen gate checks it',
  );
  assertStringIncludes(block, 'github.event.pull_request.draft == false');
  assertStringIncludes(block, "needs.classify.result != 'success'");
});

Deno.test('runtime assignment covers the complete current root suite exactly once', async () => {
  const manifest: ShardManifest = JSON.parse(
    await Deno.readTextFile(new URL('.github/scripts/ci-test-shards.json', ROOT)),
  );
  const discovered = await discoverTests(new URL(ROOT).pathname);
  const assignment = validateManifest(manifest, discovered);
  assertEquals(assignment.files.map((file) => file.path), discovered);
  assertEquals(new Set(assignment.files.map((file) => file.path)).size, discovered.length);
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

Deno.test('upstream Deno caches include version and lock hash and skip unused browser setup', async () => {
  const source = await workflow();
  assertEquals(source.includes('Configure Deno module cache'), false);
  for (const name of ['check-test-shard', 'quality', 'deps-report']) {
    const block = job(source, name);
    assertStringIncludes(block, 'uses: denoland/setup-deno@v2');
    assertStringIncludes(block, 'cache:');
    const writer = name === 'check-test-shard' ? ' && matrix.index == 0' : '';
    assertStringIncludes(
      block,
      name === 'deps-report'
        ? "cache-hash: ${{ env.DENO_VERSION }}-${{ hashFiles('deno.lock') }}"
        : `cache-hash: \${{ env.RUN == 'true'${writer} && format('{0}-{1}', env.DENO_VERSION, hashFiles('deno.lock')) || '' }}`,
    );
    assertEquals(block.includes('path: ${{ env.DENO_DIR }}'), false);
  }
  const matrix = job(source, 'check-test-shard');
  const policy = "env.RUN == 'true' && (matrix.index != -1 || env.RUN_FRESH_BROWSER == 'true')";
  assertStringIncludes(matrix, "cache: ${{ env.RUN == 'true' && matrix.index == 0 }}");
  assertStringIncludes(matrix, `name: Install workspace dependencies\n        if: ${policy}`);
  assertEquals(matrix.includes("hashFiles('deno.lock') }}-${{ matrix.lane }}"), false);
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
  assertStringIncludes(block, 'docker tag "$CI_REDIS_IMAGE" netscript-ci-redis:locked');
  assertStringIncludes(block, '--publish 6379:6379 netscript-ci-redis:locked');
  assertStringIncludes(block, 'docker save --output "$image_cache" netscript-ci-redis:locked');
  assertStringIncludes(block, 'key: ${{ runner.os }}-ci-image-${{ env.CI_REDIS_IMAGE }}-v1');
  assert(/CI_REDIS_IMAGE: redis:7-alpine@sha256:[a-f0-9]{64}/.test(await workflow()));
  assertStringIncludes(block, 'CI Redis $mode:');
  assertStringIncludes(block, '$GITHUB_STEP_SUMMARY');
});

Deno.test('regression: Fresh module graph is primed before isolated test and browser lanes', async () => {
  const block = job(await workflow(), 'check-test-shard');
  const prime = block.match(
    /\s{6}- name: Prime Fresh Vite module graph\n([\s\S]*?)(?=\s{6}- name:)/,
  )?.[1];
  assert(prime, 'Vite lanes must prepare their graph without depending on repo-wide check');
  assertStringIncludes(
    prime,
    "if: env.RUN == 'true' && (matrix.index != -1 || env.RUN_FRESH_BROWSER == 'true')",
  );
  assertStringIncludes(
    prime,
    'run: deno run --allow-read --allow-run .github/scripts/prime-ci-npm-metadata.ts',
  );
  const primeIndex = block.indexOf('name: Prime Fresh Vite module graph');
  assert(primeIndex < block.indexOf('name: Measured test shard'));
  assert(primeIndex < block.indexOf('name: Managed form browser regression'));
});

Deno.test('regression: matrix Deno cache has one shared key and a single writer', async () => {
  const block = job(await workflow(), 'check-test-shard');
  assertStringIncludes(block, "cache: ${{ env.RUN == 'true' && matrix.index == 0 }}");
  assertStringIncludes(
    block,
    "cache-hash: ${{ env.RUN == 'true' && matrix.index == 0 && format('{0}-{1}', env.DENO_VERSION, hashFiles('deno.lock')) || '' }}\n",
  );
  assertEquals(block.includes("hashFiles('deno.lock') }}-${{ matrix.lane }}"), false);
  const restore = block.match(
    /\s{6}- name: Restore shared Deno modules\n([\s\S]*?)(?=\s{6}- name:)/,
  )?.[1];
  assert(restore, 'non-writer lanes need a read-only restore');
  assertStringIncludes(restore, 'uses: actions/cache/restore@v4');
  assertStringIncludes(
    restore,
    "if: env.RUN == 'true' && matrix.index != 0 && (matrix.index != -1 || env.RUN_FRESH_BROWSER == 'true')",
  );
  assertStringIncludes(
    restore,
    "key: deno-cache-${{ runner.os }}-${{ runner.arch }}-check-test-shard-${{ env.DENO_VERSION }}-${{ hashFiles('deno.lock') }}",
  );
  // setup-deno also enables caching for any nonempty hash, irrespective of cache=false.
  // Requiring an empty reader hash prevents a second restore and competing post-job saves.
  assertEquals(block.includes('actions/cache/save'), false);
});
