import { globToRegExp, join, relative } from '@std/path';
import { parse } from 'jsr:@std/jsonc@1';

/** Measured module duration and result count from a native Deno JUnit timing pass. */
export interface TestTiming {
  path: string;
  durationMs: number;
  tests: number;
}

/** Checked-in measured weights and suggested assignments; discovery owns the current test set. */
export interface ShardManifest {
  schemaVersion: 1;
  source: string;
  shardCount: number;
  files: Array<TestTiming & { shard: number }>;
}

/** Test lanes in the CI matrix; changing this also requires updating its matrix include list. */
export const CI_TEST_SHARD_COUNT = 6;

/** Estimate until a native timing pass measures a new module. */
export const UNMEASURED_DURATION_MS = 1000;

export interface RuntimeAssignment {
  files: ShardManifest['files'];
  unmeasured: string[];
  removed: string[];
  rebalanced: boolean;
}

interface Selection {
  base: string;
  exclude: RegExp[];
  include?: RegExp[];
}

const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', '.deno']);
const TEST_NAME = /(?:^test|[._]test)\.[cm]?[jt]sx?$/;

function patterns(value: unknown): RegExp[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('Test selection must be an array of path patterns');
  }
  return value.map((item: string) => globToRegExp(item.replace(/\/$/, '') + '/**'))
    .concat(value.map((item: string) => globToRegExp(item.replace(/\/$/, ''))));
}

function selected(path: string, selections: Selection[], directory: boolean): boolean {
  return selections.every(({ base, exclude, include }) => {
    const local = path.slice(base.length).replace(/^\//, '');
    return !exclude.some((pattern) => pattern.test(local)) &&
      (directory || !include || include.some((pattern) => pattern.test(local)));
  });
}

/** Discover test modules using repository names and config selectors, including hidden tooling. */
export async function discoverTests(root: string = Deno.cwd()): Promise<string[]> {
  const files: string[] = [];
  async function visit(directory: string, inherited: Selection[]): Promise<void> {
    const entries: Deno.DirEntry[] = [];
    for await (const entry of Deno.readDir(directory)) entries.push(entry);
    const config = entries.find((entry) => entry.name === 'deno.json') ??
      entries.find((entry) => entry.name === 'deno.jsonc');
    const selections = [...inherited];
    if (config) {
      const value = parse(await Deno.readTextFile(join(directory, config.name)));
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Invalid config in ${directory}`);
      }
      const test = value.test;
      const selectors = test && typeof test === 'object' && !Array.isArray(test) ? test : {};
      selections.push({
        base: relative(root, directory).replaceAll('\\', '/'),
        exclude: [...patterns(value.exclude ?? []), ...patterns(selectors.exclude ?? [])],
        include: selectors.include === undefined ? undefined : patterns(selectors.include),
      });
    }
    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      const path = relative(root, absolute).replaceAll('\\', '/');
      if (!selected(path, selections, entry.isDirectory)) continue;
      if (entry.isDirectory && !SKIP_DIRS.has(entry.name)) await visit(absolute, selections);
      else if (entry.isFile && TEST_NAME.test(entry.name)) files.push(path);
    }
  }
  await visit(root, []);
  return files.sort();
}

/** Assign the slowest modules first to the least-loaded shard, with stable tie breaking. */
export function balanceTests(timings: TestTiming[], shardCount: number): ShardManifest['files'] {
  if (!Number.isInteger(shardCount) || shardCount < 1 || shardCount > 256) {
    throw new Error('Invalid shard count');
  }
  const loads = Array<number>(shardCount).fill(0);
  const sorted = [...timings].sort((a, b) =>
    b.durationMs - a.durationMs ||
    (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  );
  return sorted.map((file) => {
    const shard = loads.indexOf(Math.min(...loads));
    loads[shard] += Math.max(1, file.durationMs);
    return { ...file, shard: shard + 1 };
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

/** Build exactly-once coverage from discovery, retaining known weights despite manifest drift. */
export function validateManifest(
  manifest: ShardManifest,
  discovered: string[],
): RuntimeAssignment {
  const hint = 'Repair the timing data with update-ci-test-shards.ts <description> <junit.xml>.';
  if (manifest.schemaVersion !== 1 || !manifest.source || manifest.files.length === 0) {
    throw new Error(`Invalid manifest. ${hint}`);
  }
  const paths = manifest.files.map((file) => file.path).sort();
  const pathSet = new Set(paths);
  const discoveredSet = new Set(discovered);
  if (pathSet.size !== paths.length) throw new Error(`Duplicate test module. ${hint}`);
  if (discoveredSet.size !== discovered.length) {
    throw new Error('Duplicate discovery path; inspect discoverTests selectors.');
  }
  for (const file of manifest.files) {
    if (
      !Number.isFinite(file.durationMs) || file.durationMs < 0 ||
      !Number.isInteger(file.tests) || file.tests < 0
    ) {
      throw new Error(`Invalid measurement: ${file.path}. ${hint}`);
    }
  }
  const known = new Map(manifest.files.map((file) => [file.path, file]));
  const unmeasured = discovered.filter((path) => !pathSet.has(path)).sort();
  const removed = paths.filter((path) => !discoveredSet.has(path));
  const files = balanceTests(
    discovered.map((path) =>
      known.get(path) ?? { path, durationMs: UNMEASURED_DURATION_MS, tests: 0 }
    ),
    manifest.shardCount,
  );
  const runtimePaths = files.map((file) => file.path);
  if (
    new Set(runtimePaths).size !== discovered.length ||
    runtimePaths.some((path) => !discoveredSet.has(path))
  ) throw new Error('Invalid runtime coverage; inspect balanceTests.');
  return {
    files,
    unmeasured,
    removed,
    rebalanced: files.some((file) =>
      known.has(file.path) && known.get(file.path)!.shard !== file.shard
    ),
  };
}

/** Stale weights affect estimated balance, never whether a discovered test runs. */
export function reportTimingDrift(assignment: RuntimeAssignment): void {
  if (assignment.unmeasured.length || assignment.removed.length || assignment.rebalanced) {
    console.warn(JSON.stringify({
      warning:
        'Timing data drift; all discovered modules will run. Refresh with update-ci-test-shards.ts <description> <junit.xml>.',
      unmeasured: assignment.unmeasured,
      removed: assignment.removed,
      rebalanced: assignment.rebalanced,
    }));
  }
}

if (import.meta.main) {
  const manifest: ShardManifest = JSON.parse(
    await Deno.readTextFile('.github/scripts/ci-test-shards.json'),
  );
  const discovered = await discoverTests();
  reportTimingDrift(validateManifest(manifest, discovered));
  console.log(JSON.stringify({ modules: discovered.length, shards: manifest.shardCount }));
}
