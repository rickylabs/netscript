#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/** Coordinate exact NetScript workspace versions around native `deno bump-version`. */

import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { dirname, join, normalize, relative } from 'jsr:@std/path@^1.0.0';

export interface BumpResult {
  readonly oldVersion: string;
  readonly newVersion: string;
  readonly files: readonly string[];
}

interface Args {
  readonly json: boolean;
  readonly pretty: boolean;
  readonly cwd: string;
  readonly nativeArgs: readonly string[];
}

interface Semver {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly string[];
}

const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** Apply an exact release version to root, every declared workspace member, scaffolds, and lock. */
export async function coordinateVersionBump(root: string, newVersion: string): Promise<BumpResult> {
  const rootDenoJson = join(root, 'deno.json');
  const oldVersion = await readVersion(rootDenoJson);
  validateNewerVersion(newVersion, oldVersion);
  const files = await discoverVersionFiles(root);
  await replaceVersionFiles(files, oldVersion, newVersion);
  return { oldVersion, newVersion, files };
}

/** Return version-bearing release files that still contain the old version. */
export async function findVersionResidue(root: string, oldVersion: string): Promise<string[]> {
  const residue: string[] = [];
  for await (
    const entry of walk(root, {
      includeDirs: false,
      skip: [
        /(?:^|[/\\])\.git(?:[/\\]|$)/,
        /(?:^|[/\\])node_modules(?:[/\\]|$)/,
        /(?:^|[/\\])\.llm[/\\]tmp(?:[/\\]|$)/,
        /(?:^|[/\\])\.llm[/\\]runs(?:[/\\]|$)/,
        /(?:^|[/\\])\.claude[/\\]worktrees(?:[/\\]|$)/,
        /(?:^|[/\\])\.data(?:[/\\]|$)/,
      ],
    })
  ) {
    const relativePath = normalize(relative(root, entry.path));
    if (!entry.path.endsWith('.json') && relativePath !== 'deno.lock') continue;
    if ((await Deno.readTextFile(entry.path)).includes(oldVersion)) {
      residue.push(normalize(entry.path));
    }
  }
  return residue.sort();
}

/** Validate that an exact version is newer than the current workspace version. */
export function validateNewerVersion(next: string, current: string): void {
  if (compareSemver(parseSemver(next), parseSemver(current)) <= 0) {
    throw new Error(`Release version ${next} must be newer than current version ${current}.`);
  }
}

export function parseSemver(version: string): Semver {
  const match = semverPattern.exec(version);
  if (!match) throw new Error(`Invalid semver version: ${version}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

/** Discover the complete release-version surface from the root workspace declaration. */
export async function discoverVersionFiles(root: string): Promise<string[]> {
  const rootDenoJson = join(root, 'deno.json');
  const rootConfig = parseJsonObject(await Deno.readTextFile(rootDenoJson), rootDenoJson);
  if (
    !Array.isArray(rootConfig.workspace) ||
    !rootConfig.workspace.every((item) => typeof item === 'string')
  ) {
    throw new Error(`${rootDenoJson} must declare a string-valued workspace array.`);
  }

  const memberManifests = new Set<string>();
  for (const pattern of rootConfig.workspace as string[]) {
    for (const member of await expandWorkspacePattern(root, pattern)) memberManifests.add(member);
  }

  const files = new Set<string>([rootDenoJson, join(root, 'deno.lock'), ...memberManifests]);
  for (const manifest of memberManifests) {
    for await (
      const entry of walk(dirname(manifest), {
        includeDirs: false,
        match: [/scaffold\.plugin\.json$/],
        skip: [/(?:^|[/\\])node_modules(?:[/\\]|$)/, /(?:^|[/\\])\.generated(?:[/\\]|$)/],
      })
    ) {
      files.add(entry.path);
    }
  }
  return [...files].map(normalize).sort();
}

async function expandWorkspacePattern(root: string, pattern: string): Promise<string[]> {
  if (!pattern.endsWith('/*')) {
    const manifest = join(root, pattern, 'deno.json');
    return await exists(manifest) ? [manifest] : [];
  }
  const parent = join(root, pattern.slice(0, -2));
  const manifests: string[] = [];
  try {
    for await (const entry of Deno.readDir(parent)) {
      if (!entry.isDirectory) continue;
      const manifest = join(parent, entry.name, 'deno.json');
      if (await exists(manifest)) manifests.push(manifest);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return manifests;
}

async function replaceVersionFiles(
  files: readonly string[],
  oldVersion: string,
  newVersion: string,
): Promise<void> {
  for (const path of files) {
    const text = await Deno.readTextFile(path);
    const next = text.replaceAll(oldVersion, newVersion);
    if (next !== text) await Deno.writeTextFile(path, next);
  }
}

function parseArgs(argv: readonly string[]): Args {
  let json = false;
  let pretty = false;
  let cwd = Deno.cwd();
  const nativeArgs: string[] = [];
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--json') json = true;
    else if (arg === '--pretty') pretty = true;
    else if (arg === '--cwd') cwd = argv[++index] ?? cwd;
    else if (arg !== '--') nativeArgs.push(arg);
  }
  return { json, pretty, cwd, nativeArgs };
}

async function run(args: Args): Promise<number> {
  const start = performance.now();
  const oldVersion = await readVersion(join(args.cwd, 'deno.json'));
  const exactVersion = args.nativeArgs.length === 1 && semverPattern.test(args.nativeArgs[0]);
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let bump: BumpResult | undefined;

  if (exactVersion) {
    bump = await coordinateVersionBump(args.cwd, args.nativeArgs[0]);
    const residue = await findVersionResidue(args.cwd, oldVersion);
    if (residue.length > 0) throw new Error(`Version residue remains:\n${residue.join('\n')}`);
    stdout = `${bump.oldVersion} -> ${bump.newVersion}\n`;
  } else {
    const commandArgs = ['bump-version', ...args.nativeArgs];
    const output = await new Deno.Command('deno', {
      args: commandArgs,
      cwd: args.cwd,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    stdout = new TextDecoder().decode(output.stdout);
    stderr = new TextDecoder().decode(output.stderr);
    exitCode = output.code;
    if (exitCode === 0 && !args.nativeArgs.includes('--dry-run')) {
      const newVersion = await readVersion(join(args.cwd, 'deno.json'));
      const files = await discoverVersionFiles(args.cwd);
      await replaceVersionFiles(files, oldVersion, newVersion);
      const residue = await findVersionResidue(args.cwd, oldVersion);
      if (residue.length > 0) throw new Error(`Version residue remains:\n${residue.join('\n')}`);
      bump = { oldVersion, newVersion, files };
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    command: exactVersion
      ? `version:bump ${args.nativeArgs[0]}`
      : `deno bump-version ${args.nativeArgs.join(' ')}`,
    cwd: args.cwd,
    exitCode,
    ok: exitCode === 0,
    durationMs: Math.round(performance.now() - start),
    stdout,
    stderr,
    files: bump?.files ?? [],
  };
  if (args.json || !args.pretty) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`version:bump - ${result.ok ? 'OK' : `FAILED (exit ${exitCode})`}`);
    if (stdout.trim()) console.log(stdout.trim());
    if (stderr.trim()) console.error(stderr.trim());
  }
  return exitCode;
}

async function readVersion(path: string): Promise<string> {
  const parsed = parseJsonObject(await Deno.readTextFile(path), path);
  if (typeof parsed.version !== 'string') throw new Error(`${path} must declare a string version.`);
  return parsed.version;
}

function compareSemver(left: Semver, right: Semver): number {
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1;
  }
  if (left.prerelease.length === 0 && right.prerelease.length === 0) return 0;
  if (left.prerelease.length === 0) return 1;
  if (right.prerelease.length === 0) return -1;
  for (let index = 0; index < Math.max(left.prerelease.length, right.prerelease.length); index++) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumber = numericIdentifier(leftPart);
    const rightNumber = numericIdentifier(rightPart);
    if (leftNumber !== null && rightNumber !== null) return leftNumber > rightNumber ? 1 : -1;
    if (leftNumber !== null) return -1;
    if (rightNumber !== null) return 1;
    return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

function numericIdentifier(value: string): number | null {
  return /^(0|[1-9]\d*)$/.test(value) ? Number(value) : null;
}

function parseJsonObject(source: string, path: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(source);
  if (!isJsonObject(parsed)) throw new Error(`${path} must contain a JSON object.`);
  return parsed;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

function printHelp(): void {
  console.log(`Usage:
  deno task version:bump -- <exact-version>
  deno task version:bump -- <native-increment> [--dry-run]

An exact version coordinates root, every declared workspace member, scaffold manifests, and
deno.lock. Native increments remain supported and receive the same residue synchronization.`);
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) printHelp();
  else Deno.exit(await run(parseArgs(Deno.args)));
}
