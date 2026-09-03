import { relative, resolve } from '@std/path';

/** A source file that appears to poll an Aspire describe snapshot on its own clock. */
export interface AspireResourcePollingFinding {
  readonly path: string;
  readonly describeLine: number;
}

/**
 * Concurrency-fenced files temporarily exempt from the #1906 regrowth guard.
 *
 * This list may only shrink as their owning PRs land. It must not acquire an in-scope file merely
 * to make the guard green.
 */
export const ASPIRE_RESOURCE_POLL_ALLOWLIST: ReadonlySet<string> = new Set([]);

const DESCRIBE_COMMAND = /['"`]describe['"`]/gu;
const FOLLOW_FLAG = /['"`]--follow['"`]/u;
const COMMAND_SIGNAL = /Deno\.Command|runAspire|AspireCommand/u;
const TIMING_SIGNAL = /Date\.now|setTimeout|\bdelay\s*\(|deadline|poll|timeout/iu;
const LOOP_START = /\b(?:while|for)\s*(?:await\s*)?\([^\n]*\)\s*\{/gu;

/** Find source files that combine snapshot describe, iteration, and a local timing mechanism. */
export async function findAspireResourcePolling(
  sourceRoot: string,
  repositoryRoot: string = Deno.cwd(),
): Promise<readonly AspireResourcePollingFinding[]> {
  const findings: AspireResourcePollingFinding[] = [];
  for (const path of await typescriptFiles(sourceRoot)) {
    const source = await Deno.readTextFile(path);
    const loops = loopRanges(source);
    for (const match of source.matchAll(DESCRIBE_COMMAND)) {
      const index = match.index;
      const loop = loops.find((candidate) => candidate.start < index && index < candidate.end);
      if (!loop) continue;
      const body = source.slice(loop.start, loop.end);
      if (FOLLOW_FLAG.test(body) || !COMMAND_SIGNAL.test(body) || !TIMING_SIGNAL.test(body)) continue;
      findings.push({
        path: normalize(relative(repositoryRoot, path)),
        describeLine: source.slice(0, index).split(/\r?\n/u).length,
      });
      break;
    }
  }
  return findings.sort((left, right) => left.path.localeCompare(right.path));
}

function loopRanges(source: string): readonly { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  for (const match of source.matchAll(LOOP_START)) {
    const open = source.indexOf('{', match.index);
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1;
      else if (source[index] === '}') depth -= 1;
      if (depth === 0) {
        ranges.push({ start: open, end: index + 1 });
        break;
      }
    }
  }
  return ranges;
}

/** Render non-allowlisted findings as an actionable guard failure. */
export function unexpectedAspireResourcePolling(
  findings: readonly AspireResourcePollingFinding[],
): readonly AspireResourcePollingFinding[] {
  return findings.filter((finding) => !ASPIRE_RESOURCE_POLL_ALLOWLIST.has(finding.path));
}

async function typescriptFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  await visit(resolve(root), files);
  return files.sort((left, right) => left.localeCompare(right));
}

async function visit(path: string, files: string[]): Promise<void> {
  for await (const entry of Deno.readDir(path)) {
    const child = resolve(path, entry.name);
    if (entry.isDirectory) await visit(child, files);
    else if (entry.isFile && entry.name.endsWith('.ts')) files.push(child);
  }
}

function normalize(path: string): string {
  return path.replaceAll('\\', '/');
}
