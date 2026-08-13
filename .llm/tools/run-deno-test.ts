/**
 * Structured, token-efficient runner for `deno test`.
 *
 * Deno's TAP reporter already places failure details in JSON diagnostic blocks. This wrapper
 * converts that stream into one compact report, groups repeated failure shapes, preserves the
 * child exit code, and can atomically persist the report for CI/harness consumption.
 */

import { dirname, resolve } from '@std/path';

interface Options {
  cwd: string;
  output?: string;
  pretty: boolean;
  testArgs: string[];
}

interface TestLocation {
  file?: string;
  line?: number;
  column?: number;
}

interface TestFailureInstance extends TestLocation {
  name: string;
}

interface TestFailureGroup {
  message: string;
  count: number;
  tests: TestFailureInstance[];
}

interface StreamEvidence {
  bytes: number;
  sha256: string;
  tail: string;
  truncated: boolean;
}

export interface TestReport {
  schemaVersion: 1;
  command: string[];
  cwd: string;
  exitCode: number;
  durationMs: number;
  summary: {
    passed: number;
    failed: number;
    ignored: number;
    totalResults: number;
    uniqueFailures: number;
  };
  failures: TestFailureGroup[];
  processFailure?: {
    reason: string;
    stdout: StreamEvidence;
    stderr: StreamEvidence;
  };
}

interface TapDiagnostic {
  message?: unknown;
  severity?: unknown;
  at?: {
    file?: unknown;
    line?: unknown;
    column?: unknown;
  };
}

interface ParsedTap {
  passed: number;
  ignored: number;
  failed: Array<{ name: string; message: string; location: TestLocation }>;
}

const STREAM_TAIL_BYTES = 8 * 1024;

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts [options] -- [deno test args]',
    '',
    'Options:',
    '  --cwd <path>       Run deno test from this directory. Defaults to the current directory.',
    '  --output <path>    Atomically write the full JSON report to this path.',
    '  --pretty           Pretty-print JSON output.',
    '  --help             Show this help.',
    '',
    'The wrapper owns --reporter=tap; forwarded --reporter/--junit-path flags are rejected.',
    '`deno task test` callers use --report-output <path> because task args arrive after `--`.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseArgs(args: string[]): Options | null {
  const separator = args.indexOf('--');
  const own = separator < 0 ? args : args.slice(0, separator);
  const forwarded = separator < 0 ? [] : args.slice(separator + 1);
  const testArgs: string[] = [];
  let cwd = Deno.cwd();
  let output: string | undefined;
  let pretty = false;

  for (let index = 0; index < own.length; index++) {
    switch (own[index]) {
      case '--cwd':
        cwd = requireValue(own, index, own[index]);
        index++;
        break;
      case '--output':
        output = requireValue(own, index, own[index]);
        index++;
        break;
      case '--pretty':
        pretty = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${own[index]}`);
    }
  }

  // `deno task test <args>` appends task arguments after the task command's existing `--`. Pull
  // wrapper-only output flags back out so CI can request a report through the stable task alias.
  for (let index = 0; index < forwarded.length; index++) {
    if (forwarded[index] === '--report-output') {
      output = requireValue(forwarded, index, forwarded[index]);
      index++;
      continue;
    }
    testArgs.push(forwarded[index]);
  }

  if (testArgs.some((arg) => arg === '--reporter' || arg.startsWith('--reporter='))) {
    throw new Error('run-deno-test owns --reporter=tap; remove the forwarded --reporter flag');
  }
  if (testArgs.some((arg) => arg === '--junit-path' || arg.startsWith('--junit-path='))) {
    throw new Error(
      'run-deno-test owns structured reporting; remove the forwarded --junit-path flag',
    );
  }

  return { cwd, output, pretty, testArgs };
}

function asLocation(value: TapDiagnostic['at']): TestLocation {
  return {
    file: typeof value?.file === 'string' ? value.file.replaceAll('\\', '/') : undefined,
    line: typeof value?.line === 'number' ? value.line : undefined,
    column: typeof value?.column === 'number' ? value.column : undefined,
  };
}

function normalizeFailure(message: string, cwd: string): string {
  const normalizedCwd = cwd.replaceAll('\\', '/').replace(/\/$/, '');
  const normalized = message
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replaceAll('\\', '/')
    .replaceAll(`file://${normalizedCwd}/`, 'file://<cwd>/')
    .replaceAll(`${normalizedCwd}/`, '<cwd>/')
    .replace(/:\d+:\d+(?=[)\n]|$)/g, ':<line>:<column>');
  const lines = normalized.split('\n');
  return lines
    .filter((line, index) => {
      const isCaret = /^\s*\^+\s*$/.test(line);
      const introducesCaret = index + 1 < lines.length && /^\s*\^+\s*$/.test(lines[index + 1]);
      return !isCaret && !introducesCaret;
    })
    .join('\n')
    .trim();
}

function parseDiagnostic(lines: string[], start: number): TapDiagnostic | undefined {
  for (let index = start + 1; index < Math.min(lines.length, start + 8); index++) {
    const candidate = lines[index].trim();
    if (candidate === '...' || /^(?:not )?ok\s+\d+\s+-/.test(candidate)) break;
    if (!candidate.startsWith('{')) continue;
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed as TapDiagnostic;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** Parse the stable JSON diagnostics embedded by Deno's TAP reporter. */
export function parseTap(text: string, cwd: string = Deno.cwd()): ParsedTap {
  const lines = text.replace(/\u001b\[[0-9;]*m/g, '').split(/\r?\n/);
  const result: ParsedTap = { passed: 0, ignored: 0, failed: [] };

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^\s*(not ok|ok)\s+\d+\s+-\s+(.+)$/);
    if (!match) continue;
    const directive = match[2].match(/\s+#\s+(?:SKIP|TODO)\b/i);
    const name = match[2].replace(/\s+#\s+(?:SKIP|TODO)\b.*$/i, '').trim();
    if (directive) {
      result.ignored++;
      continue;
    }
    if (match[1] === 'ok') {
      result.passed++;
      continue;
    }

    const diagnostic = parseDiagnostic(lines, index);
    const message = typeof diagnostic?.message === 'string'
      ? diagnostic.message
      : `Test failed without a parseable TAP diagnostic: ${name}`;
    result.failed.push({
      name,
      message: normalizeFailure(message, cwd),
      location: asLocation(diagnostic?.at),
    });
  }

  return result;
}

function groupFailures(failures: ParsedTap['failed']): TestFailureGroup[] {
  const groups = new Map<string, TestFailureGroup>();
  for (const failure of failures) {
    const current = groups.get(failure.message) ?? {
      message: failure.message,
      count: 0,
      tests: [],
    };
    current.count++;
    current.tests.push({ name: failure.name, ...failure.location });
    groups.set(failure.message, current);
  }
  return [...groups.values()].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return left.message.localeCompare(right.message);
  });
}

async function streamEvidence(text: string): Promise<StreamEvidence> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const tail = bytes.length <= STREAM_TAIL_BYTES
    ? bytes
    : bytes.slice(bytes.length - STREAM_TAIL_BYTES);
  return {
    bytes: bytes.length,
    sha256,
    tail: new TextDecoder().decode(tail),
    truncated: bytes.length > tail.length,
  };
}

async function writeAtomic(path: string, text: string): Promise<void> {
  const absolute = resolve(path);
  await Deno.mkdir(dirname(absolute), { recursive: true });
  const temp = `${absolute}.${crypto.randomUUID()}.tmp`;
  try {
    await Deno.writeTextFile(temp, text, { createNew: true });
    await Deno.rename(temp, absolute);
  } finally {
    await Deno.remove(temp).catch(() => undefined);
  }
}

async function emit(report: TestReport, options: Options): Promise<void> {
  const full = `${JSON.stringify(report, null, options.pretty ? 2 : undefined)}\n`;
  if (!options.output) {
    await Deno.stdout.write(new TextEncoder().encode(full));
    return;
  }
  await writeAtomic(options.output, full);
  console.log(JSON.stringify({ report: options.output, summary: report.summary }));
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) return;
  options.cwd = await Deno.realPath(options.cwd).catch(() => resolve(options.cwd));
  const command = ['deno', 'test', '--reporter=tap', ...options.testArgs];
  const started = performance.now();
  let code = 1;
  let stdout = '';
  let stderr = '';

  try {
    const output = await new Deno.Command(Deno.execPath(), {
      args: command.slice(1),
      cwd: options.cwd,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    code = output.code;
    stdout = new TextDecoder().decode(output.stdout);
    stderr = new TextDecoder().decode(output.stderr);
  } catch (error) {
    stderr = error instanceof Error ? error.message : String(error);
  }

  const parsed = parseTap(stdout, options.cwd);
  const failures = groupFailures(parsed.failed);
  const report: TestReport = {
    schemaVersion: 1,
    command,
    cwd: options.cwd,
    exitCode: code,
    durationMs: Math.round(performance.now() - started),
    summary: {
      passed: parsed.passed,
      failed: parsed.failed.length,
      ignored: parsed.ignored,
      totalResults: parsed.passed + parsed.failed.length + parsed.ignored,
      uniqueFailures: failures.length,
    },
    failures,
  };

  if (code !== 0 && parsed.failed.length === 0) {
    report.processFailure = {
      reason: 'deno test exited non-zero without a parseable TAP test failure',
      stdout: await streamEvidence(stdout),
      stderr: await streamEvidence(stderr),
    };
  }

  await emit(report, options);
  if (code !== 0) Deno.exit(code);
}

if (import.meta.main) await main();
