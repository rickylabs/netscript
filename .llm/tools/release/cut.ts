import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { join, normalize, relative } from 'jsr:@std/path@^1.0.0';
import {
  buildPullRequestBody,
  githubRequest,
  type GitHubResponse,
  resolveGithubToken,
} from '../agentic/lib/agentic-lib.ts';
import { runReleasePreflight } from './preflight-release.ts';

export interface ReleaseCutOptions {
  version: string;
  dryRun: boolean;
  root: string;
}

export interface BumpResult {
  oldVersion: string;
  newVersion: string;
  files: string[];
}

interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface ReleasePrDependencies {
  resolveToken: () => Promise<{ token: string; source: string }>;
  request: (
    method: string,
    path: string,
    token: string,
    body?: unknown,
  ) => Promise<GitHubResponse>;
}

const defaultReleasePrDependencies: ReleasePrDependencies = {
  resolveToken: () => resolveGithubToken(),
  request: githubRequest,
};

const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** Apply the release version to root/member deno.json files and deno.lock. */
export async function coordinateVersionBump(root: string, newVersion: string): Promise<BumpResult> {
  const rootDenoJson = join(root, 'deno.json');
  const oldVersion = await readRootVersion(rootDenoJson);
  validateNewerVersion(newVersion, oldVersion);

  const files = [rootDenoJson, ...await discoverMemberDenoJsonFiles(root), join(root, 'deno.lock')];
  for (const file of files) {
    await replaceVersionInFile(file, oldVersion, newVersion);
  }

  return {
    oldVersion,
    newVersion,
    files: files.map((file) => normalize(file)),
  };
}

/** Return files that still contain the old version after a release bump. */
export async function findVersionResidue(root: string, oldVersion: string): Promise<string[]> {
  const residue: string[] = [];
  for await (
    const entry of walk(root, {
      includeDirs: false,
      skip: [
        /(?:^|[/\\])\.git(?:[/\\]|$)/,
        /(?:^|[/\\])node_modules(?:[/\\]|$)/,
        // Prune agent/e2e scratch trees: leftover scaffolded test projects
        // under .llm/tmp can contain container-owned Postgres .data dirs that
        // are not readdir-able by this user, which would otherwise crash the
        // residue walk (a release-determinism hazard, #147).
        /(?:^|[/\\])\.llm[/\\]tmp(?:[/\\]|$)/,
        // Run artifacts are historical records: they quote old release
        // versions by design and are never part of the publish surface.
        /(?:^|[/\\])\.llm[/\\]runs(?:[/\\]|$)/,
        // Agent worktrees are independent checkouts, not release surface;
        // descending into them false-fails the residue check.
        /(?:^|[/\\])\.claude[/\\]worktrees(?:[/\\]|$)/,
        /(?:^|[/\\])\.data(?:[/\\]|$)/,
      ],
    })
  ) {
    const relativePath = normalize(relative(root, entry.path));
    if (relativePath.startsWith(normalize('.llm/tmp/'))) {
      continue;
    }
    if (
      !entry.path.endsWith('.json') && normalize(entry.path) !== normalize(join(root, 'deno.lock'))
    ) {
      continue;
    }
    const text = await Deno.readTextFile(entry.path);
    if (text.includes(oldVersion)) {
      residue.push(normalize(entry.path));
    }
  }
  residue.sort();
  return residue;
}

export function validateNewerVersion(next: string, current: string): void {
  const nextSemver = parseSemver(next);
  const currentSemver = parseSemver(current);
  if (compareSemver(nextSemver, currentSemver) <= 0) {
    throw new Error(`Release version ${next} must be newer than current version ${current}.`);
  }
}

export function parseSemver(version: string): Semver {
  const match = semverPattern.exec(version);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4] ? match[4].split('.') : [];
  return { major, minor, patch, prerelease };
}

function compareSemver(left: Semver, right: Semver): number {
  for (const key of ['major', 'minor', 'patch']) {
    const leftValue = key === 'major' ? left.major : key === 'minor' ? left.minor : left.patch;
    const rightValue = key === 'major' ? right.major : key === 'minor' ? right.minor : right.patch;
    if (leftValue !== rightValue) return leftValue > rightValue ? 1 : -1;
  }
  if (left.prerelease.length === 0 && right.prerelease.length === 0) return 0;
  if (left.prerelease.length === 0) return 1;
  if (right.prerelease.length === 0) return -1;
  const length = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < length; index++) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (leftPart === rightPart) continue;
    const leftNumber = numericIdentifier(leftPart);
    const rightNumber = numericIdentifier(rightPart);
    if (leftNumber !== null && rightNumber !== null) {
      return leftNumber > rightNumber ? 1 : -1;
    }
    if (leftNumber !== null) return -1;
    if (rightNumber !== null) return 1;
    return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

function numericIdentifier(value: string): number | null {
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  return Number(value);
}

async function readRootVersion(path: string): Promise<string> {
  const parsed = JSON.parse(await Deno.readTextFile(path));
  if (!isJsonObject(parsed) || typeof parsed.version !== 'string') {
    throw new Error(`${path} must declare a string version.`);
  }
  return parsed.version;
}

async function discoverMemberDenoJsonFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const parent of ['packages', 'plugins']) {
    const parentPath = join(root, parent);
    try {
      for await (
        const entry of walk(parentPath, {
          includeDirs: false,
          match: [/deno\.json$/, /scaffold\.plugin\.json$/],
          skip: [
            /(?:^|[/\\])node_modules(?:[/\\]|$)/,
            /(?:^|[/\\])\.generated(?:[/\\]|$)/,
          ],
        })
      ) {
        files.push(entry.path);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  files.sort();
  return files;
}

async function replaceVersionInFile(
  path: string,
  oldVersion: string,
  newVersion: string,
): Promise<void> {
  const text = await Deno.readTextFile(path);
  const next = text.replaceAll(oldVersion, newVersion);
  if (next !== text) {
    await Deno.writeTextFile(path, next);
  }
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

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseArgs(argv: string[]): ReleaseCutOptions {
  let version = '';
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
        if (!version) {
          version = arg;
        } else {
          throw new Error(`Unexpected argument: ${arg}`);
        }
    }
  }
  if (!version) {
    throw new Error('release:cut requires a version argument.');
  }
  return { version, dryRun, root };
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function printHelp(): void {
  console.log(`Usage:
  deno task release:cut -- <version> [--dry-run]

Options:
  --dry-run      Run bump, residue check, and gates without branch/commit/push/PR.
  --root <path>  Repository root. Defaults to the current directory.
  --help         Show this help.`);
}

async function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

async function runGate(name: string, command: string, args: string[], cwd: string): Promise<void> {
  console.log(`release:cut gate: ${name}`);
  const result = await runCommand(command, args, cwd);
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.code !== 0) {
    throw new Error(`${name} failed with exit ${result.code}.`);
  }
}

/** Open a release PR through the shared GitHub API token path. */
export async function createReleasePullRequest(
  version: string,
  body: string,
  dependencies: ReleasePrDependencies = defaultReleasePrDependencies,
): Promise<boolean> {
  const branch = `release/cut-${version}`;
  try {
    const { token, source } = await dependencies.resolveToken();
    console.log(`release:cut GitHub token source: ${source}`);
    const response = await dependencies.request(
      'POST',
      '/repos/rickylabs/netscript/pulls',
      token,
      buildPullRequestBody({
        title: `chore(release): cut ${version}`,
        head: branch,
        base: 'main',
        body,
      }),
    );
    if (!response.ok) {
      throw new Error(
        `GitHub API returned ${response.status}: ${response.body?.message ?? response.body}`,
      );
    }
    const url = typeof response.body?.html_url === 'string' ? response.body.html_url : '';
    if (url) console.log(url);
    return true;
  } catch (error) {
    console.error(
      `release:cut could not create the release PR: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    console.error(
      `Branch ${branch} was pushed successfully. Open the PR manually against main using the generated body file.`,
    );
    return false;
  }
}

/** Write the generated release PR body to the scratch file used by the cut flow. */
export async function writeReleasePrBody(root: string, version: string): Promise<string> {
  const bodyDirectory = join(root, '.llm', 'tmp');
  const bodyFile = join(bodyDirectory, `release-cut-${version}-body.md`);
  await Deno.mkdir(bodyDirectory, { recursive: true });
  await Deno.writeTextFile(
    bodyFile,
    `## Summary

Cut NetScript ${version}.

## Validation

- \`deno task release:preflight\`
- \`deno task publish:dry-run\`
- \`deno ci --prod\`

## Post-Merge

Create and publish GitHub Release \`v${version}\`; \`publish.yml\` will publish with OIDC and hand the published version to \`e2e-cli-prod.yml\`.
`,
  );
  return bodyFile;
}

async function createReleasePr(root: string, version: string, files: string[]): Promise<void> {
  const branch = `release/cut-${version}`;
  await mustRun('git', ['checkout', '-b', branch], root);
  await mustRun('git', ['add', ...files], root);
  await mustRun('git', ['commit', '-m', `chore(release): cut ${version}`], root);
  await mustRun('git', ['push', 'origin', `HEAD:refs/heads/${branch}`], root);

  const bodyFile = await writeReleasePrBody(root, version);
  const body = await Deno.readTextFile(bodyFile);
  await createReleasePullRequest(version, body);
}

async function mustRun(command: string, args: string[], cwd: string): Promise<void> {
  const result = await runCommand(command, args, cwd);
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.code}.`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  const bump = await coordinateVersionBump(options.root, options.version);
  console.log(`release:cut bumped ${bump.oldVersion} -> ${bump.newVersion}`);

  const residue = await findVersionResidue(options.root, bump.oldVersion);
  if (residue.length > 0) {
    throw new Error(
      `Version residue remains for ${bump.oldVersion}:\n${
        residue.map((file) => `- ${file}`).join('\n')
      }`,
    );
  }

  await runReleasePreflight(options.root, options.version);

  await runGate('release:preflight', 'deno', ['task', 'release:preflight'], options.root);
  await runGate('publish:dry-run', 'deno', ['task', 'publish:dry-run'], options.root);
  await runGate('deno ci --prod', 'deno', ['ci', '--prod'], options.root);

  if (options.dryRun) {
    console.log('release:cut dry-run complete; branch/commit/push/PR skipped.');
    return;
  }

  await createReleasePr(options.root, options.version, bump.files);
  console.log(
    `Post-merge: publish GitHub Release v${options.version}; CI will publish and verify.`,
  );
}

if (import.meta.main) {
  await main();
}
