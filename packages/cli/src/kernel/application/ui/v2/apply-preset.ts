import { resolve } from '@std/path';
import { z } from 'zod';
import { resolveUiPreset } from './resolve-preset.ts';
import { applyRemoteUiPreset } from './apply-remote-preset.ts';
import { uiContentHash } from '../../../domain/ui/ui-lock.ts';
import { readUiConfig, readUiLock, writeUiMetadata } from './config-lock.ts';
import { prepareUiRegistryInstall } from './install-registry.ts';
import { createUiRegistryClient, type UiRegistryDependencies } from './registry-client.ts';
import { stageUiPresetTokens } from './preset-tokens.ts';
import { planUiWrites } from './ui-write-plan.ts';

const presetMetadata = z.object({ id: z.string() }).passthrough();

/** Preset selection and initialization share one preflighted application mutation. */
export interface UiPresetApplyInput {
  readonly root: string;
  readonly preset: string;
  readonly only?: string;
  readonly initializeNames?: readonly string[];
}

/** Apply theme/font through the existing compiler; component sources change only for explicit style. */
export async function applyUiPreset(input: UiPresetApplyInput, deps: UiRegistryDependencies) {
  const root = resolve(input.root);
  const selection = await resolveUiPreset(input.preset, deps);
  if (selection.kind === 'remote') {
    return await applyRemoteUiPreset(input, selection.url, selection.deps);
  }
  const preset = selection.preset;
  const only = new Set(input.only?.split(',').map((part) => part.trim()) ?? []);
  if ([...only].some((part) => part !== 'theme' && part !== 'font')) {
    throw new Error('--only accepts theme,font');
  }
  const theme = !only.size || only.has('theme');
  const font = !only.size || only.has('font');
  const plan = planUiWrites(root, deps.fs);
  const staged = { ...deps, fs: plan.fs };
  if (input.initializeNames) {
    const initial = await prepareUiRegistryInstall({
      root,
      names: input.initializeNames,
      strict: true,
    }, staged);
    await initial.plan.commit();
  }
  let config = await readUiConfig(root, plan.fs);
  const client = await createUiRegistryClient(config, deps);
  if (!only.size && preset.style) {
    const style = await client.item(preset.style);
    if (style.item.type !== 'registry:style' || !style.item.meta?.components) {
      throw new Error('Preset style must declare a registry:style component source map');
    }
    const install = await prepareUiRegistryInstall({
      root,
      names: [preset.style],
      strict: true,
      replaceManaged: false,
    }, staged);
    await install.plan.commit();
    config = install.config;
  }
  let files: readonly string[] = [];
  let tokenOwner: string | undefined;
  if (preset.theme && (theme || (font && !preset.font))) {
    // Compilation and docs are staged together; any bad token/docs input leaves all files intact.
    const result = await stageUiPresetTokens({
      root,
      preset: preset.theme,
      only,
      config,
      plan,
      deps,
    });
    files = result.files;
    if (theme) {
      const item = (await client.catalog()).items.find((item) =>
        item.type === 'registry:theme' &&
        presetMetadata.safeParse(item.meta?.preset).data?.id === result.preset
      );
      if (!item) throw new Error(`No registry theme documents for preset: ${result.preset}`);
      const resolved = await client.item(item.name);
      tokenOwner = resolved.ref;
      const docs = resolved.files.filter((file) =>
        file.target?.startsWith('.agents/skills/fresh-ui-theme-') ||
        file.target === '@assets/styles.css'
      );
      const install = await prepareUiRegistryInstall({
        root,
        names: [resolved.ref],
        config,
        strict: true,
        replaceManaged: false,
        entries: [{
          ...resolved,
          item: { ...resolved.item, registryDependencies: [] },
          files: docs,
          resolvedDependencies: [],
        }],
      }, staged);
      await install.plan.commit();
    }
  }
  if (font && preset.font) {
    const entries = await client.resolve([preset.font]);
    if (
      entries.find((entry) => entry.ref === preset.font)?.item.type !== 'registry:font' ||
      entries.some((entry) => !['registry:font', 'registry:file'].includes(entry.item.type))
    ) throw new Error('Preset font must resolve only font and file registry items');
    const install = await prepareUiRegistryInstall({
      root,
      names: [preset.font],
      config,
      entries,
      strict: true,
    }, staged);
    await install.plan.commit();
  }
  if (!only.size && preset.iconLibrary) config = { ...config, iconLibrary: preset.iconLibrary };
  const lock = await readUiLock(root, plan.fs) ?? { version: 1, items: {} };
  if (tokenOwner) {
    for (const target of files) {
      for (const [ref, item] of Object.entries(lock.items)) {
        if (ref !== tokenOwner) item.files = item.files.filter((file) => file.target !== target);
      }
      const content = await plan.fs.readFile(resolve(root, target));
      const owner = lock.items[tokenOwner];
      owner.files = owner.files.filter((file) => file.target !== target);
      owner.files.push({ target, content, hash: await uiContentHash(content), managed: true });
    }
  }
  for (const item of Object.values(lock.items)) {
    for (const file of item.files.filter((file) => file.managed)) {
      const path = resolve(root, file.target);
      if (await plan.fs.exists(path)) {
        file.content = await plan.fs.readFile(path);
        file.hash = await uiContentHash(file.content);
      }
    }
  }
  await writeUiMetadata(root, config, lock, plan.fs);
  await plan.commit(deps.paths);
  return { preset, style: config.style, files };
}
