import { extname, relative } from '@std/path';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { DbEngine } from '../../domain/db-engine.ts';

/** Return true when the init options selected a concrete database engine. */
export function isDbEngine(value: ValidatedInitOptions['dbEngine']): value is DbEngine {
  return value !== 'none';
}

/** Empty scaffold phase result for skipped phases. */
export function emptyScaffoldResult(): ScaffoldResult {
  return {
    filesCreated: [],
    directoriesCreated: [],
    filesSkipped: [],
    totalOperations: 0,
    durationMs: 0,
  };
}

/** Adjust a local package base for a nested generated workspace member. */
export function adjustLocalBase(localBase: string, depth: number): string {
  return '../'.repeat(depth) + localBase;
}

const FORMATTABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.json',
  '.jsonc',
  '.md',
  '.css',
]);

/** Collect scaffold-owned files that should be passed to deno fmt. */
export function collectFormattableScaffoldFiles(
  targetPath: string,
  phases: readonly ScaffoldResult[],
): string[] {
  const files = new Set<string>();
  for (const phase of phases) {
    for (const absolutePath of phase.filesCreated) {
      const relativePath = relative(targetPath, absolutePath);
      if (!relativePath || relativePath.startsWith('..')) continue;
      const normalizedPath = relativePath.replaceAll('\\', '/');
      if (
        normalizedPath.startsWith('packages/') ||
        normalizedPath.startsWith('aspire/node_modules/') ||
        normalizedPath.startsWith('aspire/.aspire/')
      ) continue;
      if (!FORMATTABLE_EXTENSIONS.has(extname(normalizedPath).toLowerCase())) continue;
      files.add(normalizedPath);
    }
  }
  return [...files];
}
