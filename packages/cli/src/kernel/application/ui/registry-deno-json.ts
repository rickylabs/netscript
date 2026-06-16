import { resolve } from '@std/path';

import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { UiRegistryItem } from './registry.ts';

const PREACT_IMPORTS: Readonly<Record<string, string>> = {
  preact: 'npm:preact@^10.27.2',
  'preact/hooks': 'npm:preact@^10.27.2/hooks',
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
      const key = importKeyForDependency(dependency);
      if (key) candidates.set(key, dependency);
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

function importKeyForDependency(specifier: string): string | undefined {
  if (!specifier.startsWith('npm:') && !specifier.startsWith('jsr:')) return undefined;
  const body = specifier.slice(4);
  if (body.startsWith('@')) {
    const parts = body.split('/');
    if (parts.length < 2) return undefined;
    const [scope, rest] = parts;
    return `${scope}/${rest.replace(/@.+$/, '')}`;
  }
  return body.replace(/@.+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
