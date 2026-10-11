import { join } from '@std/path';
const MAX_FILE_BYTES = 16 * 1024 * 1024;
/** Reject linked paths before following authored inputs or generated outputs. */
export async function rejectInspectionLinks(projectRoot: string, path: string): Promise<void> {
  const components = path.split('/');
  for (let count = 1; count <= components.length; count++) {
    try {
      if ((await Deno.lstat(join(projectRoot, ...components.slice(0, count)))).isSymlink) {
        throw new Error('Linked paths cannot prove generated ownership.');
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return;
      throw error;
    }
  }
}

/** Read exact bytes with a fixed bound, including protection against growth during the read. */
export async function readInspectionFile(
  projectRoot: string,
  path: string,
): Promise<Uint8Array | undefined> {
  await rejectInspectionLinks(projectRoot, path);
  try {
    const file = await Deno.open(join(projectRoot, path), { read: true });
    try {
      const info = await file.stat();
      if (!info.isFile || info.size > MAX_FILE_BYTES) throw new Error('Invalid inspection file.');
      // Read at most the declared bound even if a file grows after stat.
      const bytes = new Uint8Array(info.size + 1);
      let count = 0;
      while (count < bytes.length) {
        const read = await file.read(bytes.subarray(count));
        if (read === null) return bytes.slice(0, count);
        count += read;
      }
      throw new Error('Inspection input grew while reading.');
    } finally {
      file.close();
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

/** Bound the authored source tree before a plugin selector can allocate from its files. */
export async function validateInspectionDirectories(
  projectRoot: string,
  paths: readonly string[],
): Promise<void> {
  const pending = [...new Set(paths)];
  const visited = new Set<string>();
  let count = 0;
  let bytes = 0;
  while (pending.length) {
    const path = pending.pop()!;
    if (visited.has(path)) continue;
    visited.add(path);
    await rejectInspectionLinks(projectRoot, path);
    try {
      for await (const entry of Deno.readDir(join(projectRoot, path))) {
        if (++count > 4096) throw new Error('Plugin source tree capacity exceeded.');
        const child = `${path}/${entry.name}`;
        if (entry.isSymlink) throw new Error('Linked plugin source cannot prove ownership.');
        if (entry.isDirectory) pending.push(child);
        else {
          const info = await Deno.lstat(join(projectRoot, child));
          if (!info.isFile || (bytes += info.size) > MAX_FILE_BYTES) {
            throw new Error('Plugin source byte capacity exceeded.');
          }
        }
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
}
