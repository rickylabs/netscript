/**
 * MCP-friendly structured parser for `deno check` / `deno task check*` failures.
 *
 * Use this when raw terminal output is too noisy to reason about efficiently. The script strips
 * ANSI codes, parses Deno/TypeScript-style error blocks, deduplicates repeated occurrences, and
 * emits grouped JSON by error kind with affected files and locations.
 *
 * Examples:
 * - deno run --allow-read .llm/tools/parse-deno-check-errors.ts --input .llm/tmp/check-packages.log
 * - deno run --allow-run --allow-read .llm/tools/parse-deno-check-errors.ts --cwd . -- deno task check:packages
 * - deno run --allow-run --allow-read .llm/tools/parse-deno-check-errors.ts --pretty --cwd packages/fresh -- deno check ./route/contract.ts
 */

interface SourceData {
  text: string;
  command?: string[];
  exitCode?: number;
}

interface Location {
  path: string;
  line: number;
  column: number;
}

interface ParsedOccurrence {
  kind: string;
  message: string;
  location?: Location;
}

interface GroupedPath {
  path: string;
  count: number;
  locations: Array<{ line: number; column: number }>;
}

interface ErrorGroup {
  kind: string;
  message: string;
  count: number;
  paths: GroupedPath[];
}

interface OutputReport {
  source: {
    mode: 'file' | 'stdin' | 'command';
    input?: string;
    command?: string[];
    cwd?: string;
    exitCode?: number;
  };
  summary: {
    totalOccurrences: number;
    uniqueOccurrences: number;
    uniqueKinds: number;
    uniquePaths: number;
  };
  groups: ErrorGroup[];
}

interface Options {
  input?: string;
  cwd?: string;
  pretty: boolean;
  command?: string[];
}

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
const ERROR_HEADER = /^([A-Z]+[0-9]+)\s+\[ERROR\]:\s+(.*)$/;
const LOCATION_LINE = /^\s*at\s+(?:file:\/\/)?(.+?):(\d+):(\d+)\s*$/;

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read .llm/tools/parse-deno-check-errors.ts [options]',
    '  deno run --allow-run --allow-read .llm/tools/parse-deno-check-errors.ts [options] -- deno task check:packages',
    '',
    'Options:',
    '  --input <path>   Parse a saved log file instead of stdin/command output.',
    '  --cwd <path>     Working directory used when running a command after `--`.',
    '  --pretty         Pretty-print JSON output.',
    '  --help           Show this help.',
    '',
    'Notes:',
    '  - If `--input` is omitted and a command is not provided after `--`, the script reads stdin.',
    '  - The JSON groups by error kind + message, then lists affected paths and locations.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseArgs(args: string[]): Options | null {
  const separatorIndex = args.indexOf('--');
  const optionArgs = separatorIndex >= 0 ? args.slice(0, separatorIndex) : args;
  const command = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : undefined;

  let input: string | undefined;
  let cwd: string | undefined;
  let pretty = false;

  for (let index = 0; index < optionArgs.length; index++) {
    const arg = optionArgs[index];
    switch (arg) {
      case '--input':
        input = requireValue(optionArgs, index, arg);
        index++;
        break;
      case '--cwd':
        cwd = requireValue(optionArgs, index, arg);
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
    cwd,
    pretty,
    command: command && command.length > 0 ? command : undefined,
  };
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

async function loadSource(options: Options): Promise<SourceData> {
  if (options.input) {
    return {
      text: await Deno.readTextFile(options.input),
    };
  }

  if (options.command) {
    const [name, ...commandArgs] = options.command;
    const result = await new Deno.Command(name, {
      args: commandArgs,
      cwd: options.cwd,
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    return {
      text: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
      command: options.command,
      exitCode: result.code,
    };
  }

  return {
    text: await readStdinText(),
  };
}

function stripAnsi(text: string): string {
  return text.replaceAll(ANSI_PATTERN, '');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function parseOccurrences(text: string): ParsedOccurrence[] {
  const clean = stripAnsi(text);
  const lines = clean.split(/\r?\n/);
  const occurrences: ParsedOccurrence[] = [];

  for (let index = 0; index < lines.length; index++) {
    const headerMatch = lines[index].match(ERROR_HEADER);
    if (!headerMatch) continue;

    const [, kind, message] = headerMatch;
    let location: Location | undefined;

    for (let scan = index + 1; scan < lines.length; scan++) {
      const nextLine = lines[scan];
      if (ERROR_HEADER.test(nextLine)) break;
      const locationMatch = nextLine.match(LOCATION_LINE);
      if (locationMatch) {
        location = {
          path: normalizePath(locationMatch[1]),
          line: Number(locationMatch[2]),
          column: Number(locationMatch[3]),
        };
        break;
      }
      if (nextLine.startsWith('Found ') || nextLine.startsWith('error: ')) break;
    }

    occurrences.push({ kind, message, location });
  }

  return occurrences;
}

function dedupeOccurrences(occurrences: ParsedOccurrence[]): ParsedOccurrence[] {
  const seen = new Set<string>();
  const unique: ParsedOccurrence[] = [];

  for (const occurrence of occurrences) {
    const key = JSON.stringify({
      kind: occurrence.kind,
      message: occurrence.message,
      location: occurrence.location ?? null,
    });
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(occurrence);
  }

  return unique;
}

function groupOccurrences(occurrences: ParsedOccurrence[]): ErrorGroup[] {
  const groups = new Map<
    string,
    { kind: string; message: string; occurrences: ParsedOccurrence[] }
  >();

  for (const occurrence of occurrences) {
    const key = `${occurrence.kind}::${occurrence.message}`;
    const current = groups.get(key);
    if (current) {
      current.occurrences.push(occurrence);
    } else {
      groups.set(key, {
        kind: occurrence.kind,
        message: occurrence.message,
        occurrences: [occurrence],
      });
    }
  }

  return [...groups.values()]
    .map((group): ErrorGroup => {
      const byPath = new Map<string, GroupedPath>();

      for (const occurrence of group.occurrences) {
        const path = occurrence.location?.path ?? '(unknown)';
        const current = byPath.get(path) ?? { path, count: 0, locations: [] };
        current.count += 1;

        if (occurrence.location) {
          const hasLocation = current.locations.some((location) =>
            location.line === occurrence.location!.line &&
            location.column === occurrence.location!.column
          );
          if (!hasLocation) {
            current.locations.push({
              line: occurrence.location.line,
              column: occurrence.location.column,
            });
          }
        }

        byPath.set(path, current);
      }

      return {
        kind: group.kind,
        message: group.message,
        count: group.occurrences.length,
        paths: [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path)),
      };
    })
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      if (left.kind !== right.kind) return left.kind.localeCompare(right.kind);
      return left.message.localeCompare(right.message);
    });
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) return;

  const source = await loadSource(options);
  const occurrences = parseOccurrences(source.text);
  const uniqueOccurrences = dedupeOccurrences(occurrences);
  const groups = groupOccurrences(uniqueOccurrences);
  const uniquePaths = new Set(
    uniqueOccurrences.flatMap((occurrence) =>
      occurrence.location?.path ? [occurrence.location.path] : []
    ),
  );

  const report: OutputReport = {
    source: {
      mode: options.input ? 'file' : options.command ? 'command' : 'stdin',
      input: options.input,
      command: source.command,
      cwd: options.cwd,
      exitCode: source.exitCode,
    },
    summary: {
      totalOccurrences: occurrences.length,
      uniqueOccurrences: uniqueOccurrences.length,
      uniqueKinds: new Set(uniqueOccurrences.map((occurrence) => occurrence.kind)).size,
      uniquePaths: uniquePaths.size,
    },
    groups,
  };

  console.log(JSON.stringify(report, null, options.pretty ? 2 : undefined));

  if (options.command && source.exitCode && source.exitCode !== 0) {
    Deno.exit(source.exitCode);
  }
}

await main();
