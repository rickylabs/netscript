import {
  balanceTests,
  CI_TEST_SHARD_COUNT,
  discoverTests,
  type ShardManifest,
  type TestTiming,
  validateManifest,
} from './ci-test-shards.ts';

/** Read module names, counts and summed testcase durations from Deno's native JUnit reporter. */
export function parseTimings(xml: string): TestTiming[] {
  const timings: TestTiming[] = [];
  for (
    const match of xml.matchAll(
      /<testsuite\s+name="([^"]+)"\s+tests="(\d+)"[^>]*>([\s\S]*?)<\/testsuite>/g,
    )
  ) {
    const durationMs = [...match[3].matchAll(/<testcase\s[^>]*\btime="([\d.]+)"/g)]
      .reduce((total, item) => total + Number(item[1]) * 1000, 0);
    timings.push({
      path: match[1].replace(/^\.\//, ''),
      durationMs: Math.round(durationMs),
      tests: Number(match[2]),
    });
  }
  if (timings.length === 0) throw new Error('No Deno JUnit modules found');
  return timings;
}

if (import.meta.main) {
  const [source, ...reports] = Deno.args;
  if (!source || reports.length === 0) {
    throw new Error('Usage: update-ci-test-shards.ts <measurement description> <junit.xml>...');
  }
  const discovered = await discoverTests();
  const discoveredSet = new Set(discovered);
  const timings = new Map<string, TestTiming>();
  // Reuse checked-in measurements; contributors only need to time new/changed modules.
  // A new module without a native measurement still fails coverage below.
  try {
    const previous: ShardManifest = JSON.parse(
      await Deno.readTextFile('.github/scripts/ci-test-shards.json'),
    );
    validateManifest(previous, previous.files.map((file) => file.path));
    for (const file of previous.files) {
      if (discoveredSet.has(file.path)) {
        timings.set(file.path, { path: file.path, durationMs: file.durationMs, tests: file.tests });
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  for (const report of reports) {
    for (const timing of parseTimings(await Deno.readTextFile(report))) {
      timings.set(timing.path, timing);
    }
  }
  const missing = discovered.filter((path) => !timings.has(path));
  const extra = [...timings.keys()].filter((path) => !discoveredSet.has(path));
  if (missing.length || extra.length) {
    throw new Error(
      `Timing pass differs from discovery; missing: ${missing.join(', ')}; extra: ${
        extra.join(', ')
      }`,
    );
  }
  const manifest: ShardManifest = {
    schemaVersion: 1,
    source,
    shardCount: CI_TEST_SHARD_COUNT,
    files: balanceTests([...timings.values()], CI_TEST_SHARD_COUNT),
  };
  await Deno.writeTextFile(
    '.github/scripts/ci-test-shards.json',
    JSON.stringify(manifest, null, 2) + '\n',
  );
  console.log(JSON.stringify({
    modules: manifest.files.length,
    tests: manifest.files.reduce((n, f) => n + f.tests, 0),
    loadsMs: Array.from(
      { length: manifest.shardCount },
      (_, i) =>
        manifest.files.filter((f) => f.shard === i + 1).reduce((n, f) => n + f.durationMs, 0),
    ),
  }));
}
