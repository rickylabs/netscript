import { applyEdits, type Node, parseTree } from 'jsonc-parser';
import {
  dirname,
  fromFileUrl,
  isAbsolute,
  relative,
  resolve,
  SEPARATOR,
  toFileUrl,
} from '@std/path';

// Relocate only path-bearing Deno/import-map fields, preserving comments and authored formatting.
export function relocateDenoConfig(
  text: string,
  configPath: string,
  sourceRoot: string,
  destinationRoot: string,
): string {
  const tree = parseTree(text);
  if (tree?.type !== 'object') return text;
  const sourceDirectory = dirname(resolve(sourceRoot, configPath));
  const destinationDirectory = dirname(resolve(destinationRoot, configPath));
  const edits: Array<{ offset: number; length: number; content: string }> = [];
  const relocate = (node: Node | undefined) => {
    const value: unknown = node?.value;
    if (node?.type !== 'string' || typeof value !== 'string') return;
    if (!/^(?:\.\.?\/|\/|file:)/.test(value)) return;
    const url = new URL(value, toFileUrl(sourceDirectory + SEPARATOR));
    if (url.protocol !== 'file:') return;
    const path = fromFileUrl(url);
    const within = relative(sourceRoot, path);
    const target = !isAbsolute(within) && within !== '..' && !within.startsWith('..' + SEPARATOR)
      ? resolve(destinationRoot, within)
      : path;
    let replacement: string;
    if (value.startsWith('file:')) {
      replacement = toFileUrl(target).href;
    } else if (value.startsWith('/')) {
      replacement = encodePath(target);
    } else {
      const path = relative(destinationDirectory, target);
      replacement = isAbsolute(path) ? toFileUrl(target).href : encodePath(path);
      if (!isAbsolute(path) && !replacement.startsWith('.')) replacement = './' + replacement;
    }
    if (url.pathname.endsWith('/') && !replacement.endsWith('/')) replacement += '/';
    replacement += url.search + url.hash;
    if (replacement !== value) {
      edits.push({
        offset: node.offset,
        length: node.length,
        content: JSON.stringify(replacement),
      });
    }
  };
  const imports = (node: Node | undefined) => {
    if (node?.type !== 'object') return;
    for (const property of node.children ?? []) {
      relocate(property.children?.[0]);
      relocate(property.children?.[1]);
    }
  };
  for (const property of tree.children ?? []) {
    const [key, value] = property.children ?? [];
    switch (key?.value) {
      case 'imports':
        imports(value);
        break;
      case 'scopes':
        for (const scope of value?.children ?? []) {
          relocate(scope.children?.[0]);
          imports(scope.children?.[1]);
        }
        break;
      case 'importMap':
        relocate(value);
        break;
      case 'workspace':
        for (const member of value?.children ?? []) relocate(member);
        break;
    }
  }
  return applyEdits(text, edits);
}

function encodePath(path: string): string {
  return path.replaceAll('\\', '/').split('/').map(encodeURIComponent).join('/');
}

// Removal uses these snapshots to restore import mappings; they must share the config's path base.
export function relocateInstallMetadata(
  text: string,
  relocateConfig: (text: string, configPath: string) => string,
): string {
  const tree = parseTree(text);
  const install = tree?.children?.find((node) => node.children?.[0]?.value === 'netscriptInstall')
    ?.children?.[1];
  const edits: Array<{ offset: number; length: number; content: string }> = [];
  const relocate = (node: Node | undefined, configPath: string) => {
    const value: unknown = node?.value;
    if (node?.type !== 'string' || typeof value !== 'string') return;
    const relocated = relocateConfig(value, configPath);
    if (relocated !== value) {
      edits.push({ offset: node.offset, length: node.length, content: JSON.stringify(relocated) });
    }
  };
  for (const property of install?.children ?? []) {
    const [key, value] = property.children ?? [];
    switch (key?.value) {
      case 'rootDenoJsonBefore':
      case 'rootDenoJsonAfter':
        relocate(value, 'deno.json');
        break;
      case 'managedFilesBefore':
      case 'managedFilesAfter':
        for (const file of value?.children ?? []) {
          const path: unknown = file.children?.[0]?.value;
          if (typeof path === 'string' && /(?:^|\/)deno\.jsonc?$/.test(path)) {
            relocate(file.children?.[1], path);
          }
        }
        break;
    }
  }
  return applyEdits(text, edits);
}
