import type { Registry, RegistryItem } from './registry-contract.ts';
import {
  REGISTRY_ITEM_SCHEMA_URL,
  REGISTRY_SCHEMA_URL,
  validateRegistry,
} from './validate-registry.ts';

/** Inputs for a static build; source reads are supplied by the publisher's filesystem edge. */
export interface RegistryBuildInput {
  /** Untrusted source registry.json document. */
  readonly registry: unknown;
  /** Read a UTF-8 file relative to the explicitly selected source root. */
  readonly readSource: (path: string, signal?: AbortSignal) => Promise<string>;
  /** Optional cancellation propagated to every source read. */
  readonly signal?: AbortSignal;
}

/** Reject source paths that could escape the publisher's selected source root. */
export function assertRegistrySourcePath(path: string): void {
  if (
    !path || /[\\:\0]/.test(path) || path.startsWith('/') ||
    path.split('/').some((part) => part === '..' || part === '')
  ) {
    throw new Error('Registry source paths must remain relative to the source root');
  }
}

/** Resolve all source bytes before returning deterministic catalog and item JSON artifacts. */
export async function buildRegistry(
  input: RegistryBuildInput,
): Promise<Readonly<Record<string, string>>> {
  const root = validateRegistry(input.registry);
  if (!root.name || !root.homepage) throw new Error('Root registry requires name and homepage');
  const included = new Set<string>();
  const visiting = new Set<string>();
  const items: RegistryItem[] = [];
  const collect = async (registry: Registry, directory: string): Promise<void> => {
    input.signal?.throwIfAborted();
    items.push(...registry.items);
    for (const include of registry.include ?? []) {
      assertRegistrySourcePath(include);
      const path = directory + include.replace(/^\.\//, '');
      if (visiting.has(path)) throw new Error(`Registry include cycle: ${path}`);
      if (included.has(path)) continue;
      visiting.add(path);
      const chunk = validateRegistry(JSON.parse(await input.readSource(path, input.signal)));
      await collect(chunk, path.slice(0, path.lastIndexOf('/') + 1));
      visiting.delete(path);
      included.add(path);
    }
  };
  await collect(root, '');
  validateRegistry({ ...root, include: undefined, items });
  const built = await Promise.all(items.map(async (item): Promise<RegistryItem> => ({
    ...item,
    files: await Promise.all((item.files ?? []).map(async (file) => {
      assertRegistrySourcePath(file.path);
      input.signal?.throwIfAborted();
      return { ...file, content: file.content ?? await input.readSource(file.path, input.signal) };
    })),
  })));
  built.sort((left, right) => left.name.localeCompare(right.name));
  const catalog: Registry = {
    ...root,
    $schema: REGISTRY_SCHEMA_URL,
    include: undefined,
    items: built,
  };
  const artifacts: Record<string, string> = {
    'registry.json': JSON.stringify(catalog, null, 2) + '\n',
  };
  for (const item of built) {
    if (item.name === 'registry') {
      throw new Error('The registry item name is reserved for the catalog');
    }
    artifacts[`${item.name}.json`] =
      JSON.stringify({ $schema: REGISTRY_ITEM_SCHEMA_URL, ...item }, null, 2) + '\n';
  }
  return artifacts;
}
