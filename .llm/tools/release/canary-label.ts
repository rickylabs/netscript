import { readRegistryVersions } from './canary.ts';
import { runCommand } from './prepare-release.ts';

export const CANARY_LABEL_PREFIX = 'canary:';
const CANARY_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-canary\.(0|[1-9]\d*)$/;
const MERGED_PR_SUFFIX_PATTERN = /\(#([1-9]\d*)\)\s*$/;
const CANARY_LABEL_COLOR = '1d76db';
const PUBLISHED_CANARY_PACKAGE = '@netscript/cli';

export interface CanaryPayload {
  readonly pullRequests: readonly number[];
  readonly issues: readonly number[];
}

export interface CanaryPayloadDependencies {
  readonly firstParentSubjects: (previous: string, head: string) => Promise<readonly string[]>;
  readonly closingIssues: (pullRequest: number) => Promise<readonly number[]>;
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
  readonly previous: string;
  readonly head: string;
  readonly json: boolean;
}

interface GitHubLabel {
  readonly name: string;
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
  if (!CANARY_VERSION_PATTERN.test(publishedVersion)) {
    throw new Error(
      `Published canary version must match <major>.<minor>.<patch>-canary.<n>: ${publishedVersion}`,
    );
  }
  return `${CANARY_LABEL_PREFIX}${publishedVersion}`;
}

/** Extract merged PR numbers from first-parent subjects in observed merge order. */
export function pullRequestsFromMergeSubjects(subjects: readonly string[]): number[] {
  const pullRequests: number[] = [];
  const seen = new Set<number>();
  for (const subject of subjects) {
    const match = MERGED_PR_SUFFIX_PATTERN.exec(subject);
    if (!match) continue;
    const pullRequest = Number(match[1]);
    if (!seen.has(pullRequest)) {
      seen.add(pullRequest);
      pullRequests.push(pullRequest);
    }
  }
  return pullRequests;
}

/** Compute PR and closed-issue membership from first-parent merge history. */
export async function deriveCanaryPayload(
  previous: string,
  head: string,
  dependencies: CanaryPayloadDependencies,
): Promise<CanaryPayload> {
  const subjects = await dependencies.firstParentSubjects(previous, head);
  const pullRequests = pullRequestsFromMergeSubjects(subjects);
  const issues = new Set<number>();
  for (const pullRequest of pullRequests) {
    for (const issue of await dependencies.closingIssues(pullRequest)) issues.add(issue);
  }
  return { pullRequests, issues: [...issues].sort((left, right) => left - right) };
}

/** Compare exact GitHub canary labels with published canary versions in both directions. */
export function checkCanaryDrift(
  labels: readonly string[],
  publishedVersions: readonly string[],
): CanaryDrift {
  const canaryLabels = new Set(labels.filter((label) => label.startsWith(CANARY_LABEL_PREFIX)));
  const expectedLabels = new Set(publishedVersions.map(canaryLabelFor));
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
  return ['published-version', 'merge-history-payload', 'label-application', 'drift'].map((
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

function targetCore(version: string): string {
  const match = CANARY_VERSION_PATTERN.exec(version);
  if (!match) canaryLabelFor(version);
  return `${match![1]}.${match![2]}.${match![3]}`;
}

async function firstParentSubjects(previous: string, head: string): Promise<readonly string[]> {
  const result = await runCommand(
    'git',
    ['log', '--first-parent', '--reverse', '--format=%s', `${previous}..${head}`],
    Deno.cwd(),
  );
  if (result.code !== 0) {
    throw new Error(
      `git first-parent history failed: ${result.stderr.trim() || `exit ${result.code}`}`,
    );
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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
  let previous = '';
  let head = 'HEAD';
  let json = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--') continue;
    else if (arg === '--repo') repo = requireValue(args, ++index, arg);
    else if (arg === '--published-version') publishedVersion = requireValue(args, ++index, arg);
    else if (arg === '--previous') previous = requireValue(args, ++index, arg);
    else if (arg === '--head') head = requireValue(args, ++index, arg);
    else if (arg === '--json') json = true;
    else if (arg === '--help') {
      console.log(
        'Usage: release:canary-label --published-version <x.y.z-canary.n> --previous <ref> [--head <ref>] [--repo owner/name] [--json]',
      );
      Deno.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error('--repo must be owner/name.');
  if (!publishedVersion || !previous || !head) {
    throw new Error('Missing required canary-label arguments.');
  }
  return { repo, publishedVersion, previous, head, json };
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
    const core = targetCore(options.publishedVersion);
    const registryVersions = await readRegistryVersions(PUBLISHED_CANARY_PACKAGE);
    const publishedVersions = (registryVersions ?? []).filter((version) =>
      version.startsWith(`${core}-canary.`) && CANARY_VERSION_PATTERN.test(version)
    ).sort();
    if (!publishedVersions.includes(options.publishedVersion)) {
      throw new Error(`${PUBLISHED_CANARY_PACKAGE}@${options.publishedVersion} is not published.`);
    }
    setCheck(
      checks,
      activeCheck,
      true,
      `${options.publishedVersion} exists on ${PUBLISHED_CANARY_PACKAGE}`,
    );

    const token = Deno.env.get('GH_TOKEN') ?? Deno.env.get('GITHUB_TOKEN');
    if (!token) throw new Error('GH_TOKEN or GITHUB_TOKEN is required.');
    const github = new GitHubClient(options.repo, token);
    activeCheck = 'merge-history-payload';
    const payload = await deriveCanaryPayload(options.previous, options.head, {
      firstParentSubjects,
      closingIssues: (pullRequest) => github.closingIssues(pullRequest),
    });
    setCheck(
      checks,
      activeCheck,
      true,
      `${payload.pullRequests.length} PR(s), ${payload.issues.length} closed issue(s) from ${options.previous}..${options.head}`,
    );

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

    activeCheck = 'drift';
    const labels = (await github.listLabels()).filter((name) =>
      name.startsWith(`${CANARY_LABEL_PREFIX}${core}-canary.`)
    );
    const drift = checkCanaryDrift(labels, publishedVersions);
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
