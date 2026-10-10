import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  balanceTests,
  discoverTests,
  type ShardManifest,
  validateManifest,
} from './ci-test-shards.ts';
import { parseTimings } from './update-ci-test-shards.ts';
import { runShard } from './run-ci-test-shard.ts';

const timings = [
  { path: 'a_test.ts', durationMs: 100, tests: 2 },
  { path: 'b.test.tsx', durationMs: 70, tests: 1 },
  { path: 'test.ts', durationMs: 30, tests: 1 },
];
const fixture = (): ShardManifest => ({
  schemaVersion: 1,
  source: 'measured fixture',
  shardCount: 2,
  files: balanceTests(timings, 2),
});

Deno.test('longest-first assignment balances measured modules deterministically', () => {
  const files = balanceTests(timings, 2);
  assertEquals(files.map((file) => file.shard), [1, 2, 2]);
  assertEquals(balanceTests([...timings].reverse(), 2), files);
  assertThrows(() => balanceTests(timings, 0));
});

Deno.test('runtime coverage tolerates additions, removals, renames and stale assignments', () => {
  const manifest = fixture();
  const paths = timings.map((file) => file.path);
  const discovered = [paths[0], paths[2], 'new_test.ts', 'renamed.test.tsx'];
  const assignment = validateManifest(manifest, discovered);
  assertEquals(assignment.files.map((file) => file.path), [...discovered].sort());
  assertEquals(assignment.unmeasured, ['new_test.ts', 'renamed.test.tsx']);
  assertEquals(assignment.removed, ['b.test.tsx']);
  assertEquals(assignment.files.find((file) => file.path === paths[0])?.durationMs, 100);
  assertEquals(validateManifest(manifest, [...discovered].reverse()), assignment);
  const stale = structuredClone(manifest);
  stale.files[0].shard = 2;
  assertEquals(validateManifest(stale, paths).rebalanced, true);
});

Deno.test('invalid measurements and duplicate weights fail with a refresh hint', () => {
  const manifest = fixture();
  const paths = timings.map((file) => file.path);
  assertThrows(
    () => validateManifest({ ...manifest, files: [...manifest.files, manifest.files[0]] }, paths),
    Error,
    'Duplicate test module. Repair',
  );
  assertThrows(
    () => validateManifest(manifest, [...paths, paths[0]]),
    Error,
    'Duplicate discovery',
  );
  const invalid = structuredClone(manifest);
  invalid.files[0].durationMs = NaN;
  assertThrows(() => validateManifest(invalid, paths), Error, 'Invalid measurement');
});

Deno.test('timing parser retains native module set, test counts and measured durations', () => {
  assertEquals(
    parseTimings(
      '<testsuites><testsuite name="./a_test.ts" tests="2"><testcase name="a" time="0.1"></testcase><testcase name="b" time="0.07"></testcase></testsuite></testsuites>',
    ),
    [{ path: 'a_test.ts', durationMs: 170, tests: 2 }],
  );
  assertThrows(() => parseTimings('<testsuites/>'));
  assertEquals(
    parseTimings(
      '<testsuite name="./ignored_test.ts" tests="1"><testcase name="ignored"><skipped/></testcase></testsuite>',
    ),
    [{ path: 'ignored_test.ts', durationMs: 0, tests: 1 }],
  );
  assertEquals(
    parseTimings(
      '<testsuite name="./nested_test.ts" tests="3"><testcase name="outer" time="0.2"></testcase><testcase name="outer &gt; inner" time="0.1"></testcase><testcase name="outer &gt; inner &gt; deep" time="0.05"></testcase></testsuite>',
    ),
    [{ path: 'nested_test.ts', durationMs: 200, tests: 3 }],
  );
  assertEquals(
    parseTimings(
      '<testsuites><testsuite name="./parent_test.ts" tests="1"><testcase name="outer" time="0.2"></testcase></testsuite><testsuite name="ext:cli/40_test.js" tests="1"><testcase name="outer &gt; inner" time="0.1"></testcase></testsuite></testsuites>',
    ),
    [{ path: 'parent_test.ts', durationMs: 200, tests: 2 }],
  );
  assertEquals(
    parseTimings(
      '<testsuite name="./helper.ts" tests="1"><testcase name="contract" time="0.1"></testcase></testsuite>',
      new Map([[JSON.stringify(['helper.ts', 'contract']), 'contract_test.ts']]),
    ),
    [{ path: 'contract_test.ts', durationMs: 100, tests: 1 }],
  );
});

Deno.test('discovery follows naming and config selectors without picking scratch tests', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/scratch`);
    await Deno.mkdir(`${root}/nested`);
    await Deno.mkdir(`${root}/.hidden`);
    await Deno.mkdir(`${root}/node_modules`);
    await Deno.writeTextFile(
      `${root}/deno.json`,
      '{"workspace":["nested"],"exclude":["scratch/"]}',
    );
    await Deno.writeTextFile(
      `${root}/nested/deno.jsonc`,
      '{/* comment */ "test":{"exclude":["skip_test.ts"]}}',
    );
    for (
      const path of [
        'a_test.ts',
        '.hidden/hidden.test.ts',
        'nested/keep_test.ts',
        'nested/skip_test.ts',
        'scratch/scratch_test.ts',
        'node_modules/vendor_test.ts',
        'unrelated.ts',
      ]
    ) {
      await Deno.writeTextFile(`${root}/${path}`, 'Deno.test("fixture", () => {});');
    }
    assertEquals(await discoverTests(root), [
      '.hidden/hidden.test.ts',
      'a_test.ts',
      'nested/keep_test.ts',
    ]);
    const native = await new Deno.Command(Deno.execPath(), {
      cwd: root,
      args: ['test', '--no-check', '--reporter=junit'],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(native.code, 0, new TextDecoder().decode(native.stderr));
    assertEquals(
      parseTimings(new TextDecoder().decode(native.stdout)).map((file) => file.path).sort(),
      await discoverTests(root),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('shard runner refuses an invalid index before starting tests', async () => {
  await assertRejects(
    () => runShard(0, '.llm/tmp/x-2194/invalid.json'),
    Error,
    'Invalid shard index',
  );
});

Deno.test('shard runner executes an unlisted new module exactly once and propagates failure', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/.github/scripts`, { recursive: true });
    await Deno.mkdir(`${root}/.llm/tools`, { recursive: true });
    await Deno.copyFile(
      new URL('../../.llm/tools/run-deno-test.ts', import.meta.url),
      `${root}/.llm/tools/run-deno-test.ts`,
    );
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({ imports: { '@std/path': 'jsr:@std/path@1' } }),
    );
    await Deno.writeTextFile(`${root}/pass_test.ts`, 'Deno.test("selected pass", () => {});');
    await Deno.writeTextFile(
      `${root}/fail_test.ts`,
      'Deno.test("selected failure", () => {throw new Error("sentinel");});',
    );
    const manifest: ShardManifest = {
      schemaVersion: 1,
      source: 'runner integration fixture',
      shardCount: 2,
      files: balanceTests([{ path: 'pass_test.ts', durationMs: 1, tests: 1 }, {
        path: 'fail_test.ts',
        durationMs: 1,
        tests: 1,
      }], 2),
    };
    await Deno.writeTextFile(
      `${root}/.github/scripts/ci-test-shards.json`,
      JSON.stringify(manifest),
    );
    // This file is deliberately absent from the checked-in timing manifest.
    await Deno.writeTextFile(`${root}/new_test.ts`, 'Deno.test("unlisted pass", () => {});');
    const assignment = validateManifest(manifest, await discoverTests(root));
    const executed: string[] = [];
    for (const index of [1, 2]) {
      const files = assignment.files.filter((file) => file.shard === index).map((file) =>
        file.path
      );
      const report = `${root}/report-${index}.json`;
      assertEquals(await runShard(index, report, root), files.includes('fail_test.ts') ? 1 : 0);
      const result = JSON.parse(await Deno.readTextFile(report));
      assertEquals(result.summary.totalResults, files.length);
      assertEquals(result.command.slice(-files.length - 1), ['--allow-all', ...files]);
      executed.push(...files);
    }
    assertEquals(executed.sort(), ['fail_test.ts', 'new_test.ts', 'pass_test.ts']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
