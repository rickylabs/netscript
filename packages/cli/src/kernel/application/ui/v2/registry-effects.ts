import { z } from 'zod';
import { dirname, relative, resolve } from '@std/path';
import type { RegistryCss } from '@netscript/fresh-ui/registry-v2';
import { uiContentHash, type UiLock } from '../../../domain/ui/ui-lock.ts';
import type { UiConfig } from '../../../domain/ui/ui-config.ts';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import { mergeDenoJsonImports } from '../registry-deno-json.ts';
import { renderUiRegistryStyles } from '../registry-styles.ts';
import type { UiCopyFile } from './copy-files.ts';
import type { UiResolvedItem } from './registry-client.ts';

const legacyMetadata = z.object({
  css: z.array(z.object({ content: z.string() }).passthrough()).optional(),
}).passthrough();

/** Convert nested registry CSS without introducing an application runtime or CSS compiler. */
function cssText(css: RegistryCss): string {
  return Object.entries(css).map(([key, value]) =>
    typeof value === 'string'
      ? `${key}: ${value};`
      : Object.keys(value).length === 0 && key.startsWith('@')
      ? `${key};`
      : `${key} {\n${cssText(value)}\n}`
  ).join('\n');
}

/** Build scheme-aware variables and font declarations from the portable registry fields. */
function itemCss(entry: UiResolvedItem): string {
  const item = entry.item;
  const blocks: string[] = [];
  for (const [scheme, values] of Object.entries(item.cssVars ?? {})) {
    const selector = scheme === 'theme'
      ? '@theme inline'
      : scheme === 'dark'
      ? '.dark, [data-scheme="dark"], [data-theme="dark"]'
      : ':root';
    blocks.push(
      `${selector} {\n${
        Object.entries(values).map(([key, value]) =>
          `${key.startsWith('--') ? key : `--${key}`}: ${value};`
        ).join('\n')
      }\n}`,
    );
  }
  if (item.css) blocks.push(cssText(item.css));
  if (item.font) {
    const font = item.font;
    const family = encodeURIComponent(font.family).replaceAll('%20', '+');
    const weights = font.weight?.length
      ? `:wght@${font.weight.map(encodeURIComponent).join(';')}`
      : '';
    blocks.unshift(
      `@import url("https://fonts.googleapis.com/css2?family=${family}${weights}&display=swap");`,
    );
    blocks.push(`:root { ${font.variable}: ${JSON.stringify(font.family)}; }`);
    blocks.push(`${font.selector ?? 'html'} { font-family: var(${font.variable}); }`);
  }
  return blocks.join('\n');
}

/** Plan generated CSS and remember each item's imports for safe update and removal. */
export async function registryCssFiles(
  root: string,
  entries: readonly UiResolvedItem[],
  copies: readonly UiCopyFile[],
  config: UiConfig,
): Promise<{
  readonly files: readonly UiCopyFile[];
  readonly imports: ReadonlyMap<string, readonly string[]>;
}> {
  const files: UiCopyFile[] = [];
  const imports = new Map<string, readonly string[]>();
  const stylesPath = resolve(root, config.aliases.assets, 'styles.css');
  for (const entry of entries) {
    const legacy = entry.item.meta?.netscript;
    const cssImports = legacy === undefined
      ? []
      : (legacyMetadata.parse(legacy).css ?? []).map((value) => value.content.trim());
    if (legacy === undefined && entry.item.type !== 'registry:theme') {
      for (
        const copy of copies.filter((copy) =>
          copy.owner === entry.ref && copy.target.endsWith('.css')
        )
      ) {
        const target = resolve(root, copy.target);
        if (target === stylesPath) continue;
        let specifier = relative(dirname(stylesPath), target).replaceAll('\\', '/');
        if (!specifier.startsWith('.')) specifier = `./${specifier}`;
        cssImports.push(`@import ${JSON.stringify(specifier)};`);
      }
    }
    // Builtin legacy files already carry compiled theme and component CSS.
    const content = legacy === undefined ? itemCss(entry) : '';
    if (content) {
      const id = `${entry.item.name}-${(await uiContentHash(entry.ref)).slice(0, 12)}`;
      const target = relative(root, resolve(root, config.aliases.assets, 'registry', `${id}.css`))
        .replaceAll('\\', '/');
      files.push({
        owner: entry.ref,
        source: `registry-css:${entry.ref}`,
        target,
        content: content + '\n',
        managed: true,
      });
      cssImports.push(`@import './registry/${id}.css';`);
    }
    imports.set(entry.ref, cssImports);
  }
  return { files, imports };
}

/** Merge CSS and Deno import effects through the same staged filesystem as copied files. */
export async function applyRegistryEffects(input: {
  readonly root: string;
  readonly config: UiConfig;
  readonly entries: readonly UiResolvedItem[];
  readonly previous?: UiLock;
  readonly lock: UiLock;
  readonly fs: FileSystemPort;
  readonly themeBase?: string;
}): Promise<void> {
  const { root, config, entries, fs } = input;
  await reconcileUiStyles(root, config, input.previous, input.lock, fs, input.themeBase);
  await mergeDenoJsonImports(
    root,
    entries.map((entry) => ({
      name: entry.item.name,
      files: [],
      dependencies: [
        ...(entry.item.dependencies ?? []),
        ...(entry.item.devDependencies ?? []),
        ...(entry.item.font?.dependency ? [entry.item.font.dependency] : []),
      ]
        .map((dependency) => /^(npm:|jsr:)/.test(dependency) ? dependency : `npm:${dependency}`),
    })),
    fs,
  );
}

/** Reconcile only stylesheet imports so removals never recreate package dependency mappings. */
export async function reconcileUiStyles(
  root: string,
  config: UiConfig,
  previous: UiLock | undefined,
  lock: UiLock,
  fs: FileSystemPort,
  themeBase?: string,
): Promise<void> {
  const allImports = [
    ...new Set(Object.values(lock.items).flatMap((item) => item.cssImports ?? [])),
  ];
  const removed = Object.values(previous?.items ?? {}).flatMap((item) => item.cssImports ?? [])
    .filter((line) => !allImports.includes(line));
  const stylesPath = resolve(root, config.aliases.assets, 'styles.css');
  const existing = await fs.exists(stylesPath) ? await fs.readFile(stylesPath) : '';
  if (existing || allImports.length || themeBase !== undefined) {
    await fs.writeFile(
      stylesPath,
      renderUiRegistryStyles(existing, allImports, removed, themeBase),
    );
  }
}
