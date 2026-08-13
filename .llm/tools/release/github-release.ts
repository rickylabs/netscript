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
  githubField,
  githubRequest,
  type GitHubResponse,
  resolveGithubToken,
} from '../agentic/lib/agentic-lib.ts';
import {
  discoverPreparedReleaseFiles,
  PREPARED_RELEASE_GENERATED_OUTPUTS,
} from './prepare-release.ts';
import { rewriteNetScriptVersion } from '../deps/bump-version.ts';

const DEFAULT_REPO = 'rickylabs/netscript';
export const CANARY_PAIR_STATUS_CONTEXT = 'release/canary-pair';
const AGENT_DOCS_PROSE_PATH = '.llm/assets/agent-docs/prose.json.gz';
const AGENT_DOCS_PROVENANCE_PATH = '.llm/assets/agent-docs/provenance.json';

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
  readonly releaseFiles: (root: string) => Promise<readonly string[]>;
  readonly fileAtRevision: (root: string, revision: string, path: string) => Promise<string>;
  readonly fileBytesAtRevision?: (
    root: string,
    revision: string,
    path: string,
  ) => Promise<Uint8Array>;
  readonly generatedOutputsFresh?: (root: string) => Promise<unknown>;
  readonly request: typeof githubRequest;
}

const defaultCanaryPairDependencies: CanaryPairDependencies = {
  revParse: runGitRevParse,
  changedFiles: runGitChangedFiles,
  releaseFiles: discoverPreparedReleaseFiles,
  fileAtRevision: runGitFileAtRevision,
  fileBytesAtRevision: runGitFileBytesAtRevision,
  generatedOutputsFresh: assertPreparedReleaseGeneratedOutputsFresh,
  request: githubRequest,
};

/** True only when the current commit changed writer-declared release files and nothing else. */
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
    rewriteNetScriptVersion(before, previousVersion, nextVersion) === after;
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
  const releaseFiles = await dependencies.releaseFiles(root);
  if (isVersionOnlyReleaseDiff(root, changed, releaseFiles)) {
    const parent = await dependencies.revParse(root, 'HEAD^');
    const parentRoot = await dependencies.fileAtRevision(root, parent, 'deno.json');
    const currentRoot = await dependencies.fileAtRevision(root, current, 'deno.json');
    const previousVersion = readManifestVersion(parentRoot, `${parent}:deno.json`);
    const nextVersion = readManifestVersion(currentRoot, `${current}:deno.json`);
    const inexactGeneratedPaths: string[] = [];
    const exactReplacement = await everyAsync(changed, async (path) => {
      const before = await dependencies.fileAtRevision(root, parent, path);
      const after = await dependencies.fileAtRevision(root, current, path);
      if (isExactVersionReplacement(before, after, previousVersion, nextVersion)) return true;
      if (isPreparedReleaseGeneratedOutput(path)) {
        inexactGeneratedPaths.push(path);
        return true;
      }
      return false;
    });
    if (exactReplacement) {
      if (inexactGeneratedPaths.length > 0) {
        const agentDocsChanged = inexactGeneratedPaths.some((path) => {
          const normalized = normalizeGitPath(path);
          return normalized === AGENT_DOCS_PROSE_PATH || normalized === AGENT_DOCS_PROVENANCE_PATH;
        });
        if (agentDocsChanged) {
          const readBytes = dependencies.fileBytesAtRevision;
          if (!readBytes) {
            throw new Error(
              'Stable publication blocked: agent-docs provenance requires binary parent-to-HEAD ' +
                'prose comparisons before canary evidence can be inherited.',
            );
          }
          const [beforeProvenance, afterProvenance, beforeProse, afterProse] = await Promise.all([
            dependencies.fileAtRevision(root, parent, AGENT_DOCS_PROVENANCE_PATH),
            dependencies.fileAtRevision(root, current, AGENT_DOCS_PROVENANCE_PATH),
            readBytes(root, parent, AGENT_DOCS_PROSE_PATH),
            readBytes(root, current, AGENT_DOCS_PROSE_PATH),
          ]);
          if (
            !(await isExactAgentDocsProvenanceReplacement(
              beforeProvenance,
              afterProvenance,
              beforeProse,
              afterProse,
              previousVersion,
              nextVersion,
            ))
          ) {
            throw new Error(
              'Stable publication blocked: agent-docs provenance contains non-version changes, ' +
                'so the parent canary evidence cannot authorize this content.',
            );
          }
        }
        const assertFresh = dependencies.generatedOutputsFresh;
        try {
          const proof = assertFresh ? await assertFresh(root) : undefined;
          if (proof !== PREPARED_RELEASE_FRESHNESS_PROOF) {
            throw new Error(
              'Stable publication blocked: semantic generated-output freshness was not proven.',
            );
          }
        } catch (error) {
          if (agentDocsChanged) {
            throw new Error(
              'Stable publication blocked: agent-docs prose contains non-version changes, so ' +
                'the parent canary evidence cannot authorize this content.' +
                `\n${error instanceof Error ? error.message : String(error)}`,
            );
          }
          throw error;
        }
      }
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

function isAgentDocsPayload(
  value: unknown,
): value is { readonly schemaVersion: 1; readonly files: Readonly<Record<string, string>> } {
  return isRecord(value) && value.schemaVersion === 1 && isRecord(value.files) &&
    Object.values(value.files).every((source) => typeof source === 'string');
}

async function decompressGzip(compressed: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(compressed);
  const stream = new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

interface AgentDocsProvenance {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly sourceCommit: string;
  readonly extractionTimestamp: string;
  readonly files: readonly string[];
  readonly uncompressedBytes: number;
  readonly compressedBytes: number;
  readonly sha256: string;
}

const AGENT_DOCS_PROVENANCE_KEYS = [
  'schemaVersion',
  'version',
  'sourceCommit',
  'extractionTimestamp',
  'files',
  'uncompressedBytes',
  'compressedBytes',
  'sha256',
] as const;

/** True only when both revisions close over canonical corpus identity with the expected versions. */
export async function isExactAgentDocsProvenanceReplacement(
  beforeSource: string,
  afterSource: string,
  beforeProse: Uint8Array,
  afterProse: Uint8Array,
  previousVersion: string,
  nextVersion: string,
): Promise<boolean> {
  if (previousVersion === nextVersion) return false;
  try {
    const before = parseAgentDocsProvenance(beforeSource);
    const after = parseAgentDocsProvenance(afterSource);
    if (!before || !after || before.version !== previousVersion) return false;
    const [beforePayload, afterPayload] = await Promise.all([
      decompressGzip(beforeProse),
      decompressGzip(afterProse),
    ]);
    const beforeFiles = agentDocsPayloadFiles(beforePayload);
    const afterFiles = agentDocsPayloadFiles(afterPayload);
    if (!beforeFiles || !afterFiles) return false;
    return await provenanceMatchesCanonicalCorpus(
      before,
      previousVersion,
      beforeFiles,
      beforePayload,
      beforeProse.byteLength,
    ) && await provenanceMatchesCanonicalCorpus(
      after,
      nextVersion,
      afterFiles,
      afterPayload,
      afterProse.byteLength,
    ) &&
      JSON.stringify(before.files) === JSON.stringify(after.files);
  } catch {
    return false;
  }
}

function parseAgentDocsProvenance(source: string): AgentDocsProvenance | undefined {
  const value: unknown = JSON.parse(source);
  if (
    !isRecord(value) || value.schemaVersion !== 1 || typeof value.version !== 'string' ||
    typeof value.sourceCommit !== 'string' || typeof value.extractionTimestamp !== 'string' ||
    !Array.isArray(value.files) || !value.files.every((path) => typeof path === 'string') ||
    typeof value.uncompressedBytes !== 'number' || typeof value.compressedBytes !== 'number' ||
    typeof value.sha256 !== 'string' ||
    Object.keys(value).sort().join('\0') !== [...AGENT_DOCS_PROVENANCE_KEYS].sort().join('\0')
  ) return undefined;
  return {
    schemaVersion: 1,
    version: value.version,
    sourceCommit: value.sourceCommit,
    extractionTimestamp: value.extractionTimestamp,
    files: [...value.files],
    uncompressedBytes: value.uncompressedBytes,
    compressedBytes: value.compressedBytes,
    sha256: value.sha256,
  };
}

function agentDocsPayloadFiles(payloadBytes: Uint8Array): readonly string[] | undefined {
  const value: unknown = JSON.parse(new TextDecoder().decode(payloadBytes));
  return isAgentDocsPayload(value) ? Object.keys(value.files) : undefined;
}

async function provenanceMatchesCanonicalCorpus(
  provenance: AgentDocsProvenance,
  version: string,
  files: readonly string[],
  uncompressed: Uint8Array,
  compressedBytes: number,
): Promise<boolean> {
  // sourceCommit and extractionTimestamp describe the render; they do not authorize canary
  // inheritance and may legitimately change between revisions. They must still be values the
  // writer can emit: a nine-character lowercase Git object abbreviation and canonical UTC ISO
  // timestamp. compressedBytes is likewise checked only against its own revision's blob, so this
  // closes forged sidecars without comparing gzip encoders across revisions (#1626).
  return provenance.version === version &&
    /^[0-9a-f]{9}$/.test(provenance.sourceCommit) &&
    isCanonicalIsoTimestamp(provenance.extractionTimestamp) &&
    JSON.stringify(provenance.files) === JSON.stringify(files) &&
    provenance.uncompressedBytes === uncompressed.byteLength &&
    provenance.compressedBytes === compressedBytes &&
    provenance.sha256 === await sha256Hex(uncompressed);
}

function isCanonicalIsoTimestamp(value: string): boolean {
  // Honest writers emit UTC RFC3339 with `Z` and either omit fractional seconds or use the three
  // millisecond digits produced by Date.toISOString(). Offsets and every other byte shape are not
  // provenance this writer can produce. The round trip also rejects impossible calendar values.
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{3}))?Z$/.exec(value);
  if (!match) return false;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.valueOf())) return false;
  const canonical = `${match[1]}.${match[2] ?? '000'}Z`;
  return timestamp.toISOString() === canonical;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', copy.buffer))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function isPreparedReleaseGeneratedOutput(path: string): boolean {
  const normalized = normalizeGitPath(path);
  return PREPARED_RELEASE_GENERATED_OUTPUTS.some(
    (generatedPath) => normalizeGitPath(generatedPath) === normalized,
  );
}

export interface PreparedReleaseFreshnessDependencies {
  readonly trackedStatus: (root: string) => Promise<string>;
  readonly runDeno: (root: string, args: readonly string[]) => Promise<void>;
}

const defaultPreparedReleaseFreshnessDependencies: PreparedReleaseFreshnessDependencies = {
  trackedStatus: (root) => runGit(root, ['status', '--porcelain', '--untracked-files=no']),
  runDeno: (root, args) => runCheckedCommand(root, args),
};

// Identity, not structure, proves the production freshness pipeline reached its terminal verdict.
// Dependency stubs cannot manufacture this module-private capability from self-consistent sidecars.
const PREPARED_RELEASE_FRESHNESS_PROOF = Object.freeze({});

/** Reproduce semantic corpus content and every downstream generated release asset from HEAD. */
export async function assertPreparedReleaseGeneratedOutputsFresh(
  root: string,
  dependencies: PreparedReleaseFreshnessDependencies = defaultPreparedReleaseFreshnessDependencies,
): Promise<unknown> {
  const dirty = await dependencies.trackedStatus(root);
  if (dirty) {
    throw new Error(
      'Stable publication blocked: generated release outputs require a clean tracked worktree ' +
        'before their writer-derived content can be verified.',
    );
  }
  await dependencies.runDeno(root, ['task', 'check:agent-docs-prose']);
  await dependencies.runDeno(root, ['task', 'gen:publish-assets', '--check']);
  await dependencies.runDeno(root, ['task', 'check:mcp-export-corpus']);
  await dependencies.runDeno(root, [
    'run',
    '--no-lock',
    '--allow-read',
    '--allow-run=deno',
    '.llm/tools/generate-cli-assets-barrel.ts',
    '--check',
  ]);
  return PREPARED_RELEASE_FRESHNESS_PROOF;
}

async function runCheckedCommand(root: string, args: readonly string[]): Promise<void> {
  const result = await new Deno.Command('deno', {
    args: [...args],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    const stdout = new TextDecoder().decode(result.stdout).trim();
    const stderr = new TextDecoder().decode(result.stderr).trim();
    throw new Error(
      `Stable publication blocked: deno ${args.join(' ')} did not reproduce the generated ` +
        `release outputs.${stdout ? `\n${stdout}` : ''}${stderr ? `\n${stderr}` : ''}`,
    );
  }
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
  const statuses = githubField(response.body, 'statuses');
  if (!response.ok || !Array.isArray(statuses)) {
    throw new Error(
      `Canary-pair status lookup failed for ${sha}: HTTP ${response.status} ` +
        `${JSON.stringify(response.body)}. Stable publication fails closed.`,
    );
  }
  const status = statuses.find(
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

async function runGitFileBytesAtRevision(
  root: string,
  revision: string,
  path: string,
): Promise<Uint8Array> {
  const result = await new Deno.Command('git', {
    args: ['show', `${revision}:${normalizeGitPath(path)}`],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr).trim();
    throw new Error(
      `git show ${revision}:${normalizeGitPath(path)} failed: ${stderr || `exit ${result.code}`}`,
    );
  }
  return result.stdout;
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
    if (arg === '--') {
      continue;
    } else if (arg === '--version') {
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

export interface PreviousRelease {
  readonly tag: string;
  readonly since: string;
}

/** The most recent non-draft release other than `currentTag`, for the changelog range. */
async function fetchPreviousRelease(
  repo: string,
  token: string,
  currentTag: string,
  request: typeof githubRequest = githubRequest,
): Promise<PreviousRelease | null> {
  const res = await request('GET', `/repos/${repo}/releases?per_page=20`, token);
  if (!res.ok || !Array.isArray(res.body)) {
    return null;
  }
  for (const release of res.body) {
    if (!isRecord(release)) continue;
    const tag = release.tag_name;
    if (typeof tag === 'string' && tag !== currentTag && release.draft !== true) {
      const since = release.published_at ?? release.created_at;
      return { tag, since: typeof since === 'string' ? since : '' };
    }
  }
  return null;
}

/** Resolve an explicit changelog tag to its release date, or its commit date when unreleased. */
export async function resolvePreviousTag(
  repo: string,
  token: string,
  tag: string,
  request: typeof githubRequest = githubRequest,
): Promise<PreviousRelease> {
  const encodedTag = encodeURIComponent(tag);
  const release = await request('GET', `/repos/${repo}/releases/tags/${encodedTag}`, token);
  if (release.ok && isRecord(release.body)) {
    const since = release.body.published_at ?? release.body.created_at;
    if (typeof since === 'string' && since.trim()) return { tag, since };
  } else if (release.status !== 404) {
    throw new Error(
      `Previous release lookup failed for ${tag}: HTTP ${release.status} ` +
        `${JSON.stringify(release.body)}.`,
    );
  }

  const commit = await request('GET', `/repos/${repo}/commits/${encodedTag}`, token);
  const commitRecord = isRecord(commit.body) && isRecord(commit.body.commit)
    ? commit.body.commit
    : null;
  const committer = commitRecord && isRecord(commitRecord.committer)
    ? commitRecord.committer.date
    : undefined;
  const author = commitRecord && isRecord(commitRecord.author)
    ? commitRecord.author.date
    : undefined;
  const since = typeof committer === 'string' && committer.trim()
    ? committer
    : typeof author === 'string' && author.trim()
    ? author
    : '';
  if (!commit.ok || !since) {
    throw new Error(
      `Previous tag ${tag} is known but its release/commit date could not be resolved: ` +
        `HTTP ${commit.status} ${JSON.stringify(commit.body)}.`,
    );
  }
  return { tag, since };
}

/** GitHub's auto-generated "What's Changed" body (merged PRs + Full Changelog link). */
async function generateWhatsChanged(
  repo: string,
  token: string,
  tag: string,
  previousTag?: string,
  request: typeof githubRequest = githubRequest,
): Promise<string> {
  const payload: Record<string, unknown> = { tag_name: tag };
  if (previousTag) {
    payload.previous_tag_name = previousTag;
  }
  const res = await request('POST', `/repos/${repo}/releases/generate-notes`, token, payload);
  if (!res.ok) {
    throw new Error(
      `generate-notes failed: HTTP ${res.status} ${JSON.stringify(res.body)}. ` +
        'The release tag must exist on the default branch (merge the release PR first).',
    );
  }
  const body = githubField(res.body, 'body');
  return typeof body === 'string' ? body : '';
}

/** Issues (not PRs) closed since `since` (ISO timestamp), newest first. */
async function fetchClosedIssues(
  repo: string,
  token: string,
  since: string,
  request: typeof githubRequest = githubRequest,
): Promise<ClosedIssue[]> {
  const range = since ? ` closed:>${since}` : '';
  const query = `repo:${repo} is:issue is:closed${range}`;
  const path = `/search/issues?q=${encodeURIComponent(query)}&per_page=100&sort=updated&order=desc`;
  const res = await request('GET', path, token);
  const items = githubField(res.body, 'items');
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

export interface ReleaseNotesDependencies {
  readonly fetchPreviousRelease: (
    repo: string,
    token: string,
    currentTag: string,
  ) => Promise<PreviousRelease | null>;
  readonly resolvePreviousTag: (
    repo: string,
    token: string,
    tag: string,
  ) => Promise<PreviousRelease>;
  readonly generateWhatsChanged: (
    repo: string,
    token: string,
    tag: string,
    previousTag?: string,
  ) => Promise<string>;
  readonly fetchClosedIssues: (
    repo: string,
    token: string,
    since: string,
  ) => Promise<ClosedIssue[]>;
}

export interface ReleaseNotes {
  readonly previous: PreviousRelease | null;
  readonly whatsChanged: string;
  readonly closed: readonly ClosedIssue[];
}

const defaultReleaseNotesDependencies: ReleaseNotesDependencies = {
  fetchPreviousRelease,
  resolvePreviousTag,
  generateWhatsChanged,
  fetchClosedIssues,
};

/** Resolve one changelog window and query every generated release-notes section for it. */
export async function collectReleaseNotes(
  plan: ReleasePlan,
  token: string,
  tag: string,
  dependencies: ReleaseNotesDependencies = defaultReleaseNotesDependencies,
): Promise<ReleaseNotes> {
  const previous = plan.prevTag
    ? await dependencies.resolvePreviousTag(plan.repo, token, plan.prevTag)
    : await dependencies.fetchPreviousRelease(plan.repo, token, tag);
  if (previous?.tag && !previous.since.trim()) {
    throw new Error(
      `Previous tag ${previous.tag} is known but its since timestamp is empty; ` +
        'closed-issue collection refuses to report a false zero.',
    );
  }
  const whatsChanged = await dependencies.generateWhatsChanged(
    plan.repo,
    token,
    tag,
    previous?.tag,
  );
  const closed = previous
    ? await dependencies.fetchClosedIssues(plan.repo, token, previous.since)
    : [];
  return { previous, whatsChanged, closed };
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
  const htmlUrl = githubField(res.body, 'html_url');
  return typeof htmlUrl === 'string' ? htmlUrl : `${tag} created`;
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

  const { previous, whatsChanged, closed } = await collectReleaseNotes(plan, token, tag);
  if (previous?.tag) {
    console.error(`[release:publish] previous release: ${previous.tag}`);
  }
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
