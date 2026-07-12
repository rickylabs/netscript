/**
 * Scoped runner for `deno fmt`.
 *
 * Use this instead of root `deno task fmt` when validation must stay inside a package, run
 * artifact, or file-type subset. The default mode is non-mutating `--check`.
 *
 * Examples:
 * - deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/logger --ext md
 * - deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file AGENTS.md --pretty
 * - deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/aspire --ext ts,json --write
 */

interface Options {
  roots: string[];
  files: string[];
  extensions: Set<string>;
  include?: RegExp;
  exclude?: RegExp;
  cwd: string;
  check: boolean;
  ignoreLineEndings: boolean;
  showIgnored: boolean;
  batchSize: number;
  pretty: boolean;
}

interface FormatFinding {
  path: string;
  reason: string;
}

export interface BatchResult {
  files: string[];
  exitCode: number;
  output: string;
}

interface OutputReport {
  command: string;
  cwd: string;
  mode: 'check' | 'write';
  summary: {
    filesSelected: number;
    batches: number;
    failedBatches: number;
    findings: number;
    ignoredFindings: number;
  };
  findings: FormatFinding[];
  ignoredFindings?: FormatFinding[];
}

const DEFAULT_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'mts', 'json', 'jsonc', 'md']);
const SKIP_DIRS = new Set([
  '.git',
  '.deno',
  '.deploy',
  '.output',
  'node_modules',
  'vendor',
]);
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const NO_TARGET_FILES_MESSAGE = 'No target files found.';

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts [options]',
    '',
    'Options:',
    '  --root <path>       Directory or file to scan. Repeatable. Defaults to current directory.',
    '  --file <path>       Explicit file to include. Repeatable.',
    '  --ext <list>        Comma-separated extensions without dots. Repeatable.',
    '  --include <regex>   Include only matching normalized paths.',
    '  --exclude <regex>   Exclude matching normalized paths.',
    '  --cwd <path>        Working directory. Defaults to Deno.cwd().',
    '  --batch-size <n>    Files per deno fmt invocation. Defaults to 200.',
    '  --write             Run mutating deno fmt instead of non-mutating deno fmt --check.',
    '  --ignore-line-endings',
    '                      Treat line-ending-only check findings as baseline drift.',
    '  --show-ignored      Include ignored findings in JSON output.',
    '  --pretty           Pretty-print JSON output.',
    '  --help             Show this help.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseExtensions(value: string): string[] {
  return value.split(',')
    .map((part) => part.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
}

function parseArgs(args: string[]): Options | null {
  const roots: string[] = [];
  const files: string[] = [];
  let extensions = new Set(DEFAULT_EXTENSIONS);
  let include: RegExp | undefined;
  let exclude: RegExp | undefined;
  let cwd = Deno.cwd();
  let check = true;
  let ignoreLineEndings = false;
  let showIgnored = false;
  let batchSize = 200;
  let pretty = false;
  let sawExt = false;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--root':
        roots.push(requireValue(args, index, arg));
        index++;
        break;
      case '--file':
        files.push(requireValue(args, index, arg));
        index++;
        break;
      case '--ext':
        if (!sawExt) {
          extensions = new Set();
          sawExt = true;
        }
        for (const extension of parseExtensions(requireValue(args, index, arg))) {
          extensions.add(extension);
        }
        index++;
        break;
      case '--include':
        include = new RegExp(requireValue(args, index, arg));
        index++;
        break;
      case '--exclude':
        exclude = new RegExp(requireValue(args, index, arg));
        index++;
        break;
      case '--cwd':
        cwd = requireValue(args, index, arg);
        index++;
        break;
      case '--batch-size':
        batchSize = Number(requireValue(args, index, arg));
        if (!Number.isInteger(batchSize) || batchSize < 1) {
          throw new Error('--batch-size must be a positive integer');
        }
        index++;
        break;
      case '--write':
        check = false;
        break;
      case '--ignore-line-endings':
        ignoreLineEndings = true;
        break;
      case '--show-ignored':
        showIgnored = true;
        break;
      case '--pretty':
        pretty = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return {
    roots: roots.length > 0 ? roots : files.length > 0 ? [] : ['.'],
    files,
    extensions,
    include,
    exclude,
    cwd,
    check,
    ignoreLineEndings,
    showIgnored,
    batchSize,
    pretty,
  };
}

function isLineEndingFinding(finding: FormatFinding): boolean {
  return finding.reason === 'Text differed by line endings.';
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function hasWindowsDrivePrefix(path: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(path);
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || path.startsWith('\\\\') || hasWindowsDrivePrefix(path);
}

function resolveFromCwd(cwd: string, path: string): string {
  if (isAbsolutePath(path)) return path;
  return normalizePath(`${cwd.replace(/[/\\]+$/, '')}/${path.replace(/^[/\\]+/, '')}`);
}

function relativePath(cwd: string, path: string): string {
  const normalizedCwd = normalizePath(cwd).replace(/\/+$/, '');
  const normalizedPath = normalizePath(path);
  if (normalizedPath === normalizedCwd) return '';
  return normalizedPath.startsWith(`${normalizedCwd}/`)
    ? normalizedPath.slice(normalizedCwd.length + 1)
    : normalizedPath;
}

function hasSelectedExtension(path: string, extensions: Set<string>): boolean {
  const name = path.split(/[\\/]/).pop() ?? path;
  const dot = name.lastIndexOf('.');
  if (dot < 0) return false;
  return extensions.has(name.slice(dot + 1).toLowerCase());
}

function matchesFilters(path: string, options: Options): boolean {
  const normalized = normalizePath(path);
  if (!hasSelectedExtension(normalized, options.extensions)) return false;
  if (options.include && !options.include.test(normalized)) return false;
  if (options.exclude && options.exclude.test(normalized)) return false;
  return true;
}

async function collectRoot(root: string, options: Options, output: Set<string>): Promise<void> {
  const target = resolveFromCwd(options.cwd, root);
  const absolute = await Deno.realPath(target).catch(() => target);
  const info = await Deno.stat(absolute);

  if (info.isFile) {
    const relative = relativePath(options.cwd, absolute);
    if (matchesFilters(relative, options)) output.add(relative);
    return;
  }

  if (!info.isDirectory) return;

  for await (const entry of Deno.readDir(absolute)) {
    if (entry.isDirectory && SKIP_DIRS.has(entry.name)) continue;
    const child = `${absolute}/${entry.name}`;
    if (entry.isDirectory) {
      await collectRoot(child, options, output);
    } else if (entry.isFile) {
      const relative = relativePath(options.cwd, child);
      if (matchesFilters(relative, options)) output.add(relative);
    }
  }
}

async function collectFiles(options: Options): Promise<string[]> {
  const output = new Set<string>();

  for (const root of options.roots) {
    await collectRoot(root, options, output);
  }

  for (const file of options.files) {
    const target = resolveFromCwd(options.cwd, file);
    const relative = relativePath(options.cwd, await Deno.realPath(target).catch(() => target));
    if (matchesFilters(relative, options)) output.add(relative);
  }

  return [...output].sort((left, right) => left.localeCompare(right));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function runBatch(files: string[], options: Options): Promise<BatchResult> {
  const args = ['fmt', ...(options.check ? ['--check'] : []), ...files];
  const result = await new Deno.Command('deno', {
    args,
    cwd: options.cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  return {
    files,
    exitCode: result.code,
    output: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  };
}

function parseFindings(results: BatchResult[]): FormatFinding[] {
  const findings: FormatFinding[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const clean = result.output.replaceAll(ANSI_PATTERN, '');
    const lines = clean.split(/\r?\n/);
    let currentPath: string | undefined;

    for (const line of lines) {
      const fromMatch = line.match(/^from\s+(.+):$/);
      if (fromMatch) {
        currentPath = normalizePath(fromMatch[1]);
        continue;
      }

      if (currentPath && line.includes('|')) {
        const reason = line.slice(line.indexOf('|') + 1).trim();
        if (reason) {
          const key = `${currentPath}::${reason}`;
          if (!seen.has(key)) {
            findings.push({ path: currentPath, reason });
            seen.add(key);
          }
          currentPath = undefined;
        }
      }
    }
  }

  return findings.sort((left, right) => left.path.localeCompare(right.path));
}

function isNoTargetFilesResult(result: BatchResult): boolean {
  return result.exitCode !== 0 && result.output.includes(NO_TARGET_FILES_MESSAGE);
}

/**
 * Identify the batches that CRASHED, judged per batch.
 *
 * A batch is a crash when it exits non-zero and **its own output** yields no parseable formatting
 * finding — a config parse error, a permission error, a file `deno fmt` cannot handle. It is an
 * ordinary formatting difference when its own output does parse into findings.
 *
 * This must be decided per batch, never across the run. Judging globally (`some batch failed` AND
 * `no findings anywhere`) lets a crashed batch hide behind an unrelated batch's formatting finding —
 * and, when the only findings are ignored via `--ignore-line-endings`, lets the run exit 0 with a
 * crashed batch. Both are false greens on a repository gate.
 */
export function crashedBatches(results: readonly BatchResult[]): BatchResult[] {
  return results.filter((result) =>
    result.exitCode !== 0 &&
    !isNoTargetFilesResult(result) &&
    parseFindings([result]).length === 0
  );
}

/**
 * Render crashed batches for the human/CI log.
 *
 * The JSON report is machine-consumed on stdout; this goes to stderr so a failing CI job shows the
 * underlying error instead of `findings: 0` and a bare exit code.
 */
export function formatFailedBatches(results: readonly BatchResult[]): string {
  const failed = crashedBatches(results);

  const lines: string[] = [
    `${failed.length} deno fmt batch(es) failed without producing formatting findings.`,
    'This is a tooling/parse/permission failure, not a formatting difference.',
  ];

  for (const [index, result] of failed.entries()) {
    lines.push(
      '',
      `--- batch ${index} — exit ${result.exitCode} — ${result.files.length} file(s)`,
    );
    const sample = result.files.slice(0, 10);
    lines.push(`files: ${sample.join(', ')}${result.files.length > sample.length ? ', …' : ''}`);
    const output = result.output.replaceAll(ANSI_PATTERN, '').trimEnd();
    if (output) lines.push('output:', output);
  }

  return lines.join('\n');
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) return;
  options.cwd = await Deno.realPath(options.cwd).catch(() =>
    resolveFromCwd(Deno.cwd(), options.cwd)
  );

  const files = await collectFiles(options);
  const batches = chunk(files, options.batchSize);
  const results: BatchResult[] = [];

  for (const batch of batches) {
    if (batch.length === 0) continue;
    results.push(await runBatch(batch, options));
  }

  const allFindings = parseFindings(results);
  const ignoredFindings = options.ignoreLineEndings ? allFindings.filter(isLineEndingFinding) : [];
  const findings = options.ignoreLineEndings
    ? allFindings.filter((finding) => !isLineEndingFinding(finding))
    : allFindings;
  const failedBatches =
    results.filter((result) => result.exitCode !== 0 && !isNoTargetFilesResult(result)).length;
  // Crashes are judged PER BATCH. A batch that failed with no parseable finding of its own is a
  // crash even if some other batch produced findings, and even if the only findings in the run are
  // line-ending ones we ignore. Judging this globally is a false-green (see crashedBatches).
  const crashed = crashedBatches(results);
  const effectiveFailedBatches = findings.length > 0 || crashed.length > 0 ? failedBatches : 0;
  const report: OutputReport = {
    command: `deno fmt${options.check ? ' --check' : ''}`,
    cwd: options.cwd,
    mode: options.check ? 'check' : 'write',
    summary: {
      filesSelected: files.length,
      batches: batches.length,
      failedBatches: effectiveFailedBatches,
      findings: findings.length,
      ignoredFindings: ignoredFindings.length,
    },
    findings,
  };

  if (options.showIgnored) {
    report.ignoredFindings = ignoredFindings;
  }

  console.log(JSON.stringify(report, null, options.pretty ? 2 : undefined));

  // A batch that failed without any parseable finding of its own is a crash. Never let it exit
  // silently, and never let it pass just because another batch had findings.
  if (crashed.length > 0) console.error(formatFailedBatches(results));

  if (findings.length > 0 || crashed.length > 0) Deno.exit(1);
}

if (import.meta.main) await main();
