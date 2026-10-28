import { basename, dirname, normalize, relative, resolve } from '@std/path';
import type { RegistryFile } from '@netscript/fresh-ui/registry-v2';
import { APP_TOKEN_FILES } from '@netscript/fresh-ui/token-config';
import {
  isUiRelativePath,
  UI_CONFIG_FILE,
  UI_LOCK_FILE,
  type UiConfig,
} from '../../../domain/ui/ui-config.ts';
import { rewriteRegistryImports } from '../registry.ts';
import type { UiResolvedItem } from './registry-client.ts';

/** Planned app-owned file with provenance kept separate from its rewritten bytes. */
export interface UiCopyFile {
  readonly owner: string;
  readonly source: string;
  readonly target: string;
  readonly content: string;
  readonly managed: boolean;
}

/** Resolve upstream and legacy target placeholders through the selected app's aliases. */
export function uiTargetPath(root: string, file: RegistryFile, config: UiConfig): string {
  const aliases = config.aliases;
  const defaultDirectory = file.path.endsWith('.css')
    ? `${aliases.assets}/ui`
    : file.type === 'registry:lib'
    ? aliases.lib
    : file.type === 'registry:hook'
    ? aliases.hooks
    : file.type === 'registry:theme' || file.type === 'registry:style'
    ? aliases.assets
    : aliases.ui;
  let target = file.target ??
    `${defaultDirectory}/${basename(file.path).replace(/\.template$/, '')}`;
  if (target.startsWith('~/')) target = target.slice(2);
  for (const [alias, directory] of Object.entries(aliases)) {
    if (target.startsWith(`@${alias}/`)) {
      target = `${directory}/${target.slice(alias.length + 2)}`;
      break;
    }
  }
  if (target.startsWith('@') || !isUiRelativePath(target)) {
    throw new Error('Invalid registry destination path');
  }
  const local = relative(resolve(root), resolve(root, target)).replaceAll('\\', '/');
  if (
    !isUiRelativePath(local) || local === '.' || local.toLowerCase() === UI_CONFIG_FILE ||
    local.toLowerCase() === UI_LOCK_FILE
  ) {
    throw new Error('Registry files cannot replace app registry metadata or escape the app');
  }
  return local;
}

/** Isolate source-relative imports from other registries with coincidentally identical paths. */
function sourceScope(entry: UiResolvedItem): string {
  if (entry.source.startsWith('builtin:')) return 'builtin';
  const ref = entry.sourceRef ?? entry.ref;
  if (ref.startsWith('@')) return ref.slice(0, ref.indexOf('/'));
  return new URL('.', entry.source).href;
}

/** Prepare file destinations and imports, rejecting conflicting payloads before any writes. */
export function planUiCopies(
  root: string,
  items: readonly UiResolvedItem[],
  config: UiConfig,
): readonly UiCopyFile[] {
  const scopes = new Map<string, Map<string, string>>();
  for (const entry of items) {
    const key = sourceScope(entry);
    if (!scopes.has(key)) scopes.set(key, new Map());
    const sources = scopes.get(key)!;
    for (const file of entry.files) {
      const target = resolve(root, uiTargetPath(root, file, config));
      sources.set(normalize(file.path), target);
      if (file.path.startsWith('packages/fresh-ui/')) {
        sources.set(normalize(file.path.slice('packages/fresh-ui/'.length)), target);
      }
    }
  }
  const allTargets = new Set([...scopes.values()].flatMap((scope) => [...scope.values()]));
  const destinations = new Map<string, string>();
  const files: UiCopyFile[] = [];
  for (const entry of items) {
    const sources = scopes.get(sourceScope(entry))!;
    for (const file of entry.files) {
      const target = uiTargetPath(root, file, config);
      let content = file.content;
      if (/\.[cm]?[jt]sx?(?:\.template)?$/.test(file.path)) {
        content = rewriteRegistryImports(
          content,
          file.path,
          resolve(root, target),
          undefined,
          sources,
        );
        content = content.replace(
          /(\b(?:from|import)\s*(?:\(\s*)?['"])([^'"]+)(['"])/g,
          (_match, open: string, specifier: string, close: string) => {
            let next = specifier;
            for (const [alias, directory] of Object.entries(config.aliases)) {
              const prefixes = [`@${alias}/`, `@/${alias === 'ui' ? 'components/ui' : alias}/`];
              const prefix = prefixes.find((value) => specifier.startsWith(value));
              if (!prefix) continue;
              let mapped = resolve(root, directory, specifier.slice(prefix.length));
              if (!allTargets.has(mapped)) {
                mapped =
                  ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'].map((extension) =>
                    mapped + extension
                  ).find((candidate) => allTargets.has(candidate)) ?? mapped;
              }
              next = relative(dirname(resolve(root, target)), mapped).replaceAll('\\', '/');
              if (!next.startsWith('.')) next = `./${next}`;
              break;
            }
            return open + next + close;
          },
        );
      }
      const existing = destinations.get(target);
      if (existing !== undefined && existing !== content) {
        throw new Error(`Registry target collision: ${target}`);
      }
      destinations.set(target, content);
      const managed = ['styles.css', ...APP_TOKEN_FILES]
        .some((name) => resolve(root, target) === resolve(root, config.aliases.assets, name));
      files.push({ owner: entry.ref, source: file.path, target, content, managed });
    }
  }
  return files;
}
