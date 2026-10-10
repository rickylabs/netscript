import { join } from '@std/path';
import {
  ASPIRE_SURFACE_GENERATOR,
  ASPIRE_SURFACE_MARKER,
  ASPIRE_SURFACE_VERSION,
  type AspireAuthoredInput,
  type AspireSurfaceDrift,
  type AspireSurfaceReport,
} from '../../domain/aspire-generated-surface.ts';
import type { GeneratedFile } from '../../templates/aspire/helpers/types.ts';
import { aspireContentDigest, buildAspireInventory } from './aspire-surface-inventory.ts';

const MAX_FILE_BYTES = 16 * 1024 * 1024;
const MAX_HELPER_ENTRIES = 1024;

/** Inspect rendered bytes using read-only Deno operations, never a scaffolder. */
export async function checkAspireSurface(
  projectRoot: string,
  render: () => Promise<readonly GeneratedFile[]>,
): Promise<AspireSurfaceReport> {
  try {
    // Reject linked input/output roots before selectors or renderer follow them.
    await rejectLinks(projectRoot, 'aspire');
    await rejectLinks(projectRoot, 'appsettings.json');
    const inputs: AspireAuthoredInput[] = [];
    for (
      const path of [
        'appsettings.json',
        'netscript.config.ts',
        'netscript.config.js',
        'netscript.config.mjs',
        'deno.json',
      ]
    ) {
      const bytes = await readBoundedFile(projectRoot, path);
      if (!bytes) {
        if (path === 'appsettings.json') throw new Error('Missing authored authority.');
        continue;
      }
      inputs.push({
        generator: ASPIRE_SURFACE_GENERATOR,
        path,
        ownership: 'authored',
        digest: await aspireContentDigest(bytes),
      });
    }
    const files = await render();
    const inventory = await buildAspireInventory(files);
    const drift: AspireSurfaceDrift[] = [];
    const selected = new Set(inventory.outputs.map((entry) => entry.path));
    for (const entry of inventory.outputs) {
      const bytes = await readBoundedFile(projectRoot, entry.path);
      if (!bytes) {
        drift.push({ path: entry.path, kind: 'missing' });
        continue;
      }
      const marker = new TextEncoder().encode(ASPIRE_SURFACE_MARKER);
      if (!marker.every((byte, index) => bytes[index] === byte)) {
        drift.push({ path: entry.path, kind: 'ownership' });
      }
      if (await aspireContentDigest(bytes) !== entry.digest) {
        drift.push({ path: entry.path, kind: 'bytes' });
      }
    }
    for (const path of await helperLeaves(projectRoot)) {
      if (!selected.has(path)) drift.push({ path, kind: 'extra' });
    }
    return {
      ...inventory,
      inputs,
      status: drift.length === 0 ? 'current' : 'drift',
      exitCode: drift.length === 0 ? 0 : 1,
      drift,
    };
  } catch {
    // A selector, renderer, permission or read failure can never fall back to generation.
    return {
      version: ASPIRE_SURFACE_VERSION,
      generator: ASPIRE_SURFACE_GENERATOR,
      outputs: [],
      inputs: [],
      status: 'inspection-failure',
      exitCode: 1,
      drift: [{ path: ASPIRE_SURFACE_GENERATOR, kind: 'inspection-failure' }],
    };
  }
}

async function rejectLinks(projectRoot: string, path: string): Promise<void> {
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

async function readBoundedFile(projectRoot: string, path: string): Promise<Uint8Array | undefined> {
  await rejectLinks(projectRoot, path);
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

async function helperLeaves(projectRoot: string): Promise<readonly string[]> {
  const pending = ['aspire/.helpers'];
  const leaves: string[] = [];
  let count = 0;
  while (pending.length > 0) {
    const path = pending.pop()!;
    await rejectLinks(projectRoot, path);
    try {
      for await (const entry of Deno.readDir(join(projectRoot, path))) {
        if (++count > MAX_HELPER_ENTRIES) throw new Error('Helper inspection capacity exceeded.');
        const child = `${path}/${entry.name}`;
        if (entry.isSymlink) throw new Error('Linked helper has no generated ownership.');
        if (entry.isDirectory) pending.push(child);
        else leaves.push(child);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return leaves.sort();
}
