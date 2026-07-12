import { join } from 'jsr:@std/path@^1.0.0';
import {
  type BumpResult,
  coordinateVersionBump,
  findVersionResidue,
  validateNewerVersion,
} from '../deps/bump-version.ts';
export { coordinateVersionBump, findVersionResidue, validateNewerVersion };
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
