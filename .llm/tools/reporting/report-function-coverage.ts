import { dirname } from '@std/path';

interface Options {
  coverageDir: string;
  out: string;
  packages: string[];
}

interface LcovFunction {
  file: string;
  name: string;
  line: number;
  hits: number;
}

interface ExportedSymbol {
  name: string;
  kind: string;
  file?: string;
  line?: number;
}

interface PackageReport {
  packagePath: string;
  exportedSymbols: Array<
    ExportedSymbol & {
      coverage: {
        kind: 'function' | 'not_found';
        hits: number;
        file?: string;
        line?: number;
      };
    }
  >;
}

if (import.meta.main) {
  const options = parseArgs(Deno.args);
  const lcovPath = `${options.coverageDir.replace(/\/$/, '')}/lcov.info`;
  const coverageByName = await loadFunctionCoverage(options.coverageDir, lcovPath);
  const packages: PackageReport[] = [];

  for (const packagePath of options.packages) {
    const symbols = await getExportedSymbols(packagePath);
    packages.push({
      packagePath,
      exportedSymbols: symbols.map((symbol) => {
        const coverage = coverageByName.get(symbol.name);
        return {
          ...symbol,
          coverage: coverage
            ? {
              kind: 'function' as const,
              hits: coverage.hits,
              file: coverage.file,
              line: coverage.line,
            }
            : {
              kind: 'not_found' as const,
              hits: 0,
            },
        };
      }),
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: {
      coverageDir: options.coverageDir,
      lcov: await exists(lcovPath) ? lcovPath : undefined,
    },
    summary: {
      packages: packages.length,
      exportedSymbols: packages.reduce((sum, pkg) => sum + pkg.exportedSymbols.length, 0),
      coveredFunctionExports: packages.reduce(
        (sum, pkg) =>
          sum +
          pkg.exportedSymbols.filter((symbol) =>
            symbol.coverage.kind === 'function' && symbol.coverage.hits > 0
          ).length,
        0,
      ),
    },
    packages,
  };

  await Deno.mkdir(dirname(options.out), { recursive: true });
  await Deno.writeTextFile(options.out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Wrote ${options.out} with ${report.summary.exportedSymbols} exported symbols across ${packages.length} packages.`,
  );
}

function parseArgs(args: string[]): Options {
  let coverageDir = '';
  let out = '';
  const packages: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case '--coverage':
        coverageDir = requireValue(args, ++index, arg);
        break;
      case '--out':
        out = requireValue(args, ++index, arg);
        break;
      case '--package':
        packages.push(requireValue(args, ++index, arg));
        break;
      case '--help':
        printHelp();
        Deno.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!coverageDir) throw new Error('Missing --coverage <dir>');
  if (!out) throw new Error('Missing --out <path>');
  if (packages.length === 0) throw new Error('At least one --package <path> is required');
  return { coverageDir, out, packages };
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-write --allow-run .llm/tools/reporting/report-function-coverage.ts \\',
    '    --coverage .llm/tmp/coverage/functions \\',
    '    --out .llm/tmp/coverage/function-report.json \\',
    '    --package packages/contracts',
  ].join('\n'));
}

function parseLcovFunctions(lcov: string): Map<string, LcovFunction> {
  const definitions = new Map<string, { file: string; line: number }>();
  const functions = new Map<string, LcovFunction>();
  let currentFile = '';

  for (const line of lcov.split(/\r?\n/)) {
    if (line.startsWith('SF:')) {
      currentFile = line.slice(3);
      continue;
    }
    if (line.startsWith('FN:')) {
      const [lineNumber, ...nameParts] = line.slice(3).split(',');
      const name = nameParts.join(',');
      definitions.set(`${currentFile}:${name}`, {
        file: currentFile,
        line: Number(lineNumber),
      });
      continue;
    }
    if (line.startsWith('FNDA:')) {
      const [hitsValue, ...nameParts] = line.slice(5).split(',');
      const name = nameParts.join(',');
      const definition = definitions.get(`${currentFile}:${name}`);
      if (!definition) continue;
      const hits = Number(hitsValue);
      const existing = functions.get(name);
      if (!existing || hits > existing.hits) {
        functions.set(name, {
          file: definition.file,
          line: definition.line,
          name,
          hits,
        });
      }
    }
  }

  return functions;
}

async function loadFunctionCoverage(
  coverageDir: string,
  lcovPath: string,
): Promise<Map<string, LcovFunction>> {
  if (await exists(lcovPath)) {
    return parseLcovFunctions(await Deno.readTextFile(lcovPath));
  }
  return await parseRawCoverageFunctions(coverageDir);
}

async function parseRawCoverageFunctions(coverageDir: string): Promise<Map<string, LcovFunction>> {
  const functions = new Map<string, LcovFunction>();
  for await (const entry of Deno.readDir(coverageDir)) {
    if (!entry.isFile || !entry.name.endsWith('.json')) continue;
    const profile = JSON.parse(await Deno.readTextFile(`${coverageDir}/${entry.name}`)) as {
      url?: string;
      functions?: Array<{
        functionName?: string;
        ranges?: Array<{ count?: number }>;
      }>;
    };
    if (!profile.url?.startsWith('file:')) continue;
    const file = new URL(profile.url).pathname;
    for (const fn of profile.functions ?? []) {
      const name = fn.functionName;
      if (!name) continue;
      const hits = Math.max(0, ...((fn.ranges ?? []).map((range) => range.count ?? 0)));
      const existing = functions.get(name);
      if (!existing || hits > existing.hits) {
        functions.set(name, {
          file,
          line: 0,
          name,
          hits,
        });
      }
    }
  }
  return functions;
}

async function getExportedSymbols(packagePath: string): Promise<ExportedSymbol[]> {
  const symbols = await scanExports(`${packagePath}/mod.ts`, new Set());
  return [...new Map(symbols.map((symbol) => [symbol.name, symbol])).values()]
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function scanExports(path: string, seen: Set<string>): Promise<ExportedSymbol[]> {
  const normalizedPath = normalizePath(path);
  if (seen.has(normalizedPath)) return [];
  seen.add(normalizedPath);

  const source = await Deno.readTextFile(normalizedPath);
  const lines = source.split(/\r?\n/);
  const symbols: ExportedSymbol[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const lineNumber = index + 1;

    const star = line.match(/^\s*export\s+\*\s+from\s+['"](.+)['"]/);
    if (star) {
      symbols.push(...await scanExports(resolveRelative(normalizedPath, star[1]), seen));
      continue;
    }

    const namedStart = line.match(/^\s*export\s+(?:type\s+)?\{(.*)$/);
    if (namedStart) {
      const parts = [namedStart[1]];
      while (!parts.join('\n').includes('}') && index + 1 < lines.length) {
        index++;
        parts.push(lines[index]);
      }
      const block = parts.join('\n');
      const names = block.slice(0, block.indexOf('}'));
      for (const part of names.split(',')) {
        const cleaned = part.trim().replace(/^type\s+/, '');
        if (!cleaned) continue;
        const alias = cleaned.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
        const name = alias?.[1] ?? cleaned.split(/\s+/)[0];
        symbols.push({ name, kind: 'reExport', file: normalizedPath, line: lineNumber });
      }
      continue;
    }

    const declaration = line.match(
      /^\s*export\s+(?:declare\s+)?(?:async\s+)?(const|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/,
    );
    if (declaration) {
      symbols.push({
        name: declaration[2],
        kind: declaration[1],
        file: normalizedPath,
        line: lineNumber,
      });
    }
  }

  return symbols;
}

function resolveRelative(fromPath: string, specifier: string): string {
  if (!specifier.startsWith('.')) {
    return specifier;
  }
  const base = dirname(fromPath);
  const parts = `${base}/${specifier}`.split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return normalizePath(resolved.join('/'));
}

function normalizePath(path: string): string {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) {
    return path;
  }
  return `${path}.ts`;
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
