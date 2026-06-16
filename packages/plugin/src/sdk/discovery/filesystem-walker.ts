import type { WalkedFile, WalkerPort } from './ports/walker-port.ts';

const DEFAULT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs']);
const SKIPPED_SEGMENTS = new Set([
  '.data',
  '.git',
  '.netscript',
  'node_modules',
  'dist',
  'build',
  'coverage',
]);

/** Filesystem walker for plugin source discovery. */
export class FilesystemWalker implements WalkerPort {
  /** Walk source files under a root directory. */
  async walk(root: string): Promise<readonly WalkedFile[]> {
    const files: WalkedFile[] = [];
    await walkDirectory(root.replace(/[\\/]$/, ''), '', files);
    return files.sort((left, right) => left.path.localeCompare(right.path));
  }
}

async function walkDirectory(
  root: string,
  relativeDir: string,
  files: WalkedFile[],
): Promise<void> {
  const directory = relativeDir === '' ? root : `${root}/${relativeDir}`;
  for await (const entry of Deno.readDir(directory)) {
    const path = `${directory}/${entry.name}`;
    const relativePath = relativeDir === '' ? entry.name : `${relativeDir}/${entry.name}`;
    if (shouldSkip(relativePath, entry.name)) continue;

    if (entry.isDirectory) {
      await walkDirectory(root, relativePath, files);
      continue;
    }

    if (!entry.isFile || !isSourceFile(entry.name)) continue;
    files.push({
      path: relativePath,
      text: await Deno.readTextFile(path),
    });
  }
}

function shouldSkip(relativePath: string, name: string): boolean {
  if (SKIPPED_SEGMENTS.has(name)) return true;
  return relativePath.split(/[\\/]/).some((segment) => SKIPPED_SEGMENTS.has(segment));
}

function isSourceFile(name: string): boolean {
  return DEFAULT_EXTENSIONS.has(name.slice(name.lastIndexOf('.')));
}
