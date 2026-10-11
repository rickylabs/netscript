import { join } from '@std/path';
const MAX_FILE_BYTES = 16 * 1024 * 1024;
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
