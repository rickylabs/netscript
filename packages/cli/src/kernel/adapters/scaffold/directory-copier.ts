/**
 * @module infra/scaffold/directory-copier
 *
 * Filtered recursive copy helper shared by local package and plugin source
 * materialization.
 */

import { ensureDir, walk } from "@std/fs";
import { dirname, join, relative } from "@std/path";
import { copyFilePortable } from "../runtime/file-system/deno-file-system.ts";

/** Options for recursively copying a directory with scaffold filters. */
export interface CopyDirectoryFilteredOptions {
  /** Source directory. */
  readonly source: string;
  /** Destination directory. */
  readonly dest: string;
  /** Directory names to skip at any depth. */
  readonly skipDirs: readonly string[];
  /** File suffixes to skip. */
  readonly skipFileSuffixes: readonly string[];
  /** Whether existing destination files should be overwritten. */
  readonly overwrite?: boolean;
}

/** Result of a filtered recursive copy. */
export interface CopyDirectoryFilteredResult {
  /** Directories created or ensured. */
  readonly directoriesCreated: readonly string[];
  /** Files copied. */
  readonly filesCreated: readonly string[];
  /** Files skipped because they already existed or matched a filter. */
  readonly filesSkipped: readonly string[];
}

/** Recursively copy `source` to `dest`, applying scaffold filters. */
export async function copyDirectoryFiltered(
  options: CopyDirectoryFilteredOptions,
): Promise<CopyDirectoryFilteredResult> {
  const directoriesCreated: string[] = [];
  const filesCreated: string[] = [];
  const filesSkipped: string[] = [];

  await copyDirectoryFilteredInto(
    options.source,
    options.dest,
    {
      skipDirs: options.skipDirs,
      skipFileSuffixes: options.skipFileSuffixes,
      overwrite: options.overwrite ?? true,
    },
    directoriesCreated,
    filesCreated,
    filesSkipped,
  );

  return {
    directoriesCreated,
    filesCreated,
    filesSkipped,
  };
}

async function copyDirectoryFilteredInto(
  source: string,
  dest: string,
  options: Required<
    Pick<
      CopyDirectoryFilteredOptions,
      "skipDirs" | "skipFileSuffixes" | "overwrite"
    >
  >,
  directoriesCreated: string[],
  filesCreated: string[],
  filesSkipped: string[],
): Promise<void> {
  await ensureDir(dest);
  directoriesCreated.push(dest);

  for await (
    const entry of walk(source, {
      includeSymlinks: false,
      skip: options.skipDirs.map((dir) =>
        new RegExp(`(^|[\\\\/])${RegExp.escape(dir)}([\\\\/]|$)`)
      ),
    })
  ) {
    const rel = relative(source, entry.path);
    if (rel === "") {
      continue;
    }

    const dst = join(dest, rel);

    if (entry.isDirectory) {
      await ensureDir(dst);
      directoriesCreated.push(dst);
      continue;
    }

    if (
      options.skipFileSuffixes.some((suffix) => entry.name.endsWith(suffix))
    ) {
      filesSkipped.push(dst);
      continue;
    }

    if (!options.overwrite) {
      try {
        await Deno.stat(dst);
        filesSkipped.push(dst);
        continue;
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    }

    await ensureDir(dirname(dst));
    await copyFilePortable(entry.path, dst);
    filesCreated.push(dst);
  }
}
