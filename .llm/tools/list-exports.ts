/**
 * MCP-friendly reusable export inventory tool.
 *
 * Use this to inventory a package or app surface without brittle shell pipelines. It prints
 * `path:line: kind:name :: source line` for common export forms so future sessions can quickly map
 * public APIs and migration surfaces.
 *
 * Examples:
 * - deno run --allow-read .llm/tools/list-exports.ts --root packages/fresh
 * - deno run --allow-read .llm/tools/list-exports.ts --root packages/fresh --name define
 * - deno run --allow-read .llm/tools/list-exports.ts --root apps/playground/routes --name handler
 */

interface Options {
  roots: string[];
  nameFilters: string[];
  exts: Set<string>;
  ignoreDirs: Set<string>;
  summary: boolean;
}

interface Stats {
  scannedFiles: number;
  matchedFiles: number;
  matchedLines: number;
}

interface ExportMatch {
  kind: string;
  name: string;
}

const DEFAULT_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cts'];
const DEFAULT_IGNORE_DIRS = ['.git', '_fresh', 'node_modules', 'dist', 'coverage'];

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read .llm/tools/list-exports.ts [options]',
    '',
    'Options:',
    '  --root <path>     Root path to scan. Repeatable. Default: .',
    '  --name <text>     Filter by exported symbol or line content. Repeatable.',
    '  --ext <csv>       Extensions to scan, e.g. .ts,.tsx',
    '  --ignore <name>   Directory name to skip. Repeatable.',
    '  --no-summary      Omit summary output.',
    '  --help            Show this help.',
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
  const nameFilters: string[] = [];
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
      case '--name':
        nameFilters.push(requireValue(args, index, arg));
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
  return { roots, nameFilters, exts, ignoreDirs, summary };
}

function shouldScanFile(path: string, exts: Set<string>): boolean {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return false;
  return exts.has(path.slice(dotIndex));
}

function parseExport(line: string): ExportMatch | null {
  const patterns: Array<[RegExp, string]> = [
    [/^\s*export\s+default\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/, 'default-function'],
    [/^\s*export\s+default\s+class\s+([A-Za-z_$][\w$]*)/, 'default-class'],
    [/^\s*export\s+default\b/, 'default'],
    [/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/, 'function'],
    [/^\s*export\s+const\s+([A-Za-z_$][\w$]*)/, 'const'],
    [/^\s*export\s+let\s+([A-Za-z_$][\w$]*)/, 'let'],
    [/^\s*export\s+var\s+([A-Za-z_$][\w$]*)/, 'var'],
    [/^\s*export\s+class\s+([A-Za-z_$][\w$]*)/, 'class'],
    [/^\s*export\s+interface\s+([A-Za-z_$][\w$]*)/, 'interface'],
    [/^\s*export\s+type\s+([A-Za-z_$][\w$]*)/, 'type'],
    [/^\s*export\s+enum\s+([A-Za-z_$][\w$]*)/, 'enum'],
    [/^\s*export\s+\*\s+from\s+['"]([^'"]+)['"]/, 'star-reexport'],
    [/^\s*export\s+\{([^}]+)\}(?:\s+from\s+['"]([^'"]+)['"])?/, 'named-export'],
  ];

  for (const [pattern, kind] of patterns) {
    const match = line.match(pattern);
    if (!match) continue;

    const rawName = match[1] ?? 'default';
    return { kind, name: rawName.replace(/\s+/g, ' ').trim() };
  }

  return null;
}

function matchesFilter(line: string, parsed: ExportMatch, filters: string[]): boolean {
  if (filters.length === 0) return true;
  const haystacks = [parsed.name, parsed.kind, line];
  return filters.some((filter) => haystacks.some((value) => value.includes(filter)));
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
    const parsed = parseExport(lines[index]);
    if (!parsed) continue;
    if (!matchesFilter(lines[index], parsed, options.nameFilters)) continue;

    fileMatched = true;
    stats.matchedLines++;
    console.log(`${path}:${index + 1}: ${parsed.kind}:${parsed.name} :: ${lines[index].trim()}`);
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
