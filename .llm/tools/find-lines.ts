/**
 * MCP-friendly reusable Deno line scanner.
 *
 * Prefer this over PowerShell `Select-String`, `findstr`, or complex shell pipelines when scanning
 * this repo from an MCP session. It is more reliable on Windows paths and usually more performant
 * because one Deno process can walk the tree once and handle all matching in-process.
 *
 * Examples:
 * - deno run --allow-read .llm/tools/find-lines.ts --root packages/cli/src --contains @netscript/
 * - deno run --allow-read .llm/tools/find-lines.ts --root packages/fresh --regex define(ListPage|DetailPage|FormPage)
 * - deno run --allow-read .llm/tools/find-lines.ts --root packages/cli/src --contains ../ --ext .ts,.tsx
 */

interface Options {
  roots: string[];
  contains: string[];
  regexes: RegExp[];
  exts: Set<string>;
  ignoreDirs: Set<string>;
  summary: boolean;
}

interface ScanStats {
  scannedFiles: number;
  matchedFiles: number;
  matchedLines: number;
}

const DEFAULT_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cts', '.css', '.json', '.md'];
const DEFAULT_IGNORE_DIRS = ['.git', '_fresh', 'node_modules', 'dist', 'coverage'];

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read .llm/tools/find-lines.ts [options]',
    '',
    'Options:',
    '  --root <path>       Root path to scan. Repeatable. Default: .',
    '  --contains <text>   Substring to match. Repeatable.',
    '  --regex <pattern>   JavaScript regex source to match. Repeatable.',
    '  --ext <csv>         Extensions to scan, e.g. .ts,.tsx,.css',
    '  --ignore <name>     Directory name to skip. Repeatable.',
    '  --no-summary        Omit summary output.',
    '  --help              Show this help.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function normalizeExt(ext: string): string {
  return ext === '*' || ext.startsWith('.') ? ext : `.${ext}`;
}

function parseArgs(args: string[]): Options | null {
  const roots: string[] = [];
  const contains: string[] = [];
  const regexes: RegExp[] = [];
  const exts = new Set(DEFAULT_EXTS);
  const ignoreDirs = new Set(DEFAULT_IGNORE_DIRS);
  let summary = true;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    switch (arg) {
      case '--root':
        roots.push(requireValue(args, index, arg));
        index++;
        break;
      case '--contains':
        contains.push(requireValue(args, index, arg));
        index++;
        break;
      case '--regex':
        regexes.push(new RegExp(requireValue(args, index, arg)));
        index++;
        break;
      case '--ext': {
        const value = requireValue(args, index, arg);
        exts.clear();
        for (const ext of value.split(',')) {
          const normalized = normalizeExt(ext.trim());
          if (normalized) exts.add(normalized);
        }
        index++;
        break;
      }
      case '--ignore':
        ignoreDirs.add(requireValue(args, index, arg));
        index++;
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

  if (contains.length === 0 && regexes.length === 0) {
    throw new Error('Provide at least one --contains or --regex matcher.');
  }

  return { roots, contains, regexes, exts, ignoreDirs, summary };
}

function shouldScanFile(path: string, exts: Set<string>): boolean {
  if (exts.has('*')) return true;

  const lastDot = path.lastIndexOf('.');
  if (lastDot === -1) return false;

  return exts.has(path.slice(lastDot));
}

function lineMatches(line: string, options: Options): boolean {
  return options.contains.some((value) => line.includes(value)) ||
    options.regexes.some((pattern) => pattern.test(line));
}

async function scanPath(path: string, options: Options, stats: ScanStats): Promise<void> {
  const fileInfo = await Deno.stat(path);

  if (fileInfo.isDirectory) {
    for await (const entry of Deno.readDir(path)) {
      if (entry.isDirectory && options.ignoreDirs.has(entry.name)) continue;
      await scanPath(`${path}/${entry.name}`, options, stats);
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

  const lines = text.split(/\r?\n/);
  let fileMatched = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!lineMatches(line, options)) continue;

    fileMatched = true;
    stats.matchedLines++;
    console.log(`${path}:${index + 1}: ${line.trim()}`);
  }

  if (fileMatched) {
    stats.matchedFiles++;
  }
}

const options = parseArgs(Deno.args);

if (options) {
  const stats: ScanStats = { scannedFiles: 0, matchedFiles: 0, matchedLines: 0 };

  for (const root of options.roots) {
    await scanPath(root, options, stats);
  }

  if (options.summary) {
    console.error(
      `summary: scanned ${stats.scannedFiles} file(s), matched ${stats.matchedFiles} file(s), ${stats.matchedLines} line(s)`,
    );
  }
}
