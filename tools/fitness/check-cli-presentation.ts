#!/usr/bin/env -S deno run --allow-read
/**
 * Fitness gate for CLI presentation and composition boundaries.
 */

const PRESENTATION_ROOTS = [
  'packages/cli/src/public/presentation',
  'packages/cli/src/maintainer/presentation',
];
const COMPOSITION_ROOTS = [
  {
    mode: 'public',
    path: 'packages/cli/src/public/composition',
    expected: 'create-public-cli.ts',
    closes: 'slice 17',
  },
  {
    mode: 'maintainer',
    path: 'packages/cli/src/maintainer/composition',
    expected: 'create-maintainer-cli.ts',
    closes: 'slice 25',
  },
];
const BINARY_LIMIT = 60;

interface Finding {
  message: string;
}

const findings: Finding[] = [];

for (const root of PRESENTATION_ROOTS) {
  if (!await exists(root)) continue;
  for await (const path of walk(root)) {
    if (!path.endsWith('.ts')) continue;
    const text = await Deno.readTextFile(path);
    const lines = countLines(text);
    if (lines > 150) {
      findings.push({
        status: 'FAIL',
        message: `${path} has ${lines} lines; presentation limit is 150`,
      });
    }
    if (text.includes('Deno.')) {
      findings.push({
        status: 'FAIL',
        message: `${path} calls Deno.* from presentation`,
      });
    }
  }
}

for (const root of COMPOSITION_ROOTS) {
  const files = await listTsFiles(root.path);
  const createFiles = files.filter((path) => path.includes('/create-'));
  if (createFiles.length === 0) {
    findings.push({
      message: `${root.mode} composition root not created; planned closure was ${root.closes}`,
    });
  } else if (
    createFiles.length !== 1 || !createFiles[0].endsWith(`/${root.expected}`)
  ) {
    findings.push({
      message: `${root.mode} composition root must be exactly ${root.expected}; found ${
        createFiles.join(', ')
      }`,
    });
  }
}

for (const binary of ['packages/cli/bin/netscript.ts', 'packages/cli/bin/netscript-dev.ts']) {
  if (!await exists(binary)) continue;
  const lines = countLines(await Deno.readTextFile(binary));
  if (lines > BINARY_LIMIT) {
    findings.push({
      status: 'FAIL',
      message: `${binary} has ${lines} lines; binary limit is ${BINARY_LIMIT}`,
    });
  }
}

if (findings.length === 0) {
  console.log('F-CLI-5/F-CLI-6 presentation and composition: PASS');
} else {
  for (const finding of findings) {
    console.error(`F-CLI-5/F-CLI-6 presentation and composition: FAIL ${finding.message}`);
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

async function listTsFiles(root: string): Promise<string[]> {
  if (!await exists(root)) return [];
  const files: string[] = [];
  for await (const path of walk(root)) {
    if (path.endsWith('.ts')) files.push(path);
  }
  return files;
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

function countLines(text: string): number {
  return text.length === 0 ? 0 : text.split(/\r?\n/).length;
}
