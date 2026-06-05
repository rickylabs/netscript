import { outputText } from '../../presentation/output/default-output.ts';
/**
 * @module infra/windows/tasks-copier
 *
 * Copies task script files from the project's `tasksDir` (and optional extra
 * include paths) into the deploy output's `bin/tasks/` directory.
 *
 * Tasks are polyglot scripts (.ts, .py, .sh, .ps1, .cmd, .exe) invoked at
 * runtime by the workers plugin. Unlike compiled services, they are NOT
 * embedded in binaries — they must be deployed alongside the executables.
 *
 * Supports:
 *   - Auto-discovery from `netscript.config.ts` `workers.tasksDir` and `tasks.tasksDir`
 *   - `--include-tasks` flag to add extra task files/directories
 *   - `--exclude-tasks` flag to skip specific task files
 */

import { basename, extname, join, resolve } from '@std/path';
import { exists } from '@std/fs';
import { gray, green as _green, yellow as _yellow } from '@std/fmt/colors';

// ============================================================================
// TYPES
// ============================================================================

/** Options for copying task files to the deploy output. */
export interface TaskCopyOptions {
  /** Absolute path to the project root. */
  projectRoot: string;
  /** Absolute path to the deploy bin/ directory. */
  binDir: string;
  /** Task directories to scan (from config — relative to projectRoot). */
  tasksDirs: string[];
  /** Extra file or directory paths to include (from --include-tasks flag). */
  includePaths?: string[];
  /** Task file basenames to exclude (from --exclude-tasks flag). */
  excludeNames?: string[];
  /** Print detailed output. */
  verbose?: boolean;
}

/** Result of the task copy operation. */
export interface TaskCopyResult {
  /** Number of files copied. */
  copied: number;
  /** Number of files skipped (excluded or already up to date). */
  skipped: number;
  /** Files that failed to copy. */
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * File extensions recognized as task scripts.
 * Anything outside this set is ignored during directory scans.
 */
const TASK_EXTENSIONS = new Set([
  '.ts',
  '.js',
  '.py',
  '.sh',
  '.ps1',
  '.cmd',
  '.bat',
  '.exe',
  '.mjs',
]);

/**
 * Filenames that are never copied — internal infrastructure, not tasks.
 */
const ALWAYS_EXCLUDED = new Set([
  '_registry.ts',
  'mod.ts',
  'types.ts',
  'deno.json',
  'tsconfig.json',
]);

/** Subdirectory name within `bin/` where task files are placed. */
export const TASKS_OUTPUT_DIR = 'tasks';

// ============================================================================
// CORE
// ============================================================================

/**
 * Discover all task files in a directory (non-recursive).
 *
 * @param dir       Absolute path to scan
 * @param exclude   Set of basenames to skip
 * @returns         Array of absolute file paths
 */
async function discoverTaskFiles(
  dir: string,
  exclude: Set<string>,
): Promise<string[]> {
  const files: string[] = [];

  try {
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile) continue;
      if (entry.name.startsWith('.')) continue;
      if (ALWAYS_EXCLUDED.has(entry.name)) continue;
      if (exclude.has(entry.name)) continue;
      if (exclude.has(stripExtension(entry.name))) continue;

      const ext = extname(entry.name).toLowerCase();
      if (!TASK_EXTENSIONS.has(ext)) continue;

      files.push(join(dir, entry.name));
    }
  } catch (error: unknown) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }

  return files.sort();
}

/**
 * Remove the file extension from a filename.
 */
function stripExtension(name: string): string {
  const ext = extname(name);
  return ext ? name.slice(0, -ext.length) : name;
}

/**
 * Check whether a source file should be copied to the destination.
 * Returns true if the destination doesn't exist or the source is newer/different size.
 */
async function shouldCopy(src: string, dst: string): Promise<boolean> {
  try {
    const [srcStat, dstStat] = await Promise.all([Deno.stat(src), Deno.stat(dst)]);
    if (srcStat.size !== dstStat.size) return true;
    if (srcStat.mtime && dstStat.mtime && srcStat.mtime > dstStat.mtime) return true;
    return false;
  } catch {
    return true; // destination doesn't exist
  }
}

/**
 * Copy task script files from configured directories into `bin/tasks/`.
 *
 * Called by the build pipeline after binary compilation. The `bin/tasks/`
 * directory mirrors the source `tasksDir` structure (flat — no nesting).
 *
 * @returns Result with counts and any errors encountered.
 */
export async function copyTaskFiles(options: TaskCopyOptions): Promise<TaskCopyResult> {
  const {
    projectRoot,
    binDir,
    tasksDirs,
    includePaths = [],
    excludeNames = [],
    verbose = false,
  } = options;

  const outputDir = join(binDir, TASKS_OUTPUT_DIR);
  await Deno.mkdir(outputDir, { recursive: true });

  const excludeSet = new Set(excludeNames.map((n) => n.trim()).filter(Boolean));
  const result: TaskCopyResult = { copied: 0, skipped: 0, errors: [] };
  const seen = new Set<string>(); // track basenames to avoid duplicates

  // ── Phase 1: Scan configured task directories ──────────────────────────
  for (const relDir of tasksDirs) {
    const absDir = resolve(projectRoot, relDir);
    if (!(await exists(absDir))) {
      if (verbose) {
        outputText(gray(`   → tasks dir not found: ${relDir} — skipping`));
      }
      continue;
    }

    const files = await discoverTaskFiles(absDir, excludeSet);
    for (const srcPath of files) {
      const name = basename(srcPath);
      if (seen.has(name)) {
        if (verbose) {
          outputText(gray(`   → duplicate: ${name} — already copied from earlier dir`));
        }
        result.skipped++;
        continue;
      }
      seen.add(name);

      const dstPath = join(outputDir, name);
      try {
        if (await shouldCopy(srcPath, dstPath)) {
          await Deno.copyFile(srcPath, dstPath);
          result.copied++;
          if (verbose) {
            outputText(`   📄 ${name}`);
          }
        } else {
          result.skipped++;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push(`${name}: ${msg}`);
      }
    }
  }

  // ── Phase 2: Process explicit include paths ────────────────────────────
  for (const rawPath of includePaths) {
    const absPath = resolve(projectRoot, rawPath.trim());
    try {
      const stat = await Deno.stat(absPath);

      if (stat.isDirectory) {
        // Include all task files from directory
        const files = await discoverTaskFiles(absPath, excludeSet);
        for (const srcPath of files) {
          const name = basename(srcPath);
          if (seen.has(name)) {
            result.skipped++;
            continue;
          }
          seen.add(name);

          const dstPath = join(outputDir, name);
          try {
            if (await shouldCopy(srcPath, dstPath)) {
              await Deno.copyFile(srcPath, dstPath);
              result.copied++;
              if (verbose) {
                outputText(`   📄 ${name} (included from ${rawPath})`);
              }
            } else {
              result.skipped++;
            }
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            result.errors.push(`${name}: ${msg}`);
          }
        }
      } else if (stat.isFile) {
        // Include single file
        const name = basename(absPath);
        if (seen.has(name) || excludeSet.has(name) || excludeSet.has(stripExtension(name))) {
          result.skipped++;
          continue;
        }
        seen.add(name);

        const dstPath = join(outputDir, name);
        try {
          if (await shouldCopy(absPath, dstPath)) {
            await Deno.copyFile(absPath, dstPath);
            result.copied++;
            if (verbose) {
              outputText(`   📄 ${name} (included from ${rawPath})`);
            }
          } else {
            result.skipped++;
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          result.errors.push(`${name}: ${msg}`);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        result.errors.push(`include path not found: ${rawPath}`);
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push(`${rawPath}: ${msg}`);
      }
    }
  }

  return result;
}
