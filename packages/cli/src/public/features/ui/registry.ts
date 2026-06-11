import {
  dirname,
  fromFileUrl,
  isAbsolute,
  join,
  normalize,
  relative,
  resolve,
  toFileUrl,
} from "@std/path";

import type { DenoFileSystem } from "../../../kernel/adapters/runtime/file-system/deno-file-system.ts";

export type UiRegistryFile = {
  readonly source: string;
  readonly target: string;
};

export type UiRegistryCssContribution = {
  readonly layer?: "base" | "components" | "utilities";
  readonly content: string;
};

export type UiRegistryItem = {
  readonly name: string;
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
  readonly fs: DenoFileSystem;
};

export type UiInstallInput = {
  readonly projectRoot: string;
  readonly registryRoot?: string;
  readonly names: readonly string[];
  readonly overwrite: boolean;
};

export type UiInstallResult = {
  readonly installedItems: readonly string[];
  readonly copiedFiles: readonly string[];
  readonly stylesPath: string;
  readonly denoJsonPath: string;
  readonly dependenciesMerged: readonly string[];
};

type PlannedFile = {
  readonly source: string;
  readonly target: string;
};

const PREACT_IMPORTS: Readonly<Record<string, string>> = {
  preact: "npm:preact@^10.27.2",
  "preact/hooks": "npm:preact@^10.27.2/hooks",
};

const TARGET_PREFIXES: readonly [prefix: string, directory: string][] = [
  ["@ui/", "components/ui/"],
  ["@islands/", "islands/ui/"],
  ["@assets/", "assets/"],
  ["@lib/", "lib/"],
  ["~/", ""],
];

export const DEFAULT_UI_INIT_ITEMS: readonly string[] = [
  "button",
  "card",
  "badge",
  "form-field",
  "input",
  "select",
  "alert",
  "spinner",
  "skeleton",
  "page-header",
  "sidebar-shell",
  "theme-toggle",
  "toast",
  "data-table",
  "empty-state",
  "pagination",
  "filter-form",
  "stats-grid",
];

/** Resolve the source registry root when the CLI runs from the monorepo. */
export function defaultFreshUiRegistryRoot(): string {
  return normalize(fromFileUrl(new URL("../../../../../fresh-ui/", import.meta.url)));
}

export async function installUiRegistryItems(
  input: UiInstallInput,
  dependencies: UiInstallDependencies,
): Promise<UiInstallResult> {
  const registryRoot = resolve(input.registryRoot ?? defaultFreshUiRegistryRoot());
  const projectRoot = resolve(input.projectRoot);
  const manifest = await loadRegistryManifest(registryRoot);
  const items = resolveRegistryItems(manifest, input.names);
  const plannedFiles = planFiles(registryRoot, projectRoot, items);
  const sourceToTarget = new Map(plannedFiles.map((file) => [normalize(file.source), file.target]));
  const copiedFiles: string[] = [];

  for (const file of plannedFiles) {
    if (!input.overwrite && await dependencies.fs.exists(file.target)) {
      continue;
    }
    const content = await dependencies.fs.readFile(file.source);
    const next = isTypeScriptLike(file.source)
      ? rewriteRegistryImports(content, file.source, file.target, registryRoot, sourceToTarget)
      : content;
    await dependencies.fs.writeFile(file.target, next);
    copiedFiles.push(file.target);
  }

  const stylesPath = await writeStylesAggregator({
    registryRoot,
    projectRoot,
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

export async function loadRegistryManifest(registryRoot: string): Promise<UiRegistryManifest> {
  const manifestUrl = toFileUrl(join(registryRoot, "registry", "manifest.ts")).href;
  const module = await import(manifestUrl) as { freshUiRegistryManifest?: UiRegistryManifest };
  if (!module.freshUiRegistryManifest) {
    throw new Error(`Fresh UI registry manifest not found at ${manifestUrl}`);
  }
  return module.freshUiRegistryManifest;
}

export function resolveRegistryItems(
  manifest: UiRegistryManifest,
  names: readonly string[],
): readonly UiRegistryItem[] {
  const byName = new Map(manifest.items.map((item) => [item.name, item]));
  const collections = new Map(manifest.collections.map((collection) => [
    collection.name,
    collection.items,
  ]));
  const resolved: UiRegistryItem[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visitItem = (name: string): void => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Cycle detected in Fresh UI registry dependencies at "${name}".`);
    }
    const item = byName.get(name);
    if (!item) {
      throw new Error(`Unknown Fresh UI registry item or collection: ${name}`);
    }
    visiting.add(name);
    for (const dependency of item.registryDependencies ?? []) visitItem(dependency);
    visiting.delete(name);
    visited.add(name);
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
  registryRoot: string,
  projectRoot: string,
  items: readonly UiRegistryItem[],
): readonly PlannedFile[] {
  const files = new Map<string, PlannedFile>();
  for (const item of items) {
    for (const file of item.files) {
      const source = resolve(registryRoot, file.source);
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
  return path.endsWith(".ts") || path.endsWith(".tsx");
}

function rewriteRegistryImports(
  content: string,
  sourceFile: string,
  targetFile: string,
  registryRoot: string,
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
  registryRoot: string,
  specifier: string,
): string | undefined {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return resolve(dirname(sourceFile), specifier);
  }
  const packagePrefix = "@netscript/fresh-ui/";
  if (specifier.startsWith(packagePrefix)) {
    return resolve(registryRoot, specifier.slice(packagePrefix.length));
  }
  return undefined;
}

function toImportSpecifier(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

async function writeStylesAggregator(input: {
  readonly registryRoot: string;
  readonly projectRoot: string;
  readonly items: readonly UiRegistryItem[];
  readonly fs: DenoFileSystem;
}): Promise<string> {
  const themeStylesPath = join(input.registryRoot, "registry", "theme", "styles.css");
  const themeStyles = await input.fs.readFile(themeStylesPath);
  const cssImports = [
    ...new Set(
      input.items.flatMap((item) =>
        item.css?.map((entry) => entry.content.trim()).filter((content) =>
          content.startsWith("@import ")
        ) ?? []
      ),
    ),
  ];
  const styles = composeStylesAggregator(themeStyles, cssImports);
  const target = resolve(input.projectRoot, "assets", "styles.css");
  await input.fs.writeFile(target, styles);
  return target;
}

function composeStylesAggregator(themeStyles: string, cssImports: readonly string[]): string {
  const lines = themeStyles.replace(/\r\n/g, "\n").split("\n");
  const importLines: string[] = [];
  let index = 0;
  while (index < lines.length && lines[index].startsWith("@import ")) {
    importLines.push(lines[index]);
    index += 1;
  }
  while (index < lines.length && lines[index].trim() === "") index += 1;
  const rest = lines.slice(index).join("\n").trimEnd();
  const importBlock = [
    ...importLines,
    "",
    "/* Per-item CSS - ui:init writes these @import lines. */",
    ...cssImports,
    "",
  ].join("\n");
  return `${importBlock}${rest}\n\n/* App-specific custom styles below. */\n`;
}

async function mergeDenoJsonImports(
  projectRoot: string,
  items: readonly UiRegistryItem[],
  fs: DenoFileSystem,
): Promise<{ readonly path: string; readonly added: readonly string[] }> {
  const path = resolve(projectRoot, "deno.json");
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
  if (!specifier.startsWith("npm:") && !specifier.startsWith("jsr:")) return undefined;
  const body = specifier.slice(4);
  if (body.startsWith("@")) {
    const parts = body.split("/");
    if (parts.length < 2) return undefined;
    const [scope, rest] = parts;
    return `${scope}/${rest.replace(/@.+$/, "")}`;
  }
  return body.replace(/@.+$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
