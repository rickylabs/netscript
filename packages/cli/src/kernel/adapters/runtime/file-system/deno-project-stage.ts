import { ensureDir, walk } from '@std/fs';
import { basename, dirname, join, relative, resolve } from '@std/path';
import { parseTree } from 'jsonc-parser';
import type { ProjectStage, ProjectStagePort } from '../../../ports/project-stage-port.ts';
import { copyFilePortable } from './deno-file-system.ts';
import { relocateDenoConfig, relocateInstallMetadata } from './relocate-deno-config.ts';

// Keep generated control files, but omit dependency, VCS and runtime/build trees.
const SKIPPED = new Set([
  '.git',
  '.hg',
  '.svn',
  '.data',
  'node_modules',
  '.aspire',
  '.deno',
  'vendor',
]);

/** Deno staging adapter; copies bytes rather than linking to the live installation. */
export class DenoProjectStage implements ProjectStagePort {
  /** Copy the project into an isolated tree and return its commit/disposal operations. */
  async stage(projectRoot: string): Promise<ProjectStage> {
    const liveRoot = resolve(projectRoot);
    const container = await Deno.makeTempDir({ prefix: 'netscript-plugin-update-' });
    // Generators may use the directory name as a fallback project name.
    const root = join(container, basename(liveRoot));
    const original = new Set<string>();
    const configs = new Map<string, readonly [string, string]>();
    try {
      await ensureDir(root);
      for await (
        const entry of walk(liveRoot, {
          includeSymlinks: false,
          followSymlinks: false,
          // Avoid copying our own stage if TMPDIR is inside the project.
          skip: [...skipPaths(liveRoot), new RegExp(`^${escapePattern(container)}(?:[/\\\\]|$)`)],
        })
      ) {
        const path = relative(liveRoot, entry.path);
        const target = join(root, path);
        if (entry.isDirectory) {
          await ensureDir(target);
          continue;
        }
        if (!entry.isFile) continue;
        original.add(path);
        await ensureDir(dirname(target));
        await copyFilePortable(join(liveRoot, path), target);
      }
      await relocateConfigs(root, liveRoot, root, configs);
    } catch (error) {
      await Deno.remove(container, { recursive: true });
      throw error;
    }
    return {
      root,
      commit: async () => {
        // Finish every relocation before the first live write, including newly generated imports.
        await relocateConfigs(root, root, liveRoot, configs);
        const remaining = new Set(original);
        for await (const path of files(root)) {
          remaining.delete(path);
          const source = join(root, path);
          const target = join(liveRoot, path);
          if (await identical(source, target)) continue;
          await ensureDir(dirname(target));
          await copyFilePortable(source, target);
        }
        for (const path of remaining) await Deno.remove(join(liveRoot, path));
      },
      dispose: () => Deno.remove(container, { recursive: true }),
    };
  }
}

async function* files(root: string): AsyncIterable<string> {
  for await (
    const entry of walk(root, {
      includeDirs: false,
      includeSymlinks: false,
      followSymlinks: false,
      skip: skipPaths(root),
    })
  ) {
    if (entry.isFile) yield relative(root, entry.path);
  }
}

function skipPaths(root: string): RegExp[] {
  const prefix = escapePattern(root);
  const skipped = [...SKIPPED].map((name) =>
    new RegExp(`^${prefix}[/\\\\](?:.*[/\\\\])?${escapePattern(name)}(?:[/\\\\]|$)`)
  );
  // The maintained AppHost lives under aspire; preserve authored bin/obj/build/dist elsewhere.
  skipped.push(new RegExp(`^${prefix}[/\\\\]aspire[/\\\\](?:.*[/\\\\])?(?:bin|obj)(?:[/\\\\]|$)`));
  return skipped;
}

async function relocateConfigs(
  root: string,
  sourceRoot: string,
  destinationRoot: string,
  originals: Map<string, readonly [string, string]>,
): Promise<void> {
  const paths = new Set<string>();
  for await (const path of files(root)) {
    if (['deno.json', 'deno.jsonc', 'scaffold.plugin.json'].includes(basename(path))) {
      paths.add(path);
    }
  }
  const relocateConfig = (text: string, path: string) => {
    const initial = originals.get(path);
    return initial && text === initial[1]
      ? initial[0]
      : relocateDenoConfig(text, path, sourceRoot, destinationRoot);
  };
  for (const path of paths) {
    const target = join(root, path);
    const text = await Deno.readTextFile(target);
    // An in-project external import-map file needs the same relocation as inline imports.
    const tree = parseTree(text);
    const importMap: unknown = tree?.children?.find((node) =>
      node.children?.[0]?.value === 'importMap'
    )?.children?.[1]?.value;
    if (typeof importMap === 'string' && !/^[a-z]+:/i.test(importMap)) {
      const mapPath = relative(sourceRoot, resolve(sourceRoot, dirname(path), importMap));
      if (mapPath !== '..' && !mapPath.startsWith('../') && !mapPath.startsWith('..\\')) {
        paths.add(mapPath);
      }
    }
    const initial = originals.get(path);
    const relocated = initial && text === initial[1]
      ? initial[0]
      : basename(path) === 'scaffold.plugin.json'
      ? relocateInstallMetadata(text, relocateConfig)
      : relocateConfig(text, path);
    if (!initial) originals.set(path, [text, relocated]);
    if (text !== relocated) await Deno.writeTextFile(target, relocated);
  }
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
