#!/usr/bin/env -S deno run --allow-read
/**
 * Fitness gate for CLI mode isolation.
 *
 * It checks static import specifiers in `src/{kernel,public,maintainer}` and
 * fails on public/maintainer crossings or kernel imports into either mode.
 */

const CLI_SRC = 'packages/cli/src';
const MODE_ROOTS = ['kernel', 'public', 'maintainer'] as const;
type Mode = typeof MODE_ROOTS[number];

interface Finding {
  path: string;
  specifier: string;
  reason: string;
}

const findings: Finding[] = [];

for (const mode of MODE_ROOTS) {
  const root = `${CLI_SRC}/${mode}`;
  if (!await exists(root)) continue;

  for await (const path of walk(root)) {
    if (!path.endsWith('.ts')) continue;
    const text = await Deno.readTextFile(path);
    for (const specifier of readImportSpecifiers(text)) {
      const resolved = resolveImport(path, specifier);
      if (resolved === undefined) continue;

      if (mode === 'kernel' && isUnder(resolved, `${CLI_SRC}/public`)) {
        findings.push({ path, specifier, reason: 'kernel imports public' });
      }
      if (mode === 'kernel' && isUnder(resolved, `${CLI_SRC}/maintainer`)) {
        findings.push({ path, specifier, reason: 'kernel imports maintainer' });
      }
      if (mode === 'public' && isUnder(resolved, `${CLI_SRC}/maintainer`)) {
        findings.push({ path, specifier, reason: 'public imports maintainer' });
      }
      if (
        mode === 'maintainer' && isUnder(resolved, `${CLI_SRC}/public`) &&
        !isAllowedMaintainerPublicImport(resolved)
      ) {
        findings.push({ path, specifier, reason: 'maintainer imports public' });
      }
    }
  }
}

if (findings.length === 0) {
  console.log('F-CLI-3/F-CLI-4 mode isolation: PASS');
} else {
  for (const finding of findings) {
    console.error(
      `F-CLI-3/F-CLI-4 mode isolation: FAIL ${finding.path} imports ${finding.specifier} (${finding.reason})`,
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

function readImportSpecifiers(text: string): string[] {
  const specifiers: string[] = [];
  const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const match of text.matchAll(importPattern)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function resolveImport(fromPath: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const base = fromPath.split('/').slice(0, -1).join('/');
  const parts = `${base}/${specifier}`.split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      resolved.pop();
      continue;
    }
    resolved.push(part);
  }
  return resolved.join('/');
}

function isUnder(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}

function isAllowedMaintainerPublicImport(path: string): boolean {
  return path === `${CLI_SRC}/public/adapters/jsr-import-resolver.ts`;
}
