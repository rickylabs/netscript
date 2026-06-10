/**
 * Scoped runner and JSON summarizer for `deno check`.
 *
 * Use this when root `deno check .` or broad package directories include generated output,
 * scratch workspaces, or future-wave packages. The tool selects explicit files by root,
 * extension, and regex filters, runs `deno check`, then emits a compact JSON report.
 *
 * Examples:
 * - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/logger
 * - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(service|sdk|fresh|fresh-ui)|.*(?:^|/)\\.generated/)"
 * - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/plugin-triggers-core/mod.ts --deno-arg --doc
 */

interface Options {
  input?: string;
  stdin: boolean;
  command?: string[];
  roots: string[];
  files: string[];
  extensions: Set<string>;
  include?: RegExp;
  exclude?: RegExp;
  cwd: string;
  batchSize: number;
  pretty: boolean;
  unstableKv: boolean;
  denoArgs: string[];
}

interface CheckOccurrence {
  code: string;
  message: string;
  location?: {
    path: string;
    line: number;
    column: number;
  };
}

interface CheckGroup {
  code: string;
  message: string;
  count: number;
  paths: Array<{
    path: string;
    count: number;
    locations: Array<{ line: number; column: number }>;
  }>;
}

interface BatchResult {
  files: string[];
  exitCode: number;
  output: string;
}

interface OutputReport {
  source: {
    mode: 'file' | 'stdin' | 'command' | 'selection';
    input?: string;
    command?: string[];
    cwd?: string;
    exitCode?: number;
  };
  command?: string;
  selection?: {
    filesSelected: number;
    batches: number;
    failedBatches: number;
  };
  summary: {
    totalOccurrences: number;
    uniqueOccurrences: number;
    uniqueCodes: number;
    uniquePaths: number;
  };
  groups: CheckGroup[];
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
const ERROR_HEADER = /^([A-Z]+[0-9]+)\s+\[ERROR\]:\s+(.+)$/;
const LOCATION_LINE = /^\s*at\s+(?:file:\/\/)?(.+?):(\d+):(\d+)\s*$/;

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-run .llm/tools/run-deno-check.ts [options]',
    '',
    'Options:',
    '  --input <path>      Parse a saved deno check log instead of running deno check.',
    '  --stdin             Parse stdin instead of running deno check.',
    '  --root <path>       Directory or file to scan. Repeatable. Defaults to current directory.',
    '  --file <path>       Explicit file to include. Repeatable.',
    '  --ext <list>        Comma-separated extensions without dots. Repeatable.',
    '  --include <regex>   Include only matching normalized paths.',
    '  --exclude <regex>   Exclude matching normalized paths.',
    '  --cwd <path>        Working directory. Defaults to Deno.cwd().',
    '  --batch-size <n>    Files per deno check invocation. Defaults to 120.',
    '  --deno-arg <arg>    Extra argument passed to deno check. Repeatable.',
    '  --no-unstable-kv    Do not pass --unstable-kv. Defaults to passing it.',
    '  --pretty           Pretty-print JSON output.',
    '  --help             Show this help.',
    '',
    'Parser compatibility:',
    '  deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --input .llm/tmp/check.log',
    '  deno task check 2>&1 | deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --stdin',
    '  deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --pretty -- deno task check',
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
  const separatorIndex = args.indexOf('--');
  const optionArgs = separatorIndex >= 0 ? args.slice(0, separatorIndex) : args;
  const command = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : undefined;

  const roots: string[] = [];
  const files: string[] = [];
  let input: string | undefined;
  let stdin = false;
  let extensions = new Set(DEFAULT_EXTENSIONS);
  let include: RegExp | undefined;
  let exclude: RegExp | undefined;
  let cwd = Deno.cwd();
  let batchSize = 120;
  let pretty = false;
  let unstableKv = true;
  let denoArgs: string[] = [];
  let sawExt = false;

  for (let index = 0; index < optionArgs.length; index++) {
    const arg = optionArgs[index];
    switch (arg) {
      case '--input':
        input = requireValue(optionArgs, index, arg);
        index++;
        break;
      case '--stdin':
        stdin = true;
        break;
      case '--root':
        roots.push(requireValue(optionArgs, index, arg));
        index++;
        break;
      case '--file':
        files.push(requireValue(optionArgs, index, arg));
        index++;
        break;
      case '--ext':
        if (!sawExt) {
          extensions = new Set();
          sawExt = true;
        }
        for (const extension of parseExtensions(requireValue(optionArgs, index, arg))) {
          extensions.add(extension);
        }
        index++;
        break;
      case '--include':
        include = new RegExp(requireValue(optionArgs, index, arg));
        index++;
        break;
      case '--exclude':
        exclude = new RegExp(requireValue(optionArgs, index, arg));
        index++;
        break;
      case '--cwd':
        cwd = requireValue(optionArgs, index, arg);
        index++;
        break;
      case '--batch-size':
        batchSize = Number(requireValue(optionArgs, index, arg));
        if (!Number.isInteger(batchSize) || batchSize < 1) {
          throw new Error('--batch-size must be a positive integer');
        }
        index++;
        break;
      case '--deno-arg':
        denoArgs = [...denoArgs, requireValue(optionArgs, index, arg)];
        index++;
        break;
      case '--no-unstable-kv':
        unstableKv = false;
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
    stdin,
    command: command && command.length > 0 ? command : undefined,
    roots: roots.length > 0 ? roots : files.length > 0 ? [] : ['.'],
    files,
    extensions,
    include,
    exclude,
    cwd,
    batchSize,
    pretty,
    unstableKv,
    denoArgs,
  };
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

async function readStdinText(): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = Deno.stdin.readable.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return new TextDecoder().decode(concatChunks(chunks));
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

function buildCheckArgs(options: Options, files: string[]): string[] {
  return [
    'check',
    '--quiet',
    ...(options.unstableKv ? ['--unstable-kv'] : []),
    ...options.denoArgs,
    ...files,
  ];
}

async function runBatch(files: string[], options: Options): Promise<BatchResult> {
  const result = await new Deno.Command('deno', {
    args: buildCheckArgs(options, files),
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

async function runCommand(command: string[], options: Options): Promise<BatchResult> {
  const [name, ...args] = command;
  const result = await new Deno.Command(name, {
    args,
    cwd: options.cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  return {
    files: [],
    exitCode: result.code,
    output: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  };
}

function stripAnsi(text: string): string {
  return text.replaceAll(ANSI_PATTERN, '');
}

function parseOccurrences(results: BatchResult[]): CheckOccurrence[] {
  const occurrences: CheckOccurrence[] = [];

  for (const result of results) {
    const lines = stripAnsi(result.output).split(/\r?\n/);

    for (let index = 0; index < lines.length; index++) {
      const header = lines[index].trim().match(ERROR_HEADER);
      if (!header) continue;

      let location: CheckOccurrence['location'];
      for (let scan = index + 1; scan < lines.length; scan++) {
        const next = lines[scan];
        if (ERROR_HEADER.test(next.trim())) break;
        const match = next.match(LOCATION_LINE);
        if (match) {
          location = {
            path: normalizePath(match[1]),
            line: Number(match[2]),
            column: Number(match[3]),
          };
          break;
        }
        if (next.startsWith('Found ') || next.startsWith('error:')) break;
      }

      occurrences.push({ code: header[1], message: header[2], location });
    }
  }

  return occurrences;
}

function dedupeOccurrences(occurrences: CheckOccurrence[]): CheckOccurrence[] {
  const seen = new Set<string>();
  const unique: CheckOccurrence[] = [];

  for (const occurrence of occurrences) {
    const key = JSON.stringify(occurrence);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(occurrence);
  }

  return unique;
}

function groupOccurrences(occurrences: CheckOccurrence[]): CheckGroup[] {
  const groups = new Map<string, CheckOccurrence[]>();
  for (const occurrence of occurrences) {
    const key = `${occurrence.code}::${occurrence.message}`;
    groups.set(key, [...(groups.get(key) ?? []), occurrence]);
  }

  return [...groups.entries()].map(([key, items]): CheckGroup => {
    const [code, message] = key.split('::');
    const pathGroups = new Map<string, CheckGroup['paths'][number]>();

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
      code,
      message,
      count: items.length,
      paths: [...pathGroups.values()].sort((left, right) => left.path.localeCompare(right.path)),
    };
  }).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    if (left.code !== right.code) return left.code.localeCompare(right.code);
    return left.message.localeCompare(right.message);
  });
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) return;
  options.cwd = await Deno.realPath(options.cwd).catch(() =>
    resolveFromCwd(Deno.cwd(), options.cwd)
  );

  const results: BatchResult[] = [];
  let files: string[] | undefined;
  let batches: string[][] | undefined;
  let sourceMode: OutputReport['source']['mode'] = 'selection';
  let sourceExitCode: number | undefined;

  if (options.input) {
    sourceMode = 'file';
    results.push({
      files: [],
      exitCode: 0,
      output: await Deno.readTextFile(options.input),
    });
  } else if (options.stdin) {
    sourceMode = 'stdin';
    results.push({
      files: [],
      exitCode: 0,
      output: await readStdinText(),
    });
  } else if (options.command) {
    sourceMode = 'command';
    const result = await runCommand(options.command, options);
    sourceExitCode = result.exitCode;
    results.push(result);
  } else {
    files = await collectFiles(options);
    batches = chunk(files, options.batchSize);
    for (const batch of batches) {
      if (batch.length === 0) continue;
      results.push(await runBatch(batch, options));
    }
  }

  const occurrences = parseOccurrences(results);
  const uniqueOccurrences = dedupeOccurrences(occurrences);
  const groups = groupOccurrences(uniqueOccurrences);
  const failedBatches = results.filter((result) => result.exitCode !== 0).length;
  const uniquePaths = new Set(
    uniqueOccurrences.flatMap((occurrence) =>
      occurrence.location?.path ? [occurrence.location.path] : []
    ),
  );

  const report: OutputReport = {
    source: {
      mode: sourceMode,
      input: options.input,
      command: options.command,
      cwd: sourceMode === 'file' ? undefined : options.cwd,
      exitCode: sourceMode === 'command' ? sourceExitCode : undefined,
    },
    command: sourceMode === 'selection'
      ? `deno ${buildCheckArgs(options, ['<files>']).join(' ')}`
      : undefined,
    selection: files && batches
      ? {
        filesSelected: files.length,
        batches: batches.length,
        failedBatches,
      }
      : undefined,
    summary: {
      totalOccurrences: occurrences.length,
      uniqueOccurrences: uniqueOccurrences.length,
      uniqueCodes: new Set(uniqueOccurrences.map((occurrence) => occurrence.code)).size,
      uniquePaths: uniquePaths.size,
    },
    groups,
  };

  console.log(JSON.stringify(report, null, options.pretty ? 2 : undefined));

  if (sourceMode === 'command' && sourceExitCode && sourceExitCode !== 0) Deno.exit(sourceExitCode);
  if (sourceMode === 'selection' && failedBatches > 0) Deno.exit(1);
}

await main();
