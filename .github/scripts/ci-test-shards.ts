import { globToRegExp, join, relative } from '@std/path';
import { parse } from 'jsr:@std/jsonc@1';

/** Measured module duration and result count from a native Deno JUnit timing pass. */
export interface TestTiming {
  path: string;
  durationMs: number;
  tests: number;
}

/** Checked-in, reproducible longest-first assignment of the complete root test set. */
export interface ShardManifest {
  schemaVersion: 1;
  source: string;
  shardCount: number;
  files: Array<TestTiming & { shard: number }>;
}

/** Test lanes in the CI matrix; changing this also requires updating its matrix include list. */
export const CI_TEST_SHARD_COUNT = 6;

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
    const entries = Array.from(Deno.readDirSync(directory));
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

/** Fail closed if files or deterministic assignments drift from the current root suite. */
export function validateManifest(manifest: ShardManifest, discovered: string[]): void {
  if (manifest.schemaVersion !== 1 || !manifest.source || manifest.files.length === 0) {
    throw new Error('Invalid manifest');
  }
  const paths = manifest.files.map((file) => file.path).sort();
  const pathSet = new Set(paths);
  const discoveredSet = new Set(discovered);
  if (pathSet.size !== paths.length) throw new Error('Duplicate test module');
  if (JSON.stringify(paths) !== JSON.stringify([...discovered].sort())) {
    const missing = discovered.filter((path) => !pathSet.has(path));
    const extra = paths.filter((path) => !discoveredSet.has(path));
    throw new Error(
      `Stale test manifest; missing: ${missing.join(', ')}; extra: ${extra.join(', ')}`,
    );
  }
  for (const file of manifest.files) {
    if (
      !Number.isFinite(file.durationMs) || file.durationMs < 0 ||
      !Number.isInteger(file.tests) || file.tests < 0
    ) {
      throw new Error(`Invalid measurement: ${file.path}`);
    }
  }
  const expected = balanceTests(manifest.files, manifest.shardCount);
  if (
    manifest.files.some((file, index) =>
      file.path !== expected[index].path ||
      file.shard !== expected[index].shard
    )
  ) throw new Error('Stale shard assignments');
}

if (import.meta.main) {
  const manifest: ShardManifest = JSON.parse(
    await Deno.readTextFile('.github/scripts/ci-test-shards.json'),
  );
  const discovered = await discoverTests();
  validateManifest(manifest, discovered);
  console.log(JSON.stringify({ modules: discovered.length, shards: manifest.shardCount }));
}
