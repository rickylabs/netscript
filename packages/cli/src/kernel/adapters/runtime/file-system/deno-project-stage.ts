import { ensureDir, walk } from '@std/fs';
import { dirname, join, relative } from '@std/path';
import type { ProjectStage, ProjectStagePort } from '../../../ports/project-stage-port.ts';
import { copyFilePortable } from './deno-file-system.ts';

// Keep generated control files, but omit dependency, VCS and runtime/build trees.
const SKIPPED = new Set([
  '.git',
  '.hg',
  '.svn',
  '.data',
  'node_modules',
  'dist',
  'build',
  'coverage',
]);
const SKIP_PATHS = [...SKIPPED].map((name) =>
  new RegExp(`(?:^|[/\\\\])${name.replaceAll('.', '\\.')}(?:[/\\\\]|$)`)
);

/** Deno staging adapter; copies bytes rather than linking to the live installation. */
export class DenoProjectStage implements ProjectStagePort {
  /** Copy the project into an isolated tree and return its commit/disposal operations. */
  async stage(projectRoot: string): Promise<ProjectStage> {
    const root = await Deno.makeTempDir({ prefix: 'netscript-plugin-update-' });
    const original = new Set<string>();
    try {
      for await (
        const entry of walk(projectRoot, {
          includeSymlinks: false,
          followSymlinks: false,
          skip: SKIP_PATHS,
        })
      ) {
        const path = relative(projectRoot, entry.path);
        const target = join(root, path);
        if (entry.isDirectory) {
          await ensureDir(target);
          continue;
        }
        if (!entry.isFile) continue;
        original.add(path);
        await ensureDir(dirname(target));
        await copyFilePortable(join(projectRoot, path), target);
      }
    } catch (error) {
      await Deno.remove(root, { recursive: true });
      throw error;
    }
    return {
      root,
      commit: async () => {
        const remaining = new Set(original);
        for await (const path of files(root)) {
          remaining.delete(path);
          const source = join(root, path);
          const target = join(projectRoot, path);
          if (await identical(source, target)) continue;
          await ensureDir(dirname(target));
          await copyFilePortable(source, target);
        }
        for (const path of remaining) await Deno.remove(join(projectRoot, path));
      },
      dispose: () => Deno.remove(root, { recursive: true }),
    };
  }
}

async function* files(root: string): AsyncIterable<string> {
  for await (
    const entry of walk(root, {
      includeDirs: false,
      includeSymlinks: false,
      followSymlinks: false,
      skip: SKIP_PATHS,
    })
  ) {
    if (entry.isFile) yield relative(root, entry.path);
  }
}

// Compare one file at a time with bounded buffers; unchanged files keep their original bytes/mtime.
async function identical(left: string, right: string): Promise<boolean> {
  let rightFile: Deno.FsFile;
  try {
    rightFile = await Deno.open(right, { read: true });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
  using rightHandle = rightFile;
  using leftHandle = await Deno.open(left, { read: true });
  if ((await leftHandle.stat()).size !== (await rightHandle.stat()).size) return false;
  const leftBuffer = new Uint8Array(64 * 1024);
  const rightBuffer = new Uint8Array(leftBuffer.length);
  while (true) {
    const length = await leftHandle.read(leftBuffer);
    if (length === null) return true;
    let offset = 0;
    while (offset < length) {
      const count = await rightHandle.read(rightBuffer.subarray(offset, length));
      if (count === null) return false;
      offset += count;
    }
    for (let index = 0; index < length; index++) {
      if (leftBuffer[index] !== rightBuffer[index]) return false;
    }
  }
}
