import { relative } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';

/** Exact pre-command state for one owned project path. */
export type ProjectPathSnapshot =
  | { readonly kind: 'absent'; readonly path: string }
  | { readonly content: string; readonly kind: 'file'; readonly path: string }
  | {
    readonly directories: readonly string[];
    readonly files: Readonly<Record<string, string>>;
    readonly kind: 'directory';
    readonly path: string;
  };

/** Capture owned removal paths before dispatch or mutation. */
export async function captureProjectPaths(
  paths: readonly string[],
  fs: FileSystemPort,
): Promise<readonly ProjectPathSnapshot[]> {
  const snapshots: ProjectPathSnapshot[] = [];
  for (const path of new Set(paths)) {
    if (!await fs.exists(path)) {
      snapshots.push({ kind: 'absent', path });
      continue;
    }
    const info = await fs.stat(path);
    if (info.isFile) {
      snapshots.push({ content: await fs.readFile(path), kind: 'file', path });
      continue;
    }
    const directories: string[] = [];
    const files: Record<string, string> = {};
    for await (const entry of fs.walk(path)) {
      const child = relative(path, entry.path);
      if (child.length === 0) continue;
      if (entry.isDirectory) directories.push(child);
      if (entry.isFile) files[child] = await fs.readFile(entry.path);
    }
    snapshots.push({ directories, files, kind: 'directory', path });
  }
  return snapshots;
}

/** Restore every owned path exactly to its captured pre-command state. */
export async function restoreProjectPaths(
  snapshots: readonly ProjectPathSnapshot[],
  fs: FileSystemPort,
): Promise<void> {
  for (const snapshot of snapshots) {
    if (await fs.exists(snapshot.path)) await fs.remove(snapshot.path);
    if (snapshot.kind === 'absent') continue;
    if (snapshot.kind === 'file') {
      await fs.writeFile(snapshot.path, snapshot.content);
      continue;
    }
    await fs.createDir(snapshot.path);
    for (const directory of [...snapshot.directories].sort(pathDepthOrder)) {
      await fs.createDir(`${snapshot.path}/${directory}`);
    }
    for (const [path, content] of Object.entries(snapshot.files)) {
      await fs.writeFile(`${snapshot.path}/${path}`, content);
    }
  }
}

function pathDepthOrder(left: string, right: string): number {
  return left.split(/[\\/]/).length - right.split(/[\\/]/).length || left.localeCompare(right);
}
