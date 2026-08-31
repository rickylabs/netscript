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
  output?: string;
  roots: string[];
  files: string[];
  extensions: Set<string>;
  include?: RegExp;
  exclude?: RegExp;
  config?: string;
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

export type CoverageRefusalCause =
  | 'empty-selection'
  | 'all-excluded'
  | 'partial-exclusion'
  | 'processed-count-unavailable'
  | 'processed-count-inconsistent';

export interface CoverageRefusal {
  cause: CoverageRefusalCause;
  filesSelected: number;
  filesProcessed?: number;
  droppedFiles: string[];
  unverifiedFiles?: string[];
}

export interface CoverageReport {
  filesSelected: number;
  filesProcessed?: number;
  droppedFiles: string[];
  refusals: CoverageRefusal[];
}

export interface BatchResult {
  files: string[];
  config?: string;
  exitCode: number;
  output: string;
}

export interface ConfigBatch {
  files: string[];
  config?: string;
}

export interface FmtRunnerOptions {
  cwd: string;
  check: boolean;
}

export interface FmtRunOptions extends FmtRunnerOptions {
  batchSize: number;
  config?: string;
}

export type BatchRunner = (
  batch: ConfigBatch,
  options: FmtRunnerOptions,
) => Promise<BatchResult>;

export type NearestConfigCache = Map<string, string | null>;

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
  coverage: CoverageReport;
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
const FMT_CHECKED_LINE = /^Checked (\d+) files?$/;
const FMT_CHECK_FINDING_LINE = /^error: Found (\d+) not formatted files? in (\d+) files?$/;
const FMT_WRITE_CRASH_LINE = /^error: Failed to format (\d+) of (\d+) checked files?$/;
const NO_TARGET_FILES_MESSAGE = 'No target files found.';
const IGNORE_MARKER = '.deno-fmt-lint-ignore';
const DENO_CONFIG_NAMES = ['deno.json', 'deno.jsonc'] as const;

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts [options]',
    '',
    'Options:',
    '  --output <path>     Atomically write the full JSON report to this path.',
    '  --root <path>       Directory or file to scan. Repeatable. Defaults to current directory.',
    '  --file <path>       Explicit file to include. Repeatable.',
    '  --ext <list>        Comma-separated extensions without dots. Repeatable.',
    '  --include <regex>   Include only matching normalized paths.',
    '  --exclude <regex>   Exclude matching normalized paths.',
    '  --config <path>     Pass an explicit deno.json/jsonc to every fmt batch.',
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
  let output: string | undefined;
  let extensions = new Set(DEFAULT_EXTENSIONS);
  let include: RegExp | undefined;
  let exclude: RegExp | undefined;
  let config: string | undefined;
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
      case '--output':
        output = requireValue(args, index, arg);
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
      case '--config':
        config = requireValue(args, index, arg);
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
    output,
    roots: roots.length > 0 ? roots : files.length > 0 ? [] : ['.'],
    files,
    extensions,
    include,
    exclude,
    config,
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

async function writeAtomic(path: string, text: string): Promise<void> {
  const normalized = normalizePath(path);
  const separator = normalized.lastIndexOf('/');
  const directory = separator < 0 ? '.' : normalized.slice(0, separator) || '/';
  await Deno.mkdir(directory, { recursive: true });
  const temp = `${normalized}.${crypto.randomUUID()}.tmp`;
  try {
    await Deno.writeTextFile(temp, text, { createNew: true });
    await Deno.rename(temp, normalized);
  } finally {
    await Deno.remove(temp).catch(() => undefined);
  }
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

function joinPath(directory: string, name: string): string {
  return `${directory.replace(/[/\\]+$/, '')}/${name}`;
}

function directoryName(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';
  if (/^[A-Za-z]:\/?$/.test(normalized)) return `${normalized.slice(0, 2)}/`;

  const trimmed = normalized.replace(/\/+$/, '');
  const separator = trimmed.lastIndexOf('/');
  if (separator < 0) return '.';
  if (separator === 0) return '/';

  const parent = trimmed.slice(0, separator);
  return /^[A-Za-z]:$/.test(parent) ? `${parent}/` : parent;
}

async function isFile(path: string): Promise<boolean> {
  return await Deno.stat(path).then((info) => info.isFile).catch(() => false);
}

async function isInsideMarkedSubtree(path: string): Promise<boolean> {
  let directory = directoryName(path);

  while (true) {
    if (await isFile(joinPath(directory, IGNORE_MARKER))) return true;
    const parent = directoryName(directory);
    if (parent === directory) return false;
    directory = parent;
  }
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
    if (matchesFilters(relative, options) && !await isInsideMarkedSubtree(absolute)) {
      output.add(relative);
    }
    return;
  }

  if (!info.isDirectory) return;
  if (await isFile(joinPath(absolute, IGNORE_MARKER))) return;

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
    const absolute = await Deno.realPath(target).catch(() => target);
    const relative = relativePath(options.cwd, absolute);
    if (matchesFilters(relative, options) && !await isInsideMarkedSubtree(absolute)) {
      output.add(relative);
    }
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

async function nearestConfig(
  file: string,
  cwd: string,
  cache?: NearestConfigCache,
): Promise<string | undefined> {
  let directory = directoryName(resolveFromCwd(cwd, file));
  const visited: string[] = [];

  while (true) {
    if (cache?.has(directory)) {
      const cached = cache.get(directory) ?? undefined;
      for (const visitedDirectory of visited) cache.set(visitedDirectory, cached ?? null);
      return cached;
    }

    visited.push(directory);
    for (const name of DENO_CONFIG_NAMES) {
      const candidate = joinPath(directory, name);
      if (await isFile(candidate)) {
        for (const visitedDirectory of visited) cache?.set(visitedDirectory, candidate);
        return candidate;
      }
    }

    const parent = directoryName(directory);
    if (parent === directory) {
      for (const visitedDirectory of visited) cache?.set(visitedDirectory, null);
      return undefined;
    }
    directory = parent;
  }
}

/** Group files by effective nearest Deno config, then preserve that grouping while batching. */
export async function buildConfigBatches(
  files: string[],
  cwd: string,
  batchSize: number,
  explicitConfig?: string,
  cache?: NearestConfigCache,
): Promise<ConfigBatch[]> {
  const groups = new Map<string, ConfigBatch>();

  for (const file of files) {
    const config = explicitConfig
      ? resolveFromCwd(cwd, explicitConfig)
      : await nearestConfig(file, cwd, cache);
    const key = config ?? '';
    const group = groups.get(key) ?? { files: [], config };
    group.files.push(file);
    groups.set(key, group);
  }

  return [...groups.values()].flatMap((group) =>
    chunk(group.files, batchSize).map((files) => ({ files, config: group.config }))
  );
}

const denoFmtRunner: BatchRunner = async (batch, options) => {
  const args = [
    'fmt',
    ...(options.check ? ['--check'] : []),
    ...(batch.config ? ['--config', batch.config] : []),
    ...batch.files,
  ];
  const result = await new Deno.Command('deno', {
    args,
    cwd: options.cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  return {
    files: batch.files,
    config: batch.config,
    exitCode: result.code,
    output: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  };
};

type CompletionEvidence =
  | { processedCount: number }
  | { cause: 'processed-count-unavailable' | 'processed-count-inconsistent' };

function stripAnsi(text: string): string {
  return text.replaceAll(ANSI_PATTERN, '');
}

/** Parse a mode-specific terminal fmt completion summary into its processed-file count. */
export function parseFmtCompletion(
  text: string,
  mode: 'check' | 'write',
): CompletionEvidence {
  const lines = stripAnsi(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const matches: Array<{ line: string; processedCount: number; valid: boolean }> = [];

  for (const line of lines) {
    const checked = line.match(FMT_CHECKED_LINE);
    if (checked) {
      matches.push({ line, processedCount: Number(checked[1]), valid: true });
      continue;
    }

    const checkFinding = mode === 'check' ? line.match(FMT_CHECK_FINDING_LINE) : null;
    if (checkFinding) {
      const findings = Number(checkFinding[1]);
      const processed = Number(checkFinding[2]);
      matches.push({ line, processedCount: processed, valid: findings <= processed });
      continue;
    }

    const writeCrash = mode === 'write' ? line.match(FMT_WRITE_CRASH_LINE) : null;
    if (writeCrash) {
      const failures = Number(writeCrash[1]);
      const processed = Number(writeCrash[2]);
      matches.push({ line, processedCount: processed, valid: failures <= processed });
    }
  }

  const summaryLike = lines.filter((line) =>
    line.startsWith('Checked') || line.startsWith('error: Found') ||
    line.startsWith('error: Failed to format')
  );

  if (matches.length === 0) return { cause: 'processed-count-unavailable' };
  if (
    matches.length !== 1 || summaryLike.length !== 1 || !matches[0].valid ||
    lines.at(-1) !== matches[0].line
  ) {
    return { cause: 'processed-count-inconsistent' };
  }

  return { processedCount: matches[0].processedCount };
}

function sortedPaths(paths: Iterable<string>): string[] {
  return [...new Set([...paths].map(normalizePath))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function makeCoverageRefusal(
  cause: CoverageRefusalCause,
  filesSelected: number,
  droppedFiles: string[],
  filesProcessed?: number,
  unverifiedFiles: string[] = [],
): CoverageRefusal {
  return {
    cause,
    filesSelected,
    ...(filesProcessed === undefined ? {} : { filesProcessed }),
    droppedFiles,
    ...(unverifiedFiles.length > 0 ? { unverifiedFiles } : {}),
  };
}

export interface FmtRunResult {
  results: BatchResult[];
  batches: number;
  noTargetBatches: number;
  coverage: CoverageReport;
}

/** Run mode-aware fmt batches and prove selected-versus-processed identity. */
export async function runFmt(
  files: string[],
  options: FmtRunOptions,
  runner: BatchRunner = denoFmtRunner,
): Promise<FmtRunResult> {
  const batches = await buildConfigBatches(
    files,
    options.cwd,
    options.batchSize,
    options.config,
    new Map(),
  );
  const results: BatchResult[] = [];
  const droppedFiles = new Set<string>();
  const unverifiedFiles = new Set<string>();
  let noTargetBatches = 0;
  let processedCount = 0;
  let evidenceCause:
    | 'processed-count-unavailable'
    | 'processed-count-inconsistent'
    | undefined;

  const recordEvidenceCause = (
    cause: 'processed-count-unavailable' | 'processed-count-inconsistent',
  ): void => {
    if (cause === 'processed-count-inconsistent' || !evidenceCause) evidenceCause = cause;
  };

  for (const batch of batches) {
    if (batch.files.length === 0) continue;
    const original = await runner(batch, { cwd: options.cwd, check: options.check });
    const result: BatchResult = {
      ...original,
      files: batch.files,
      config: batch.config,
    };
    results.push(result);

    if (isNoTargetFilesResult(result)) {
      noTargetBatches++;
      for (const file of batch.files) droppedFiles.add(normalizePath(file));
      continue;
    }

    const mode = options.check ? 'check' : 'write';
    const completion = parseFmtCompletion(result.output, mode);
    if ('cause' in completion) {
      recordEvidenceCause(completion.cause);
      for (const file of batch.files) unverifiedFiles.add(normalizePath(file));
    } else if (completion.processedCount > batch.files.length) {
      recordEvidenceCause('processed-count-inconsistent');
      for (const file of batch.files) unverifiedFiles.add(normalizePath(file));
    } else if (completion.processedCount === batch.files.length) {
      processedCount += completion.processedCount;
    } else {
      let probedProcessed = 0;
      const probeUnverified = new Set<string>();

      for (const file of batch.files) {
        const probe = await runner(
          { files: [file], config: batch.config },
          { cwd: options.cwd, check: true },
        );
        if (isNoTargetFilesResult(probe)) {
          droppedFiles.add(normalizePath(file));
          continue;
        }

        const probeCompletion = parseFmtCompletion(probe.output, 'check');
        if ('processedCount' in probeCompletion && probeCompletion.processedCount === 1) {
          probedProcessed++;
        } else {
          probeUnverified.add(normalizePath(file));
        }
      }

      if (probeUnverified.size === 0 && probedProcessed === completion.processedCount) {
        processedCount += completion.processedCount;
      } else {
        recordEvidenceCause('processed-count-inconsistent');
        for (const file of batch.files) {
          if (!droppedFiles.has(normalizePath(file))) {
            unverifiedFiles.add(normalizePath(file));
          }
        }
      }
    }
  }

  const normalizedDropped = sortedPaths(droppedFiles);
  const normalizedUnverified = sortedPaths(unverifiedFiles);
  let coverage: CoverageReport;

  if (files.length === 0) {
    coverage = {
      filesSelected: 0,
      filesProcessed: 0,
      droppedFiles: [],
      refusals: [makeCoverageRefusal('empty-selection', 0, [], 0)],
    };
  } else if (evidenceCause) {
    coverage = {
      filesSelected: files.length,
      droppedFiles: normalizedDropped,
      refusals: [
        makeCoverageRefusal(
          evidenceCause,
          files.length,
          normalizedDropped,
          undefined,
          normalizedUnverified,
        ),
      ],
    };
  } else if (processedCount + normalizedDropped.length !== files.length) {
    const candidates = sortedPaths(
      files.filter((file) => !droppedFiles.has(normalizePath(file))),
    );
    coverage = {
      filesSelected: files.length,
      droppedFiles: normalizedDropped,
      refusals: [
        makeCoverageRefusal(
          'processed-count-inconsistent',
          files.length,
          normalizedDropped,
          undefined,
          candidates,
        ),
      ],
    };
  } else if (processedCount === 0) {
    coverage = {
      filesSelected: files.length,
      filesProcessed: 0,
      droppedFiles: normalizedDropped,
      refusals: [makeCoverageRefusal('all-excluded', files.length, normalizedDropped, 0)],
    };
  } else if (normalizedDropped.length > 0) {
    coverage = {
      filesSelected: files.length,
      filesProcessed: processedCount,
      droppedFiles: normalizedDropped,
      refusals: [
        makeCoverageRefusal(
          'partial-exclusion',
          files.length,
          normalizedDropped,
          processedCount,
        ),
      ],
    };
  } else {
    coverage = {
      filesSelected: files.length,
      filesProcessed: processedCount,
      droppedFiles: [],
      refusals: [],
    };
  }

  return { results, batches: batches.length, noTargetBatches, coverage };
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
  const run = await runFmt(files, options);
  const results = run.results;

  const allFindings = parseFindings(results);
  const ignoredFindings = options.ignoreLineEndings ? allFindings.filter(isLineEndingFinding) : [];
  const findings = options.ignoreLineEndings
    ? allFindings.filter((finding) => !isLineEndingFinding(finding))
    : allFindings;
  const failedBatches =
    results.filter((result) => result.exitCode !== 0 && !isNoTargetFilesResult(result)).length;
  const noTargetBatches = run.noTargetBatches;
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
      batches: run.batches,
      failedBatches: effectiveFailedBatches + noTargetBatches,
      findings: findings.length,
      ignoredFindings: ignoredFindings.length,
    },
    coverage: run.coverage,
    findings,
  };

  if (options.showIgnored) {
    report.ignoredFindings = ignoredFindings;
  }

  const json = `${JSON.stringify(report, null, options.pretty ? 2 : undefined)}\n`;
  if (options.output) {
    await writeAtomic(options.output, json);
    console.log(JSON.stringify({ report: options.output, summary: report.summary }));
  } else {
    await Deno.stdout.write(new TextEncoder().encode(json));
  }

  // A batch that failed without any parseable finding of its own is a crash. Never let it exit
  // silently, and never let it pass just because another batch had findings.
  if (crashed.length > 0) console.error(formatFailedBatches(results));

  if (run.coverage.refusals.length > 0) {
    const [refusal] = run.coverage.refusals;
    const dropped = refusal.droppedFiles.length > 0
      ? ` Dropped: ${refusal.droppedFiles.join(', ')}.`
      : '';
    console.error(`deno fmt coverage refusal: ${refusal.cause}.${dropped}`);
    Deno.exit(2);
  }

  if (findings.length > 0 || crashed.length > 0) Deno.exit(1);
}

if (import.meta.main) await main();
