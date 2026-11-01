import { relative, resolve } from '@std/path';
import { TOKEN_CONFIG_FILE } from '../../../../domain/tokens/token-config.ts';
import { uiContentHash } from '../../../../domain/ui/ui-lock.ts';
import { readUiConfig, readUiLock, writeUiMetadata } from '../config-lock.ts';
import { createUiRegistryClient, type UiRegistryDependencies } from '../registry-client.ts';
import { prepareUiRegistryInstall } from '../install-registry.ts';
import { planUiWrites } from '../ui-write-plan.ts';
import { figmaThemeFiles, transferThemeBaselines } from './figma-theme-files.ts';
import { uiTargetPath } from '../copy-files.ts';
import type { UiPresetApplyInput } from './apply-preset.ts';

/** Apply fetched registry theme/base through S2's schema, path, local-edit and lock write plan. */
export async function applyRemoteUiPreset(
  input: UiPresetApplyInput,
  url: string,
  deps: UiRegistryDependencies,
) {
  if (input.only) {
    throw new Error('--only applies to preset codes; URL theme items apply as a whole');
  }
  const root = resolve(input.root);
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
  const config = await readUiConfig(root, plan.fs);
  const client = await createUiRegistryClient(config, deps);
  const entry = await client.item(url);
  if (!['registry:theme', 'registry:base'].includes(entry.item.type)) {
    throw new Error('URL preset must be a registry:theme or registry:base item');
  }
  const previous = await readUiLock(root, plan.fs);
  const compiled = await figmaThemeFiles(root, entry, deps, plan, previous);
  const incoming = { ...entry, files: compiled.files };
  const targets = new Set(incoming.files.map((file) => uiTargetPath(root, file, config)));
  const transferred = compiled.config
    ? await transferThemeBaselines(incoming, targets, previous)
    : undefined;
  if (transferred) await writeUiMetadata(root, config, transferred, plan.fs);
  const entries = (await client.resolve([url])).map((item) => item.ref === url ? incoming : item);
  const install = await prepareUiRegistryInstall({
    root,
    names: [url],
    config,
    entries,
    strict: true,
    replaceManaged: true,
  }, staged);
  await install.plan.commit();
  if (compiled.config) {
    await plan.fs.writeFile(resolve(root, TOKEN_CONFIG_FILE), compiled.config);
    for (const item of Object.values(install.lock.items)) {
      item.files = item.files.filter((file) => file.target !== TOKEN_CONFIG_FILE);
    }
    install.lock.items[url].files.push({
      target: TOKEN_CONFIG_FILE,
      content: compiled.config,
      hash: await uiContentHash(compiled.config),
      managed: false,
    });
    for (const [ref, item] of Object.entries(install.lock.items)) {
      if (
        ref !== url && ['registry:theme', 'registry:base'].includes(item.type) &&
        !item.files.length && !item.registryDependencies.length && !item.dependencies?.length &&
        !item.cssImports?.length &&
        !Object.entries(install.lock.items).some(([dependentRef, dependent]) =>
          dependentRef !== ref && dependent.registryDependencies.includes(ref)
        )
      ) delete install.lock.items[ref];
    }
    await writeUiMetadata(root, install.config, install.lock, plan.fs);
  }
  await plan.commit(deps.paths);
  return {
    preset: { version: 1 as const, theme: url },
    style: install.config.style,
    files: [...plan.writes.keys()].map((path) => relative(root, path).replaceAll('\\', '/')),
  };
}
