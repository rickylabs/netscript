import type { BumpResult } from '../deps/bump-version.ts';
import { discoverWorkspaceMembers, type PublishableMember } from './publish-workspace.ts';
import {
  mustRun,
  prepareRelease,
  type ReleaseCommandRunner,
  runCommand,
} from './prepare-release.ts';
import { JSR_REGISTRY_BASE_URL } from './config/endpoints.ts';

export const CANARY_PRERELEASE_LABEL = 'canary';

export interface CanaryOptions {
  readonly targetVersion: string;
  readonly dryRun: boolean;
  readonly root: string;
}

export interface CanaryVersionDependencies {
  readonly discoverMembers: (root: string) => Promise<readonly PublishableMember[]>;
  readonly readRegistryVersions: (packageName: string) => Promise<readonly string[] | null>;
  readonly listTags: (root: string, targetVersion: string) => Promise<readonly string[]>;
}

const defaultVersionDependencies: CanaryVersionDependencies = {
  discoverMembers: discoverWorkspaceMembers,
  readRegistryVersions,
  listTags,
};

export function parseArgs(argv: string[]): CanaryOptions {
  let targetVersion = '';
  let dryRun = false;
  let root = Deno.cwd();
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    switch (arg) {
      case '--':
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--root':
        root = requireValue(argv, ++index, arg);
        break;
      case '--help':
        printHelp();
        Deno.exit(0);
        break;
      default:
        if (!targetVersion) targetVersion = arg;
        else throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  if (!targetVersion) throw new Error('release:canary requires a target stable version.');
  validateStableTarget(targetVersion);
  return { targetVersion, dryRun, root };
}

const VERSION_CORE = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)/;
const PRERELEASE_IDENTIFIERS =
  /^(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*$/;

/**
 * Validate the release a canary is proving (#888).
 *
 * Accepts a stable target (`0.0.1`) and a prerelease target (`0.0.1-beta.12`), because a canary
 * must encode the release it is tied to — a bare `0.0.1-canary.N` cut for beta.12 says nothing
 * about which release it proved, which is the provenance loss #888 was opened to fix.
 *
 * Rejects build metadata, which JSR does not accept, and rejects a target that is already a
 * canary, which would derive `...-canary.1-canary.1`.
 */
export function validateStableTarget(version: string): void {
  const invalid = (reason: string): never => {
    throw new Error(`Canary target ${reason}: ${version}`);
  };
  if (version.includes('+')) invalid('must not carry build metadata');

  const core = VERSION_CORE.exec(version);
  if (!core || (version.length > core[0].length && version[core[0].length] !== '-')) {
    invalid('must be a semantic version');
  }
  const prerelease = version.slice(core![0].length + 1);
  if (version.length === core![0].length) return; // stable target

  if (!prerelease || !PRERELEASE_IDENTIFIERS.test(prerelease)) {
    invalid('has a malformed prerelease');
  }
  if (prerelease.split('.').includes(CANARY_PRERELEASE_LABEL)) {
    invalid('is already a canary');
  }
}

/**
 * Join a canary label onto its target so the result stays correctly ordered.
 *
 * A stable target keeps the historical `0.0.1-canary.N` shape. A prerelease target appends
 * `.canary.N` **with a dot, not a hyphen** — and that is not cosmetic. Semver compares
 * prerelease identifiers pairwise, and a numeric identifier always loses to a non-numeric one,
 * so `0.0.1-beta.12-canary.1` parses as `[beta, "12-canary", 1]` and sorts ABOVE `0.0.1-beta.13`,
 * `0.0.1-beta.20`, and every later beta forever. The dotted form parses as
 * `[beta, 12, canary, 1]`, which sorts above `0.0.1-beta.12` (the release it proves) and below
 * everything after it. Verified with `@std/semver`.
 */
export function canarySuffix(targetVersion: string, ordinal: number): string {
  const separator = targetVersion.includes('-') ? '.' : '-';
  return `${targetVersion}${separator}${CANARY_PRERELEASE_LABEL}.${ordinal}`;
}

/** Derive the next immutable canary version across every effective publish member. */
export async function deriveCanaryVersion(
  root: string,
  targetVersion: string,
  dependencies: CanaryVersionDependencies = defaultVersionDependencies,
): Promise<string> {
  validateStableTarget(targetVersion);
  const members = await dependencies.discoverMembers(root);
  if (members.length === 0) {
    throw new Error('Cannot derive a canary version for an empty publish set.');
  }

  const observed = new Set<string>();
  for (const member of members) {
    const versions = await dependencies.readRegistryVersions(member.name);
    for (const version of versions ?? []) observed.add(version);
  }
  for (const tag of await dependencies.listTags(root, targetVersion)) {
    observed.add(tag.startsWith('v') ? tag.slice(1) : tag);
  }

  const separator = targetVersion.includes('-') ? '\\.' : '-';
  const pattern = new RegExp(
    `^${escapeRegExp(targetVersion)}${separator}${CANARY_PRERELEASE_LABEL}\\.(0|[1-9]\\d*)$`,
  );
  let maximum = 0;
  for (const version of observed) {
    const match = pattern.exec(version);
    if (match) maximum = Math.max(maximum, Number(match[1]));
  }
  return canarySuffix(targetVersion, maximum + 1);
}

/** Create the ephemeral canary branch and immutable provenance tag; never open a PR. */
export async function createCanaryRefs(
  root: string,
  version: string,
  files: readonly string[],
  runner: ReleaseCommandRunner = runCommand,
): Promise<void> {
  const branch = `release/canary-${version}`;
  const tag = `v${version}`;
  await mustRun('git', ['checkout', '-b', branch], root, runner);
  await mustRun('git', ['add', ...files], root, runner);
  await mustRun('git', ['commit', '-m', `chore(release): cut ${version}`], root, runner);
  await mustRun('git', ['tag', '-a', tag, '-m', `NetScript canary ${version}`], root, runner);
  await mustRun('git', ['push', 'origin', `HEAD:refs/heads/${branch}`], root, runner);
  await mustRun('git', ['push', 'origin', `refs/tags/${tag}`], root, runner);
}

export async function readRegistryVersions(
  packageName: string,
  fetcher: typeof fetch = fetch,
): Promise<readonly string[] | null> {
  const response = await fetcher(`${JSR_REGISTRY_BASE_URL}/${packageName}/meta.json`, {
    headers: { accept: 'application/json' },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(
      `JSR metadata lookup failed for ${packageName}: HTTP ${response.status} ${response.statusText}`,
    );
  }
  const metadata: unknown = await response.json();
  if (!isJsonObject(metadata) || !isJsonObject(metadata.versions)) {
    throw new Error(`JSR metadata for ${packageName} is missing a versions object.`);
  }
  return Object.keys(metadata.versions);
}

async function listTags(root: string, targetVersion: string): Promise<readonly string[]> {
  const result = await runCommand(
    'git',
    ['tag', '--list', `v${canarySuffix(targetVersion, 0).slice(0, -1)}*`],
    root,
  );
  if (result.code !== 0) throw new Error(`git tag --list failed with exit ${result.code}.`);
  return result.stdout.split(/\r?\n/).map((tag) => tag.trim()).filter(Boolean);
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

function printHelp(): void {
  console.log(`Usage:
  deno task release:canary -- <target-stable-version> [--dry-run]

Options:
  --dry-run      Run version discovery, bump, and gates without creating refs.
  --root <path>  Repository root. Defaults to the current directory.
  --help         Show this help.`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  const version = await deriveCanaryVersion(options.root, options.targetVersion);
  console.log(`release:canary selected ${version}`);
  const bump: BumpResult = await prepareRelease(options.root, version, 'release:canary');

  if (options.dryRun) {
    console.log('release:canary dry-run complete; branch/commit/tag/push skipped.');
    return;
  }

  await createCanaryRefs(options.root, version, bump.files);
  console.log(`release:canary created v${version}; no release PR was created.`);
}

if (import.meta.main) await main();
