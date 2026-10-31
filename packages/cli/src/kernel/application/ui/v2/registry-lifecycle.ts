import { z } from 'zod';
import { resolve } from '@std/path';
import { parseUiRegistryJson } from '../../../domain/ui/ui-config.ts';
import { uiContentHash, uiFileDiff } from '../../../domain/ui/ui-lock.ts';
import { importEntryForDependency } from '../registry-deno-json.ts';
import { listUiRegistryItems, removeUiRegistryItem, updateUiRegistryItems } from '../registry.ts';
import { readUiConfig, readUiLock, writeUiMetadata } from './config-lock.ts';
import { installUiRegistry } from './install-registry.ts';
import { reconcileUiStyles } from './registry-effects.ts';
import type { UiRegistryDependencies } from './registry-client.ts';
import { isUiManagedCoreFile } from './style-history.ts';
import { planUiWrites } from './ui-write-plan.ts';

/** Update only baseline-matching copies; an existing empty lock never falls back to file discovery. */
export async function updateUiRegistry(
  root: string,
  names: readonly string[],
  deps: UiRegistryDependencies,
): Promise<{ readonly updated: readonly string[]; readonly drifted: readonly string[] }> {
  const lock = await readUiLock(root, deps.fs);
  const installed = new Set(Object.keys(lock?.items ?? {}));
  if (!lock && names.length) {
    const legacy = await listUiRegistryItems(root, deps.fs, { includePartial: true });
    for (const item of legacy.items) if (item.installed) installed.add(item.name);
    for (const collection of legacy.collections) {
      if (collection.items.some((name) => installed.has(name))) installed.add(collection.name);
    }
  }
  for (const name of names) {
    if (!installed.has(name)) {
      throw new Error(`Registry item '${name}' is not installed. Use ui:add to install it first.`);
    }
  }
  if (!lock) return await updateUiRegistryItems(root, names, deps.fs);
  const selected = names.length ? names : Object.keys(lock.items);
  if (!selected.length) return { updated: [], drifted: [] };
  const result = await installUiRegistry({
    root,
    names: selected,
    replaceManaged: false,
    selectStyle: false,
  }, deps);
  return { updated: result.copiedFiles, drifted: result.drifted };
}

/** Remove owned copies and lock entries, preserving shared files and app-modified dependencies. */
export async function removeUiRegistry(
  root: string,
  ref: string,
  deps: UiRegistryDependencies,
): Promise<readonly string[]> {
  const previous = await readUiLock(root, deps.fs);
  if (!previous) return await removeUiRegistryItem(root, ref, deps.fs);
  const entry = previous.items[ref];
  if (!entry) throw new Error(`Registry item '${ref}' is not installed.`);
  const dependents = Object.entries(previous.items).filter(([name, item]) =>
    name !== ref && item.registryDependencies.includes(ref)
  ).map(([name]) => name);
  if (dependents.length) {
    throw new Error(`Registry item is still required by: ${dependents.join(', ')}`);
  }
  const config = await readUiConfig(root, deps.fs);
  const lock = structuredClone(previous);
  delete lock.items[ref];
  const plan = planUiWrites(root, deps.fs);
  const removed: string[] = [];
  const edited: string[] = [];
  for (const file of entry.files) {
    if (isUiManagedCoreFile(file)) continue;
    if (
      Object.values(lock.items).some((item) =>
        item.files.some((other) => other.target === file.target)
      )
    ) continue;
    const path = resolve(root, file.target);
    await deps.paths?.assertContained(root, path);
    if (!await deps.fs.exists(path)) continue;
    const content = await deps.fs.readFile(path);
    if (!file.managed && await uiContentHash(content) !== file.hash) {
      edited.push(`${file.target}\n${uiFileDiff(file.content, content, file.target)}`);
      continue;
    }
    await plan.fs.remove(path);
    removed.push(path);
  }
  if (edited.length) {
    throw new Error(`Refusing removal of edited registry copies:\n${edited.join('\n')}`);
  }
  const denoPath = resolve(root, 'deno.json');
  if (await plan.fs.exists(denoPath)) {
    const settings = z.object({ imports: z.record(z.string(), z.string()).optional() })
      .passthrough().parse(parseUiRegistryJson(await plan.fs.readFile(denoPath)));
    for (const dependency of entry.dependencies ?? []) {
      const importEntry = importEntryForDependency(
        /^(npm:|jsr:)/.test(dependency) ? dependency : `npm:${dependency}`,
      );
      if (!importEntry) continue;
      const shared = Object.values(lock.items).some((item) =>
        (item.dependencies ?? []).some((other) =>
          importEntryForDependency(/^(npm:|jsr:)/.test(other) ? other : `npm:${other}`)?.key ===
            importEntry.key
        )
      );
      if (!shared && settings.imports?.[importEntry.key] === importEntry.value) {
        delete settings.imports[importEntry.key];
      }
    }
    await plan.fs.writeFile(denoPath, JSON.stringify(settings, null, 2) + '\n');
  }
  await reconcileUiStyles(root, config, previous, lock, plan.fs);
  await writeUiMetadata(root, config, lock, plan.fs);
  await plan.commit(deps.paths);
  return removed;
}
