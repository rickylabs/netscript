#!/usr/bin/env -S deno run --allow-read
/**
 * Fitness gate for `packages/cli` file size limits.
 *
 * No accepted debt remains after the CLI doctrine rewrite lock-in.
 */

const TARGET_ROOT = 'packages/cli';
const TARGET_LIMIT = 350;
const HARD_LIMIT = 500;

interface Finding {
  path: string;
  lines: number;
  limit: number;
}

const findings: Finding[] = [];

for await (const path of walk(TARGET_ROOT)) {
  if (!path.endsWith('.ts') && !path.endsWith('.md')) continue;
  if (path.endsWith('_test.ts') || path.endsWith('.test.ts') || path.includes('/tests/')) continue;
  if (path.includes('/src/templates/') && path.endsWith('.template')) continue;

  const text = await Deno.readTextFile(path);
  const lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
  const limit = path.includes('/presentation/') ? 150 : TARGET_LIMIT;
  const hardViolation = lines > HARD_LIMIT;
  const targetViolation = lines > limit;
  if (!targetViolation && !hardViolation) continue;

  findings.push({
    path,
    lines,
    limit: hardViolation ? HARD_LIMIT : limit,
  });
}

printFindings('F-CLI-1/F-CLI-2 file size', findings);

if (findings.length > 0) {
  Deno.exit(1);
}

async function* walk(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      if (entry.name === 'node_modules') continue;
      yield* walk(path);
      continue;
    }
    if (entry.isFile) {
      yield path;
    }
  }
}

function printFindings(title: string, items: readonly Finding[]): void {
  if (items.length === 0) {
    console.log(`${title}: PASS`);
    return;
  }

  for (const item of items) {
    console.error(`${title}: FAIL ${item.path} (${item.lines} lines > ${item.limit})`);
  }
}
