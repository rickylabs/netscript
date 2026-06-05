#!/usr/bin/env -S deno run --allow-read
/**
 * Fitness gate for public/kernel leakage of maintainer-only vocabulary.
 */

const ROOTS = ['packages/cli/src/public', 'packages/cli/src/kernel'];
const MARKERS = [
  '--local',
  '--source local',
  '--monorepo-root',
  '--copy-local-packages',
  'ImportMode',
  'auto-detect',
  'detectMonorepo',
  'monorepoRoot',
  'copyLocalPackages',
  'SCAFFOLD_LOCAL_PACKAGES',
  'SCAFFOLD_ENGINE_LOCAL_PACKAGES',
] as const;

interface Finding {
  path: string;
  line: number;
  marker: string;
}

const findings: Finding[] = [];

for (const root of ROOTS) {
  if (!await exists(root)) continue;
  for await (const path of walk(root)) {
    if (!path.endsWith('.ts') && !path.endsWith('.md')) continue;
    const lines = (await Deno.readTextFile(path)).split(/\r?\n/);
    lines.forEach((text, index) => {
      for (const marker of MARKERS) {
        if (text.includes(marker)) {
          findings.push({ path, line: index + 1, marker });
        }
      }
    });
  }
}

if (findings.length === 0) {
  console.log('F-CLI-11 public/kernel leak markers: PASS');
} else {
  for (const finding of findings) {
    console.error(
      `F-CLI-11 public/kernel leak markers: FAIL ${finding.path}:${finding.line} contains ${finding.marker}`,
    );
  }
  Deno.exit(1);
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

async function* walk(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walk(path);
      continue;
    }
    if (entry.isFile) yield path;
  }
}
