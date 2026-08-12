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
const EMPTY_TAINT: Set<string> = new Set();

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
    const child = resolve(path, entry.name);
    if (entry.isDirectory) files.push(...await collect(child));
    else if (entry.isFile && isScannable(child)) files.push(child);
  }
  return files;
}

/** A reasoned `// quality-allow:` suppression the scanner honored. */
export interface QualityAllowance {
  readonly file: string;
  readonly line: number;
  readonly reason: string;
  readonly fenceOrdinal?: number;
}

/** Full scan result: real findings plus every honored allowance (for audit). */
export interface QualityScan {
  readonly findings: QualityFinding[];
  readonly allowances: QualityAllowance[];
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
): Promise<QualityScan> {
  const files = (await Promise.all(paths.map((path) => collect(resolve(cwd, path))))).flat();
  const findings: QualityFinding[] = [];
  const allowances: QualityAllowance[] = [];
  for (const file of files) {
    for (const unit of await scanUnits(file, cwd)) {
      const normalized = unit.sourcePath.replaceAll('\\', '/');
      const tainted = normalized.includes('/features/plugins/')
        ? collectPluginNameIdents(unit.lines)
        : EMPTY_TAINT;
      for (let index = 0; index < unit.lines.length; index++) {
        const line = unit.lines[index];
        const allowance = line.match(/\/\/\s*quality-allow:\s*(.+)$/);
        if (allowance?.[1].trim()) {
          // A quality-allow only suppresses a line that would otherwise fire a
          // rule — an allowance on a clean line is dead weight, not counted.
          if (ruleFor(line.replace(/\/\/\s*quality-allow:.*$/, ''), normalized, tainted)) {
            allowances.push({
              file: unit.sourcePath,
              line: unit.lineOffset + index + 1,
              reason: allowance[1].trim(),
              ...(unit.fenceOrdinal === undefined ? {} : { fenceOrdinal: unit.fenceOrdinal }),
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
  return { findings, allowances };
}

/** Scan selected source paths for code-quality violations. */
export async function scanCodeQuality(
  paths: readonly string[],
  cwd: string = Deno.cwd(),
): Promise<QualityFinding[]> {
  return (await scanCodeQualityDetailed(paths, cwd)).findings;
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
  const { findings, allowances } = await scanCodeQualityDetailed(scanned);
  const allowExceeded = maxAllow !== undefined && Number.isFinite(maxAllow) &&
    allowances.length > maxAllow;
  const result = {
    ok: findings.length === 0 && !allowExceeded,
    mode,
    scanned,
    findings,
    allowCount: allowances.length,
    allowances,
    ...(allowExceeded ? { allowLimitExceeded: { limit: maxAllow, count: allowances.length } } : {}),
  };
  console.log(JSON.stringify(result, null, pretty ? 2 : undefined));
  if (!result.ok) Deno.exit(1);
}
