import { dirname, isAbsolute, join, normalize, relative, resolve, toFileUrl } from '@std/path';
import { normalize as posixNormalize } from '@std/path/posix';
import { FRESH_UI_REGISTRY_CONTENT, freshUiRegistryManifest } from '@netscript/fresh-ui/registry';

import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { mergeDenoJsonImports } from './registry-deno-json.ts';
import { writeStylesAggregator } from './registry-styles.ts';

export type UiRegistryFile = {
  readonly source: string;
  readonly target: string;
};

export type UiRegistryCssContribution = {
  readonly layer?: 'base' | 'components' | 'utilities';
  readonly content: string;
};

export type UiRegistryItem = {
  readonly name: string;
  readonly kind?: string;
  readonly files: readonly UiRegistryFile[];
  readonly registryDependencies?: readonly string[];
  readonly dependencies?: readonly string[];
  readonly css?: readonly UiRegistryCssContribution[];
};

export type UiRegistryCollection = {
  readonly name: string;
  readonly items: readonly string[];
};

export type UiRegistryManifest = {
  readonly items: readonly UiRegistryItem[];
  readonly collections: readonly UiRegistryCollection[];
};

export type UiInstallDependencies = {
  readonly fs: FileSystemPort;
};

export type UiInstallInput = {
  readonly projectRoot: string;
  readonly registryRoot?: string;
  readonly names: readonly string[];
  readonly overwrite: boolean;
  /** Theme item that satisfies theme dependencies; defaults to the registry's official theme. */
  readonly theme?: string;
};

export type UiInstallResult = {
  readonly installedItems: readonly string[];
  readonly copiedFiles: readonly string[];
  readonly stylesPath: string;
  readonly denoJsonPath: string;
  readonly dependenciesMerged: readonly string[];
};

export type UiRegistryListEntry = UiRegistryItem & { readonly installed: boolean };
export type UiUpdateResult = { readonly updated: readonly string[]; readonly drifted: readonly string[] };

type PlannedFile = {
  readonly source: string;
  readonly target: string;
};

const TARGET_PREFIXES: readonly [prefix: string, directory: string][] = [
  ['@ui/', 'components/ui/'],
  ['@islands/', 'islands/ui/'],
  ['@assets/', 'assets/'],
  ['@lib/', 'lib/'],
  ['~/', ''],
];

export const DEFAULT_UI_INIT_ITEMS: readonly string[] = [
  'foundation',
  'floating-styles',
  'control-props',
];

export async function installUiRegistryItems(
  input: UiInstallInput,
  dependencies: UiInstallDependencies,
): Promise<UiInstallResult> {
  const registryRoot = input.registryRoot === undefined ? undefined : resolve(input.registryRoot);
  const projectRoot = resolve(input.projectRoot);
  const manifest = registryRoot === undefined
    ? freshUiRegistryManifest
    : await loadRegistryManifest(registryRoot);
  const registryContent = registryRoot === undefined ? FRESH_UI_REGISTRY_CONTENT : undefined;
  const items = resolveRegistryItems(manifest, input.names, input.theme);
  const plannedFiles = planFiles(registryRoot, projectRoot, items);
  const sourceToTarget = new Map(plannedFiles.map((file) => [normalize(file.source), file.target]));
  const copiedFiles: string[] = [];

  for (const file of plannedFiles) {
    if (!input.overwrite && await dependencies.fs.exists(file.target)) {
      continue;
    }
    const content = registryContent
      ? readRegistryContent(registryContent, file.source)
      : await dependencies.fs.readFile(file.source);
    const next = isTypeScriptLike(file.source)
      ? rewriteRegistryImports(content, file.source, file.target, registryRoot, sourceToTarget)
      : content;
    await dependencies.fs.writeFile(file.target, next);
    copiedFiles.push(file.target);
  }

  const stylesPath = await writeStylesAggregator({
    registryRoot,
    registryContent,
    projectRoot,
    manifest,
    items,
    fs: dependencies.fs,
  });
  const mergeResult = await mergeDenoJsonImports(projectRoot, items, dependencies.fs);

  return {
    installedItems: items.map((item) => item.name),
    copiedFiles,
    stylesPath,
    denoJsonPath: mergeResult.path,
    dependenciesMerged: mergeResult.added,
  };
}

/** List manifest items with installed state derived from their target files. */
export async function listUiRegistryItems(
  projectRootInput: string,
  fs: FileSystemPort,
): Promise<{ readonly items: readonly UiRegistryListEntry[]; readonly collections: readonly UiRegistryCollection[] }> {
  const projectRoot = resolve(projectRootInput);
  const items = await Promise.all(freshUiRegistryManifest.items.map(async (item) => ({
    ...item,
    installed: item.files.length > 0 && (await Promise.all(
      item.files.map((file) => fs.exists(resolveTarget(projectRoot, file.target))),
    )).every(Boolean),
  })));
  return { items, collections: freshUiRegistryManifest.collections };
}

/** Update missing/unchanged registry files while reporting locally edited files as drift. */
export async function updateUiRegistryItems(
  projectRootInput: string,
  names: readonly string[],
  fs: FileSystemPort,
): Promise<UiUpdateResult> {
  const projectRoot = resolve(projectRootInput);
  const selected = names.length ? resolveRegistryItems(freshUiRegistryManifest, names) :
    (await listUiRegistryItems(projectRoot, fs)).items.filter((item) => item.installed);
  const updated: string[] = [];
  const drifted: string[] = [];
  for (const file of planFiles(undefined, projectRoot, selected)) {
    const desired = rewriteRegistryImports(
      readRegistryContent(FRESH_UI_REGISTRY_CONTENT, file.source), file.source, file.target,
      undefined, new Map(planFiles(undefined, projectRoot, selected).map((entry) => [normalize(entry.source), entry.target])),
    );
    if (!await fs.exists(file.target)) {
      await fs.writeFile(file.target, desired);
      updated.push(file.target);
    } else if (await fs.readFile(file.target) !== desired) drifted.push(file.target);
  }
  return { updated, drifted };
}

/** Remove an installed registry item and prune dependency imports it contributed. */
export async function removeUiRegistryItem(
  projectRootInput: string,
  name: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const projectRoot = resolve(projectRootInput);
  const item = freshUiRegistryManifest.items.find((candidate) => candidate.name === name);
  if (!item) throw new Error(`Unknown Fresh UI registry item: ${name}`);
  const removed: string[] = [];
  for (const file of item.files) {
    const target = resolveTarget(projectRoot, file.target);
    if (await fs.exists(target)) { await fs.remove(target); removed.push(target); }
  }
  const denoJsonPath = resolve(projectRoot, 'deno.json');
  if (await fs.exists(denoJsonPath)) {
    const config = JSON.parse(await fs.readFile(denoJsonPath)) as { imports?: Record<string, string> };
    for (const dependency of item.dependencies ?? []) {
      const stillRequired = (await listUiRegistryItems(projectRoot, fs)).items.some((candidate) =>
        candidate.name !== name && candidate.installed && candidate.dependencies?.includes(dependency)
      );
      if (stillRequired) continue;
      const value = Object.entries(config.imports ?? {}).find(([, candidate]) => candidate === dependency);
      if (value) delete config.imports![value[0]];
    }
    await fs.writeFile(denoJsonPath, `${JSON.stringify(config, null, 2)}\n`);
  }
  return removed;
}

export async function loadRegistryManifest(registryRoot: string): Promise<UiRegistryManifest> {
  const manifestUrl = registryManifestModuleUrl(registryRoot);
  const module = await import(manifestUrl) as { freshUiRegistryManifest?: UiRegistryManifest };
  if (!module.freshUiRegistryManifest) {
    throw new Error(`Fresh UI registry manifest not found at ${manifestUrl}`);
  }
  return module.freshUiRegistryManifest;
}

export function registryManifestModuleUrl(registryRoot: string): string {
  return toFileUrl(join(registryRoot, 'registry.manifest.ts')).href;
}

export function resolveRegistryItems(
  manifest: UiRegistryManifest,
  names: readonly string[],
  theme?: string,
): readonly UiRegistryItem[] {
  const byName = new Map(manifest.items.map((item) => [item.name, item]));
  const collections = new Map(manifest.collections.map((collection) => [
    collection.name,
    collection.items,
  ]));
  const themeOverride = theme === undefined ? undefined : requireThemeItem(manifest, theme);
  const resolved: UiRegistryItem[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visitItem = (name: string): void => {
    const direct = byName.get(name);
    if (!direct) {
      throw new Error(`Unknown Fresh UI registry item or collection: ${name}`);
    }
    // Theme dependencies name the official theme; an override satisfies them instead.
    const item = themeOverride !== undefined && direct.kind === 'theme' ? themeOverride : direct;
    if (visited.has(item.name)) return;
    if (visiting.has(item.name)) {
      throw new Error(`Cycle detected in Fresh UI registry dependencies at "${item.name}".`);
    }
    visiting.add(item.name);
    for (const dependency of item.registryDependencies ?? []) visitItem(dependency);
    visiting.delete(item.name);
    visited.add(item.name);
    resolved.push(item);
  };

  for (const name of names) {
    const collectionItems = collections.get(name);
    if (collectionItems) {
      for (const item of collectionItems) visitItem(item);
      continue;
    }
    visitItem(name);
  }

  return resolved;
}

function planFiles(
  registryRoot: string | undefined,
  projectRoot: string,
  items: readonly UiRegistryItem[],
): readonly PlannedFile[] {
  const files = new Map<string, PlannedFile>();
  for (const item of items) {
    for (const file of item.files) {
      const source = registryRoot === undefined ? file.source : resolve(registryRoot, file.source);
      const target = resolveTarget(projectRoot, file.target);
      files.set(normalize(source), { source, target });
    }
  }
  return [...files.values()];
}

function resolveTarget(projectRoot: string, target: string): string {
  for (const [prefix, directory] of TARGET_PREFIXES) {
    if (target.startsWith(prefix)) {
      return resolve(projectRoot, directory, target.slice(prefix.length));
    }
  }
  return isAbsolute(target) ? target : resolve(projectRoot, target);
}

function isTypeScriptLike(path: string): boolean {
  return path.endsWith('.ts') || path.endsWith('.tsx');
}

function rewriteRegistryImports(
  content: string,
  sourceFile: string,
  targetFile: string,
  registryRoot: string | undefined,
  sourceToTarget: ReadonlyMap<string, string>,
): string {
  const rewrite = (specifier: string): string => {
    const source = resolveSpecifierSource(sourceFile, registryRoot, specifier);
    if (!source) return specifier;
    const mapped = sourceToTarget.get(normalize(source));
    if (!mapped) return specifier;
    return toImportSpecifier(relative(dirname(targetFile), mapped));
  };

  return content
    .replace(
      /(\bfrom\s+['"])([^'"]+)(['"])/g,
      (_match, open: string, specifier: string, close: string) =>
        open + rewrite(specifier) +
        close,
    )
    .replace(
      /(\bimport\s+['"])([^'"]+)(['"])/g,
      (_match, open: string, specifier: string, close: string) =>
        open + rewrite(specifier) +
        close,
    );
}

function resolveSpecifierSource(
  sourceFile: string,
  registryRoot: string | undefined,
  specifier: string,
): string | undefined {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return registryRoot === undefined
      ? normalize(join(dirname(sourceFile), specifier))
      : resolve(dirname(sourceFile), specifier);
  }
  const packagePrefix = '@netscript/fresh-ui/';
  if (specifier.startsWith(packagePrefix)) {
    const source = specifier.slice(packagePrefix.length);
    return registryRoot === undefined ? normalize(source) : resolve(registryRoot, source);
  }
  return undefined;
}

function readRegistryContent(
  registryContent: Readonly<Record<string, string>>,
  source: string,
): string {
  const content = registryContent[posixNormalize(source)];
  if (content === undefined) {
    throw new Error(`Fresh UI registry content is missing: ${source}`);
  }
  return content;
}

function toImportSpecifier(path: string): string {
  const normalized = path.replaceAll('\\', '/');
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
}

function requireThemeItem(manifest: UiRegistryManifest, name: string): UiRegistryItem {
  const item = manifest.items.find((candidate) => candidate.name === name);
  if (!item) {
    throw new Error(`Unknown Fresh UI theme: ${name}`);
  }
  if (item.kind !== 'theme') {
    throw new Error(`Fresh UI registry item "${name}" is not a theme (kind: ${item.kind}).`);
  }
  return item;
}
