import { isAbsolute, relative, resolve } from '@std/path';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import type { UiRegistryPathPort } from '../../../ports/ui-registry-port.ts';

/** An application write plan shared by registry and the existing token builder. */
export interface UiWritePlan {
  readonly fs: FileSystemPort;
  readonly writes: Map<string, string>;
  readonly removals: Set<string>;
  /** Validate all physical destinations before executing any planned mutation. */
  commit(paths?: UiRegistryPathPort): Promise<void>;
}

/** Stage injected filesystem effects so conflicts or compiler errors leave the app untouched. */
export function planUiWrites(root: string, inner: FileSystemPort): UiWritePlan {
  const writes = new Map<string, string>();
  const removals = new Set<string>();
  const directories = new Set<string>();
  const fs: FileSystemPort = {
    readFile: (path) =>
      removals.has(resolve(path))
        ? Promise.reject(new Error('File removed by registry plan'))
        : writes.has(resolve(path))
        ? Promise.resolve(writes.get(resolve(path))!)
        : inner.readFile(path),
    writeFile: (path, content) => {
      removals.delete(resolve(path));
      writes.set(resolve(path), content);
      return Promise.resolve();
    },
    exists: (path) =>
      Promise.resolve(writes.has(resolve(path)) || directories.has(resolve(path))).then((staged) =>
        removals.has(resolve(path)) ? false : staged || inner.exists(path)
      ),
    stat: (path) =>
      removals.has(resolve(path))
        ? Promise.reject(new Error('File removed by registry plan'))
        : directories.has(resolve(path))
        ? Promise.resolve({ isFile: false, isDirectory: true })
        : writes.has(resolve(path))
        ? Promise.resolve({ isFile: true, isDirectory: false })
        : inner.stat(path),
    createDir: (path) => {
      directories.add(resolve(path));
      return Promise.resolve();
    },
    readDir: (path) => inner.readDir(path),
    walk: (path) => inner.walk(path),
    remove: (path) => {
      writes.delete(resolve(path));
      removals.add(resolve(path));
      return Promise.resolve();
    },
    copy: async (from, to) => {
      await fs.writeFile(to, await fs.readFile(from));
    },
  };
  return {
    fs,
    writes,
    removals,
    commit: async (paths) => {
      for (const path of [...directories, ...writes.keys(), ...removals]) {
        const inside = relative(resolve(root), path);
        if (
          isAbsolute(inside) || inside === '..' || inside.startsWith('../') ||
          inside.startsWith('..\\') || (removals.has(path) && !inside)
        ) {
          throw new Error('Registry write plan escapes the application file boundary');
        }
        if (paths) await paths.assertContained(root, path);
      }
      for (const directory of directories) await inner.createDir(directory);
      for (const [path, content] of writes) await inner.writeFile(path, content);
      for (const path of removals) if (await inner.exists(path)) await inner.remove(path);
    },
  };
}
