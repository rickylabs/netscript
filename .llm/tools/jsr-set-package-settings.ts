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
 * - runtimeCompat: per-package, from the centralized config. The default is
 *   { deno: true } (Deno shows as supported; other runtimes stay "unknown"
 *   rather than being falsely marked incompatible), and browser-facing members
 *   (sdk, fresh, fresh-ui) additionally declare browser support.
 *
 * The desired values come from the centralized registry `jsr-package-settings.json`
 * at the repo root: a `defaults` block plus per-`packages` overrides keyed by the
 * segment after `@netscript/`. When the file is absent, built-in defaults apply.
 *
 * Writes require a JSR access token with package-edit scope in JSR_API_TOKEN
 * (the OIDC publish token is publish-scoped and cannot edit settings). Without a
 * token the tool runs read-only and reports the diff it would apply.
 *
 * Usage:
 *   deno run --allow-net --allow-read --allow-env \
 *     .llm/tools/jsr-set-package-settings.ts \
 *     [--scope netscript] [--root .] [--config jsr-package-settings.json] [--dry-run]
 */

import { discoverWorkspaceMembers, type PublishableMember } from './publish-workspace.ts';

interface Options {
  readonly scope: string;
  readonly dryRun: boolean;
  readonly root: string;
  readonly configPath?: string;
}

interface RuntimeCompat {
  readonly browser?: boolean;
  readonly deno?: boolean;
  readonly node?: boolean;
  readonly workerd?: boolean;
  readonly bun?: boolean;
}

type ReadmeSource = 'readme' | 'jsdoc';

interface PackageSettings {
  readonly readmeSource?: ReadmeSource;
  readonly runtimeCompat?: RuntimeCompat;
  readonly description?: string;
}

interface SettingsConfig {
  readonly defaults: PackageSettings;
  readonly packages: Readonly<Record<string, PackageSettings>>;
}

interface DesiredSettings {
  readonly readmeSource: ReadmeSource;
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
const CONFIG_BASENAME = 'jsr-package-settings.json';
// JSR caps package descriptions at 250 characters.
const DESCRIPTION_MAX_LENGTH = 250;
const RUNTIME_COMPAT_KEYS = ['browser', 'deno', 'node', 'workerd', 'bun'] as const;
const README_SOURCES: readonly ReadmeSource[] = ['readme', 'jsdoc'];
// Used when the centralized config file is absent.
const FALLBACK_DEFAULTS: PackageSettings = {
  readmeSource: 'readme',
  runtimeCompat: { deno: true },
};

const options = parseArgs(Deno.args);
const members = await discoverWorkspaceMembers(options.root);
const config = await loadConfig(options.configPath ?? `${options.root}/${CONFIG_BASENAME}`);
assertConfigPackagesExist(config, members);

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
  const desired = await resolveDesiredSettings(packageName, member, options.root, config);

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
  packageName: string,
  member: PublishableMember,
  root: string,
  settingsConfig: SettingsConfig,
): Promise<DesiredSettings> {
  const override = settingsConfig.packages[packageName] ?? {};
  const readmeSource = override.readmeSource ?? settingsConfig.defaults.readmeSource ?? 'readme';
  const runtimeCompat = override.runtimeCompat ?? settingsConfig.defaults.runtimeCompat ?? {
    deno: true,
  };
  // Description is dynamic from the README tagline unless the config overrides it.
  const description = override.description ??
    await readReadmeDescription(`${root}/${member.path}/${README_BASENAME}`);
  return {
    readmeSource,
    runtimeCompat,
    ...(description ? { description } : {}),
  };
}

async function loadConfig(configPath: string): Promise<SettingsConfig> {
  let source: string;
  try {
    source = await Deno.readTextFile(configPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(`no config at ${configPath} — using built-in defaults`);
      return { defaults: FALLBACK_DEFAULTS, packages: {} };
    }
    throw error;
  }

  const parsed: unknown = JSON.parse(source);
  if (!isJsonObject(parsed)) {
    throw new Error(`${configPath} must contain a JSON object.`);
  }

  const defaults = parsePackageSettings(parsed.defaults ?? {}, 'defaults');
  const packagesValue = parsed.packages ?? {};
  if (!isJsonObject(packagesValue)) {
    throw new Error(`${configPath}: "packages" must be an object.`);
  }
  const packages: Record<string, PackageSettings> = {};
  for (const [name, value] of Object.entries(packagesValue)) {
    packages[name] = parsePackageSettings(value, `packages.${name}`);
  }

  console.log(
    `loaded settings config from ${configPath} (${Object.keys(packages).length} overrides)`,
  );
  return { defaults, packages };
}

function parsePackageSettings(value: unknown, label: string): PackageSettings {
  if (!isJsonObject(value)) {
    throw new Error(`${label} must be an object.`);
  }
  const settings: { -readonly [K in keyof PackageSettings]: PackageSettings[K] } = {};

  const readmeSource = value.readmeSource;
  if (readmeSource !== undefined) {
    if (
      typeof readmeSource !== 'string' || !README_SOURCES.includes(readmeSource as ReadmeSource)
    ) {
      throw new Error(`${label}.readmeSource must be one of ${README_SOURCES.join(', ')}.`);
    }
    settings.readmeSource = readmeSource as ReadmeSource;
  }

  if (value.runtimeCompat !== undefined) {
    settings.runtimeCompat = parseRuntimeCompat(value.runtimeCompat, `${label}.runtimeCompat`);
  }

  if (value.description !== undefined) {
    if (typeof value.description !== 'string') {
      throw new Error(`${label}.description must be a string.`);
    }
    settings.description = truncate(flattenMarkdown(value.description), DESCRIPTION_MAX_LENGTH);
  }

  return settings;
}

function parseRuntimeCompat(value: unknown, label: string): RuntimeCompat {
  if (!isJsonObject(value)) {
    throw new Error(`${label} must be an object.`);
  }
  const compat: { -readonly [K in keyof RuntimeCompat]: RuntimeCompat[K] } = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!RUNTIME_COMPAT_KEYS.includes(key as (typeof RUNTIME_COMPAT_KEYS)[number])) {
      throw new Error(
        `${label}: unknown runtime "${key}" (allowed: ${RUNTIME_COMPAT_KEYS.join(', ')}).`,
      );
    }
    if (typeof entry !== 'boolean') {
      throw new Error(`${label}.${key} must be a boolean.`);
    }
    compat[key as keyof RuntimeCompat] = entry;
  }
  return compat;
}

function assertConfigPackagesExist(
  settingsConfig: SettingsConfig,
  workspaceMembers: readonly PublishableMember[],
): void {
  const known = new Set(workspaceMembers.map((member) => packageSegment(member.name)));
  const unknown = Object.keys(settingsConfig.packages).filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new Error(
      `config references unknown packages: ${
        unknown.join(', ')
      } (not publishable workspace members).`,
    );
  }
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
  let configPath: string | undefined;

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
    } else if (arg === '--config') {
      configPath = readValue(args, index, arg);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { scope, dryRun, root, configPath };
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
