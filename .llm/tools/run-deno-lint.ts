/**
 * Scoped runner and JSON summarizer for `deno lint`.
 *
 * Use this when root `deno task lint` is too broad or noisy. The tool selects explicit files by
 * root, extension, and regex filters, runs `deno lint`, then emits a grouped JSON report.
 *
 * Examples:
 * - deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/logger --pretty
 * - deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/aspire --ext ts,tsx
 * - deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --input .llm/tmp/lint.log --pretty
 */

interface Options {
  input?: string;
  roots: string[];
  files: string[];
  extensions: Set<string>;
  include?: RegExp;
  exclude?: RegExp;
  cwd: string;
  batchSize: number;
  pretty: boolean;
}

interface LintOccurrence {
  rule: string;
  message: string;
  location?: {
    path: string;
    line: number;
    column: number;
  };
}

interface LintGroup {
  rule: string;
  message: string;
  count: number;
  paths: Array<{
    path: string;
    count: number;
    locations: Array<{ line: number; column: number }>;
  }>;
}

/**
 * A `deno lint` batch that exited non-zero **without** producing any parseable lint occurrence.
 *
 * This is the crash class (parse error, permission error, unsupported file, OOM) as opposed to the
 * ordinary "lint found problems" non-zero exit, which always carries occurrences. Before this was
 * modelled, such a batch propagated its exit code while its stderr was swallowed into the parser —
 * producing an exit-1 report with an empty `groups[]` and no diagnostics at all.
 */
interface BatchFailure {
  batchIndex: number;
  exitCode: number;
  fileCount: number;
  files: string[];
  stderr: string;
  stdout: string;
}

interface OutputReport {
  source: {
    mode: 'file' | 'command';
    input?: string;
    cwd?: string;
    exitCode?: number;
  };
  selection?: {
    filesSelected: number;
    batches: number;
  };
  summary: {
    totalOccurrences: number;
    uniqueOccurrences: number;
    uniqueRules: number;
    uniquePaths: number;
  };
  groups: LintGroup[];
  /** Batches that failed without lint occurrences. Present only when non-empty. */
  failures?: BatchFailure[];
}

const DEFAULT_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'mts']);
const SKIP_DIRS = new Set([
  '.git',
  '.deno',
  '.deploy',
  '.output',
  'node_modules',
  'vendor',
]);
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const RULE_HEADER = /^(?:error\[([^\]]+)\]:\s*(.+)|\(([^)]+)\)\s+(.+))$/;
const LOCATION_LINE = /^\s*(?:-->|at)\s+(?:file:\/\/)?(.+?):(\d+):(\d+)/;
const NO_TARGET_FILES_MESSAGE = 'No target files found.';

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts [options]',
    '',
    'Options:',
    '  --input <path>      Parse a saved lint log instead of running deno lint.',
    '  --root <path>       Directory or file to scan. Repeatable. Defaults to current directory.',
    '  --file <path>       Explicit file to include. Repeatable.',
    '  --ext <list>        Comma-separated extensions without dots. Repeatable.',
    '  --include <regex>   Include only matching normalized paths.',
    '  --exclude <regex>   Exclude matching normalized paths.',
    '  --cwd <path>        Working directory. Defaults to Deno.cwd().',
    '  --batch-size <n>    Files per deno lint invocation. Defaults to 200.',
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
  let input: string | undefined;
  let cwd = Deno.cwd();
  let batchSize = 200;
  let pretty = false;
  let sawExt = false;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--input':
        input = requireValue(args, index, arg);
        index++;
        break;
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
    input,
    roots: roots.length > 0 ? roots : files.length > 0 ? [] : ['.'],
    files,
    extensions,
    include,
    exclude,
    cwd,
    batchSize,
    pretty,
  };
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

export interface BatchResult {
  code: number;
  stdout: string;
  stderr: string;
}

export type BatchRunner = (files: string[], cwd: string) => Promise<BatchResult>;

const denoLintRunner: BatchRunner = async (files, cwd) => {
  const result = await new Deno.Command('deno', {
    args: ['lint', ...files],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  const decoder = new TextDecoder();
  return {
    code: result.code,
    stdout: decoder.decode(result.stdout),
    stderr: decoder.decode(result.stderr),
  };
};

export interface LintRunResult {
  text: string;
  exitCode: number;
  failures: BatchFailure[];
}

/**
 * Run `deno lint` over the selected files in batches.
 *
 * A batch that exits non-zero is only an ordinary lint failure when its own output parses into at
 * least one occurrence. A batch that exits non-zero with **no** parseable occurrence is a crash: its
 * exit code, stderr, and file set are captured as a {@link BatchFailure} so the caller can surface
 * them. Silently propagating that exit code with an empty report is the bug this models away.
 */
export async function runLint(
  files: string[],
  options: Pick<Options, 'cwd' | 'batchSize'>,
  runner: BatchRunner = denoLintRunner,
): Promise<LintRunResult> {
  let text = '';
  let exitCode = 0;
  const failures: BatchFailure[] = [];
  const batches = chunk(files, options.batchSize);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const result = await runner(batch, options.cwd);
    const output = result.stdout + result.stderr;
    text += output;

    if (result.code === 0) continue;
    if (output.includes(NO_TARGET_FILES_MESSAGE)) continue;

    exitCode = result.code;

    // A non-zero batch with no parseable occurrence is a crash, not a lint finding.
    if (parseOccurrences(output).length === 0) {
      failures.push({
        batchIndex,
        exitCode: result.code,
        fileCount: batch.length,
        files: batch,
        stderr: stripAnsi(result.stderr).trimEnd(),
        stdout: stripAnsi(result.stdout).trimEnd(),
      });
    }
  }

  return { text, exitCode, failures };
}

function stripAnsi(text: string): string {
  return text.replaceAll(ANSI_PATTERN, '');
}

function parseOccurrences(text: string): LintOccurrence[] {
  const lines = stripAnsi(text).split(/\r?\n/);
  const occurrences: LintOccurrence[] = [];

  for (let index = 0; index < lines.length; index++) {
    const header = lines[index].trim().match(RULE_HEADER);
    if (!header) continue;

    const rule = header[1] ?? header[3];
    const message = header[2] ?? header[4];
    let location: LintOccurrence['location'];

    for (let scan = index + 1; scan < lines.length; scan++) {
      const next = lines[scan];
      if (RULE_HEADER.test(next.trim())) break;
      const match = next.match(LOCATION_LINE);
      if (match) {
        location = {
          path: normalizePath(match[1]),
          line: Number(match[2]),
          column: Number(match[3]),
        };
        break;
      }
      if (next.startsWith('Found ') || next.startsWith('Checked ')) break;
    }

    occurrences.push({ rule, message, location });
  }

  return occurrences;
}

function dedupeOccurrences(occurrences: LintOccurrence[]): LintOccurrence[] {
  const seen = new Set<string>();
  const unique: LintOccurrence[] = [];

  for (const occurrence of occurrences) {
    const key = JSON.stringify(occurrence);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(occurrence);
  }

  return unique;
}

function groupOccurrences(occurrences: LintOccurrence[]): LintGroup[] {
  const groups = new Map<string, LintOccurrence[]>();
  for (const occurrence of occurrences) {
    const key = `${occurrence.rule}::${occurrence.message}`;
    groups.set(key, [...(groups.get(key) ?? []), occurrence]);
  }

  return [...groups.entries()].map(([key, items]): LintGroup => {
    const [rule, message] = key.split('::');
    const pathGroups = new Map<string, LintGroup['paths'][number]>();

    for (const item of items) {
      const path = item.location?.path ?? '(unknown)';
      const current = pathGroups.get(path) ?? { path, count: 0, locations: [] };
      current.count += 1;
      if (item.location) {
        current.locations.push({ line: item.location.line, column: item.location.column });
      }
      pathGroups.set(path, current);
    }

    return {
      rule,
      message,
      count: items.length,
      paths: [...pathGroups.values()].sort((left, right) => left.path.localeCompare(right.path)),
    };
  }).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    if (left.rule !== right.rule) return left.rule.localeCompare(right.rule);
    return left.message.localeCompare(right.message);
  });
}

/**
 * Render batch crashes for the human/CI log.
 *
 * The JSON report goes to stdout and is machine-consumed; this goes to stderr so a failing CI job
 * shows the underlying error instead of an empty `groups[]`.
 */
export function formatFailures(failures: BatchFailure[]): string {
  const lines: string[] = [
    `${failures.length} deno lint batch(es) failed without producing lint occurrences.`,
    'This is a tooling/parse/permission failure, not a lint finding.',
  ];

  for (const failure of failures) {
    lines.push(
      '',
      `--- batch ${failure.batchIndex} — exit ${failure.exitCode} — ${failure.fileCount} file(s)`,
    );
    const sample = failure.files.slice(0, 10);
    lines.push(`files: ${sample.join(', ')}${failure.files.length > sample.length ? ', …' : ''}`);
    if (failure.stderr) lines.push('stderr:', failure.stderr);
    if (failure.stdout) lines.push('stdout:', failure.stdout);
  }

  return lines.join('\n');
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) return;
  options.cwd = await Deno.realPath(options.cwd).catch(() =>
    resolveFromCwd(Deno.cwd(), options.cwd)
  );

  let text: string;
  let exitCode: number | undefined;
  let files: string[] | undefined;
  let batches: number | undefined;
  let failures: BatchFailure[] = [];

  if (options.input) {
    text = await Deno.readTextFile(options.input);
  } else {
    files = await collectFiles(options);
    batches = chunk(files, options.batchSize).length;
    const result = await runLint(files, options);
    text = result.text;
    exitCode = result.exitCode;
    failures = result.failures;
  }

  const occurrences = parseOccurrences(text);
  const uniqueOccurrences = dedupeOccurrences(occurrences);
  const groups = groupOccurrences(uniqueOccurrences);
  const uniquePaths = new Set(
    uniqueOccurrences.flatMap((occurrence) =>
      occurrence.location?.path ? [occurrence.location.path] : []
    ),
  );

  const report: OutputReport = {
    source: {
      mode: options.input ? 'file' : 'command',
      input: options.input,
      cwd: options.input ? undefined : options.cwd,
      exitCode,
    },
    selection: files
      ? {
        filesSelected: files.length,
        batches: batches ?? 0,
      }
      : undefined,
    summary: {
      totalOccurrences: occurrences.length,
      uniqueOccurrences: uniqueOccurrences.length,
      uniqueRules: new Set(uniqueOccurrences.map((occurrence) => occurrence.rule)).size,
      uniquePaths: uniquePaths.size,
    },
    groups,
    failures: failures.length > 0 ? failures : undefined,
  };

  console.log(JSON.stringify(report, null, options.pretty ? 2 : undefined));

  if (failures.length > 0) console.error(formatFailures(failures));

  // Invariant: a non-zero exit must never be silent. If a batch failed but we captured neither an
  // occurrence nor a failure record, say so loudly rather than exiting 1 with an empty report.
  if (exitCode && exitCode !== 0 && groups.length === 0 && failures.length === 0) {
    console.error(
      `deno lint exited ${exitCode} but produced no lint occurrences and no captured batch error. ` +
        'Re-run with --batch-size 1 to isolate the offending file.',
    );
  }

  if (exitCode && exitCode !== 0) Deno.exit(exitCode);
}

if (import.meta.main) await main();
