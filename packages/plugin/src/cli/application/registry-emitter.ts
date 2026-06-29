/**
 * Generic static-registry source emitter shared by NetScript plugin CLIs.
 *
 * Every plugin CLI that compiles a project's convention-placed source files into a
 * generated `*.registry.ts` module (workers jobs, sagas, triggers, and future plugins)
 * shares the same emission skeleton: resolve each discovered file to a registry-relative
 * import specifier, render one import line per item, render one entry block per item, and
 * assemble `[header, ...imports, body].join('\n')` with a trailing newline.
 *
 * Only the *specifics* differ per plugin — the import-line shape, the entry-block shape,
 * the module header, and the body wrapper around the entries. {@linkcode renderRegistryModule}
 * captures the shared machinery and parameterizes those specifics through callbacks, so no
 * per-plugin (`if (kind === 'workers')`) branching lives in the generic. The path math that
 * turns a registry path plus a project-relative item path into a portable relative import
 * specifier lives once in {@linkcode toRegistryImportSpecifier}.
 *
 * @module
 */

/**
 * A discovered registry item carrying the project-relative source path used both to
 * build its import specifier and to label it inside the generated module.
 */
export interface RegistryEmitItem {
  /** Project-relative source path, using `/` separators (e.g. `workers/jobs/job-a.ts`). */
  readonly relativePath: string;
}

/**
 * Specifics a plugin CLI supplies to {@linkcode renderRegistryModule}.
 *
 * The generic owns ordering of the assembled module (header, then imports, then body) and
 * the registry-relative import-specifier math; the plugin owns the textual shape of each
 * import line, each entry block, the header, and the body wrapper.
 *
 * @typeParam TItem Concrete item shape, at least {@linkcode RegistryEmitItem}.
 */
export interface RegistryModuleSpec<TItem extends RegistryEmitItem> {
  /** Generated registry path (project-relative), used to derive relative import specifiers. */
  readonly registryPath: string;
  /** Discovered items, already filtered and ordered by the plugin. */
  readonly items: readonly TItem[];
  /** Stable per-item alias used by both the import line and the entry block (e.g. `job0`). */
  readonly alias: (index: number) => string;
  /** Render the import line for one item given its alias and resolved import specifier. */
  readonly renderImport: (alias: string, specifier: string, item: TItem, index: number) => string;
  /** Render the entry block (one or more lines) contributed to the registry body by one item. */
  readonly renderEntry: (alias: string, item: TItem, index: number) => readonly string[];
  /** Module header lines emitted before the import block. */
  readonly header: readonly string[];
  /** Wrap the rendered entry blocks into the module body (const declaration, exports, footer). */
  readonly body: (entries: readonly string[]) => readonly string[];
}

/**
 * Render a complete static-registry module from discovered items and plugin specifics.
 *
 * Assembles `[...header, ...imports, '', ...body(entries)].join('\n')`, where each import
 * line and entry block is produced by the plugin-supplied callbacks and each item's import
 * specifier is resolved with {@linkcode toRegistryImportSpecifier}. The result always ends
 * with a trailing newline.
 *
 * @typeParam TItem Concrete item shape, at least {@linkcode RegistryEmitItem}.
 * @param spec Registry path, ordered items, and the plugin's textual specifics.
 * @returns The generated module source as a single string.
 *
 * @example
 * ```ts
 * const source = renderRegistryModule({
 *   registryPath: '.netscript/generated/plugin-x/x.registry.ts',
 *   items: [{ relativePath: 'x/a.ts' }],
 *   alias: (index) => `x${index}`,
 *   renderImport: (alias, specifier) => `import * as ${alias} from ${JSON.stringify(specifier)};`,
 *   renderEntry: (alias) => [`  ${alias},`],
 *   header: ['// AUTO-GENERATED', ''],
 *   body: (entries) => ['export const registry = [', ...entries, '];', ''],
 * });
 * ```
 */
export function renderRegistryModule<TItem extends RegistryEmitItem>(
  spec: RegistryModuleSpec<TItem>,
): string {
  const registryDir = registryDirname(spec.registryPath);
  const imports = spec.items.map((item, index) => {
    const alias = spec.alias(index);
    const specifier = relativeImportSpecifier(registryDir, item.relativePath);
    return spec.renderImport(alias, specifier, item, index);
  });
  const entries = spec.items.flatMap((item, index) =>
    spec.renderEntry(spec.alias(index), item, index)
  );

  return [
    ...spec.header,
    ...imports,
    '',
    ...spec.body(entries),
  ].join('\n');
}

/**
 * Resolve the relative import specifier from a generated registry to a project-relative item.
 *
 * Mirrors the path math every plugin generator previously duplicated: compute the registry's
 * directory, take the relative route to the item path, normalize to `/` separators, and
 * prefix `./` when the result is not already explicitly relative.
 *
 * @param registryPath Project-relative path of the generated registry module.
 * @param itemPath Project-relative path of the imported source file.
 * @returns A portable relative import specifier (always starts with `.`).
 *
 * @example
 * ```ts
 * toRegistryImportSpecifier('.netscript/generated/plugin-x/x.registry.ts', 'x/a.ts');
 * // => '../../../x/a.ts'
 * ```
 */
export function toRegistryImportSpecifier(registryPath: string, itemPath: string): string {
  return relativeImportSpecifier(registryDirname(registryPath), itemPath);
}

function relativeImportSpecifier(fromDir: string, target: string): string {
  const fromParts = normalizePath(fromDir).split('/').filter(Boolean);
  const targetParts = normalizePath(target).split('/').filter(Boolean);
  const shared = sharedPrefixLength(fromParts, targetParts);
  const up = fromParts.slice(shared).map(() => '..');
  const down = targetParts.slice(shared);
  const specifier = [...up, ...down].join('/');
  return specifier.startsWith('.') ? specifier : `./${specifier}`;
}

function sharedPrefixLength(left: readonly string[], right: readonly string[]): number {
  const mismatch = left.findIndex((part, index) => part !== right[index]);
  return mismatch < 0 ? Math.min(left.length, right.length) : mismatch;
}

function registryDirname(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf('/');
  return index < 0 ? normalized : normalized.slice(0, index);
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/').replace(/\/+/g, '/');
}
