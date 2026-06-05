/**
 * @module maintainer/adapters/monorepo-detector
 *
 * Detects whether a scaffold target is nested inside a NetScript monorepo
 * checkout and, if so, computes a `localBase` relative path suitable for
 * `workspace-source` mode.
 *
 * This lets maintainer-only workflows locate a local framework checkout for
 * explicit `netscript-dev` commands without exposing monorepo detection to the
 * public CLI surface.
 *
 * ## Detection heuristic
 *
 * Starting from the resolved target directory, we walk up the filesystem
 * looking for a directory that contains ALL of:
 *   - `packages/service/mod.ts`
 *   - `packages/fresh/mod.ts`
 *   - `packages/sdk/mod.ts`
 *
 * The first ancestor matching all three markers is the monorepo root.
 *
 * @example
 * ```typescript
 * const root = await detectMonorepoRoot('/repo/output/test-app/scaffold/my-app');
 * // => '/repo/output/test-app' (if packages/ exists there)
 * ```
 */

import { dirname, relative, resolve } from '@std/path';

/** Path fragments that together identify a NetScript monorepo root. */
const MONOREPO_MARKERS: readonly string[] = [
  'packages/service/mod.ts',
  'packages/fresh/mod.ts',
  'packages/sdk/mod.ts',
];

/**
 * Walk up from `startDir` looking for a NetScript monorepo root.
 *
 * A directory qualifies when it contains every path in {@link MONOREPO_MARKERS}.
 * Returns the first matching ancestor or `undefined` if none is found before
 * hitting the filesystem root.
 *
 * @param startDir - Absolute directory to start the search from.
 * @returns Absolute path of the monorepo root, or `undefined`.
 */
export async function detectMonorepoRoot(
  startDir: string,
): Promise<string | undefined> {
  let current = resolve(startDir);
  // Guard against infinite loops on malformed paths.
  let previous = '';

  while (current !== previous) {
    if (await isMonorepoRoot(current)) {
      return current;
    }
    previous = current;
    current = dirname(current);
  }

  return undefined;
}

/**
 * Checks whether `dir` contains all {@link MONOREPO_MARKERS}.
 */
async function isMonorepoRoot(dir: string): Promise<boolean> {
  for (const marker of MONOREPO_MARKERS) {
    try {
      const stat = await Deno.stat(`${dir}/${marker}`);
      if (!stat.isFile) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Compute a POSIX-style relative path from `from` to `to`, suitable for use
 * in a `deno.json` import map value. Uses forward slashes on all platforms.
 *
 * @param from - Absolute path of the scaffold target directory.
 * @param to   - Absolute path of the monorepo root.
 * @returns Relative POSIX path (e.g. `'../..'`).
 */
export function computeLocalBase(from: string, to: string): string {
  const rel = relative(from, to);
  // Normalise backslashes to forward slashes so Windows-generated deno.json
  // files remain portable.
  return rel.replaceAll('\\', '/') || '.';
}
