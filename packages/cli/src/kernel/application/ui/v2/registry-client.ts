import { z } from 'zod';
import type { Registry, RegistryFile, RegistryItem } from '@netscript/fresh-ui/registry-v2';
import type { UiConfig } from '../../../domain/ui/ui-config.ts';
import {
  isUiRelativePath,
  parseUiRegistryJson,
  uiRegistryUrl,
} from '../../../domain/ui/ui-config.ts';
import type { UiRegistryTransportPort } from '../../../ports/ui-registry-port.ts';
import type { UiRegistryPathPort } from '../../../ports/ui-registry-port.ts';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import type { TokenEnginePort } from '../../../ports/token-engine-port.ts';

/** Source bytes attached to an item before any install plan is allowed to write files. */
export interface UiResolvedItem {
  readonly ref: string;
  /** Actual registry identity when a style replaces a logical component item. */
  readonly sourceRef?: string;
  readonly source: string;
  readonly item: RegistryItem;
  readonly files: readonly (RegistryFile & { readonly content: string })[];
  readonly resolvedDependencies?: readonly string[];
}

/** Embedded registry injection keeps remote tests independent of production component payloads. */
export interface UiRegistryClientDependencies {
  readonly transport?: UiRegistryTransportPort;
  readonly builtin?: () => Promise<
    { readonly registry: Registry; readonly content: Readonly<Record<string, string>> }
  >;
}

/** Shared injected edges for app registry operations and token preset compilation. */
export interface UiRegistryDependencies extends UiRegistryClientDependencies {
  readonly fs: FileSystemPort;
  readonly paths?: UiRegistryPathPort;
  readonly tokenEngine?: TokenEnginePort;
}

/** One request-scoped registry client, with dependency, namespace and source caches. */
export interface UiRegistryClient {
  catalog(namespace?: string): Promise<Registry>;
  item(ref: string): Promise<UiResolvedItem>;
  resolve(refs: readonly string[], theme?: string): Promise<readonly UiResolvedItem[]>;
}

/** Resolve a bare dependency in the registry that declared it, without forwarding cross-origin auth. */
export function uiDependencyReference(owner: UiResolvedItem, dependency: string): string {
  if (/^(https?:|github:|@)/.test(dependency)) return dependency;
  const namespace = (owner.sourceRef ?? owner.ref).match(namespaceRef)?.[1];
  return namespace
    ? `${namespace}/${dependency}`
    : owner.source.startsWith('builtin:')
    ? dependency
    : new URL(`${dependency}.json`, owner.source).href;
}

const collectionsSchema = z.array(
  z.object({ name: z.string(), items: z.array(z.string()) }).passthrough(),
);
const namespaceRef = /^(@[A-Za-z0-9][A-Za-z0-9_.-]*)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/;

/** Resolve source catalogs and static item URLs without importing or executing remote modules. */
export async function createUiRegistryClient(
  config: UiConfig,
  deps: UiRegistryClientDependencies,
): Promise<UiRegistryClient> {
  const { validateRegistry, validateRegistryItem } = await import(
    '@netscript/fresh-ui/registry-v2'
  );
  const responses = new Map<string, Promise<string>>();
  let embedded: ReturnType<NonNullable<UiRegistryClientDependencies['builtin']>> | undefined;
  const builtin = () =>
    embedded ??= deps.builtin
      ? deps.builtin()
      : import('@netscript/fresh-ui/registry').then((module) => ({
        registry: module.freshUiRegistryJson,
        content: module.FRESH_UI_REGISTRY_CONTENT,
      }));
  const read = (url: string, headers: Readonly<Record<string, string>>): Promise<string> => {
    if (!deps.transport) throw new Error('Remote registry transport is not configured');
    const key = JSON.stringify([url, headers]);
    if (!responses.has(key)) responses.set(key, deps.transport.read(uiRegistryUrl(url), headers));
    return responses.get(key)!;
  };
  const namespace = (name: string) => {
    const source = config.registries[name];
    if (!source) throw new Error(`Unknown registry namespace: ${name}`);
    const entry = typeof source === 'string'
      ? { url: source, headers: {}, index: undefined }
      : source;
    return {
      ...entry,
      index: entry.index ? uiRegistryUrl(entry.index) : undefined,
      url: uiRegistryUrl(entry.url.replaceAll('{name}', '__item__')).replaceAll(
        '__item__',
        '{name}',
      ),
    };
  };
  const catalogAt = async (
    url: string,
    headers: Readonly<Record<string, string>>,
    visited = new Set<string>(),
  ): Promise<Registry> => {
    if (visited.has(url)) throw new Error('Remote registry include cycle');
    visited.add(url);
    const registry = validateRegistry(parseUiRegistryJson(await read(url, headers)));
    const items = [...registry.items];
    for (const include of registry.include ?? []) {
      if (!safeRemoteSource(include)) throw new Error('Invalid remote registry include');
      const chunk = await catalogAt(new URL(include, url).href, headers, new Set(visited));
      items.push(...chunk.items);
    }
    return validateRegistry({ ...registry, include: undefined, items });
  };
  const catalog = async (name?: string): Promise<Registry> => {
    if (!name) return (await builtin()).registry;
    const entry = namespace(name);
    return await catalogAt(
      entry.index ?? entry.url.replaceAll('{name}', 'registry'),
      entry.headers,
    );
  };
  const item = async (ref: string): Promise<UiResolvedItem> => {
    const named = ref.match(namespaceRef);
    let payload: RegistryItem;
    let source: string;
    let base: string | undefined;
    let headers: Readonly<Record<string, string>> = {};
    if (named) {
      const entry = namespace(named[1]);
      headers = entry.headers;
      source = uiRegistryUrl(entry.url.replaceAll('{name}', encodeURIComponent(named[2])));
      base = source;
      if (entry.url.includes('{name}')) {
        payload = validateRegistryItem(parseUiRegistryJson(await read(source, headers)));
      } else {
        const registry = await catalogAt(source, headers);
        const found = registry.items.find((candidate) => candidate.name === named[2]);
        if (!found) throw new Error(`Unknown registry item: ${ref}`);
        payload = found;
      }
      if (payload.name !== named[2]) {
        throw new Error('Registry item response does not match the requested name');
      }
    } else if (/^(https?:|github:)/.test(ref)) {
      source = uiRegistryUrl(ref);
      base = source;
      payload = validateRegistryItem(parseUiRegistryJson(await read(source, headers)));
    } else {
      if (ref.startsWith('@')) throw new Error('Invalid namespaced registry item reference');
      const built = await builtin();
      const found = built.registry.items.find((candidate) => candidate.name === ref);
      if (!found) throw new Error(`Unknown registry item or collection: ${ref}`);
      payload = found;
      source = `builtin:${ref}`;
    }
    const files = await Promise.all((payload.files ?? []).map(async (file) => {
      if (!safeRemoteSource(file.path)) {
        throw new Error('Registry file source must be a safe relative path');
      }
      let content = file.content;
      if (content === undefined && base) {
        content = await read(new URL(file.path, base).href, headers);
      }
      if (content === undefined) {
        const key = file.path.startsWith('packages/fresh-ui/')
          ? file.path.slice('packages/fresh-ui/'.length)
          : `../../${file.path}`;
        const embeddedContent = (await builtin()).content;
        content = embeddedContent[file.path] ?? embeddedContent[key];
      }
      if (content === undefined) {
        throw new Error(`Registry source content is missing: ${file.path}`);
      }
      return { ...file, content };
    }));
    return { ref, source, item: payload, files };
  };
  return {
    catalog,
    item,
    resolve: async (refs, theme) => {
      const result: UiResolvedItem[] = [];
      const replacements = new Map<string, string>();
      if (theme && (await item(theme)).item.type !== 'registry:theme') {
        throw new Error('Theme override must name a registry:theme item');
      }
      const visiting = new Set<string>();
      const visited = new Set<string>();
      const visit = async (ref: string): Promise<void> => {
        if (visited.has(ref)) return;
        if (visiting.has(ref)) throw new Error(`Registry dependency cycle: ${ref}`);
        if (visited.size + visiting.size >= 256) {
          throw new Error('Registry dependency graph exceeds 256 items');
        }
        visiting.add(ref);
        const resolved = await item(ref);
        if (theme && resolved.item.type === 'registry:theme' && ref !== theme) {
          replacements.set(ref, theme);
          await visit(theme);
          visiting.delete(ref);
          visited.add(ref);
          return;
        }
        for (const dependency of resolved.item.registryDependencies ?? []) {
          await visit(uiDependencyReference(resolved, dependency));
        }
        visiting.delete(ref);
        visited.add(ref);
        result.push(resolved);
      };
      for (const ref of refs) {
        if (/^(https?:|github:|@)/.test(ref)) {
          await visit(ref);
          continue;
        }
        const collection = collectionsSchema.parse(
          (await builtin()).registry.meta?.collections ?? [],
        ).find((entry) => entry.name === ref);
        if (collection) { for (const name of collection.items) await visit(name); }
        else await visit(ref);
      }
      return result.map((entry) => ({
        ...entry,
        resolvedDependencies: (entry.item.registryDependencies ?? [])
          .map((dependency) => uiDependencyReference(entry, dependency)).map((dependency) =>
            replacements.get(dependency) ?? dependency
          ),
      }));
    },
  };
}

/** URL normalization must not turn an encoded source segment into parent traversal. */
function safeRemoteSource(path: string): boolean {
  try {
    return isUiRelativePath(path) && isUiRelativePath(decodeURIComponent(path));
  } catch {
    return false;
  }
}
