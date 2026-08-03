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
  readonly republishVersion?: string;
  readonly output?: string;
}

export interface CanaryResult {
  readonly version: string;
  readonly tag: string;
  readonly branch: string;
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
  let republishVersion: string | undefined;
  let output: string | undefined;
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
      case '--republish-version':
        republishVersion = requireValue(argv, ++index, arg);
        break;
      case '--output':
        output = requireValue(argv, ++index, arg);
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
  if (republishVersion) validateRepublishVersion(targetVersion, republishVersion);
  return {
    targetVersion,
    dryRun,
    root,
    ...(republishVersion ? { republishVersion } : {}),
    ...(output ? { output } : {}),
  };
}

/** Build the machine-readable identity consumed by post-publish automation. */
export function canaryResult(version: string, republish = false): CanaryResult {
  return {
    version,
    tag: `v${version}`,
    branch: republish ? '' : `release/canary-${version}`,
  };
}

/** Write the resolved canary identity without requiring consumers to inspect bumped manifests. */
export async function writeCanaryResult(path: string, result: CanaryResult): Promise<void> {
  await Deno.writeTextFile(path, `${JSON.stringify(result)}\n`);
}

export function validateStableTarget(version: string): void {
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(version)) {
    throw new Error(
      `Canary target must be a stable semantic version without a prerelease or build suffix: ${version}`,
    );
  }
}

/** Require an existing canary version to belong to the requested stable release train. */
export function validateRepublishVersion(targetVersion: string, republishVersion: string): void {
  validateStableTarget(targetVersion);
  const pattern = new RegExp(
    `^${escapeRegExp(targetVersion)}-${CANARY_PRERELEASE_LABEL}\\.(0|[1-9]\\d*)$`,
  );
  if (!pattern.test(republishVersion)) {
    throw new Error(
      `Canary republish version must belong to target ${targetVersion} and match ` +
        `${targetVersion}-${CANARY_PRERELEASE_LABEL}.N: ${republishVersion}`,
    );
  }
}

/** Prove the clean checkout has the exact committed tree recorded by the canary tag. */
export async function verifyCanaryRepublishTree(
  root: string,
  republishVersion: string,
  runner: ReleaseCommandRunner = runCommand,
): Promise<void> {
  const status = await runner('git', ['status', '--porcelain'], root);
  if (status.code !== 0) {
    throw new Error(`git status --porcelain failed with exit ${status.code}.`);
  }
  if (status.stdout.trim() !== '') {
    throw new Error(
      `Canary republish refused: working tree is dirty; ${republishVersion} must be published ` +
        'from a clean checkout.',
    );
  }

  const tagTree = await resolveTree(root, `v${republishVersion}^{tree}`, runner);
  const headTree = await resolveTree(root, 'HEAD^{tree}', runner);
  if (tagTree !== headTree) {
    throw new Error(
      `Canary republish refused: tagged tree ${tagTree} differs from checked-out tree ${headTree}.`,
    );
  }
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

  const pattern = new RegExp(
    `^${escapeRegExp(targetVersion)}-${CANARY_PRERELEASE_LABEL}\\.(0|[1-9]\\d*)$`,
  );
  let maximum = 0;
  for (const version of observed) {
    const match = pattern.exec(version);
    if (match) maximum = Math.max(maximum, Number(match[1]));
  }
  return `${targetVersion}-${CANARY_PRERELEASE_LABEL}.${maximum + 1}`;
}

/** Create the ephemeral canary branch and immutable provenance tag; never open a PR. */
export async function createCanaryRefs(
  root: string,
  version: string,
  files: readonly string[],
  runner: ReleaseCommandRunner = runCommand,
): Promise<void> {
  const { branch, tag } = canaryResult(version);
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
    ['tag', '--list', `v${targetVersion}-${CANARY_PRERELEASE_LABEL}.*`],
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

async function resolveTree(
  root: string,
  revision: string,
  runner: ReleaseCommandRunner,
): Promise<string> {
  const result = await runner('git', ['rev-parse', revision], root);
  if (result.code !== 0) {
    throw new Error(`git rev-parse ${revision} failed with exit ${result.code}.`);
  }
  const sha = result.stdout.trim();
  if (!/^[0-9a-f]{40,64}$/i.test(sha)) {
    throw new Error(`git rev-parse ${revision} returned an invalid tree SHA: ${sha || '<empty>'}`);
  }
  return sha;
}

function printHelp(): void {
  console.log(`Usage:
  deno task release:canary -- <target-stable-version> [--dry-run]

Options:
  --dry-run      Run version discovery, bump, and gates without creating refs.
  --republish-version <version>
                 Verify a clean checkout matches an existing canary tag; do not create refs.
  --output <path> Write resolved version, tag, and branch as JSON after successful preparation.
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
  if (options.republishVersion) {
    await verifyCanaryRepublishTree(options.root, options.republishVersion);
    if (options.output) {
      await writeCanaryResult(options.output, canaryResult(options.republishVersion, true));
    }
    console.log(`release:canary verified same-semver republish ${options.republishVersion}`);
    return;
  }
  const version = await deriveCanaryVersion(options.root, options.targetVersion);
  console.log(`release:canary selected ${version}`);
  const bump: BumpResult = await prepareRelease(options.root, version, 'release:canary', 'canary');

  if (options.dryRun) {
    if (options.output) await writeCanaryResult(options.output, canaryResult(version));
    console.log('release:canary dry-run complete; branch/commit/tag/push skipped.');
    return;
  }

  await createCanaryRefs(options.root, version, bump.files);
  if (options.output) await writeCanaryResult(options.output, canaryResult(version));
  console.log(`release:canary created v${version}; no release PR was created.`);
}

if (import.meta.main) await main();
