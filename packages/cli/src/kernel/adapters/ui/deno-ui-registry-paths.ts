import { basename, dirname, isAbsolute, join, relative, resolve } from '@std/path';
import type { UiRegistryPathPort } from '../../ports/ui-registry-port.ts';

/** Check registry source and destination containment through existing filesystem links. */
export class DenoUiRegistryPaths implements UiRegistryPathPort {
  async assertContained(root: string, path: string): Promise<void> {
    const base = await physicalPath(resolve(root));
    const target = await physicalPath(resolve(path));
    const inside = relative(base, target);
    if (
      isAbsolute(inside) || inside === '..' || inside.startsWith('../') || inside.startsWith('..\\')
    ) {
      throw new Error('Registry path escapes the selected root through a filesystem link');
    }
  }
}

async function physicalPath(path: string): Promise<string> {
  try {
    // lstat also detects dangling links; never interpret a dangling link as a new file.
    await Deno.lstat(path);
    return await Deno.realPath(path);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    try {
      if ((await Deno.lstat(path)).isSymlink) {
        throw new Error('Registry path contains a dangling link');
      }
    } catch (entryError) {
      if (!(entryError instanceof Deno.errors.NotFound)) throw entryError;
    }
    const parent = dirname(path);
    if (parent === path) throw error;
    return join(await physicalPath(parent), basename(path));
  }
}
