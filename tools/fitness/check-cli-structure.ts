#!/usr/bin/env -S deno run --allow-read
/**
 * Fitness gate for forbidden CLI structure markers.
 */

const ROOT = 'packages/cli/src';
const PHASE_10_FORBIDDEN_PATHS = [
  'packages/cli/src/shared',
  'packages/cli/src/kernel/commands',
  'packages/cli/src/kernel/capabilities',
  'packages/cli/src/kernel/config',
  'packages/cli/src/kernel/core',
  'packages/cli/src/kernel/types',
  'packages/cli/src/kernel/errors.ts',
  'packages/cli/src/maintainer/capabilities',
] as const;

interface Finding {
  path: string;
  gate: 'F-CLI-12' | 'F-CLI-13';
  note: string;
}

const findings: Finding[] = [];

for (const path of PHASE_10_FORBIDDEN_PATHS) {
  try {
    await Deno.stat(path);
    findings.push({
      path,
      gate: 'F-CLI-13',
      note: 'Phase 10 forbidden path still exists',
    });
  } catch {
    // Expected: the path is absent.
  }
}

for await (const path of walk(ROOT)) {
  if (path.endsWith('/interfaces')) {
    findings.push({
      path,
      gate: 'F-CLI-12',
      note: 'interfaces directories are forbidden; use ports',
    });
  }

  if (path.endsWith('/_shared.ts')) {
    findings.push({
      path,
      gate: 'F-CLI-13',
      note: '_shared.ts files are forbidden compatibility buckets',
    });
  }
}

if (findings.length === 0) {
  console.log('F-CLI-12/F-CLI-13 forbidden structure: PASS');
} else {
  for (const finding of findings) {
    console.error(`${finding.gate} forbidden structure: FAIL ${finding.path} - ${finding.note}`);
  }
  Deno.exit(1);
}

async function* walk(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield path;
      yield* walk(path);
      continue;
    }
    if (entry.isFile) yield path;
  }
}
