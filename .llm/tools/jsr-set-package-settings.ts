/**
 * Idempotently apply JSR per-package presentation settings for every publishable
 * workspace member: `readmeSource`, `description`, and `runtimeCompat`.
 *
 * These are JSR account/server settings — they are NOT carried in the published
 * tarball and cannot be baked into a package version. They persist across
 * versions, so this tool reconciles them on every publish (and covers any newly
 * created package automatically).
 *
 * - readmeSource = "readme": render the README on the package main page (full
 *   symbol docs still live on the Docs tab). JSR's default is "jsdoc", which
 *   shows the root module's @module JSDoc instead of the README.
 * - description: derived dynamically from each package README's tagline so the
 *   one-liner shown on the package page and in search stays in sync with docs.
 * - runtimeCompat = { deno: true }: NetScript is Deno-native for now. Deno shows
 *   as supported; the other runtimes stay "unknown" rather than being falsely
 *   marked incompatible (some members, e.g. sdk/query-client and fresh-ui, are
 *   browser-facing).
 *
 * Writes require a JSR access token with package-edit scope in JSR_API_TOKEN
 * (the OIDC publish token is publish-scoped and cannot edit settings). Without a
 * token the tool runs read-only and reports the diff it would apply.
 *
 * Usage:
 *   deno run --allow-net --allow-read --allow-env \
 *     .llm/tools/jsr-set-package-settings.ts [--scope netscript] [--root .] [--dry-run]
 */

import { discoverWorkspaceMembers, type PublishableMember } from './publish-workspace.ts';

interface Options {
  readonly scope: string;
  readonly dryRun: boolean;
  readonly root: string;
}

interface RuntimeCompat {
  readonly browser?: boolean;
  readonly deno?: boolean;
  readonly node?: boolean;
  readonly workerd?: boolean;
  readonly bun?: boolean;
}

interface DesiredSettings {
  readonly readmeSource: 'readme';
  readonly runtimeCompat: RuntimeCompat;
  readonly description?: string;
}

interface SettingsFailure {
  readonly packageName: string;
  readonly action: string;
  readonly reason: string;
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
const JSR_PACKAGE_PREFIX = '@netscript/';
const README_BASENAME = 'README.md';
// JSR caps package descriptions at 250 characters.
const DESCRIPTION_MAX_LENGTH = 250;
const DESIRED_RUNTIME_COMPAT: RuntimeCompat = { deno: true };

const options = parseArgs(Deno.args);
const members = await discoverWorkspaceMembers(options.root);

console.log(`discovered ${members.length} workspace members`);

const token = Deno.env.get('JSR_API_TOKEN')?.trim();
if (!token && !options.dryRun) {
  console.log('JSR_API_TOKEN not set — running read-only diff (no settings will be written)');
}

const failures: SettingsFailure[] = [];
let changed = 0;
let unchanged = 0;
let wouldChange = 0;

for (const member of members) {
  const packageName = packageSegment(member.name);
  const desired = await resolveDesiredSettings(member, options.root);

  const existing = await requestApi(
    'GET',
    `/scopes/${options.scope}/packages/${packageName}`,
  );
  if (existing.kind !== 'ok') {
    failures.push({
      packageName,
      action: 'read',
      reason: formatApiError(existing),
    });
    continue;
  }

  const patch = diffSettings(existing.body, desired);
  const fields = Object.keys(patch);
  if (fields.length === 0) {
    unchanged += 1;
    console.log(`${packageName}: up to date`);
    continue;
  }

  if (options.dryRun) {
    wouldChange += 1;
    console.log(`${packageName}: would update ${fields.join(', ')}`);
    continue;
  }

  if (!token) {
    wouldChange += 1;
    console.log(`${packageName}: needs update (${fields.join(', ')}) but no token`);
    continue;
  }

  const updated = await requestApi(
    'PATCH',
    `/scopes/${options.scope}/packages/${packageName}`,
    token,
    patch,
  );
  if (updated.kind === 'ok') {
    changed += 1;
    console.log(`${packageName}: updated ${fields.join(', ')}`);
  } else {
    failures.push({
      packageName,
      action: 'update',
      reason: formatApiError(updated),
    });
  }
}

console.log(
  `settings reconciled: ${changed} updated, ${unchanged} unchanged, ${wouldChange} pending, failures ${failures.length}`,
);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`${failure.packageName}: ${failure.action} failed: ${failure.reason}`);
  }
  Deno.exit(1);
}

if (!token && !options.dryRun && wouldChange > 0) {
  console.error('JSR_API_TOKEN not set but settings changes are needed.');
  Deno.exit(1);
}

async function resolveDesiredSettings(
  member: PublishableMember,
  root: string,
): Promise<DesiredSettings> {
  const description = await readReadmeDescription(`${root}/${member.path}/${README_BASENAME}`);
  return {
    readmeSource: 'readme',
    runtimeCompat: DESIRED_RUNTIME_COMPAT,
    ...(description ? { description } : {}),
  };
}

async function readReadmeDescription(readmePath: string): Promise<string | undefined> {
  let source: string;
  try {
    source = await Deno.readTextFile(readmePath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return undefined;
    }
    throw error;
  }
  return extractDescription(source);
}

/**
 * Pull the package tagline from a README: the first prose paragraph after the
 * H1 and badge block. NetScript READMEs lead with a `**bold tagline**`. The
 * paragraph is flattened to plain text and trimmed to JSR's length cap.
 */
function extractDescription(readme: string): string | undefined {
  const lines = readme.split(/\r?\n/);
  const paragraph: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (paragraph.length === 0) {
      if (line.length === 0 || isSkippableHeaderLine(line)) {
        continue;
      }
      paragraph.push(line);
      continue;
    }
    if (line.length === 0) {
      break;
    }
    paragraph.push(line);
  }

  if (paragraph.length === 0) {
    return undefined;
  }

  const plain = flattenMarkdown(paragraph.join(' '));
  if (plain.length === 0) {
    return undefined;
  }
  return truncate(plain, DESCRIPTION_MAX_LENGTH);
}

function isSkippableHeaderLine(line: string): boolean {
  if (line.startsWith('#')) {
    return true;
  }
  if (line.startsWith('---') || line.startsWith('***') || line.startsWith('===')) {
    return true;
  }
  // Badge lines: standalone images / links such as [![JSR](...)](...) possibly
  // chained on one line. Treat a line that is only image/link markup as a badge.
  const withoutBadges = line.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .trim();
  return withoutBadges.length === 0;
}

function flattenMarkdown(text: string): string {
  return text
    // links / images -> visible text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    // emphasis and code markers
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[\s,;:.–-]+$/, '').trim();
}

function diffSettings(current: unknown, desired: DesiredSettings): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const currentObject = isJsonObject(current) ? current : {};

  if (currentObject.readmeSource !== desired.readmeSource) {
    patch.readmeSource = desired.readmeSource;
  }

  if (
    desired.description !== undefined &&
    currentObject.description !== desired.description
  ) {
    patch.description = desired.description;
  }

  if (!runtimeCompatEquals(currentObject.runtimeCompat, desired.runtimeCompat)) {
    patch.runtimeCompat = desired.runtimeCompat;
  }

  return patch;
}

function runtimeCompatEquals(current: unknown, desired: RuntimeCompat): boolean {
  const currentObject = isJsonObject(current) ? current : {};
  const keys = new Set<string>([
    ...Object.keys(currentObject),
    ...Object.keys(desired),
  ]);
  for (const key of keys) {
    const desiredValue = (desired as Record<string, unknown>)[key];
    const currentValue = currentObject[key];
    // Treat absent and undefined as the same "unknown" state.
    if (normalizeCompat(currentValue) !== normalizeCompat(desiredValue)) {
      return false;
    }
  }
  return true;
}

function normalizeCompat(value: unknown): boolean | null {
  if (value === true || value === false) {
    return value;
  }
  return null;
}

async function requestApi(
  method: 'GET' | 'PATCH',
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
  let dryRun = false;
  let root = Deno.cwd();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--scope') {
      scope = readValue(args, index, arg);
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

  return { scope, dryRun, root };
}

function readValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
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
