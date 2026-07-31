import { resolve } from '@std/path';

import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { UiRegistryItem } from './registry.ts';

const PREACT_IMPORTS: Readonly<Record<string, string>> = {
  preact: 'npm:preact@^10.27.2',
};

/** The bare-specifier alias a registry dependency contributes, and the specifier it maps to. */
export type ImportMapEntry = {
  readonly key: string;
  readonly value: string;
};

/** Merge UI dependency imports into the target app's deno.json. */
export async function mergeDenoJsonImports(
  projectRoot: string,
  items: readonly UiRegistryItem[],
  fs: FileSystemPort,
): Promise<{ readonly path: string; readonly added: readonly string[] }> {
  const path = resolve(projectRoot, 'deno.json');
  const exists = await fs.exists(path);
  const config = exists ? JSON.parse(await fs.readFile(path)) as Record<string, unknown> : {};
  const imports = isRecord(config.imports) ? { ...config.imports } as Record<string, string> : {};
  const candidates = new Map<string, string>(Object.entries(PREACT_IMPORTS));
  for (const item of items) {
    for (const dependency of item.dependencies ?? []) {
      const entry = importEntryForDependency(dependency);
      if (entry) candidates.set(entry.key, entry.value);
    }
  }

  const added: string[] = [];
  for (const [key, value] of candidates) {
    if (imports[key] === undefined) {
      imports[key] = value;
      added.push(key);
    }
  }

  config.imports = imports;
  await fs.writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  return { path, added };
}

/**
 * Resolve the import-map entry a registry dependency contributes, dropping any export subpath.
 *
 * The alias must address the package root: Deno appends the remainder of a bare specifier to the
 * mapped value, so an alias pointing at `jsr:@netscript/sdk@<v>/desktop` resolves
 * `@netscript/sdk/desktop` to `./desktop/desktop`. Mapping the root serves the package and every
 * one of its subpaths with a single entry.
 */
export function importEntryForDependency(specifier: string): ImportMapEntry | undefined {
  if (!specifier.startsWith('npm:') && !specifier.startsWith('jsr:')) return undefined;
  const protocol = specifier.slice(0, 4);
  const body = specifier.slice(4);
  const scoped = body.startsWith('@');
  const segments = body.split('/');
  if (scoped && segments.length < 2) return undefined;
  const name = scoped ? `${segments[0]}/${segments[1]}` : segments[0];
  if (!name || (scoped && !segments[1])) return undefined;
  return { key: name.replace(/@[^@/]*$/, ''), value: `${protocol}${name}` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
