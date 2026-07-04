/**
 * MCP-friendly reusable symbol usage scanner.
 *
 * Prefer this over brittle shell grep/Select-String pipelines when you want word-boundary matching
 * for symbols during refactors, API audits, or migration work.
 *
 * Examples:
 * - deno run --allow-read .llm/tools/search/find-symbol-usages.ts --root packages/fresh --symbol definePage
 * - deno run --allow-read .llm/tools/search/find-symbol-usages.ts --root packages/cli/src --symbol defineCommand
 * - deno run --allow-read .llm/tools/search/find-symbol-usages.ts --root packages/fresh --symbol createListPage --substring
 */

interface Options {
  roots: string[];
  symbols: string[];
  exts: Set<string>;
  ignoreDirs: Set<string>;
  caseSensitive: boolean;
  substring: boolean;
  summary: boolean;
}

interface Stats {
  scannedFiles: number;
  matchedFiles: number;
  matchedLines: number;
}

const DEFAULT_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cts', '.css', '.md'];
const DEFAULT_IGNORE_DIRS = ['.git', '_fresh', 'node_modules', 'dist', 'coverage'];

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read .llm/tools/search/find-symbol-usages.ts [options]',
    '',
    'Options:',
    '  --root <path>       Root path to scan. Repeatable. Default: .',
    '  --symbol <name>     Symbol to match. Repeatable. Required.',
    '  --ext <csv>         Extensions to scan, e.g. .ts,.tsx,.md',
    '  --ignore <name>     Directory name to skip. Repeatable.',
    '  --case-sensitive    Make matching case-sensitive.',
    '  --substring         Match substrings instead of symbol boundaries.',
    '  --no-summary        Omit summary output.',
    '  --help              Show this help.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function normalizeExt(ext: string): string {
  return ext.startsWith('.') ? ext : `.${ext}`;
}

function parseArgs(args: string[]): Options | null {
  const roots: string[] = [];
  const symbols: string[] = [];
  const exts = new Set(DEFAULT_EXTS);
  const ignoreDirs = new Set(DEFAULT_IGNORE_DIRS);
  let caseSensitive = false;
  let substring = false;
  let summary = true;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--root':
        roots.push(requireValue(args, index, arg));
        index++;
        break;
      case '--symbol':
        symbols.push(requireValue(args, index, arg));
        index++;
        break;
      case '--ext': {
        exts.clear();
        for (const ext of requireValue(args, index, arg).split(',')) {
          exts.add(normalizeExt(ext.trim()));
        }
        index++;
        break;
      }
      case '--ignore':
        ignoreDirs.add(requireValue(args, index, arg));
        index++;
        break;
      case '--case-sensitive':
        caseSensitive = true;
        break;
      case '--substring':
        substring = true;
        break;
      case '--no-summary':
        summary = false;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (roots.length === 0) roots.push('.');
  if (symbols.length === 0) throw new Error('Provide at least one --symbol value.');

  return { roots, symbols, exts, ignoreDirs, caseSensitive, substring, summary };
}

function shouldScanFile(path: string, exts: Set<string>): boolean {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return false;
  return exts.has(path.slice(dotIndex));
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createPatterns(options: Options): Array<{ symbol: string; pattern: RegExp }> {
  const flags = options.caseSensitive ? '' : 'i';

  return options.symbols.map((symbol) => {
    const escaped = escapeRegex(symbol);
    const source = options.substring
      ? escaped
      : `(^|[^A-Za-z0-9_$])(${escaped})(?=$|[^A-Za-z0-9_$])`;

    return { symbol, pattern: new RegExp(source, flags) };
  });
}

async function scanPath(
  path: string,
  options: Options,
  patterns: Array<{ symbol: string; pattern: RegExp }>,
  stats: Stats,
): Promise<void> {
  const info = await Deno.stat(path);

  if (info.isDirectory) {
    for await (const entry of Deno.readDir(path)) {
      if (entry.isDirectory && options.ignoreDirs.has(entry.name)) continue;
      await scanPath(`${path}/${entry.name}`, options, patterns, stats);
    }
    return;
  }

  if (!shouldScanFile(path, options.exts)) return;

  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (error: unknown) {
    if (error instanceof Deno.errors.InvalidData) return;
    throw error;
  }

  stats.scannedFiles++;

  let fileMatched = false;
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const matchedSymbols = patterns.filter(({ pattern }) => pattern.test(lines[index])).map((
      { symbol },
    ) => symbol);
    if (matchedSymbols.length === 0) continue;

    fileMatched = true;
    stats.matchedLines++;
    console.log(`${path}:${index + 1}: [${matchedSymbols.join(',')}] ${lines[index].trim()}`);
  }

  if (fileMatched) stats.matchedFiles++;
}

const options = parseArgs(Deno.args);
if (options) {
  const patterns = createPatterns(options);
  const stats: Stats = { scannedFiles: 0, matchedFiles: 0, matchedLines: 0 };

  for (const root of options.roots) {
    await scanPath(root, options, patterns, stats);
  }

  if (options.summary) {
    console.error(
      `summary: scanned ${stats.scannedFiles} file(s), matched ${stats.matchedFiles} file(s), ${stats.matchedLines} line(s)`,
    );
  }
}
