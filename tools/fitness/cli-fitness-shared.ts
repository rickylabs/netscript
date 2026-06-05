import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { relative } from 'jsr:@std/path@^1.0.0';

export interface Finding {
  readonly path: string;
  readonly line?: number;
  readonly message: string;
}

export interface Options {
  readonly root: string;
  readonly json: boolean;
}

export function parseOptions(defaultRoot = 'packages/cli'): Options {
  let root = defaultRoot;
  let json = false;
  for (let index = 0; index < Deno.args.length; index++) {
    const arg = Deno.args[index];
    if (arg === '--report' && Deno.args[index + 1] === 'json') {
      json = true;
      index++;
    } else if (arg === '--allow' && Deno.args[index + 1]) {
      root = Deno.args[index + 1];
      index++;
    }
  }
  return { root, json };
}

export async function sourceFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for await (
    const entry of walk(root, {
      includeDirs: false,
      exts: ['.ts', '.tsx', '.template'],
      skip: [/node_modules/, /\.git/, /__snapshots__/],
    })
  ) {
    files.push(normalizePath(entry.path));
  }
  return files.sort();
}

export async function textFile(path: string): Promise<string> {
  return await Deno.readTextFile(path);
}

export function normalizePath(path: string): string {
  return path.replaceAll('\\', '/');
}

export function rel(path: string): string {
  return normalizePath(relative(Deno.cwd(), path));
}

export function lineOf(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

export function report(name: string, findings: readonly Finding[], json: boolean): void {
  if (json) {
    console.log(JSON.stringify({ name, ok: findings.length === 0, findings }, null, 2));
  } else if (findings.length === 0) {
    console.log(`${name}: PASS`);
  } else {
    console.error(`${name}: FAIL`);
    for (const finding of findings) {
      const line = finding.line === undefined ? '' : `:${finding.line}`;
      console.error(`${finding.path}${line}: ${finding.message}`);
    }
  }
  if (findings.length > 0) Deno.exit(1);
}

export function isTestOrFixture(path: string): boolean {
  return /(_test|\.test|test-support|fixtures?|testing)\.tsx?$/.test(path) ||
    path.includes('/tests/') ||
    path.includes('/e2e/tests/');
}

export function isCliSource(path: string): boolean {
  return path.startsWith('packages/cli/src/') || path.startsWith('packages/cli/bin/') ||
    path.startsWith('packages/cli/e2e/src/');
}
