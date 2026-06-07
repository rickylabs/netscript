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
  batchSize: number;
  pretty: boolean;
}

interface FormatFinding {
  path: string;
  reason: string;
}

interface BatchResult {
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
  };
  findings: FormatFinding[];
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
    batchSize,
    pretty,
  };
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || path.startsWith('\\\\') || /^[A-Za-z]:[\\/]/.test(path);
}

function resolveFromCwd(cwd: string, path: string): string {
  if (isAbsolutePath(path)) return path;
  return `${cwd.replace(/[/\\]+$/, '')}/${path}`;
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

  const findings = parseFindings(results);
  const failedBatches = results.filter((result) => result.exitCode !== 0).length;
  const report: OutputReport = {
    command: `deno fmt${options.check ? ' --check' : ''}`,
    cwd: options.cwd,
    mode: options.check ? 'check' : 'write',
    summary: {
      filesSelected: files.length,
      batches: batches.length,
      failedBatches,
      findings: findings.length,
    },
    findings,
  };

  console.log(JSON.stringify(report, null, options.pretty ? 2 : undefined));

  if (failedBatches > 0) Deno.exit(1);
}

await main();
