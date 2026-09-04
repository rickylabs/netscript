#!/usr/bin/env -S deno run --allow-read --allow-write
/** Safely prune stale harness runs and transient `.llm/tmp` entries. */

import { basename, dirname, fromFileUrl, join, resolve } from '@std/path';

export interface CleanupOptions {
  readonly repoRoot: string;
  readonly apply: boolean;
  readonly allUnretained: boolean;
  readonly allTmp: boolean;
  readonly runOlderThanDays: number;
  readonly tmpOlderThanHours: number;
  readonly now?: Date;
}

export interface CleanupReport {
  readonly schemaVersion: 1;
  readonly mode: 'dry-run' | 'apply';
  readonly retainedReleaseVersions: readonly string[];
  readonly preservedRuns: readonly string[];
  readonly selectedRuns: readonly string[];
  readonly selectedTmp: readonly string[];
  readonly skippedRecentRuns: readonly string[];
  readonly skippedRecentTmp: readonly string[];
  readonly skippedUnsafeEntries: readonly string[];
  readonly removedRuns: number;
  readonly removedTmp: number;
}

interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly text: string;
}

const DAY_MS = 24 * 60 * 60 * 1_000;
const HOUR_MS = 60 * 60 * 1_000;

function parseReleaseVersion(name: string): Version | undefined {
  const match = /^release-(\d+)\.(\d+)\.(\d+)(?:-|$)/.exec(name);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    text: `${match[1]}.${match[2]}.${match[3]}`,
  };
}

function newestReleaseVersions(names: readonly string[]): string[] {
  const versions = new Map<string, Version>();
  for (const name of names) {
    const version = parseReleaseVersion(name);
    if (version) versions.set(version.text, version);
  }
  return [...versions.values()]
    .sort((left, right) =>
      right.major - left.major || right.minor - left.minor || right.patch - left.patch
    )
    .slice(0, 2)
    .map((version) => version.text);
}

async function readTopLevelDirectories(path: string): Promise<string[]> {
  try {
    const names: string[] = [];
    for await (const entry of Deno.readDir(path)) {
      if (entry.isDirectory && !entry.isSymlink) names.push(entry.name);
    }
    return names.sort();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
}

async function isRfcRun(runsRoot: string, name: string): Promise<boolean> {
  if (/rfc/i.test(name)) return true;
  const pending = [{ path: join(runsRoot, name), depth: 0 }];
  while (pending.length > 0) {
    const current = pending.shift()!;
    for await (const entry of Deno.readDir(current.path)) {
      if (entry.isSymlink) continue;
      if (entry.isFile && /^(?:rfc\.md|rfc-authority\.md)$/i.test(entry.name)) return true;
      if (entry.isDirectory && entry.name.toLowerCase() === 'rfcs') return true;
      if (entry.isDirectory && current.depth < 2) {
        pending.push({ path: join(current.path, entry.name), depth: current.depth + 1 });
      }
    }
  }
  return false;
}

function isDirectChild(root: string, candidate: string): boolean {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  return dirname(resolvedCandidate) === resolvedRoot && basename(resolvedCandidate) !== '';
}

async function isOldEnough(path: string, cutoffMs: number): Promise<boolean> {
  const info = await Deno.lstat(path);
  return !info.isSymlink && (info.mtime?.getTime() ?? Number.POSITIVE_INFINITY) <= cutoffMs;
}

async function selectTmpEntries(
  tmpRoot: string,
  allTmp: boolean,
  cutoffMs: number,
): Promise<{ selected: string[]; recent: string[]; unsafe: string[] }> {
  const selected: string[] = [];
  const recent: string[] = [];
  const unsafe: string[] = [];
  try {
    for await (const entry of Deno.readDir(tmpRoot)) {
      const relative = `.llm/tmp/${entry.name}`;
      const absolute = join(tmpRoot, entry.name);
      if (!isDirectChild(tmpRoot, absolute) || entry.isSymlink) {
        unsafe.push(relative);
      } else if (allTmp || await isOldEnough(absolute, cutoffMs)) {
        selected.push(relative);
      } else {
        recent.push(relative);
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return { selected: selected.sort(), recent: recent.sort(), unsafe: unsafe.sort() };
}

export async function cleanupHarnessState(options: CleanupOptions): Promise<CleanupReport> {
  const repoRoot = resolve(options.repoRoot);
  const runsRoot = join(repoRoot, '.llm', 'runs');
  const tmpRoot = join(repoRoot, '.llm', 'tmp');
  const nowMs = (options.now ?? new Date()).getTime();
  const runNames = await readTopLevelDirectories(runsRoot);
  const retainedReleaseVersions = newestReleaseVersions(runNames);
  const retainedVersions = new Set(retainedReleaseVersions);
  const preservedRuns: string[] = [];
  const selectedRuns: string[] = [];
  const skippedRecentRuns: string[] = [];
  const skippedUnsafeEntries: string[] = [];
  const runCutoff = nowMs - options.runOlderThanDays * DAY_MS;

  for (const name of runNames) {
    const relative = `.llm/runs/${name}`;
    const absolute = join(runsRoot, name);
    const release = parseReleaseVersion(name);
    if (await isRfcRun(runsRoot, name) || (release && retainedVersions.has(release.text))) {
      preservedRuns.push(relative);
      continue;
    }
    if (!isDirectChild(runsRoot, absolute)) {
      skippedUnsafeEntries.push(relative);
    } else if (options.allUnretained || await isOldEnough(absolute, runCutoff)) {
      selectedRuns.push(relative);
    } else {
      skippedRecentRuns.push(relative);
    }
  }

  const tmp = await selectTmpEntries(
    tmpRoot,
    options.allTmp,
    nowMs - options.tmpOlderThanHours * HOUR_MS,
  );
  skippedUnsafeEntries.push(...tmp.unsafe);

  if (options.apply) {
    for (const relative of selectedRuns) {
      await Deno.remove(join(repoRoot, relative), { recursive: true });
    }
    for (const relative of tmp.selected) {
      await Deno.remove(join(repoRoot, relative), { recursive: true });
    }
  }

  return {
    schemaVersion: 1,
    mode: options.apply ? 'apply' : 'dry-run',
    retainedReleaseVersions,
    preservedRuns,
    selectedRuns,
    selectedTmp: tmp.selected,
    skippedRecentRuns,
    skippedRecentTmp: tmp.recent,
    skippedUnsafeEntries: skippedUnsafeEntries.sort(),
    removedRuns: options.apply ? selectedRuns.length : 0,
    removedTmp: options.apply ? tmp.selected.length : 0,
  };
}

function usage(): string {
  return [
    'Usage: deno task harness:cleanup [options]',
    '',
    'Dry-run is the default. The newest two release generations and every RFC-related run are kept.',
    '',
    'Options:',
    '  --apply                    Perform the selected deletions.',
    '  --all-unretained           Select every run outside the retention set.',
    '  --all-tmp                  Select every direct child of .llm/tmp.',
    '  --run-older-than-days <n>  Default: 30.',
    '  --tmp-older-than-hours <n> Default: 72.',
    '  --pretty                   Pretty-print the JSON report.',
    '  --help                     Show this help.',
  ].join('\n');
}

interface CliArgs {
  readonly apply: boolean;
  readonly allUnretained: boolean;
  readonly allTmp: boolean;
  readonly runOlderThanDays: number;
  readonly tmpOlderThanHours: number;
  readonly pretty: boolean;
}

function positiveNumber(value: string | undefined, flag: string): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${flag} requires a non-negative number`);
  }
  return number;
}

export function parseCleanupArgs(args: readonly string[]): CliArgs {
  let apply = false;
  let allUnretained = false;
  let allTmp = false;
  let pretty = false;
  let runOlderThanDays = 30;
  let tmpOlderThanHours = 72;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--apply') apply = true;
    else if (arg === '--all-unretained') allUnretained = true;
    else if (arg === '--all-tmp') allTmp = true;
    else if (arg === '--pretty') pretty = true;
    else if (arg === '--run-older-than-days') {
      runOlderThanDays = positiveNumber(args[++index], arg);
    } else if (arg === '--tmp-older-than-hours') {
      tmpOlderThanHours = positiveNumber(args[++index], arg);
    } else if (arg === '--help') {
      console.log(usage());
      Deno.exit(0);
    } else throw new Error(`Unknown option: ${arg}\n${usage()}`);
  }
  return { apply, allUnretained, allTmp, runOlderThanDays, tmpOlderThanHours, pretty };
}

function findRepoRoot(start: string): string {
  let directory = resolve(start);
  while (true) {
    try {
      Deno.statSync(join(directory, 'deno.json'));
      return directory;
    } catch {
      const parent = dirname(directory);
      if (parent === directory) throw new Error('Could not locate repository root.');
      directory = parent;
    }
  }
}

async function main(): Promise<void> {
  const args = parseCleanupArgs(Deno.args);
  const report = await cleanupHarnessState({
    repoRoot: findRepoRoot(dirname(fromFileUrl(import.meta.url))),
    apply: args.apply,
    allUnretained: args.allUnretained,
    allTmp: args.allTmp,
    runOlderThanDays: args.runOlderThanDays,
    tmpOlderThanHours: args.tmpOlderThanHours,
  });
  console.log(JSON.stringify(report, null, args.pretty ? 2 : undefined));
  if (report.skippedUnsafeEntries.length > 0) Deno.exitCode = 2;
}

if (import.meta.main) await main();
