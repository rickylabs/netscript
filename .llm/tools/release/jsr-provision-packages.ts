import { discoverWorkspaceMembers } from './publish-workspace.ts';

interface Options {
  readonly scope: string;
  readonly repo: GitHubRepo;
  readonly dryRun: boolean;
  readonly root: string;
}

interface GitHubRepo {
  readonly owner: string;
  readonly name: string;
}

interface PackageFailure {
  readonly packageName: string;
  readonly action: string;
  readonly reason: string;
}

interface PackageResult {
  readonly packageName: string;
  readonly state: 'exists' | 'created';
  readonly linkState: 'already-linked' | 'linked' | 'would-link';
}

interface NonJsonResponse {
  readonly nonJsonResponse: true;
  readonly preview: string;
}

type ApiResult =
  | { readonly kind: 'ok'; readonly status: number; readonly body: unknown }
  | {
    readonly kind: 'error';
    readonly status: number;
    readonly code?: string;
    readonly message: string;
  };

const API_BASE_URL = 'https://api.jsr.io';
const DEFAULT_SCOPE = 'netscript';
const DEFAULT_REPO = 'rickylabs/netscript';
const JSR_PACKAGE_PREFIX = '@netscript/';

function printHelp(): void {
  console.log(
    [
      'jsr-provision-packages.ts — idempotently create + repo-link every @netscript/*',
      'workspace member as a JSR package.',
      '',
      'Usage:',
      '  deno run --allow-net --allow-env --allow-read \\',
      '    .llm/tools/release/jsr-provision-packages.ts [flags]',
      '',
      'Flags:',
      '  --scope <name>     JSR scope (default: netscript)',
      '  --repo <owner/name> GitHub repo to link (default: rickylabs/netscript)',
      '  --root <dir>       workspace root to discover members from',
      '  --dry-run          report actions without writing (no token needed)',
      '  --help, -h         show this help',
      '',
      'Writes require JSR_API_TOKEN with package-edit scope.',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }

  const options = parseArgs(Deno.args);
  const members = await discoverWorkspaceMembers(options.root);
  const packageNames = members.map((member) => packageSegment(member.name));

  console.log(`discovered ${packageNames.length} workspace members: ${packageNames.join(', ')}`);

  const token = Deno.env.get('JSR_API_TOKEN')?.trim();
  if (!token && !options.dryRun) {
    console.log(
      'JSR_API_TOKEN not set — running public checks before deciding if writes are needed',
    );
  }

  const results: PackageResult[] = [];
  const failures: PackageFailure[] = [];

  for (const packageName of packageNames) {
    const result = await provisionPackage(packageName, options, token);
    if ('failure' in result) {
      failures.push(result.failure);
      continue;
    }
    results.push(result.result);
    console.log(`${packageName}: ${result.result.state} + ${result.result.linkState}`);
  }

  const created = results.filter((result) => result.state === 'created').length;
  const linked = results.filter((result) =>
    result.linkState === 'linked' || result.linkState === 'already-linked'
  ).length;
  console.log(
    `provisioned ${results.length}/${packageNames.length} (created ${created}, linked ${linked}), failures ${failures.length}`,
  );

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`${failure.packageName}: ${failure.action} failed: ${failure.reason}`);
    }
    Deno.exit(1);
  }

  if (!token && !options.dryRun) {
    console.log('JSR_API_TOKEN not set — no writes needed (packages already provisioned)');
  }
}

async function provisionPackage(
  packageName: string,
  provisionOptions: Options,
  tokenValue: string | undefined,
): Promise<{ readonly result: PackageResult } | { readonly failure: PackageFailure }> {
  const existing = await requestApi(
    'GET',
    `/scopes/${provisionOptions.scope}/packages/${packageName}`,
  );
  let state: PackageResult['state'] = 'exists';

  if (existing.kind === 'ok') {
    state = 'exists';
    if (isLinkedToRepo(existing.body, provisionOptions.repo)) {
      return { result: { packageName, state, linkState: 'already-linked' } };
    }
  } else if (existing.status === 404) {
    if (provisionOptions.dryRun) {
      return { result: { packageName, state: 'created', linkState: 'would-link' } };
    }
    if (!tokenValue) {
      return {
        failure: {
          packageName,
          action: 'create',
          reason: 'write needed but no token',
        },
      };
    }
    const created = await requestApi(
      'POST',
      `/scopes/${provisionOptions.scope}/packages`,
      tokenValue,
      { package: packageName },
    );
    if (created.kind === 'ok') {
      state = 'created';
    } else if (isAlreadyExists(created)) {
      state = 'exists';
    } else {
      return {
        failure: {
          packageName,
          action: 'create',
          reason: formatApiError(created),
        },
      };
    }
  } else {
    return {
      failure: {
        packageName,
        action: 'check',
        reason: formatApiError(existing),
      },
    };
  }

  if (provisionOptions.dryRun) {
    return { result: { packageName, state, linkState: 'would-link' } };
  }

  if (!tokenValue) {
    return {
      failure: {
        packageName,
        action: 'link',
        reason: 'write needed but no token',
      },
    };
  }

  const linked = await requestApi(
    'PATCH',
    `/scopes/${provisionOptions.scope}/packages/${packageName}`,
    tokenValue,
    { githubRepository: provisionOptions.repo },
  );

  if (linked.kind === 'ok' || isAlreadyLinked(linked)) {
    return { result: { packageName, state, linkState: 'linked' } };
  }

  return {
    failure: {
      packageName,
      action: 'link',
      reason: formatApiError(linked),
    },
  };
}

async function requestApi(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  tokenValue?: string,
  body?: unknown,
): Promise<ApiResult> {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (tokenValue) {
    headers.set('authorization', `Bearer ${tokenValue}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const parsed = await readJsonResponse(response);
  if (response.ok) {
    return { kind: 'ok', status: response.status, body: parsed };
  }

  if (isApiErrorBody(parsed)) {
    return {
      kind: 'error',
      status: response.status,
      code: parsed.code,
      message: parsed.message,
    };
  }

  return {
    kind: 'error',
    status: response.status,
    message: response.statusText || summarizeNonJson(parsed) || 'JSR API request failed.',
  };
}

async function readJsonResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }
  const text = await response.text();
  if (text.trim().length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { nonJsonResponse: true, preview: text.trim().slice(0, 200) };
  }
}

function parseArgs(args: readonly string[]): Options {
  let scope = DEFAULT_SCOPE;
  let repo = parseRepo(DEFAULT_REPO);
  let dryRun = false;
  let root = Deno.cwd();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--scope') {
      scope = readValue(args, index, arg);
      index += 1;
    } else if (arg === '--repo') {
      repo = parseRepo(readValue(args, index, arg));
      index += 1;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--root') {
      root = readValue(args, index, arg);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { scope, repo, dryRun, root };
}

function readValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

function parseRepo(value: string): GitHubRepo {
  const parts = value.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('--repo must use owner/name format.');
  }
  return { owner: parts[0], name: parts[1] };
}

function packageSegment(name: string): string {
  if (!name.startsWith(JSR_PACKAGE_PREFIX)) {
    throw new Error(`Workspace member ${name} is not in the ${JSR_PACKAGE_PREFIX} scope.`);
  }
  return name.slice(JSR_PACKAGE_PREFIX.length);
}

function isApiErrorBody(
  value: unknown,
): value is { readonly code: string; readonly message: string } {
  return isJsonObject(value) && typeof value.code === 'string' && typeof value.message === 'string';
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLinkedToRepo(value: unknown, repo: GitHubRepo): boolean {
  if (!isJsonObject(value)) {
    return false;
  }
  const githubRepository = value.githubRepository;
  if (!isJsonObject(githubRepository)) {
    return false;
  }
  return stringEqualsInsensitive(githubRepository.owner, repo.owner) &&
    stringEqualsInsensitive(githubRepository.name, repo.name);
}

function stringEqualsInsensitive(value: unknown, expected: string): boolean {
  return typeof value === 'string' && value.toLowerCase() === expected.toLowerCase();
}

function isAlreadyExists(result: ApiResult): boolean {
  return result.kind === 'error' && benignMatch(result, ['already', 'exists']);
}

function isAlreadyLinked(result: ApiResult): boolean {
  return result.kind === 'error' && benignMatch(result, ['already', 'linked']);
}

function benignMatch(
  result: Extract<ApiResult, { readonly kind: 'error' }>,
  terms: readonly string[],
): boolean {
  const haystack = `${result.code ?? ''} ${result.message}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function summarizeNonJson(value: unknown): string | undefined {
  if (!isNonJsonResponse(value)) {
    return undefined;
  }
  return value.preview.length > 0
    ? `non-JSON response body: ${value.preview}`
    : 'non-JSON response body';
}

function isNonJsonResponse(value: unknown): value is NonJsonResponse {
  return isJsonObject(value) && value.nonJsonResponse === true && typeof value.preview === 'string';
}

function formatApiError(result: ApiResult): string {
  if (result.kind === 'ok') {
    return `unexpected success status ${result.status}`;
  }
  const code = result.code ? `${result.code}: ` : '';
  return `HTTP ${result.status} ${code}${result.message}`;
}
