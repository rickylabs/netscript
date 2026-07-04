/**
 * MCP-friendly export surface diff helper.
 *
 * Use this to compare the current exported symbol set against an expected contract list from an RFC,
 * WI doc, or migration note. Scan a package tree, then compare against explicit expected names.
 *
 * Examples:
 * - deno run --allow-read .llm/tools/search/compare-export-surface.ts --root packages/fresh --expect definePage --expect definePartial
 * - deno run --allow-read .llm/tools/search/compare-export-surface.ts --root packages/fresh --expect-file .llm/temp/fresh-contract.txt
 * - deno run --allow-read .llm/tools/search/compare-export-surface.ts --root packages/fresh --expect definePage --fail-on-missing
 */

interface Options {
  roots: string[];
  expected: Set<string>;
  expectFile?: string;
  ignoreDirs: Set<string>;
  showActual: boolean;
  failOnMissing: boolean;
}

const DEFAULT_IGNORE_DIRS = ['.git', '_fresh', 'node_modules', 'dist', 'coverage'];
const EXPORT_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cts']);

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read .llm/tools/search/compare-export-surface.ts [options]',
    '',
    'Options:',
    '  --root <path>         Root path to scan. Repeatable. Default: .',
    '  --expect <name>       Expected exported symbol. Repeatable.',
    '  --expect-file <path>  File with one expected symbol per line; blank lines and # comments ignored.',
    '  --ignore <name>       Directory name to skip. Repeatable.',
    '  --show-actual         Print the full actual symbol set.',
    '  --fail-on-missing     Exit non-zero when any expected symbol is missing.',
    '  --help                Show this help.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseArgs(args: string[]): Options | null {
  const roots: string[] = [];
  const expected = new Set<string>();
  const ignoreDirs = new Set(DEFAULT_IGNORE_DIRS);
  let expectFile: string | undefined;
  let showActual = false;
  let failOnMissing = false;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--root':
        roots.push(requireValue(args, index, arg));
        index++;
        break;
      case '--expect':
        expected.add(requireValue(args, index, arg));
        index++;
        break;
      case '--expect-file':
        expectFile = requireValue(args, index, arg);
        index++;
        break;
      case '--ignore':
        ignoreDirs.add(requireValue(args, index, arg));
        index++;
        break;
      case '--show-actual':
        showActual = true;
        break;
      case '--fail-on-missing':
        failOnMissing = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (roots.length === 0) roots.push('.');
  return { roots, expected, expectFile, ignoreDirs, showActual, failOnMissing };
}

function fileExtension(path: string): string {
  const dotIndex = path.lastIndexOf('.');
  return dotIndex === -1 ? '' : path.slice(dotIndex);
}

function addNamedExport(raw: string, names: Set<string>): void {
  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const aliasMatch = trimmed.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
    names.add(aliasMatch?.[1] ?? trimmed);
  }
}

function collectNamesFromLine(line: string, names: Set<string>): void {
  const directPatterns: RegExp[] = [
    /^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
    /^\s*export\s+const\s+([A-Za-z_$][\w$]*)/,
    /^\s*export\s+let\s+([A-Za-z_$][\w$]*)/,
    /^\s*export\s+var\s+([A-Za-z_$][\w$]*)/,
    /^\s*export\s+class\s+([A-Za-z_$][\w$]*)/,
    /^\s*export\s+interface\s+([A-Za-z_$][\w$]*)/,
    /^\s*export\s+type\s+([A-Za-z_$][\w$]*)/,
    /^\s*export\s+enum\s+([A-Za-z_$][\w$]*)/,
  ];

  for (const pattern of directPatterns) {
    const match = line.match(pattern);
    if (match) names.add(match[1]);
  }

  const namedMatch = line.match(/^\s*export\s+\{([^}]+)\}/);
  if (namedMatch) addNamedExport(namedMatch[1], names);
}

async function collectExportNames(
  path: string,
  options: Options,
  names: Set<string>,
): Promise<void> {
  const info = await Deno.stat(path);

  if (info.isDirectory) {
    for await (const entry of Deno.readDir(path)) {
      if (entry.isDirectory && options.ignoreDirs.has(entry.name)) continue;
      await collectExportNames(`${path}/${entry.name}`, options, names);
    }
    return;
  }

  if (!EXPORT_EXTS.has(fileExtension(path))) return;

  const text = await Deno.readTextFile(path);
  for (const line of text.split(/\r?\n/)) {
    collectNamesFromLine(line, names);
  }
}

async function loadExpectedFromFile(path: string, expected: Set<string>): Promise<void> {
  const text = await Deno.readTextFile(path);
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    expected.add(trimmed);
  }
}

const options = parseArgs(Deno.args);
if (options) {
  if (options.expectFile) {
    await loadExpectedFromFile(options.expectFile, options.expected);
  }

  if (options.expected.size === 0) {
    throw new Error('Provide at least one expected symbol via --expect or --expect-file.');
  }

  const actual = new Set<string>();
  for (const root of options.roots) {
    await collectExportNames(root, options, actual);
  }

  const actualList = [...actual].sort();
  const expectedList = [...options.expected].sort();
  const present = expectedList.filter((name) => actual.has(name));
  const missing = expectedList.filter((name) => !actual.has(name));
  const extra = actualList.filter((name) => !options.expected.has(name));

  console.log(`expected: ${expectedList.join(', ')}`);
  console.log(`present: ${present.length > 0 ? present.join(', ') : '-'}`);
  console.log(`missing: ${missing.length > 0 ? missing.join(', ') : '-'}`);
  console.log(`extra-count: ${extra.length}`);

  if (options.showActual) {
    console.log(`actual: ${actualList.join(', ')}`);
  }

  if (options.failOnMissing && missing.length > 0) {
    Deno.exit(1);
  }
}
