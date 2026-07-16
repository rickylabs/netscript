#!/usr/bin/env -S deno run --allow-read
/**
 * Reject version-less `jsr:@netscript/*` values emitted or executed by framework code.
 *
 * Tests, fixtures, examples, documentation, and comments are excluded because they do not become
 * runtime or generated-project specifiers. A deliberate version-less import-map alias may use an
 * inline `jsr-versionless-ok: <reason>` marker; an empty reason is itself a failure.
 */
import { walk } from 'jsr:@std/fs@^1/walk';
import { relative } from 'jsr:@std/path@^1';

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
const NETSCRIPT_JSR_PREFIX = /jsr:@netscript\/([a-z0-9][a-z0-9-]*)/g;
const ALLOW_MARKER = 'jsr-versionless-ok:';

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

export interface SpecifierScanResult {
  readonly scannedFiles: number;
  readonly findings: readonly SpecifierFinding[];
  readonly allowances: readonly SpecifierAllowance[];
}

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

function displayedSpecifier(source: string, offset: number): string {
  const tail = source.slice(offset);
  return tail.match(/^jsr:@netscript\/[^\s'"`),\]}]+/)?.[0] ?? 'jsr:@netscript/*';
}

/** Scan repository source and emitted assets for unsafe NetScript JSR specifiers. */
export async function scanNetscriptJsrSpecifiers(
  roots: readonly string[] = DEFAULT_ROOTS,
  cwd: string = Deno.cwd(),
): Promise<SpecifierScanResult> {
  const findings: SpecifierFinding[] = [];
  const allowances: SpecifierAllowance[] = [];
  let scannedFiles = 0;

  for (const root of roots) {
    for await (const entry of walk(`${cwd}/${root}`, { includeDirs: false })) {
      const path = normalized(relative(cwd, entry.path));
      if (isExcluded(path) || !hasSourceExtension(path)) continue;
      scannedFiles++;
      const source = await Deno.readTextFile(entry.path);
      const masked = maskComments(source);

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

      NETSCRIPT_JSR_PREFIX.lastIndex = 0;
      for (const match of masked.matchAll(NETSCRIPT_JSR_PREFIX)) {
        const offset = match.index!;
        const afterPackage = masked[offset + match[0].length];
        if (afterPackage === '@') continue;
        const line = lineNumber(masked, offset);
        const text = sourceLine(source, line);
        const markerIndex = text.indexOf(ALLOW_MARKER);
        if (markerIndex >= 0) {
          const reason = text.slice(markerIndex + ALLOW_MARKER.length).trim();
          if (reason) allowances.push({ path, line, reason });
          continue;
        }
        findings.push({
          path,
          line,
          specifier: displayedSpecifier(source, offset),
          message:
            'framework-emitted or executed jsr:@netscript/* specifier must include a version',
        });
      }
    }
  }

  return {
    scannedFiles,
    findings: findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
    allowances: allowances.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
  };
}

function printResult(result: SpecifierScanResult, pretty: boolean): void {
  if (!pretty) {
    console.log(JSON.stringify({ ok: result.findings.length === 0, ...result }));
    return;
  }
  for (const finding of result.findings) {
    console.error(
      `FAIL JSR-NETSCRIPT-VERSION ${finding.path}:${finding.line} ${finding.specifier} — ${finding.message}`,
    );
  }
  for (const allowance of result.allowances) {
    console.log(
      `ALLOW JSR-NETSCRIPT-VERSION ${allowance.path}:${allowance.line} — ${allowance.reason}`,
    );
  }
  console.log(
    `NetScript JSR emitted-specifier guard: scanned=${result.scannedFiles} ` +
      `allowances=${result.allowances.length} failures=${result.findings.length}`,
  );
}

if (import.meta.main) {
  const result = await scanNetscriptJsrSpecifiers();
  printResult(result, Deno.args.includes('--pretty'));
  if (result.findings.length > 0) Deno.exit(1);
}
