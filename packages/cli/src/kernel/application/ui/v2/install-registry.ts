import { resolve } from '@std/path';
import {
  uiContentHash,
  uiFileDiff,
  type UiLock,
  type UiLockedFile,
} from '../../../domain/ui/ui-lock.ts';
import type { UiConfig } from '../../../domain/ui/ui-config.ts';
import { UI_CONFIG_FILE, UI_LOCK_FILE } from '../../../domain/ui/ui-config.ts';
import { readUiConfig, readUiLock, writeUiMetadata } from './config-lock.ts';
import { planUiCopies, type UiCopyFile, uiTargetPath } from './copy-files.ts';
import { applyRegistryEffects, registryCssFiles } from './registry-effects.ts';
import {
  createUiRegistryClient,
  uiDependencyReference,
  type UiRegistryDependencies,
  type UiResolvedItem,
} from './registry-client.ts';
import { isUiComponentStyle, resolveUiStyleSources } from './style-sources.ts';
import { retireUiStyleFiles, uiRetiringComponentStyles } from './style-history.ts';
import { planUiWrites, type UiWritePlan } from './ui-write-plan.ts';

/** Comparison of installed baseline, current local bytes and the currently resolved registry. */
export interface UiRegistryDiff {
  readonly path: string;
  readonly localEdited: boolean;
  readonly baselineHash?: string;
  readonly localHash: string;
  readonly registryHash: string;
  readonly localDiff: string;
  readonly registryDiff: string;
}

/** Edited-file refusal includes every filename and its diff before any planned write commits. */
export class UiRegistryConflictError extends Error {
  constructor(readonly files: readonly string[], readonly diffs: readonly UiRegistryDiff[]) {
    super(
      `Refusing to overwrite edited registry copies:\n${files.join('\n')}\n${
        diffs.filter((diff) => diff.localEdited).map((diff) => diff.localDiff).join('\n')
      }`,
    );
    this.name = 'UiRegistryConflictError';
  }
}

/** Input shared by add, update, initialization and explicit style regeneration. */
export interface UiRegistryInstallInput {
  readonly root: string;
  readonly names: readonly string[];
  readonly force?: boolean;
  readonly diff?: boolean;
  readonly strict?: boolean;
  readonly replaceManaged?: boolean;
  readonly config?: UiConfig;
  readonly entries?: readonly UiResolvedItem[];
  readonly theme?: string;
  /** Updates read the configured style; install/apply may explicitly select another. */
  readonly selectStyle?: boolean;
}

/** A completely preflighted install, available to preset compilation before committing. */
export interface UiRegistryInstallPlan {
  readonly plan: UiWritePlan;
  readonly config: UiConfig;
  readonly lock: UiLock;
  readonly entries: readonly UiResolvedItem[];
  readonly copies: readonly UiCopyFile[];
  readonly diffs: readonly UiRegistryDiff[];
  readonly drifted: readonly string[];
  readonly copiedFiles: readonly string[];
}

/** Resolve every dependency, compare baseline hashes, then stage copies and metadata together. */
export async function prepareUiRegistryInstall(
  input: UiRegistryInstallInput,
  deps: UiRegistryDependencies,
): Promise<UiRegistryInstallPlan> {
  const root = resolve(input.root);
  for (const name of [UI_CONFIG_FILE, UI_LOCK_FILE]) {
    await deps.paths?.assertContained(root, resolve(root, name));
  }
  let config = input.config ?? await readUiConfig(root, deps.fs);
  const previous = await readUiLock(root, deps.fs);
  const previousStyle = previous?.appliedStyle ?? config.style;
  const styled = input.entries ? undefined : await resolveUiStyleSources({
    client: await createUiRegistryClient(config, deps),
    config,
    previous,
    names: input.names,
    theme: input.theme,
    selectStyle: input.selectStyle,
  });
  config = styled?.config ?? config;
  const resolved = input.entries ?? styled!.entries;
  const retiring = styled
    ? uiRetiringComponentStyles(previous, previousStyle, config.style, resolved)
    : new Set<string>();
  const entries = resolved.filter((entry) => !retiring.has(entry.ref));
  const strict = input.strict || styled?.changed || retiring.size > 0;
  if (styled?.changed && !previous) {
    const client = await createUiRegistryClient(config, deps);
    const untracked: string[] = [];
    for (const item of (await client.catalog()).items) {
      if (!['registry:component', 'registry:ui', 'registry:block'].includes(item.type)) continue;
      for (const file of item.files ?? []) {
        const target = uiTargetPath(root, file, config);
        if (await deps.fs.exists(resolve(root, target))) untracked.push(target);
      }
    }
    if (untracked.length) {
      throw new Error(
        `Style regeneration requires an installed lock baseline for these copies:\n${
          untracked.join('\n')
        }`,
      );
    }
  }
  const copies = planUiCopies(root, entries, config);
  const css = await registryCssFiles(root, entries, copies, config);
  const files = [...copies, ...css.files];
  const destinations = new Map<string, string>();
  for (const file of files) {
    if (destinations.has(file.target) && destinations.get(file.target) !== file.content) {
      throw new Error(`Registry target collision: ${file.target}`);
    }
    destinations.set(file.target, file.content);
  }
  const plan = planUiWrites(root, deps.fs);
  const lock: UiLock = structuredClone(previous ?? { version: 1, items: {} });
  const diffs: UiRegistryDiff[] = [];
  const drifted = new Set<string>();
  const copiedFiles = new Set<string>();
  const selected = new Set([...entries.map((entry) => entry.ref), ...retiring]);
  const replaceManaged = input.replaceManaged ??
    (!!input.theme ||
      entries.some((entry) =>
        entry.item.type === 'registry:theme' && input.names.includes(entry.ref)
      ));
  const owned = new Map(
    Object.values(previous?.items ?? {}).flatMap((item) =>
      item.files.map((file) => [file.target, file] as const)
    ),
  );
  for (const entry of entries) {
    const records: UiLockedFile[] = [];
    for (const file of files.filter((copy) => copy.owner === entry.ref)) {
      const path = resolve(root, file.target);
      await deps.paths?.assertContained(root, path);
      const exists = await deps.fs.exists(path);
      const current = exists ? await deps.fs.readFile(path) : undefined;
      const baseline = previous?.items[entry.ref]?.files.find((copy) =>
        copy.target === file.target
      ) ?? owned.get(file.target);
      const currentHash = current === undefined ? undefined : await uiContentHash(current);
      const edited = !file.managed && current !== undefined &&
        (baseline ? currentHash !== baseline.hash : current !== file.content);
      if (!file.managed && current !== undefined && (current !== file.content || edited)) {
        diffs.push({
          path: file.target,
          localEdited: edited,
          baselineHash: baseline?.hash,
          localHash: currentHash!,
          registryHash: await uiContentHash(file.content),
          localDiff: uiFileDiff(
            baseline?.content ?? file.content,
            current,
            file.target,
            baseline ? ['installed', 'local'] : ['registry', 'local'],
          ),
          registryDiff: uiFileDiff(current, file.content, file.target, ['local', 'registry']),
        });
      }
      if (edited && (!input.force || strict)) {
        drifted.add(file.target);
        if (baseline) records.push(baseline);
        continue;
      }
      const sharing = Object.entries(previous?.items ?? {}).find(([ref, item]) =>
        !selected.has(ref) &&
        item.files.some((copy) =>
          copy.target === file.target && copy.content !== file.content && !copy.managed
        )
      );
      if (sharing) {
        throw new Error(
          `Registry target is shared with installed item ${sharing[0]}: ${file.target}`,
        );
      }
      const aggregator = path === resolve(root, config.aliases.assets, 'styles.css');
      const preserve = exists &&
        (aggregator ||
          (file.managed && !file.source.startsWith('registry-css:') && !replaceManaged));
      if (!preserve && current !== file.content) {
        await plan.fs.writeFile(path, file.content);
        copiedFiles.add(path);
      }
      const content = preserve ? current! : file.content;
      records.push({
        target: file.target,
        hash: await uiContentHash(content),
        content,
        managed: file.managed,
      });
    }
    lock.items[entry.ref] = {
      source: entry.source,
      sourceHash: await uiContentHash(JSON.stringify({ ...entry.item, files: entry.files })),
      type: entry.item.type,
      ...(isUiComponentStyle(entry) ? { componentStyle: true } : {}),
      requested: input.names.includes(entry.ref) || previous?.items[entry.ref]?.requested || false,
      files: records,
      registryDependencies: entry.resolvedDependencies
        ? [...entry.resolvedDependencies]
        : (entry.item.registryDependencies ?? []).map((value) =>
          uiDependencyReference(entry, value)
        ),
      dependencies: [
        ...(entry.item.dependencies ?? []),
        ...(entry.item.devDependencies ?? []),
        ...(entry.item.font?.dependency ? [entry.item.font.dependency] : []),
      ],
      cssImports: [...(css.imports.get(entry.ref) ?? [])],
    };
  }
  await retireUiStyleFiles({
    root,
    previous,
    lock,
    retiring,
    plan,
    paths: deps.paths,
    report: async (file, current) => {
      const localHash = await uiContentHash(current);
      const edited = !file.managed && localHash !== file.hash;
      if (edited) drifted.add(file.target);
      diffs.push({
        path: file.target,
        localEdited: edited,
        baselineHash: file.hash,
        localHash,
        registryHash: await uiContentHash(''),
        localDiff: uiFileDiff(file.content, current, file.target),
        registryDiff: uiFileDiff(current, '', file.target, ['local', 'registry']),
      });
    },
  });
  if (styled) lock.appliedStyle = config.style;
  if (strict && drifted.size) throw new UiRegistryConflictError([...drifted], diffs);
  if (!input.diff) {
    await applyRegistryEffects({
      root,
      config,
      entries,
      previous,
      lock,
      fs: plan.fs,
      themeBase: replaceManaged
        ? copies.find((file) =>
          resolve(root, file.target) === resolve(root, config.aliases.assets, 'styles.css')
        )?.content
        : undefined,
    });
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
  }
  return {
    plan,
    config,
    lock,
    entries,
    copies: files,
    diffs,
    drifted: [...drifted],
    copiedFiles: [...copiedFiles],
  };
}

/** Install without writing on --diff; all actual commits use the injected physical path guard. */
export async function installUiRegistry(
  input: UiRegistryInstallInput,
  deps: UiRegistryDependencies,
): Promise<UiRegistryInstallPlan> {
  const result = await prepareUiRegistryInstall(input, deps);
  if (!input.diff) await result.plan.commit(deps.paths);
  return result;
}
