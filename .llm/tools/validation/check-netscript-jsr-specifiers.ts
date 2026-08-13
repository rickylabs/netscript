#!/usr/bin/env -S deno run --allow-read
/**
 * Reject `jsr:@netscript/*` values emitted or executed by framework code that a consumer workspace
 * cannot resolve. Three rules, one scan:
 *
 * 1. **Versioned** — a version-less specifier resolves to whatever is latest at install time.
 * 2. **Current** — an exact pin must name the version that workspace package actually ships. A
 *    stale pin reaches users as an opaque bundler resolution error rather than a version mismatch
 *    (#953: `fresh-ui@beta.11` shipped `jsr:@netscript/sdk@0.0.1-beta.10/desktop`, and beta.10 had
 *    no `./desktop` export at all).
 * 3. **Real** — an export subpath must exist in that package's `exports`.
 *
 * Rules 2 and 3 need a workspace to compare against; when the root `deno.json` declares no
 * workspace, only rule 1 runs. Range pins (`^`, `~`, `>=`) fail because first-party emitted
 * specifiers must track the release train exactly. Template placeholders remain version-neutral.
 *
 * Tests, fixtures, examples, documentation, and comments are excluded because they do not become
 * runtime or generated-project specifiers. A deliberate exception may use an inline
 * `jsr-versionless-ok: <reason>` marker, which exempts its line from all three rules; an empty
 * reason is itself a failure.
 */
import { walk } from 'jsr:@std/fs@^1/walk';
import { relative } from 'jsr:@std/path@^1';
import {
  createNetscriptJsrSpecifierRegExp,
  NETSCRIPT_SEMVER_PATTERN,
  parseNetscriptJsrSpecifier,
} from '../netscript-jsr-specifier.ts';

const DEFAULT_ROOTS = ['packages', 'plugins'] as const;
const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.json',
  '.jsonc',
  '.template',
  '.yml',
  '.yaml',
]);
const ALLOW_MARKER = 'jsr-versionless-ok:';
const MCP_PUBLISH_ASSETS = 'packages/mcp/src/publish-assets.generated.ts';

export interface SpecifierFinding {
  readonly path: string;
  readonly line: number;
  readonly specifier: string;
  readonly message: string;
}

export interface SpecifierAllowance {
  readonly path: string;
  readonly line: number;
  readonly reason: string;
}

/** An exact `@netscript/*` pin naming a version the workspace package no longer ships. */
export interface StaleVersionFinding {
  readonly path: string;
  readonly line: number;
  readonly specifier: string;
  readonly pinned: string;
  readonly current: string;
}

/** A specifier whose export subpath is not declared by the workspace package. */
export interface UnknownExportFinding {
  readonly path: string;
  readonly line: number;
  readonly specifier: string;
  readonly subpath: string;
  readonly exports: readonly string[];
}

/** A range-pinned `@netscript/*` specifier, forbidden by the exact release-train policy. */
export interface RangeSpecifierNote {
  readonly path: string;
  readonly line: number;
  readonly specifier: string;
}

export interface SpecifierScanResult {
  readonly scannedFiles: number;
  readonly findings: readonly SpecifierFinding[];
  readonly allowances: readonly SpecifierAllowance[];
  readonly staleVersions: readonly StaleVersionFinding[];
  readonly unknownExports: readonly UnknownExportFinding[];
  readonly ranges: readonly RangeSpecifierNote[];
}

/** The release and export surface a workspace member declares in its `deno.json`. */
export interface WorkspacePackage {
  readonly version: string;
  readonly exports: readonly string[];
}

const EXACT_VERSION = new RegExp(`^${NETSCRIPT_SEMVER_PATTERN}$`);
// A range starts with an operator followed by a version; `<version>` and `${…}` are placeholders.
const RANGE_VERSION = /^(?:[\^~]|[<>]=?|=)\d/;
const LITERAL_SUBPATH = /^[a-z0-9][a-z0-9./-]*$/;

function normalized(path: string): string {
  return path.replaceAll('\\', '/');
}

function hasSourceExtension(path: string): boolean {
  return [...SOURCE_EXTENSIONS].some((suffix) => path.endsWith(suffix));
}

function isExcluded(path: string): boolean {
  const value = `/${normalized(path)}`;
  const name = value.slice(value.lastIndexOf('/') + 1);
  return value.includes('/tests/') ||
    value.includes('/test/') ||
    value.includes('/fixtures/') ||
    value.includes('/__fixtures__/') ||
    value.includes('/examples/') ||
    value.includes('/docs/') ||
    name.endsWith('_test.ts') ||
    name.endsWith('_test.tsx') ||
    name.endsWith('.test.ts') ||
    name.endsWith('.test.tsx');
}

function maskComments(source: string): string {
  const chars = [...source];
  let quote: "'" | '"' | '`' | undefined;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < chars.length; index++) {
    const current = chars[index]!;
    const next = chars[index + 1];

    if (lineComment) {
      if (current === '\n') lineComment = false;
      else chars[index] = ' ';
      continue;
    }
    if (blockComment) {
      if (current === '*' && next === '/') {
        chars[index] = ' ';
        chars[index + 1] = ' ';
        blockComment = false;
        index++;
      } else if (current !== '\n') {
        chars[index] = ' ';
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (current === '\\') escaped = true;
      else if (current === quote) quote = undefined;
      continue;
    }
    if (current === "'" || current === '"' || current === '`') {
      quote = current;
      continue;
    }
    if (current === '/' && next === '/') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      lineComment = true;
      index++;
      continue;
    }
    if (current === '/' && next === '*') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      blockComment = true;
      index++;
    }
  }
  return chars.join('');
}

function maskEmbeddedDocumentation(source: string, path: string): string {
  if (path !== MCP_PUBLISH_ASSETS) return source;
  const declaration = /export const MCP_PACKAGE_README(?::\s*string)?\s*=\s*/.exec(source);
  if (!declaration) return source;
  const start = declaration.index + declaration[0].length;
  const quote = source[start];
  if (quote !== "'" && quote !== '"' && quote !== '`') return source;

  const chars = [...source];
  let escaped = false;
  for (let index = start; index < chars.length; index++) {
    const current = chars[index]!;
    if (index > start && !escaped && current === quote) {
      chars[index] = ' ';
      break;
    }
    if (current !== '\n' && current !== '\r') chars[index] = ' ';
    if (index === start) continue;
    if (escaped) escaped = false;
    else if (current === '\\') escaped = true;
  }
  return chars.join('');
}

function lineNumber(source: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index++) {
    if (source.charCodeAt(index) === 10) line++;
  }
  return line;
}

function sourceLine(source: string, line: number): string {
  return source.split(/\r?\n/)[line - 1] ?? '';
}

/** Split a NetScript JSR specifier into the parts the currency and export rules compare. */
export function parseNetscriptSpecifier(
  specifier: string,
): { readonly name: string; readonly version: string; readonly subpath: string } | undefined {
  const parsed = parseNetscriptJsrSpecifier(specifier);
  return parsed && {
    name: parsed.name,
    version: `${parsed.rangeOperator}${parsed.version}`,
    subpath: parsed.subpath,
  };
}

/**
 * Read every workspace member's declared version and export surface, keyed by package name.
 *
 * Returns an empty map when the root manifest declares no workspace — the shape rule still runs,
 * the currency and export rules simply have nothing to compare against.
 */
export async function readWorkspacePackages(cwd: string): Promise<Map<string, WorkspacePackage>> {
  const packages = new Map<string, WorkspacePackage>();
  const root = await readJsonObject(`${cwd}/deno.json`);
  const patterns = root?.workspace;
  if (!Array.isArray(patterns)) return packages;

  for (const pattern of patterns) {
    if (typeof pattern !== 'string') continue;
    for (const directory of await expandWorkspacePattern(cwd, pattern)) {
      const manifest = await readJsonObject(`${directory}/deno.json`);
      if (typeof manifest?.name !== 'string' || typeof manifest.version !== 'string') continue;
      packages.set(manifest.name, {
        version: manifest.version,
        exports: typeof manifest.exports === 'object' && manifest.exports !== null
          ? Object.keys(manifest.exports as Record<string, unknown>)
          : ['.'],
      });
    }
  }
  return packages;
}

async function expandWorkspacePattern(cwd: string, pattern: string): Promise<string[]> {
  if (!pattern.endsWith('/*')) return [`${cwd}/${pattern}`];
  const parent = `${cwd}/${pattern.slice(0, -2)}`;
  const directories: string[] = [];
  try {
    for await (const entry of Deno.readDir(parent)) {
      if (entry.isDirectory) directories.push(`${parent}/${entry.name}`);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return directories;
}

async function readJsonObject(path: string): Promise<Record<string, unknown> | undefined> {
  try {
    const parsed: unknown = JSON.parse(await Deno.readTextFile(path));
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

/** Scan repository source and emitted assets for unsafe NetScript JSR specifiers. */
export async function scanNetscriptJsrSpecifiers(
  roots: readonly string[] = DEFAULT_ROOTS,
  cwd: string = Deno.cwd(),
): Promise<SpecifierScanResult> {
  const findings: SpecifierFinding[] = [];
  const allowances: SpecifierAllowance[] = [];
  const staleVersions: StaleVersionFinding[] = [];
  const unknownExports: UnknownExportFinding[] = [];
  const ranges: RangeSpecifierNote[] = [];
  const workspace = await readWorkspacePackages(cwd);
  let scannedFiles = 0;

  for (const root of roots) {
    for await (const entry of walk(`${cwd}/${root}`, { includeDirs: false })) {
      const path = normalized(relative(cwd, entry.path));
      if (isExcluded(path) || !hasSourceExtension(path)) continue;
      scannedFiles++;
      const source = await Deno.readTextFile(entry.path);
      const masked = maskEmbeddedDocumentation(maskComments(source), path);

      for (const [index, lineText] of source.split(/\r?\n/).entries()) {
        const markerIndex = lineText.indexOf(ALLOW_MARKER);
        if (markerIndex < 0) continue;
        const reason = lineText.slice(markerIndex + ALLOW_MARKER.length).trim();
        if (!reason) {
          findings.push({
            path,
            line: index + 1,
            specifier: ALLOW_MARKER,
            message: 'version-less JSR suppression requires a non-empty reason',
          });
        }
      }

      for (const match of masked.matchAll(createNetscriptJsrSpecifierRegExp())) {
        const offset = match.index!;
        const line = lineNumber(masked, offset);
        const text = sourceLine(source, line);
        const markerIndex = text.indexOf(ALLOW_MARKER);
        const reason = markerIndex >= 0
          ? text.slice(markerIndex + ALLOW_MARKER.length).trim()
          : undefined;

        if (match[3] !== undefined) {
          if (reason) continue;
          inspectVersionedSpecifier(
            { path, line, specifier: match[0] },
            workspace,
            { staleVersions, unknownExports, ranges },
          );
          continue;
        }
        if (markerIndex >= 0) {
          if (reason) allowances.push({ path, line, reason });
          continue;
        }
        findings.push({
          path,
          line,
          specifier: match[0],
          message:
            'framework-emitted or executed jsr:@netscript/* specifier must include a version',
        });
      }
    }
  }

  const byLocation = <T extends { path: string; line: number }>(a: T, b: T) =>
    a.path.localeCompare(b.path) || a.line - b.line;
  return {
    scannedFiles,
    findings: findings.sort(byLocation),
    allowances: allowances.sort(byLocation),
    staleVersions: staleVersions.sort(byLocation),
    unknownExports: unknownExports.sort(byLocation),
    ranges: ranges.sort(byLocation),
  };
}

/** Apply the currency and export rules to one already-versioned specifier occurrence. */
function inspectVersionedSpecifier(
  occurrence: { readonly path: string; readonly line: number; readonly specifier: string },
  workspace: ReadonlyMap<string, WorkspacePackage>,
  sink: {
    readonly staleVersions: StaleVersionFinding[];
    readonly unknownExports: UnknownExportFinding[];
    readonly ranges: RangeSpecifierNote[];
  },
): void {
  const parsed = parseNetscriptSpecifier(occurrence.specifier);
  if (!parsed) return;
  const target = workspace.get(parsed.name);
  if (!target) return;

  if (EXACT_VERSION.test(parsed.version)) {
    if (parsed.version !== target.version) {
      sink.staleVersions.push({
        ...occurrence,
        pinned: parsed.version,
        current: target.version,
      });
    }
  } else if (RANGE_VERSION.test(parsed.version)) {
    sink.ranges.push(occurrence);
  }

  if (parsed.subpath && LITERAL_SUBPATH.test(parsed.subpath)) {
    if (!target.exports.includes(`./${parsed.subpath}`)) {
      sink.unknownExports.push({
        ...occurrence,
        subpath: parsed.subpath,
        exports: target.exports,
      });
    }
  }
}

/** Total failing occurrences across the exact release-train and export rules. */
export function failureCount(result: SpecifierScanResult): number {
  return result.findings.length + result.staleVersions.length + result.unknownExports.length +
    result.ranges.length;
}

function printResult(result: SpecifierScanResult, pretty: boolean): void {
  if (!pretty) {
    console.log(JSON.stringify({ ok: failureCount(result) === 0, ...result }));
    return;
  }
  for (const finding of result.findings) {
    console.error(
      `FAIL JSR-NETSCRIPT-VERSION ${finding.path}:${finding.line} ${finding.specifier} — ${finding.message}`,
    );
  }
  for (const stale of result.staleVersions) {
    console.error(
      `FAIL JSR-NETSCRIPT-CURRENT ${stale.path}:${stale.line} ${stale.specifier} — pinned ` +
        `${stale.pinned}, this workspace ships ${stale.current}`,
    );
  }
  for (const unknown of result.unknownExports) {
    console.error(
      `FAIL JSR-NETSCRIPT-EXPORT ${unknown.path}:${unknown.line} ${unknown.specifier} — ` +
        `'./${unknown.subpath}' is not exported; available: ${unknown.exports.join(', ')}`,
    );
  }
  for (const allowance of result.allowances) {
    console.log(
      `ALLOW JSR-NETSCRIPT-VERSION ${allowance.path}:${allowance.line} — ${allowance.reason}`,
    );
  }
  for (const range of result.ranges) {
    console.error(
      `FAIL JSR-NETSCRIPT-RANGE ${range.path}:${range.line} ${range.specifier} — ` +
        'first-party emitted specifiers must use the exact workspace release version',
    );
  }
  console.log(
    `NetScript JSR emitted-specifier guard: scanned=${result.scannedFiles} ` +
      `allowances=${result.allowances.length} ranges=${result.ranges.length} ` +
      `failures=${failureCount(result)}`,
  );
}

if (import.meta.main) {
  const result = await scanNetscriptJsrSpecifiers();
  printResult(result, Deno.args.includes('--pretty'));
  if (failureCount(result) > 0) Deno.exit(1);
}
