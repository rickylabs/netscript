/**
 * MCP-friendly reusable import-pattern scanner.
 *
 * Use this when checking for alias migration leftovers, brittle deep relative imports, or legacy
 * alias usage. This is more reliable than PowerShell text search on Windows because it avoids shell
 * quoting problems around paths like `(dashboard)` or `[id]`.
 *
 * Examples:
 * - deno run --allow-read .llm/tools/find-import-patterns.ts --root packages/cli/src
 * - deno run --allow-read .llm/tools/find-import-patterns.ts --root packages/cli/src --legacy-alias @old/
 * - deno run --allow-read .llm/tools/find-import-patterns.ts --root packages/cli/src --include-sibling
 */

interface Options {
  roots: string[];
  legacyAliases: string[];
  includeSibling: boolean;
  exts: Set<string>;
  ignoreDirs: Set<string>;
  summary: boolean;
}

interface Stats {
  scannedFiles: number;
  matchedFiles: number;
  matchedLines: number;
}

const DEFAULT_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cts', '.css'];
const DEFAULT_IGNORE_DIRS = ['.git', '_fresh', 'node_modules', 'dist', 'coverage'];
const DEFAULT_LEGACY_ALIASES = ['@/'];

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read .llm/tools/find-import-patterns.ts [options]',
    '',
    'Options:',
    '  --root <path>          Root path to scan. Repeatable. Default: .',
    '  --legacy-alias <text>  Alias prefix to treat as legacy. Repeatable. Default: @/',
    '  --include-sibling      Also report ./ sibling-relative imports.',
    '  --ext <csv>            Extensions to scan, e.g. .ts,.tsx,.css',
    '  --ignore <name>        Directory name to skip. Repeatable.',
    '  --no-summary           Omit summary output.',
    '  --help                 Show this help.',
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
  const legacyAliases = [...DEFAULT_LEGACY_ALIASES];
  const exts = new Set(DEFAULT_EXTS);
  const ignoreDirs = new Set(DEFAULT_IGNORE_DIRS);
  let includeSibling = false;
  let summary = true;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    switch (arg) {
      case '--root':
        roots.push(requireValue(args, index, arg));
        index++;
        break;
      case '--legacy-alias':
        legacyAliases.push(requireValue(args, index, arg));
        index++;
        break;
      case '--include-sibling':
        includeSibling = true;
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

  return { roots, legacyAliases, includeSibling, exts, ignoreDirs, summary };
}

function shouldScanFile(path: string, exts: Set<string>): boolean {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return false;
  return exts.has(path.slice(dotIndex));
}

function extractSpecifier(line: string): { source: 'import' | 'css'; specifier: string } | null {
  const importMatch = line.match(/(?:\bfrom\s+|^\s*import\s+)['"]([^'"]+)['"]/);
  if (importMatch) {
    return { source: 'import', specifier: importMatch[1] };
  }

  const cssMatch = line.match(/@import\s+['"]([^'"]+)['"]/);
  if (cssMatch) {
    return { source: 'css', specifier: cssMatch[1] };
  }

  return null;
}

function classifySpecifier(specifier: string, options: Options): string | null {
  if (options.legacyAliases.some((alias) => specifier.startsWith(alias))) {
    return 'legacy-alias';
  }
  if (specifier.startsWith('../')) {
    return 'parent-relative';
  }
  if (options.includeSibling && specifier.startsWith('./')) {
    return 'sibling-relative';
  }
  return null;
}

async function scanPath(path: string, options: Options, stats: Stats): Promise<void> {
  const info = await Deno.stat(path);

  if (info.isDirectory) {
    for await (const entry of Deno.readDir(path)) {
      if (entry.isDirectory && options.ignoreDirs.has(entry.name)) continue;
      await scanPath(`${path}/${entry.name}`, options, stats);
    }
    return;
  }

  if (!shouldScanFile(path, options.exts)) return;

  const text = await Deno.readTextFile(path);
  stats.scannedFiles++;

  const lines = text.split(/\r?\n/);
  let fileMatched = false;

  for (let index = 0; index < lines.length; index++) {
    const extracted = extractSpecifier(lines[index]);
    if (!extracted) continue;

    const category = classifySpecifier(extracted.specifier, options);
    if (!category) continue;

    fileMatched = true;
    stats.matchedLines++;
    console.log(
      `${path}:${index + 1}: [${extracted.source}:${category}] ${extracted.specifier} :: ${
        lines[index].trim()
      }`,
    );
  }

  if (fileMatched) stats.matchedFiles++;
}

const options = parseArgs(Deno.args);

if (options) {
  const stats: Stats = { scannedFiles: 0, matchedFiles: 0, matchedLines: 0 };

  for (const root of options.roots) {
    await scanPath(root, options, stats);
  }

  if (options.summary) {
    console.error(
      `summary: scanned ${stats.scannedFiles} file(s), matched ${stats.matchedFiles} file(s), ${stats.matchedLines} line(s)`,
    );
  }
}
