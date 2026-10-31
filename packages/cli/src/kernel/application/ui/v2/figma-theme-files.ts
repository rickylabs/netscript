import { resolve } from '@std/path';
import { z } from 'zod';
import type { RegistryFile } from '@netscript/fresh-ui/registry-v2';
import {
  TOKEN_CONFIG_FILE,
  TOKEN_OVERRIDE_FILE,
  TOKEN_RESOLVER_FILE,
  TOKEN_SOURCE_DIR,
} from '../../../domain/tokens/token-config.ts';
import { uiContentHash, type UiLock } from '../../../domain/ui/ui-lock.ts';
import { readTokenConfig, readTokenOverride } from '../../tokens/token-files.ts';
import type { UiRegistryDependencies, UiResolvedItem } from './registry-client.ts';
import type { UiWritePlan } from './ui-write-plan.ts';

/** Compile portable Figma values with the existing engine and retain their editable source/config. */
export async function figmaThemeFiles(
  root: string,
  entry: UiResolvedItem,
  deps: UiRegistryDependencies,
  plan: UiWritePlan,
  lock: UiLock | undefined,
): Promise<{
  readonly files: readonly (RegistryFile & { readonly content: string })[];
  readonly config?: string;
}> {
  const raw = entry.item.meta?.netscript;
  if (!raw || typeof raw !== 'object' || !Object.hasOwn(raw, 'figma')) {
    return { files: entry.files };
  }
  const metadata = z.object({
    version: z.literal(1),
    preset: z.string().min(1),
    figma: z.unknown(),
  }).strict().parse(raw);
  const engine = deps.tokenEngine;
  if (!engine?.figmaSources) {
    throw new Error('Figma themes require the token engine Figma importer');
  }
  if (!(await engine.defaults()).presets.includes(metadata.preset)) {
    throw new Error(`Unknown Figma theme preset: ${metadata.preset}`);
  }
  const previous = await readTokenConfig(root, plan.fs);
  if (previous?.sourceRoot) {
    const managed = previous.sourceRoot === TOKEN_SOURCE_DIR &&
      Object.values(lock?.items ?? {}).some((item) =>
        ['registry:theme', 'registry:base'].includes(item.type) && item.files.some((file) =>
          file.target === TOKEN_CONFIG_FILE
        ) && item.files.some((file) => file.target === `${TOKEN_SOURCE_DIR}/${TOKEN_RESOLVER_FILE}`)
      );
    if (!managed) {
      throw new Error(
        'URL theme cannot replace a custom token sourceRoot; keep or move your app-owned sources first',
      );
    }
  }
  const sources = await engine.figmaSources(metadata.figma);
  const overridePath = previous?.override ??
    (!previous && await plan.fs.exists(resolve(root, TOKEN_OVERRIDE_FILE))
      ? TOKEN_OVERRIDE_FILE
      : undefined);
  const override = await readTokenOverride(root, overridePath, plan.fs);
  const build = await engine.build({ preset: metadata.preset, sources, override });
  const files = [...entry.files];
  for (const [name, content] of Object.entries(sources)) {
    files.push({
      path: `figma-source/${name}`,
      type: 'registry:file',
      target: `${TOKEN_SOURCE_DIR}/${name}`,
      content,
    });
  }
  for (const name of await engine.outputFiles()) {
    const content = build.files[name];
    if (typeof content !== 'string') throw new Error(`Token engine omitted ${name}`);
    files.push({
      path: `figma-assets/${name}`,
      type: 'registry:file',
      target: `@assets/${name}`,
      content,
    });
  }
  return {
    files,
    config: JSON.stringify(
      {
        ...previous,
        version: 1,
        preset: build.preset,
        sourceRoot: TOKEN_SOURCE_DIR,
        ...(overridePath ? { override: overridePath } : {}),
      },
      null,
      2,
    ) + '\n',
  };
}

/** Transfer only theme-owned overlapping baselines, preserving S2 local-edit checks and history. */
export async function transferThemeBaselines(
  entry: UiResolvedItem,
  targets: ReadonlySet<string>,
  lock: UiLock | undefined,
): Promise<UiLock | undefined> {
  if (!lock) return undefined;
  const next = structuredClone(lock);
  const baseline = next.items[entry.ref] ?? {
    source: entry.source,
    sourceHash: await uiContentHash(JSON.stringify(entry.item)),
    type: entry.item.type,
    requested: true,
    files: [],
    registryDependencies: [],
    dependencies: [],
    cssImports: [],
  };
  for (const [ref, item] of Object.entries(next.items)) {
    if (ref === entry.ref || !['registry:theme', 'registry:base'].includes(item.type)) continue;
    for (const file of item.files.filter((file) => targets.has(file.target))) {
      if (!baseline.files.some((existing) => existing.target === file.target)) {
        baseline.files.push(file);
      }
    }
    item.files = item.files.filter((file) => !targets.has(file.target));
  }
  next.items[entry.ref] = baseline;
  return next;
}
