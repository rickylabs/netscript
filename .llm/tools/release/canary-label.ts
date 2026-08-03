import { readRegistryVersions } from './canary.ts';
import { runCommand } from './prepare-release.ts';

export const CANARY_LABEL_PREFIX = 'canary:';
const CANARY_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-canary\.(0|[1-9]\d*)$/;
const STABLE_TAG_PATTERN = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const CANARY_LABEL_COLOR = '1d76db';
const PUBLISHED_CANARY_PACKAGE = '@netscript/cli';

export interface CanaryPayload {
  readonly commitCount: number;
  readonly outcome: 'populated' | 'genuine-empty';
  readonly pullRequests: readonly number[];
  readonly issues: readonly number[];
  readonly pullRequestTitles: Readonly<Record<number, string>>;
  readonly closedIssuesByPullRequest: Readonly<Record<number, readonly number[]>>;
}

export interface CanaryPayloadDependencies {
  readonly rangeCommits: (previous: string, head: string) => Promise<readonly string[]>;
  readonly associatedPullRequests: (commit: string) => Promise<readonly number[]>;
  readonly closingIssues: (pullRequest: number) => Promise<readonly number[]>;
  readonly pullRequestTitle?: (pullRequest: number) => Promise<string>;
}

export interface PreviousPointDependencies {
  readonly canarySource: (version: string) => Promise<string>;
  readonly nearestStable: (head: string) => Promise<string>;
}

export interface CanaryDrift {
  readonly ok: boolean;
  readonly labelsWithoutPublishedVersions: readonly string[];
  readonly publishedVersionsWithoutLabels: readonly string[];
}

export interface CheckRecord {
  readonly name: string;
  readonly ok: boolean | null;
  readonly detail: string;
}

interface Options {
  readonly repo: string;
  readonly publishedVersion: string;
  readonly head: string;
  readonly json: boolean;
  readonly dryRun: boolean;
}

interface GitHubLabel {
  readonly name: string;
}

interface GitHubPullRequest {
  readonly title: string;
}

interface AssociatedPullRequest {
  readonly number: number;
  readonly merged_at: string | null;
  readonly merge_commit_sha: string | null;
  readonly base: { readonly ref: string };
}

interface GitHubRelease {
  readonly id: number;
}

interface GraphQlResponse {
  readonly data?: {
    readonly repository?: {
      readonly pullRequest?: {
        readonly closingIssuesReferences: {
          readonly nodes: readonly { readonly number: number }[];
        };
      };
    };
  };
  readonly errors?: readonly { readonly message: string }[];
}

/** Derive a GitHub label only from a canonical published canary version. */
export function canaryLabelFor(publishedVersion: string): string {
  parseCanaryVersion(publishedVersion);
  return `${CANARY_LABEL_PREFIX}${publishedVersion}`;
}

export function targetCore(version: string): string {
  const match = parseCanaryVersion(version);
  return `${match[1]}.${match[2]}.${match[3]}`;
}

/** Select the previous published canary source, or the nearest stable first-parent point. */
export async function resolvePreviousPoint(
  publishedVersion: string,
  publishedVersions: readonly string[],
  head: string,
  dependencies: PreviousPointDependencies,
): Promise<string> {
  const currentOrdinal = Number(parseCanaryVersion(publishedVersion)[4]);
  const core = targetCore(publishedVersion);
  const previous = publishedVersions
    .filter((version) =>
      CANARY_VERSION_PATTERN.test(version) && targetCore(version) === core &&
      Number(parseCanaryVersion(version)[4]) < currentOrdinal
    )
    .sort((left, right) =>
      Number(parseCanaryVersion(right)[4]) - Number(parseCanaryVersion(left)[4])
    )[0];
  return previous
    ? await dependencies.canarySource(previous)
    : await dependencies.nearestStable(head);
}

/** Compute PR and closed-issue membership from merge-aware range history. */
export async function deriveCanaryPayload(
  previous: string,
  head: string,
  dependencies: CanaryPayloadDependencies,
): Promise<CanaryPayload> {
  const pullRequests: number[] = [];
  const seen = new Set<number>();
  const commits = await dependencies.rangeCommits(previous, head);
  for (const commit of commits) {
    for (const pullRequest of await dependencies.associatedPullRequests(commit)) {
      if (!seen.has(pullRequest)) {
        seen.add(pullRequest);
        pullRequests.push(pullRequest);
      }
    }
  }
  if (commits.length > 0 && pullRequests.length === 0) {
    throw new Error(
      `Canary payload derivation inspected ${commits.length} commit(s) in ${previous}..${head} but found no associated main-branch pull requests.`,
    );
  }
  const issues = new Set<number>();
  const pullRequestTitles: Record<number, string> = {};
  const closedIssuesByPullRequest: Record<number, readonly number[]> = {};
  for (const pullRequest of pullRequests) {
    const closedIssues = await dependencies.closingIssues(pullRequest);
    closedIssuesByPullRequest[pullRequest] = closedIssues;
    for (const issue of closedIssues) issues.add(issue);
    pullRequestTitles[pullRequest] = dependencies.pullRequestTitle
      ? await dependencies.pullRequestTitle(pullRequest)
      : `Pull request #${pullRequest}`;
  }
  return {
    commitCount: commits.length,
    outcome: commits.length === 0 ? 'genuine-empty' : 'populated',
    pullRequests,
    issues: [...issues].sort((left, right) => left - right),
    pullRequestTitles,
    closedIssuesByPullRequest,
  };
}

/** Render the note from exactly the payload used for canary labels. */
export function renderCanaryReleaseNote(
  publishedVersion: string,
  previous: string,
  payload: CanaryPayload,
  repo: string,
): string {
  canaryLabelFor(publishedVersion);
  const lines = [
    `# NetScript ${publishedVersion}`,
    '',
    `Canary payload derived from merge-aware history after \`${previous}\` (${payload.commitCount} commit(s) inspected; outcome: ${payload.outcome}).`,
    '',
    '## Included pull requests',
    '',
  ];
  if (payload.pullRequests.length === 0) {
    lines.push('_Genuine empty payload: no commits landed since the previous canary point._');
  } else {
    for (const pullRequest of payload.pullRequests) {
      const closed = payload.closedIssuesByPullRequest[pullRequest] ?? [];
      const suffix = closed.length === 0
        ? ' — closes no linked issues'
        : ` — closes ${
          closed.map((issue) => `[#${issue}](https://github.com/${repo}/issues/${issue})`).join(
            ', ',
          )
        }`;
      lines.push(
        `- [#${pullRequest}](https://github.com/${repo}/pull/${pullRequest}) ${
          payload.pullRequestTitles[pullRequest]
        }${suffix}`,
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

/** Refuse release-note publication unless the exact resolver-owned version was published. */
export function assertPublishedCanary(
  publishedVersion: string,
  publishedVersions: readonly string[],
): void {
  canaryLabelFor(publishedVersion);
  if (!publishedVersions.includes(publishedVersion)) {
    throw new Error(`${PUBLISHED_CANARY_PACKAGE}@${publishedVersion} is not published.`);
  }
}

/** GitHub release payload; canary releases are always prereleases and never Latest. */
export function canaryReleasePayload(
  publishedVersion: string,
  note: string,
): Record<string, unknown> {
  canaryLabelFor(publishedVersion);
  return {
    tag_name: `v${publishedVersion}`,
    name: `NetScript ${publishedVersion}`,
    body: note,
    prerelease: true,
    draft: false,
    make_latest: 'false',
  };
}

/** Compare exact GitHub canary labels with published canary versions in both directions. */
export function checkCanaryDrift(
  labels: readonly string[],
  publishedVersions: readonly string[],
  targetVersion?: string,
): CanaryDrift {
  // Scope to the target train. Canaries published before this surface existed (0.0.1-canary.1
  // through 0.0.3-canary.5) carry no label and never can — labelling them retroactively would
  // manufacture the data the check inspects. Comparing across trains makes the gate unpassable
  // by construction, which is the defect #1160 records. `targetCore` already existed for this;
  // it was simply not wired in.
  // Accept either form for the target: the caller passes a published canary
  // (`0.0.4-canary.1`), while a stable train (`0.0.4`) is the more natural thing to reason about.
  const coreOf = (version: string): string =>
    /-canary\.\d+$/.test(version) ? targetCore(version) : version;
  const target = targetVersion === undefined ? undefined : coreOf(targetVersion);
  const inTarget = (version: string): boolean => target === undefined || coreOf(version) === target;
  const canaryLabels = new Set(
    labels
      .filter((label) => label.startsWith(CANARY_LABEL_PREFIX))
      .filter((label) => inTarget(label.slice(CANARY_LABEL_PREFIX.length))),
  );
  const expectedLabels = new Set(publishedVersions.filter(inTarget).map(canaryLabelFor));
  const labelsWithoutPublishedVersions = [...canaryLabels].filter((label) =>
    !expectedLabels.has(label)
  ).sort();
  const publishedVersionsWithoutLabels = [...expectedLabels].filter((label) =>
    !canaryLabels.has(label)
  ).map((label) => label.slice(CANARY_LABEL_PREFIX.length)).sort();
  return {
    ok: labelsWithoutPublishedVersions.length === 0 && publishedVersionsWithoutLabels.length === 0,
    labelsWithoutPublishedVersions,
    publishedVersionsWithoutLabels,
  };
}

/** Allocate every check up front so did-not-run is distinct from PASS. */
export function initialCheckRecords(): CheckRecord[] {
  return [
    'published-version',
    'merge-history-payload',
    'label-application',
    'release-note-publication',
    'drift',
  ].map((
    name,
  ) => ({
    name,
    ok: null,
    detail: 'not run',
  }));
}

function setCheck(
  checks: CheckRecord[],
  name: string,
  ok: boolean,
  detail: string,
): void {
  const index = checks.findIndex((check) => check.name === name);
  checks[index] = { name, ok, detail };
}

function parseCanaryVersion(version: string): RegExpExecArray {
  const match = CANARY_VERSION_PATTERN.exec(version);
  if (!match) {
    throw new Error(
      `Published canary version must match <major>.<minor>.<patch>-canary.<n>: ${version}`,
    );
  }
  return match;
}

async function gitLines(args: readonly string[]): Promise<readonly string[]> {
  const result = await runCommand('git', args, Deno.cwd());
  if (result.code !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed: ${result.stderr.trim() || `exit ${result.code}`}`,
    );
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

async function rangeCommits(previous: string, head: string): Promise<readonly string[]> {
  return await gitLines(['rev-list', '--topo-order', '--reverse', `${previous}..${head}`]);
}

async function canarySource(version: string): Promise<string> {
  const lines = await gitLines(['rev-parse', `v${version}^{commit}^`]);
  if (lines.length !== 1) throw new Error(`Canary tag v${version} has no unique source parent.`);
  return lines[0];
}

async function nearestStable(head: string): Promise<string> {
  const ancestry = await gitLines(['rev-list', '--first-parent', head]);
  const candidates: Array<{ ref: string; distance: number }> = [];
  for (
    const tag of (await gitLines(['tag', '--list', 'v*'])).filter((value) =>
      STABLE_TAG_PATTERN.test(value)
    )
  ) {
    const [commit] = await gitLines(['rev-parse', `${tag}^{commit}`]);
    const distance = ancestry.indexOf(commit);
    if (distance >= 0) candidates.push({ ref: tag, distance });
  }
  candidates.sort((left, right) => left.distance - right.distance);
  if (!candidates[0]) {
    throw new Error(`No stable tag is reachable on first-parent history of ${head}.`);
  }
  return candidates[0].ref;
}

class GitHubClient {
  readonly #owner: string;
  readonly #name: string;

  constructor(private readonly repo: string, private readonly token: string) {
    [this.#owner, this.#name] = repo.split('/');
  }

  async listLabels(): Promise<readonly string[]> {
    const labels: string[] = [];
    for (let page = 1;; page++) {
      const rows = await this.request<readonly GitHubLabel[]>(
        'GET',
        `/repos/${this.repo}/labels?per_page=100&page=${page}`,
      );
      labels.push(...rows.map((row) => row.name));
      if (rows.length < 100) return labels;
    }
  }

  async ensureLabel(label: string): Promise<void> {
    if ((await this.listLabels()).includes(label)) return;
    await this.request('POST', `/repos/${this.repo}/labels`, {
      name: label,
      color: CANARY_LABEL_COLOR,
      description: `Published NetScript prerelease ${label.slice(CANARY_LABEL_PREFIX.length)}`,
    });
  }

  async applyLabel(number: number, label: string): Promise<void> {
    await this.request('POST', `/repos/${this.repo}/issues/${number}/labels`, { labels: [label] });
  }

  async associatedPullRequests(commit: string): Promise<readonly number[]> {
    const rows = await this.request<readonly AssociatedPullRequest[]>(
      'GET',
      `/repos/${this.repo}/commits/${commit}/pulls`,
    );
    return rows.filter((row) =>
      row.merged_at !== null && row.merge_commit_sha === commit && row.base.ref === 'main'
    ).map((row) => row.number);
  }

  async pullRequestTitle(pullRequest: number): Promise<string> {
    return (await this.request<GitHubPullRequest>(
      'GET',
      `/repos/${this.repo}/pulls/${pullRequest}`,
    )).title;
  }

  async publishCanaryRelease(
    publishedVersion: string,
    note: string,
  ): Promise<'created' | 'updated'> {
    const tag = `v${publishedVersion}`;
    const payload = canaryReleasePayload(publishedVersion, note);
    try {
      const release = await this.request<GitHubRelease>(
        'GET',
        `/repos/${this.repo}/releases/tags/${tag}`,
      );
      await this.request('PATCH', `/repos/${this.repo}/releases/${release.id}`, payload);
      return 'updated';
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('failed: 404 ')) throw error;
      await this.request('POST', `/repos/${this.repo}/releases`, payload);
      return 'created';
    }
  }

  async closingIssues(pullRequest: number): Promise<readonly number[]> {
    const response = await this.request<GraphQlResponse>('POST', '/graphql', {
      query:
        `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){closingIssuesReferences(first:100){nodes{number}}}}}`,
      variables: { owner: this.#owner, name: this.#name, number: pullRequest },
    });
    if (response.errors?.length) {
      throw new Error(
        `GitHub GraphQL failed: ${response.errors.map((error) => error.message).join('; ')}`,
      );
    }
    const pull = response.data?.repository?.pullRequest;
    if (!pull) throw new Error(`GitHub PR #${pullRequest} was not found.`);
    return pull.closingIssuesReferences.nodes.map((node) => node.number);
  }

  private async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        `GitHub API ${method} ${path} failed: ${response.status} ${await response.text()}`,
      );
    }
    return await response.json() as T;
  }
}

function parseArgs(args: readonly string[]): Options {
  let repo = Deno.env.get('GITHUB_REPOSITORY') ?? '';
  let publishedVersion = '';
  let head = 'HEAD';
  let json = false;
  let dryRun = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--') continue;
    else if (arg === '--repo') repo = requireValue(args, ++index, arg);
    else if (arg === '--published-version') publishedVersion = requireValue(args, ++index, arg);
    else if (arg === '--head') head = requireValue(args, ++index, arg);
    else if (arg === '--json') json = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--help') {
      console.log(
        'Usage: release:canary-label --published-version <x.y.z-canary.n> [--head <ref>] [--repo owner/name] [--json] [--dry-run]',
      );
      Deno.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error('--repo must be owner/name.');
  if (!publishedVersion || !head) {
    throw new Error('Missing required canary-label arguments.');
  }
  return { repo, publishedVersion, head, json, dryRun };
}

function requireValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

function printChecks(checks: readonly CheckRecord[], json: boolean): void {
  if (json) {
    console.log(JSON.stringify({ checks }));
    return;
  }
  for (const check of checks) {
    const result = check.ok === null ? 'NOT_RUN' : check.ok ? 'PASS' : 'FAIL';
    console.log(`${check.name} ${result}: ${check.detail}`);
  }
}

async function main(): Promise<void> {
  const checks = initialCheckRecords();
  let options: Options | undefined;
  let activeCheck = 'published-version';
  try {
    options = parseArgs(Deno.args);
    const label = canaryLabelFor(options.publishedVersion);
    const registryVersions = await readRegistryVersions(PUBLISHED_CANARY_PACKAGE);
    const publishedVersions = (registryVersions ?? []).filter((version) =>
      CANARY_VERSION_PATTERN.test(version)
    ).sort();
    assertPublishedCanary(options.publishedVersion, publishedVersions);
    setCheck(
      checks,
      activeCheck,
      true,
      `${options.publishedVersion} exists on ${PUBLISHED_CANARY_PACKAGE}`,
    );

    const token = Deno.env.get('GH_TOKEN') ?? Deno.env.get('GITHUB_TOKEN');
    if (!token) throw new Error('GH_TOKEN or GITHUB_TOKEN is required.');
    const github = new GitHubClient(options.repo, token);
    const previous = await resolvePreviousPoint(
      options.publishedVersion,
      publishedVersions,
      options.head,
      { canarySource, nearestStable },
    );
    activeCheck = 'merge-history-payload';
    const payload = await deriveCanaryPayload(previous, options.head, {
      rangeCommits,
      associatedPullRequests: (commit) => github.associatedPullRequests(commit),
      closingIssues: (pullRequest) => github.closingIssues(pullRequest),
      pullRequestTitle: (pullRequest) => github.pullRequestTitle(pullRequest),
    });
    setCheck(
      checks,
      activeCheck,
      true,
      `${payload.outcome}: inspected ${payload.commitCount} commit(s); ${payload.pullRequests.length} PR(s), ${payload.issues.length} closed issue(s) from ${previous}..${options.head}`,
    );

    const note = renderCanaryReleaseNote(
      options.publishedVersion,
      previous,
      payload,
      options.repo,
    );
    if (options.dryRun) {
      console.log(note);
      printChecks(checks, options.json);
      return;
    }

    activeCheck = 'label-application';
    await github.ensureLabel(label);
    for (const number of [...payload.pullRequests, ...payload.issues]) {
      await github.applyLabel(number, label);
    }
    setCheck(
      checks,
      activeCheck,
      true,
      `${label} applied to ${payload.pullRequests.length + payload.issues.length} item(s)`,
    );

    activeCheck = 'release-note-publication';
    const publication = await github.publishCanaryRelease(options.publishedVersion, note);
    setCheck(
      checks,
      activeCheck,
      true,
      `${publication} prerelease v${options.publishedVersion}; make_latest=false`,
    );

    activeCheck = 'drift';
    const labels = (await github.listLabels()).filter((name) =>
      name.startsWith(CANARY_LABEL_PREFIX)
    );
    const drift = checkCanaryDrift(labels, publishedVersions, options.publishedVersion);
    setCheck(
      checks,
      activeCheck,
      drift.ok,
      drift.ok
        ? `${labels.length} label(s) match ${publishedVersions.length} published version(s)`
        : `orphan labels=${
          drift.labelsWithoutPublishedVersions.join(',') || 'none'
        }; missing labels=${drift.publishedVersionsWithoutLabels.join(',') || 'none'}`,
    );
    printChecks(checks, options.json);
    if (!drift.ok) Deno.exit(1);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    setCheck(checks, activeCheck, false, detail);
    printChecks(checks, options?.json ?? Deno.args.includes('--json'));
    Deno.exit(1);
  }
}

if (import.meta.main) await main();
