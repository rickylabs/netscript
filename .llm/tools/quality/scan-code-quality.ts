import { relative, resolve } from 'jsr:@std/path@^1';
import { extractFencedBlocks } from '../docs/snippet-extractor.ts';

export type QualityRule =
  | 'explicit-any-ignore'
  | 'unsafe-cast'
  | 'explicit-any'
  | 'plugin-name-check'
  | 'ts-error-suppression';

export interface QualityFinding {
  readonly rule: QualityRule;
  readonly file: string;
  readonly line: number;
  readonly text: string;
  readonly fenceOrdinal?: number;
}

const PLUGIN_NAMES = ['ai', 'auth', 'sagas', 'streams', 'triggers', 'workers'];
// Root policy: the default `quality:scan` half of `quality:gate` covers CLI
// host code plus first-party plugins. Package-wide auditing, including the
// publishable plugin-*-core packages and fitness/quality tool sources, is the
// explicit `quality:scan:repo` task.
// The companion `arch:check` independently evaluates every doctrine root.
const DEFAULT_ROOTS = ['packages/cli/src', 'plugins'];
const ALLOWANCE_OWNER_REPOSITORY = 'rickylabs/netscript';
const ALLOWANCE_RECORD = /^#([1-9]\d*)\s+—\s+(\S(?:.*\S)?)$/u;
const ISSUE_REFERENCE = /#\d+/g;
const EMPTY_TAINT: Set<string> = new Set();
const GENERATED_OR_VENDOR_DIRS = new Set([
  '.deno',
  '.deploy',
  '.git',
  '.output',
  '_cache',
  '_site',
  'node_modules',
  'vendor',
]);

/**
 * Same-file identifiers bound to a plugin name — `const target = 'auth'` or an
 * array literal containing one. Host code that compares `plugin.name` against
 * such an identifier is the plugin-identity anti-pattern hidden behind an
 * innocent-looking extraction, so these idents are treated as plugin names.
 */
function collectPluginNameIdents(lines: readonly string[]): Set<string> {
  const names = PLUGIN_NAMES.join('|');
  const stringBind = new RegExp(
    `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*(?::[^=]+)?=\\s*[\"'](?:${names})[\"']`,
  );
  const arrayBind = new RegExp(
    `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*(?::[^=]+)?=\\s*\\[[^\\]]*[\"'](?:${names})[\"']`,
  );
  const tainted = new Set<string>();
  for (const line of lines) {
    const s = stringBind.exec(line);
    if (s) tainted.add(s[1]);
    const a = arrayBind.exec(line);
    if (a) tainted.add(a[1]);
  }
  return tainted;
}

function ruleFor(line: string, file: string, tainted: Set<string>): QualityRule | undefined {
  // Template/fixture source strings are data, not syntax in the scanned module.
  if (/^\s*[`'\"]/.test(line)) return undefined;
  if (/deno-lint-ignore(?:-file)?\s+no-explicit-any/.test(line)) return 'explicit-any-ignore';
  if (/@ts-(?:ignore|expect-error|nocheck)\b/.test(line)) return 'ts-error-suppression';
  if (/\bas\s+unknown\s+as\b|\bas\s+any\b|\bas\s+never\b/.test(line)) return 'unsafe-cast';
  const commentOnly = /^\s*(?:\/\/|\/\*|\*)/.test(line);
  if (!commentOnly && /(?:<|:\s*)any(?:\s*[,>;)\]}]|\b)/.test(line)) return 'explicit-any';
  // Host-side plugin identity: equality/predicate against a plugin name whether
  // written as a quoted literal OR a same-file identifier bound to one (const
  // indirection). Requiring the closing quote on literals keeps `'auth-backend'`
  // (a capability id) from matching the `auth` plugin name.
  if (file.includes('/features/plugins/')) {
    const names = PLUGIN_NAMES.join('|');
    const literalEquality = new RegExp(
      `(?:===|!==)\\s*[\"'](?:${names})[\"']|[\"'](?:${names})[\"']\\s*(?:===|!==)`,
    );
    const literalPredicate = new RegExp(
      `\\.(?:startsWith|endsWith|includes)\\(\\s*[\"'](?:${names})[\"']`,
    );
    if (literalEquality.test(line) || literalPredicate.test(line)) return 'plugin-name-check';
    if (tainted.size > 0) {
      const idents = [...tainted].map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      // `.name`/`kind` compared to a tainted ident, or a predicate on it, or a
      // tainted array `.includes(plugin.name)`.
      const identEquality = new RegExp(
        `(?:\\.name|\\bkind)\\s*(?:===|!==)\\s*(?:${idents})\\b|\\b(?:${idents})\\s*(?:===|!==)\\s*(?:[\\w.]*\\.name|kind)\\b`,
      );
      const identPredicate = new RegExp(
        `\\.(?:startsWith|endsWith|includes)\\(\\s*(?:${idents})\\b`,
      );
      const arrayIncludes = new RegExp(
        `\\b(?:${idents})\\.includes\\(\\s*[\\w.]*(?:\\.name|kind)\\b`,
      );
      if (identEquality.test(line) || identPredicate.test(line) || arrayIncludes.test(line)) {
        return 'plugin-name-check';
      }
    }
  }
  return undefined;
}

function isTypeFixture(file: string): boolean {
  const normalized = file.replaceAll('\\', '/');
  return normalized.includes('/tests/type-fixtures/') && normalized.endsWith('_type.ts');
}

function isSoundnessFixture(file: string): boolean {
  return file.replaceAll('\\', '/').endsWith('-soundness_test.ts');
}

function isDocsSiteFile(file: string): boolean {
  const normalized = file.replaceAll('\\', '/');
  return normalized.includes('/docs/site/') || normalized.startsWith('docs/site/');
}

function isScannable(file: string): boolean {
  if (isDocsSiteFile(file) && /\.md$/.test(file)) return true;
  if (!/\.[cm]?[jt]sx?$/.test(file) || file.endsWith('.generated.ts') || isTypeFixture(file)) {
    return false;
  }
  const testFile = /(?:_test|\.test|\.spec)\.[cm]?[jt]sx?$/.test(file);
  return !testFile || isDocsSiteFile(file) || isSoundnessFixture(file);
}

async function collect(path: string): Promise<string[]> {
  try {
    const stat = await Deno.stat(path);
    if (stat.isFile) return isScannable(path) ? [path] : [];
  } catch {
    return [];
  }
  const files: string[] = [];
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory && GENERATED_OR_VENDOR_DIRS.has(entry.name)) continue;
    const child = resolve(path, entry.name);
    if (entry.isDirectory) files.push(...await collect(child));
    else if (entry.isFile && isScannable(child)) files.push(child);
  }
  return files;
}

/** State required from the durable issue that owns an allowance. */
export interface AllowanceIssueState {
  readonly issue: number;
  readonly state: 'open' | 'closed';
  readonly milestone: string | null;
}

/** External state boundary used to verify allowance owners. */
export interface AllowanceIssueResolver {
  resolve(issue: number): Promise<AllowanceIssueState>;
}

/** Fetch subset used by the GitHub allowance-owner adapter. */
export type AllowanceIssueFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Configuration for the fixed-repository GitHub allowance-owner adapter. */
export interface GitHubAllowanceIssueResolverOptions {
  readonly fetch?: AllowanceIssueFetch;
  readonly token?: string | null;
}

export type AllowancePolicyFailureKind =
  | 'malformed-registration'
  | 'owner-unavailable'
  | 'owner-closed'
  | 'owner-unmilestoned';

/** A fail-closed reason that prevents an allowance registration from passing. */
export interface AllowancePolicyFailure {
  readonly kind: AllowancePolicyFailureKind;
  readonly file: string;
  readonly line: number;
  readonly issue?: number;
  readonly message: string;
  readonly fenceOrdinal?: number;
}

/** Options for deterministic scanner tests and alternate issue-state adapters. */
export interface QualityScanOptions {
  readonly allowanceIssueResolver?: AllowanceIssueResolver;
}

/** A syntactically valid allowance record counted by the non-increasing budget. */
export interface QualityAllowance {
  readonly file: string;
  readonly line: number;
  readonly issue: number;
  readonly reason: string;
  readonly fenceOrdinal?: number;
}

/** Full scan result: real findings plus every honored allowance (for audit). */
export interface QualityScan {
  readonly findings: QualityFinding[];
  readonly allowances: QualityAllowance[];
  readonly allowanceFailures: AllowancePolicyFailure[];
}

function optionalGitHubToken(): string | undefined {
  try {
    return Deno.env.get('GITHUB_TOKEN') ?? Deno.env.get('GH_TOKEN') ?? undefined;
  } catch {
    // A token is optional. A caller without env permission deliberately uses
    // the public unauthenticated API and remains subject to its rate limit.
    return undefined;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function githubIssuePayload(value: unknown, issue: number): AllowanceIssueState {
  if (!value || typeof value !== 'object') {
    throw new Error(`GitHub issue #${issue} returned a non-object response`);
  }
  const payload = value as Record<string, unknown>;
  if (payload.number !== issue || (payload.state !== 'open' && payload.state !== 'closed')) {
    throw new Error(`GitHub issue #${issue} returned malformed identity or state`);
  }
  let milestone: string | null;
  if (payload.milestone === null) {
    milestone = null;
  } else if (
    payload.milestone && typeof payload.milestone === 'object' &&
    typeof (payload.milestone as Record<string, unknown>).title === 'string' &&
    ((payload.milestone as Record<string, unknown>).title as string).trim().length > 0
  ) {
    milestone = ((payload.milestone as Record<string, unknown>).title as string).trim();
  } else {
    throw new Error(`GitHub issue #${issue} returned a malformed milestone`);
  }
  return { issue, state: payload.state, milestone };
}

/**
 * Resolve allowance owners from the fixed public NetScript issue tracker.
 *
 * Tokenless developer and fork runs intentionally use GitHub's anonymous API.
 * Offline, permission-denied, malformed, and rate-limited responses throw so
 * the scanner can fail closed. A token only raises the rate limit; it never
 * changes the repository whose issue state is trusted.
 */
export function createGitHubAllowanceIssueResolver(
  options: GitHubAllowanceIssueResolverOptions = {},
): AllowanceIssueResolver {
  const request = options.fetch ?? fetch;
  const token = options.token === undefined ? optionalGitHubToken() : options.token ?? undefined;
  return {
    async resolve(issue: number): Promise<AllowanceIssueState> {
      const url = `https://api.github.com/repos/${ALLOWANCE_OWNER_REPOSITORY}/issues/${issue}`;
      const headers = new Headers({
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'netscript-quality-scan',
      });
      if (token) headers.set('authorization', `Bearer ${token}`);
      let response: Response;
      try {
        response = await request(url, { headers });
      } catch (error: unknown) {
        throw new Error(
          `GitHub issue #${issue} is unavailable: ${errorMessage(error)}. ` +
            'Grant --allow-net=api.github.com; a token is optional.',
        );
      }
      if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        throw new Error(
          `GitHub issue #${issue} is unavailable: HTTP ${response.status}` +
            `${remaining === null ? '' : ` (rate-limit remaining ${remaining})`}. ` +
            'Anonymous runs fail closed at the public rate limit; provide GITHUB_TOKEN or GH_TOKEN.',
        );
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error: unknown) {
        throw new Error(`GitHub issue #${issue} returned invalid JSON: ${errorMessage(error)}`);
      }
      return githubIssuePayload(payload, issue);
    },
  };
}

interface ScanUnit {
  readonly sourcePath: string;
  readonly lines: readonly string[];
  readonly lineOffset: number;
  readonly fenceOrdinal?: number;
  readonly exemptTsErrorSuppression: boolean;
}

async function scanUnits(file: string, cwd: string): Promise<ScanUnit[]> {
  const sourcePath = relative(cwd, file).replaceAll('\\', '/');
  const source = await Deno.readTextFile(file);
  if (!sourcePath.startsWith('docs/site/') || !sourcePath.endsWith('.md')) {
    return [{
      sourcePath,
      lines: source.split(/\r?\n/),
      lineOffset: 0,
      exemptTsErrorSuppression: isSoundnessFixture(sourcePath),
    }];
  }

  return extractFencedBlocks(source, sourcePath)
    .filter((block) =>
      block.compilationExtension !== undefined && block.exemptionReason === undefined
    )
    .map((block) => ({
      sourcePath: block.sourcePath,
      lines: block.body.split(/\r?\n/),
      lineOffset: block.codeStartLine - 1,
      fenceOrdinal: block.fenceOrdinal,
      exemptTsErrorSuppression: false,
    }));
}

/** Scan selected source paths, returning findings and honored allowances. */
export async function scanCodeQualityDetailed(
  paths: readonly string[],
  cwd: string = Deno.cwd(),
  options: QualityScanOptions = {},
): Promise<QualityScan> {
  const files = (await Promise.all(paths.map((path) => collect(resolve(cwd, path))))).flat();
  const findings: QualityFinding[] = [];
  const allowances: QualityAllowance[] = [];
  const allowanceFailures: AllowancePolicyFailure[] = [];
  for (const file of files) {
    for (const unit of await scanUnits(file, cwd)) {
      const normalized = unit.sourcePath.replaceAll('\\', '/');
      const tainted = normalized.includes('/features/plugins/')
        ? collectPluginNameIdents(unit.lines)
        : EMPTY_TAINT;
      for (let index = 0; index < unit.lines.length; index++) {
        const line = unit.lines[index];
        const allowanceMarkers = [...line.matchAll(/\/\/\s*quality-allow:/g)];
        if (allowanceMarkers.length > 0) {
          // A quality-allow only suppresses a line that would otherwise fire a
          // rule — an allowance on a clean line is dead weight, not counted.
          if (!ruleFor(line.replace(/\/\/\s*quality-allow:.*$/, ''), normalized, tainted)) {
            continue;
          }
          const location = {
            file: unit.sourcePath,
            line: unit.lineOffset + index + 1,
            ...(unit.fenceOrdinal === undefined ? {} : { fenceOrdinal: unit.fenceOrdinal }),
          };
          const recordText = line.match(/\/\/\s*quality-allow:\s*(.*)$/)?.[1].trim() ?? '';
          const record = allowanceMarkers.length === 1 ? ALLOWANCE_RECORD.exec(recordText) : null;
          const references = recordText.match(ISSUE_REFERENCE) ?? [];
          if (!record || references.length !== 1) {
            allowanceFailures.push({
              kind: 'malformed-registration',
              ...location,
              message: 'Expected exactly `quality-allow: #<issue> — <specific nonblank reason>`.',
            });
          } else {
            allowances.push({
              ...location,
              issue: Number(record[1]),
              reason: record[2],
            });
          }
          continue;
        }
        const rule = ruleFor(line, normalized, tainted);
        if (rule && !(unit.exemptTsErrorSuppression && rule === 'ts-error-suppression')) {
          findings.push({
            rule,
            file: unit.sourcePath,
            line: unit.lineOffset + index + 1,
            text: line.trim(),
            ...(unit.fenceOrdinal === undefined ? {} : { fenceOrdinal: unit.fenceOrdinal }),
          });
        }
      }
    }
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  allowances.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  const resolver = options.allowanceIssueResolver ?? createGitHubAllowanceIssueResolver();
  const issueStates = new Map<number, AllowanceIssueState | Error>();
  await Promise.all(
    [...new Set(allowances.map((allowance) => allowance.issue))].map(async (issue) => {
      try {
        issueStates.set(issue, await resolver.resolve(issue));
      } catch (error: unknown) {
        issueStates.set(issue, error instanceof Error ? error : new Error(String(error)));
      }
    }),
  );
  for (const allowance of allowances) {
    const resolved = issueStates.get(allowance.issue);
    if (resolved instanceof Error || !resolved || resolved.issue !== allowance.issue) {
      allowanceFailures.push({
        kind: 'owner-unavailable',
        file: allowance.file,
        line: allowance.line,
        issue: allowance.issue,
        message: resolved instanceof Error
          ? resolved.message
          : `Issue resolver returned no authoritative state for #${allowance.issue}.`,
        ...(allowance.fenceOrdinal === undefined ? {} : { fenceOrdinal: allowance.fenceOrdinal }),
      });
    } else if (resolved.state !== 'open') {
      allowanceFailures.push({
        kind: 'owner-closed',
        file: allowance.file,
        line: allowance.line,
        issue: allowance.issue,
        message: `Allowance owner #${allowance.issue} is closed.`,
        ...(allowance.fenceOrdinal === undefined ? {} : { fenceOrdinal: allowance.fenceOrdinal }),
      });
    } else if (resolved.milestone === null) {
      allowanceFailures.push({
        kind: 'owner-unmilestoned',
        file: allowance.file,
        line: allowance.line,
        issue: allowance.issue,
        message: `Allowance owner #${allowance.issue} has no milestone.`,
        ...(allowance.fenceOrdinal === undefined ? {} : { fenceOrdinal: allowance.fenceOrdinal }),
      });
    }
  }
  allowanceFailures.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { findings, allowances, allowanceFailures };
}

/** Scan selected source paths for code-quality violations. */
export async function scanCodeQuality(
  paths: readonly string[],
  cwd: string = Deno.cwd(),
  options: QualityScanOptions = {},
): Promise<QualityFinding[]> {
  return (await scanCodeQualityDetailed(paths, cwd, options)).findings;
}

if (import.meta.main) {
  const pretty = Deno.args.includes('--pretty');
  const changed = Deno.args.flatMap((arg, index, args) =>
    arg === '--changed-file' ? [args[index + 1]] : []
  );
  const roots = Deno.args.flatMap((arg, index, args) => arg === '--root' ? [args[index + 1]] : []);
  const maxAllowArg = Deno.args.flatMap((arg, index, args) =>
    arg === '--max-allow' ? [args[index + 1]] : []
  )[0];
  const maxAllow = maxAllowArg === undefined ? undefined : Number(maxAllowArg);
  const mode = changed.length > 0 ? 'changed-files' : 'repository';
  const scanned = changed.length > 0 ? changed : roots.length > 0 ? roots : DEFAULT_ROOTS;
  const { findings, allowances, allowanceFailures } = await scanCodeQualityDetailed(scanned);
  const allowExceeded = maxAllow !== undefined && Number.isFinite(maxAllow) &&
    allowances.length > maxAllow;
  const result = {
    ok: findings.length === 0 && allowanceFailures.length === 0 && !allowExceeded,
    mode,
    scanned,
    findings,
    allowCount: allowances.length,
    allowances,
    allowanceFailures,
    ...(allowExceeded ? { allowLimitExceeded: { limit: maxAllow, count: allowances.length } } : {}),
  };
  console.log(JSON.stringify(result, null, pretty ? 2 : undefined));
  if (!result.ok) Deno.exit(1);
}
