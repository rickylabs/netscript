/**
 * github-release.ts — create the GitHub Release that publishes a NetScript version.
 *
 * WHY THIS EXISTS
 * Publishing a GitHub Release is what triggers `.github/workflows/publish.yml`
 * (`on: release: published`), which publishes every `@netscript/*` member to JSR
 * over OIDC. The release IS the publish trigger: there is no JSR publish without
 * one. This tool makes that release step deterministic instead of a hand-run
 * `gh release create`, which previously (a) omitted the introduction summary and
 * (b) left the `prerelease` flag set — and GitHub never marks a prerelease as
 * "Latest", which stranded the Latest badge on alpha.16 through alpha.19.
 *
 * WHAT IS AUTOMATED vs MANUAL
 *  - Automated: the "What's Changed" merged-PR list (GitHub's generate-notes
 *    API), the "Closed Issues" list since the previous release, and the
 *    `prerelease=false` + `make_latest` flags so the newest release shows as
 *    Latest.
 *  - MANUAL BY DESIGN: the introduction summary — the prose describing what the
 *    release ships. A maintainer writes it and passes it via `--notes-file` or
 *    `--message`. This tool REFUSES to create a release without one; generated
 *    prose is not a substitute for a maintainer's framing of a release. This is
 *    the one deliberately-human step and is documented as such in
 *    `.agents/skills/netscript-release`.
 *
 * The JSR package links are NOT added here — `publish.yml` appends them to the
 * release body after the JSR publish succeeds (see
 * `publish-workspace.ts:formatJsrLinksBlock`).
 *
 * Runs under Deno on Windows via `fetch` + `resolveGithubToken` (no `gh`
 * dependency), so it works in the deno-on-Windows / gh-in-WSL split.
 *
 * Usage:
 *   deno task release:publish -- v0.0.1-alpha.20 --notes-file intro.md
 *   deno task release:publish -- 0.0.1-alpha.20 --message "One-line intro." --dry-run
 */

import {
  githubRequest,
  type GitHubResponse,
  resolveGithubToken,
} from '../agentic/lib/agentic-lib.ts';
import { discoverVersionFiles } from '../deps/bump-version.ts';

const DEFAULT_REPO = 'rickylabs/netscript';
export const CANARY_PAIR_STATUS_CONTEXT = 'release/canary-pair';

export interface ClosedIssue {
  readonly number: number;
  readonly title: string;
}

export interface ReleasePlan {
  /** Version without a leading `v`, e.g. `0.0.1-alpha.20`. */
  readonly version: string;
  /** Repo slug `owner/name`. */
  readonly repo: string;
  /** Path to a file holding the hand-written intro. Mutually exclusive with `message`. */
  readonly notesFile?: string;
  /** Inline hand-written intro. Mutually exclusive with `notesFile`. */
  readonly message?: string;
  /** Override the previous tag used for the changelog range; auto-detected when absent. */
  readonly prevTag?: string;
  /** Mark the release as a prerelease. Default false (so it can be Latest). */
  readonly prerelease: boolean;
  /** Mark the release as the repo's Latest. Default true unless prerelease. */
  readonly latest: boolean;
  /** Create the release as a draft (does not trigger publish). Default false. */
  readonly draft: boolean;
  /** Compose and print the body without creating the release. Default false. */
  readonly dryRun: boolean;
  /** WSL user whose `gh` login to consult for token resolution. */
  readonly wslUser?: string;
}

// ---------------------------------------------------------------------------
// Pure formatting (unit-tested; no IO)
// ---------------------------------------------------------------------------

/** Render the "Closed Issues" section, or an empty string when there are none. */
export function formatClosedIssues(issues: readonly ClosedIssue[]): string {
  if (issues.length === 0) {
    return '';
  }
  const lines = issues.map((issue) => `- #${issue.number} ${issue.title}`);
  return ['## Closed Issues', '', ...lines].join('\n');
}

/**
 * Compose the full release body: hand-written intro, then the generated
 * "What's Changed" PR list, then the generated "Closed Issues" list. Blank
 * sections are dropped. `publish.yml` appends the JSR links block afterward.
 */
export function composeReleaseBody(parts: {
  readonly intro: string;
  readonly whatsChanged: string;
  readonly closedIssues: string;
}): string {
  const sections = [parts.intro, parts.whatsChanged, parts.closedIssues]
    .map((section) => section.trim())
    .filter((section) => section.length > 0);
  return `${sections.join('\n\n')}\n`;
}

/** Normalize a version/tag to a bare version (strip a single leading `v`). */
export function toVersion(input: string): string {
  return input.startsWith('v') ? input.slice(1) : input;
}

/** The canonical release tag for a version (`v` + bare version). */
export function toTag(version: string): string {
  return `v${toVersion(version)}`;
}

export interface CanaryPairDependencies {
  readonly revParse: (root: string, revision: string) => Promise<string>;
  readonly changedFiles: (root: string) => Promise<readonly string[]>;
  readonly versionFiles: (root: string) => Promise<readonly string[]>;
  readonly fileAtRevision: (root: string, revision: string, path: string) => Promise<string>;
  readonly request: typeof githubRequest;
}

const defaultCanaryPairDependencies: CanaryPairDependencies = {
  revParse: runGitRevParse,
  changedFiles: runGitChangedFiles,
  versionFiles: discoverVersionFiles,
  fileAtRevision: runGitFileAtRevision,
  request: githubRequest,
};

/** True only when the current commit changed release-version files and nothing else. */
export function isVersionOnlyReleaseDiff(
  root: string,
  changedFiles: readonly string[],
  versionFiles: readonly string[],
): boolean {
  if (changedFiles.length === 0) return false;
  const normalizedRoot = normalizeGitPath(root).replace(/\/$/, '');
  const allowed = new Set(
    versionFiles.map((path) => {
      const normalized = normalizeGitPath(path);
      return normalized.startsWith(`${normalizedRoot}/`)
        ? normalized.slice(normalizedRoot.length + 1)
        : normalized;
    }),
  );
  return changedFiles.every((path) => allowed.has(normalizeGitPath(path)));
}

/** True only when every changed file is exactly the coordinated version replacement. */
export function isExactVersionReplacement(
  before: string,
  after: string,
  previousVersion: string,
  nextVersion: string,
): boolean {
  // Keep this byte-for-byte rule aligned with deps/bump-version.ts::replaceVersionFiles.
  return previousVersion !== nextVersion &&
    before.replaceAll(previousVersion, nextVersion) === after;
}

/**
 * Enforce the mandatory green canary-publish + canary-pinned production-E2E
 * status for the same content. A stable version-only commit may inherit the
 * evidence attached to its immediate parent; any source delta fails closed.
 */
export async function verifyGreenCanaryPair(
  repo: string,
  token: string,
  root: string = Deno.cwd(),
  dependencies: CanaryPairDependencies = defaultCanaryPairDependencies,
): Promise<string> {
  const current = await dependencies.revParse(root, 'HEAD');
  if (await hasGreenCanaryPair(repo, token, current, dependencies.request)) return current;

  const changed = await dependencies.changedFiles(root);
  const versionFiles = await dependencies.versionFiles(root);
  if (isVersionOnlyReleaseDiff(root, changed, versionFiles)) {
    const parent = await dependencies.revParse(root, 'HEAD^');
    const parentRoot = await dependencies.fileAtRevision(root, parent, 'deno.json');
    const currentRoot = await dependencies.fileAtRevision(root, current, 'deno.json');
    const previousVersion = readManifestVersion(parentRoot, `${parent}:deno.json`);
    const nextVersion = readManifestVersion(currentRoot, `${current}:deno.json`);
    const exactReplacement = await everyAsync(changed, async (path) => {
      const before = await dependencies.fileAtRevision(root, parent, path);
      const after = await dependencies.fileAtRevision(root, current, path);
      return isExactVersionReplacement(before, after, previousVersion, nextVersion);
    });
    if (exactReplacement) {
      if (await hasGreenCanaryPair(repo, token, parent, dependencies.request)) return parent;
      throw new Error(
        `Stable publication blocked: neither ${current} nor its exact version-only parent ${parent} ` +
          `has a green ${CANARY_PAIR_STATUS_CONTEXT} status. Run release:canary for this content ` +
          'and wait for the canary-pinned e2e-cli-prod workflow to pass.',
      );
    }
    throw new Error(
      `Stable publication blocked: ${current} changed release manifests beyond the exact coordinated ` +
        'version replacement, so its parent canary evidence cannot authorize this content.',
    );
  }

  throw new Error(
    `Stable publication blocked: ${current} has no green ${CANARY_PAIR_STATUS_CONTEXT} status, ` +
      'and the immediate parent cannot be used because the current commit contains non-version ' +
      'changes. Run a new canary pair for this exact content.',
  );
}

async function hasGreenCanaryPair(
  repo: string,
  token: string,
  sha: string,
  request: typeof githubRequest,
): Promise<boolean> {
  const response: GitHubResponse = await request(
    'GET',
    `/repos/${repo}/commits/${sha}/status`,
    token,
  );
  if (!response.ok || !Array.isArray(response.body?.statuses)) {
    throw new Error(
      `Canary-pair status lookup failed for ${sha}: HTTP ${response.status} ` +
        `${JSON.stringify(response.body)}. Stable publication fails closed.`,
    );
  }
  const status = response.body.statuses.find(
    (entry: unknown) => isRecord(entry) && entry.context === CANARY_PAIR_STATUS_CONTEXT,
  );
  return isRecord(status) && status.state === 'success';
}

async function runGitRevParse(root: string, revision: string): Promise<string> {
  return await runGit(root, ['rev-parse', revision]);
}

async function runGitChangedFiles(root: string): Promise<readonly string[]> {
  const output = await runGit(root, ['diff', '--name-only', 'HEAD^', 'HEAD']);
  return output.split(/\r?\n/).map((path) => path.trim()).filter(Boolean);
}

async function runGitFileAtRevision(
  root: string,
  revision: string,
  path: string,
): Promise<string> {
  return await runGit(root, ['show', `${revision}:${normalizeGitPath(path)}`], false);
}

async function runGit(root: string, args: readonly string[], trim = true): Promise<string> {
  const result = await new Deno.Command('git', {
    args: [...args],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoded = new TextDecoder().decode(result.stdout);
  const stdout = trim ? decoded.trim() : decoded;
  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr).trim();
    throw new Error(`git ${args.join(' ')} failed: ${stderr || `exit ${result.code}`}`);
  }
  return stdout;
}

function readManifestVersion(source: string, label: string): string {
  const parsed: unknown = JSON.parse(source);
  if (!isRecord(parsed) || typeof parsed.version !== 'string') {
    throw new Error(`${label} does not declare a string version.`);
  }
  return parsed.version;
}

async function everyAsync<T>(
  values: readonly T[],
  predicate: (value: T) => Promise<boolean>,
): Promise<boolean> {
  for (const value of values) if (!(await predicate(value))) return false;
  return true;
}

function normalizeGitPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Argument parsing (unit-tested; no IO)
// ---------------------------------------------------------------------------

export function parseArgs(argv: readonly string[]): ReleasePlan {
  let version: string | undefined;
  let repo = DEFAULT_REPO;
  let notesFile: string | undefined;
  let message: string | undefined;
  let prevTag: string | undefined;
  let prerelease = false;
  let latestExplicit: boolean | undefined;
  let draft = false;
  let dryRun = false;
  let wslUser: string | undefined;

  const readValue = (index: number, flag: string): string => {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${flag} requires a value.`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--version') {
      version = readValue(index, arg);
      index += 1;
    } else if (arg === '--repo') {
      repo = readValue(index, arg);
      index += 1;
    } else if (arg === '--notes-file') {
      notesFile = readValue(index, arg);
      index += 1;
    } else if (arg === '--message') {
      message = readValue(index, arg);
      index += 1;
    } else if (arg === '--prev-tag') {
      prevTag = readValue(index, arg);
      index += 1;
    } else if (arg === '--wsl-user') {
      wslUser = readValue(index, arg);
      index += 1;
    } else if (arg === '--prerelease') {
      prerelease = true;
    } else if (arg === '--latest') {
      latestExplicit = true;
    } else if (arg === '--no-latest') {
      latestExplicit = false;
    } else if (arg === '--draft') {
      draft = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (!arg.startsWith('--') && version === undefined) {
      // Allow the version as a bare positional (matches `release:cut -- <version>`).
      version = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!version) {
    throw new Error('release:publish requires a version, e.g. `-- v0.0.1-alpha.20`.');
  }
  if (!notesFile && message === undefined) {
    throw new Error(
      'An introduction summary is required (it is the one deliberately manual step): ' +
        'pass --notes-file <path> or --message <text>. See .agents/skills/netscript-release.',
    );
  }
  if (notesFile && message !== undefined) {
    throw new Error('--notes-file and --message cannot be combined.');
  }

  const latest = latestExplicit ?? !prerelease;
  if (prerelease && latest) {
    throw new Error(
      'A prerelease cannot be marked Latest (GitHub rejects it). ' +
        'Drop --prerelease, or pass --no-latest with --prerelease.',
    );
  }

  return {
    version: toVersion(version),
    repo,
    notesFile,
    message,
    prevTag,
    prerelease,
    latest,
    draft,
    dryRun,
    wslUser,
  };
}

// ---------------------------------------------------------------------------
// GitHub API (impure)
// ---------------------------------------------------------------------------

interface PreviousRelease {
  readonly tag: string;
  readonly since: string;
}

/** The most recent non-draft release other than `currentTag`, for the changelog range. */
async function fetchPreviousRelease(
  repo: string,
  token: string,
  currentTag: string,
): Promise<PreviousRelease | null> {
  const res = await githubRequest('GET', `/repos/${repo}/releases?per_page=20`, token);
  if (!res.ok || !Array.isArray(res.body)) {
    return null;
  }
  for (const release of res.body) {
    const tag: unknown = release?.tag_name;
    if (typeof tag === 'string' && tag !== currentTag && release?.draft !== true) {
      const since: unknown = release?.published_at ?? release?.created_at;
      return { tag, since: typeof since === 'string' ? since : '' };
    }
  }
  return null;
}

/** GitHub's auto-generated "What's Changed" body (merged PRs + Full Changelog link). */
async function generateWhatsChanged(
  repo: string,
  token: string,
  tag: string,
  previousTag?: string,
): Promise<string> {
  const payload: Record<string, unknown> = { tag_name: tag };
  if (previousTag) {
    payload.previous_tag_name = previousTag;
  }
  const res = await githubRequest('POST', `/repos/${repo}/releases/generate-notes`, token, payload);
  if (!res.ok) {
    throw new Error(
      `generate-notes failed: HTTP ${res.status} ${JSON.stringify(res.body)}. ` +
        'The release tag must exist on the default branch (merge the release PR first).',
    );
  }
  return typeof res.body?.body === 'string' ? res.body.body : '';
}

/** Issues (not PRs) closed since `since` (ISO timestamp), newest first. */
async function fetchClosedIssues(
  repo: string,
  token: string,
  since: string,
): Promise<ClosedIssue[]> {
  const range = since ? ` closed:>${since}` : '';
  const query = `repo:${repo} is:issue is:closed${range}`;
  const path = `/search/issues?q=${encodeURIComponent(query)}&per_page=100&sort=updated&order=desc`;
  const res = await githubRequest('GET', path, token);
  const items: unknown = res.body?.items;
  if (!res.ok || !Array.isArray(items)) {
    return [];
  }
  const issues: ClosedIssue[] = [];
  for (const item of items) {
    // `is:issue` already excludes PRs, but guard against the `pull_request` field.
    if (item?.pull_request) {
      continue;
    }
    if (typeof item?.number === 'number' && typeof item?.title === 'string') {
      issues.push({ number: item.number, title: item.title });
    }
  }
  return issues;
}

async function createRelease(
  repo: string,
  token: string,
  plan: ReleasePlan,
  tag: string,
  body: string,
): Promise<string> {
  const payload = {
    tag_name: tag,
    name: tag,
    body,
    draft: plan.draft,
    prerelease: plan.prerelease,
    make_latest: plan.latest ? 'true' : 'false',
    generate_release_notes: false,
  };
  const res = await githubRequest('POST', `/repos/${repo}/releases`, token, payload);
  if (!res.ok) {
    throw new Error(`Create release failed: HTTP ${res.status} ${JSON.stringify(res.body)}`);
  }
  return typeof res.body?.html_url === 'string' ? res.body.html_url : `${tag} created`;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function resolveIntro(plan: ReleasePlan): Promise<string> {
  const raw = plan.notesFile ? await Deno.readTextFile(plan.notesFile) : (plan.message ?? '');
  const intro = raw.trim();
  if (intro.length === 0) {
    throw new Error(
      'The introduction summary is empty. Write what this release ships ' +
        '(the one deliberately manual step) and pass it via --notes-file or --message.',
    );
  }
  return intro;
}

async function main(): Promise<void> {
  const plan = parseArgs(Deno.args);
  const tag = toTag(plan.version);
  const intro = await resolveIntro(plan);

  const { token, source } = await resolveGithubToken({ wslUser: plan.wslUser });
  console.error(`[release:publish] token source: ${source}`);

  const canaryContentSha = await verifyGreenCanaryPair(plan.repo, token);
  console.error(
    `[release:publish] green canary pair: ${canaryContentSha} (${CANARY_PAIR_STATUS_CONTEXT})`,
  );

  const previous = plan.prevTag
    ? { tag: plan.prevTag, since: '' }
    : await fetchPreviousRelease(plan.repo, token, tag);
  if (previous?.tag) {
    console.error(`[release:publish] previous release: ${previous.tag}`);
  }

  const whatsChanged = await generateWhatsChanged(plan.repo, token, tag, previous?.tag);
  const closed = previous?.since ? await fetchClosedIssues(plan.repo, token, previous.since) : [];
  console.error(`[release:publish] closed issues since previous release: ${closed.length}`);

  const body = composeReleaseBody({
    intro,
    whatsChanged,
    closedIssues: formatClosedIssues(closed),
  });

  if (plan.dryRun) {
    console.error(
      `\n[release:publish] DRY RUN — would create ${tag} ` +
        `(prerelease=${plan.prerelease}, latest=${plan.latest}, draft=${plan.draft}). Body below:\n`,
    );
    console.log(body);
    return;
  }

  const url = await createRelease(plan.repo, token, plan, tag, body);
  console.error(
    `[release:publish] created ${tag} (prerelease=${plan.prerelease}, latest=${plan.latest}). ` +
      'publish.yml will now publish to JSR and append the package links.',
  );
  console.log(url);
}

if (import.meta.main) {
  await main();
}
