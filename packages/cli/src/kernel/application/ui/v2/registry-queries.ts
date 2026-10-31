import { z } from 'zod';
import { resolve } from '@std/path';
import type { Registry } from '@netscript/fresh-ui/registry-v2';
import {
  parseUiRegistryJson,
  UI_CONFIG_FILE,
  UiConfigSchema,
  UiRegistrySourceSchema,
} from '../../../domain/ui/ui-config.ts';
import { uiContentHash } from '../../../domain/ui/ui-lock.ts';
import { readUiConfig, readUiLock } from './config-lock.ts';
import { uiTargetPath } from './copy-files.ts';
import { createUiRegistryClient, type UiRegistryDependencies } from './registry-client.ts';
import { planUiWrites } from './ui-write-plan.ts';

const collections = z.array(
  z.object({ name: z.string(), items: z.array(z.string()) }).passthrough(),
);

/** List protocol metadata and compatibility file fields without loading copied component modules. */
export async function listUiRegistry(
  root: string,
  deps: UiRegistryDependencies,
  namespace?: string,
) {
  const config = await readUiConfig(root, deps.fs);
  const lock = await readUiLock(root, deps.fs);
  const client = await createUiRegistryClient(config, deps);
  const registry = await client.catalog(namespace);
  const items = await Promise.all(registry.items.map(async (item) => {
    const ref = namespace ? `${namespace}/${item.name}` : item.name;
    const recorded = lock?.items[ref];
    const files = (item.files ?? []).map((file) => ({
      source: file.path.replace(/^packages\/fresh-ui\//, ''),
      path: file.path,
      target: file.target ?? uiTargetPath(root, file, config),
    }));
    const installed = lock
      ? recorded !== undefined && (recorded.files.length > 0 || files.length === 0) &&
        (await Promise.all(
          recorded.files.map((file) => deps.fs.exists(resolve(root, file.target))),
        )).every(Boolean)
      : files.length > 0 &&
        (await Promise.all(
          (item.files ?? []).map((file) =>
            deps.fs.exists(resolve(root, uiTargetPath(root, file, config)))
          ),
        )).every(Boolean);
    const kind = item.meta?.netscript && typeof item.meta.netscript === 'object' &&
        'kind' in item.meta.netscript && typeof item.meta.netscript.kind === 'string'
      ? item.meta.netscript.kind
      : item.type.slice('registry:'.length);
    return {
      name: item.name,
      ref,
      type: item.type,
      kind,
      title: item.title,
      description: item.description,
      categories: item.categories ?? [],
      dependencies: item.dependencies ?? [],
      registryDependencies: item.registryDependencies ?? [],
      files,
      installed,
    };
  }));
  return { items, collections: collections.parse(registry.meta?.collections ?? []) };
}

/** View portable metadata and exact file bytes from the requested builtin or remote source. */
export async function viewUiRegistry(root: string, ref: string, deps: UiRegistryDependencies) {
  const client = await createUiRegistryClient(await readUiConfig(root, deps.fs), deps);
  const resolved = await client.item(ref);
  return { ...resolved.item, files: resolved.files, source: resolved.source };
}

/** Summarize install history and edit state without printing registry authentication settings. */
export async function infoUiRegistry(root: string, deps: UiRegistryDependencies) {
  const config = await readUiConfig(root, deps.fs);
  const lock = await readUiLock(root, deps.fs);
  const items = await Promise.all(
    Object.entries(lock?.items ?? {}).map(async ([name, item]) => {
      const edited: string[] = [];
      for (const file of item.files.filter((file) => !file.managed)) {
        const path = resolve(root, file.target);
        await deps.paths?.assertContained(root, path);
        if (
          !await deps.fs.exists(path) ||
          await uiContentHash(await deps.fs.readFile(path)) !== file.hash
        ) edited.push(file.target);
      }
      return {
        name,
        source: item.source,
        sourceHash: item.sourceHash,
        files: item.files.length,
        edited,
      };
    }),
  );
  return {
    version: config.version,
    style: config.style,
    iconLibrary: config.iconLibrary,
    aliases: config.aliases,
    registries: Object.keys(config.registries),
    lockVersion: lock?.version,
    items,
  };
}

/** Register unresolved URL/header templates, leaving install history untouched. */
export async function addUiRegistrySource(
  root: string,
  name: string,
  source: unknown,
  deps: UiRegistryDependencies,
): Promise<void> {
  await deps.paths?.assertContained(root, resolve(root, UI_CONFIG_FILE));
  const config = await readUiConfig(root, deps.fs);
  config.registries[name] = UiRegistrySourceSchema.parse(source);
  const validated = UiConfigSchema.parse(config);
  const plan = planUiWrites(root, deps.fs);
  await plan.fs.writeFile(resolve(root, UI_CONFIG_FILE), JSON.stringify(validated, null, 2) + '\n');
  await plan.commit(deps.paths);
}

/** Validate a local source, static URL, configured namespace or namespaced item. */
export async function validateUiRegistrySource(
  root: string,
  reference: string,
  deps: UiRegistryDependencies,
): Promise<{ readonly valid: true; readonly kind: 'registry' | 'item'; readonly items: number }> {
  const protocol = await import('@netscript/fresh-ui/registry-v2');
  if (reference.startsWith('@')) {
    const client = await createUiRegistryClient(await readUiConfig(root, deps.fs), deps);
    if (reference.includes('/')) {
      await client.item(reference);
      return { valid: true, kind: 'item', items: 1 };
    }
    return { valid: true, kind: 'registry', items: (await client.catalog(reference)).items.length };
  }
  let value: unknown;
  if (/^(https?:|github:)/.test(reference)) {
    if (!deps.transport) throw new Error('Remote registry transport is not configured');
    value = parseUiRegistryJson(await deps.transport.read(reference, {}));
  } else value = parseUiRegistryJson(await deps.fs.readFile(resolve(root, reference)));
  if (value && typeof value === 'object' && 'type' in value) {
    protocol.validateRegistryItem(value);
    return { valid: true, kind: 'item', items: 1 };
  }
  const registry: Registry = protocol.validateRegistry(value);
  return { valid: true, kind: 'registry', items: registry.items.length };
}
