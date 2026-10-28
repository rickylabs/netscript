import { z } from 'zod';
import { UI_DEFAULT_STYLE } from '../../../domain/ui/ui-config.ts';
import type { UiConfig } from '../../../domain/ui/ui-config.ts';
import type { UiLock } from '../../../domain/ui/ui-lock.ts';
import {
  uiDependencyReference,
  type UiRegistryClient,
  type UiResolvedItem,
} from './registry-client.ts';

const componentMap = z.record(z.string(), z.string().min(1));
const componentTypes = new Set(['registry:component', 'registry:ui', 'registry:block']);

/** Style sources keep logical item identity and explicit destinations over the shared contract. */
export async function resolveUiStyleSources(input: {
  readonly client: UiRegistryClient;
  readonly config: UiConfig;
  readonly previous?: UiLock;
  readonly names: readonly string[];
  readonly theme?: string;
}): Promise<{
  readonly entries: readonly UiResolvedItem[];
  readonly config: UiConfig;
  readonly changed: boolean;
}> {
  const { client, previous, names, theme } = input;
  let entries = await client.resolve(names, theme);
  const chosen = entries.find((entry) =>
    names.includes(entry.ref) && entry.item.type === 'registry:style' &&
    entry.item.meta?.components !== undefined
  );
  const styleRef = chosen?.ref ?? input.config.style;
  const changed = chosen !== undefined && styleRef !== input.config.style;
  const config = { ...input.config, style: styleRef };
  if (changed) {
    entries = await client.resolve([
      ...new Set([
        ...Object.keys(previous?.items ?? {}).filter((ref) =>
          previous!.items[ref].type !== 'registry:style'
        ),
        ...names,
      ]),
    ], theme);
  }
  // Lightweight injected registries need not provide the built-in Utility catalog.
  const available = styleRef !== UI_DEFAULT_STYLE || chosen ||
    (await client.catalog()).items.some((item) => item.name === UI_DEFAULT_STYLE);
  if (!available) return { entries, config, changed };
  const style = chosen ?? await client.item(styleRef);
  if (style.item.type !== 'registry:style') {
    throw new Error('Configured style is not registry:style');
  }
  const map = componentMap.parse(style.item.meta?.components);
  const aliases = new Map<string, string>();
  const replacements = new Map<string, UiResolvedItem>();
  const extras = new Map<string, UiResolvedItem>();
  for (const entry of entries) {
    if (entry.item.type === 'registry:style' || entry.item.type === 'registry:theme') continue;
    const compatible = styleRef !== UI_DEFAULT_STYLE || entry.source.startsWith('builtin:');
    const source = compatible ? map[entry.ref] ?? map[entry.item.name] : undefined;
    if (!source) {
      if ((changed || compatible) && componentTypes.has(entry.item.type)) {
        throw new Error(`Style has no source for installed component: ${entry.ref}`);
      }
      continue;
    }
    const ref = uiDependencyReference(style, source);
    if (ref === entry.ref) continue;
    const graph = await client.resolve([ref], theme);
    const replacement = graph.find((item) => item.ref === ref);
    if (!replacement || replacement.item.type !== entry.item.type) {
      throw new Error(`Style source has an incompatible item type: ${entry.ref}`);
    }
    const targets = (value: UiResolvedItem) => value.files.map((file) => file.target).sort();
    if (
      entry.files.some((file) => !file.target) || replacement.files.some((file) => !file.target) ||
      JSON.stringify(targets(entry)) !== JSON.stringify(targets(replacement))
    ) throw new Error(`Style source must preserve explicit file targets: ${entry.ref}`);
    aliases.set(ref, entry.ref);
    replacements.set(entry.ref, replacement);
    for (const extra of graph) extras.set(extra.ref, extra);
  }
  const selected = new Map(entries.map((entry) => [entry.ref, entry]));
  for (const extra of extras.values()) {
    if (!aliases.has(extra.ref) && !selected.has(extra.ref)) selected.set(extra.ref, extra);
  }
  // The style itself is installed for provenance even when it declares no files.
  if (chosen || styleRef !== UI_DEFAULT_STYLE) selected.set(style.ref, style);
  return {
    config,
    changed,
    entries: [...selected.values()].map((logical) => {
      const source = replacements.get(logical.ref) ?? logical;
      return {
        ...source,
        ref: logical.ref,
        sourceRef: source.sourceRef ?? source.ref,
        resolvedDependencies: (source.resolvedDependencies ??
          (source.item.registryDependencies ?? []).map((ref) => uiDependencyReference(source, ref)))
          .map((ref) => aliases.get(ref) ?? ref),
      };
    }),
  };
}
