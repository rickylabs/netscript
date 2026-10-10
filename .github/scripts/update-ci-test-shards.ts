import {
  balanceTests,
  CI_TEST_SHARD_COUNT,
  discoverTests,
  type ShardManifest,
  type TestTiming,
  validateManifest,
} from './ci-test-shards.ts';

interface JUnitCase {
  path: string;
  name: string;
  durationMs: number;
}

const TEST_MODULE = /(?:^test|[._]test)\.[cm]?[jt]sx?$/;

function isEntryModule(path: string): boolean {
  return !/^[a-z]+:/i.test(path) && TEST_MODULE.test(path);
}

function readCases(xml: string): { files: string[]; cases: JUnitCase[] } {
  const files: string[] = [];
  const cases: JUnitCase[] = [];
  for (
    const suite of xml.matchAll(
      /<testsuite\s+name="([^"]+)"\s+tests="(\d+)"[^>]*>([\s\S]*?)<\/testsuite>/g,
    )
  ) {
    const path = suite[1].replace(/^\.\//, '');
    files.push(path);
    for (const item of suite[3].matchAll(/<testcase\s+name="([^"]+)"([^>]*)>/g)) {
      cases.push({
        path,
        name: item[1],
        durationMs: Math.round(Number(item[2].match(/\btime="([\d.]+)"/)?.[1] ?? 0) * 1000),
      });
    }
  }
  if (files.length === 0) throw new Error('No Deno JUnit modules found');
  return { files, cases };
}

function registrationKey(item: JUnitCase): string {
  return JSON.stringify([item.path, item.name]);
}

function ancestors(name: string): string[] {
  const result: string[] = [];
  let separator = name.indexOf(' &gt; ');
  while (separator >= 0) {
    result.push(name.slice(0, separator));
    separator = name.indexOf(' &gt; ', separator + 1);
  }
  return result;
}

/** Attribute helper-defined steps to their entry module, retaining every native result once. */
export function parseTimings(
  xml: string,
  registrations: ReadonlyMap<string, string> = new Map(),
): TestTiming[] {
  const { files, cases } = readCases(xml);
  const names = new Set(cases.map((item) => item.name));
  const parents = new Map<string, Set<string>>();
  for (const item of cases) {
    const owner = registrations.get(registrationKey(item)) ??
      (isEntryModule(item.path) ? item.path : undefined);
    if (owner) {
      const owners = parents.get(item.name) ?? new Set<string>();
      owners.add(owner);
      parents.set(item.name, owners);
    }
  }
  const groups = new Map<string, TestTiming>(
    files.filter((path) => isEntryModule(path)).map((
      path,
    ) => [path, { path, durationMs: 0, tests: 0 }]),
  );
  for (const item of cases) {
    const prefixes = ancestors(item.name);
    let owner = registrations.get(registrationKey(item)) ??
      (isEntryModule(item.path) ? item.path : undefined);
    if (!owner) {
      for (const prefix of prefixes.toReversed()) {
        const candidates = parents.get(prefix);
        if (!candidates) continue;
        if (candidates.size !== 1) throw new Error(`Ambiguous helper registration: ${item.name}`);
        owner = [...candidates][0];
        break;
      }
    }
    const path = owner ?? item.path;
    const group = groups.get(path) ?? { path, durationMs: 0, tests: 0 };
    group.tests++;
    // The parent's duration already includes nested steps, even when their classname differs.
    if (!prefixes.some((prefix) => names.has(prefix))) group.durationMs += item.durationMs;
    groups.set(path, group);
  }
  return [...groups.values()];
}

if (import.meta.main) {
  const [source, ...reports] = Deno.args;
  if (!source || reports.length === 0) {
    throw new Error(
      'Usage: update-ci-test-shards.ts <measurement description> <junit.xml | module=junit.xml>...',
    );
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
  const inputs: Array<{ xml: string; module?: string }> = [];
  const registrations = new Map<string, string>();
  for (const report of reports) {
    const separator = report.indexOf('=');
    const module = separator < 0 ? undefined : report.slice(0, separator);
    const path = separator < 0 ? report : report.slice(separator + 1);
    if (module && !discoveredSet.has(module)) {
      throw new Error(`Unknown test entry module: ${module}`);
    }
    const xml = await Deno.readTextFile(path);
    inputs.push({ xml, module });
    if (module) {
      for (const item of readCases(xml).cases) {
        const key = registrationKey(item);
        const prior = registrations.get(key);
        if (prior && prior !== module) {
          throw new Error(`Ambiguous registration measurement: ${item.name}`);
        }
        registrations.set(key, module);
      }
    }
  }
  for (const input of inputs) {
    const parsed = parseTimings(input.xml, registrations);
    if (input.module) {
      timings.set(input.module, {
        path: input.module,
        durationMs: parsed.reduce((n, file) => n + file.durationMs, 0),
        tests: parsed.reduce((n, file) => n + file.tests, 0),
      });
    } else {
      for (const timing of parsed) timings.set(timing.path, timing);
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
