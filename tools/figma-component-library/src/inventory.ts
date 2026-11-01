import { z } from 'npm:zod@^4.6.5';
import type { ComponentContract } from '../../../packages/fresh-ui/contracts.ts';
import { validateRegistry } from '../../../packages/fresh-ui/registry-v2.ts';
import type { RegistryItem } from '../../../packages/fresh-ui/registry-v2.ts';
import type { GenerateOptions, LibraryCoverage, LibraryInput } from './contract.ts';
import { validateContracts } from './validate-contract.ts';

const identifier = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const identityMap = z.record(identifier, identifier);
const VISUAL_TYPES = new Set(['registry:ui', 'registry:component', 'registry:block']);

/** Exact source join resolved from a style's registry map. */
export interface InventoryEntry {
  readonly item: string;
  readonly sourceItem: RegistryItem;
  readonly contract: ComponentContract;
  readonly source: string;
}
/** Validated inventory keeps exclusions visible even when generating a selected subset. */
export interface LibraryInventory {
  readonly entries: readonly InventoryEntry[];
  readonly coverage: LibraryCoverage;
}

/** Resolve every visual registry entry before selecting any item; refuse stale or fuzzy identities. */
export function resolveInventory(
  input: LibraryInput,
  options: GenerateOptions = {},
): LibraryInventory {
  const catalog = validateContracts(input.catalog);
  const registry = validateRegistry(input.registry);
  const items = new Map(registry.items.map((item) => [item.name, item]));
  if (items.size !== registry.items.length) throw new Error('Duplicate registry item');
  const style = items.get(input.style);
  if (style?.type !== 'registry:style') throw new Error(`Unknown component style: ${input.style}`);
  const sourceMap = identityMap.parse(style.meta?.components);
  if (Object.keys(sourceMap).length === 0) throw new Error('Empty style source map');
  const aliases = identityMap.parse(input.aliases);
  const contracts = new Map(catalog.components.map((c) => [c.name, c]));
  const entries: InventoryEntry[] = [];
  const physical = new Set<string>();
  const claimedContracts = new Set<string>();
  const referenced = new Set<string>();
  const logical = new Set<string>();
  for (const candidate of registry.items.filter((item) => item.meta?.components !== undefined)) {
    const map = identityMap.parse(candidate.meta?.components);
    for (const [name, target] of Object.entries(map)) {
      referenced.add(target);
      if (VISUAL_TYPES.has(items.get(target)?.type ?? '')) logical.add(name);
    }
  }
  for (const item of registry.items.filter((item) => VISUAL_TYPES.has(item.type))) {
    if (!referenced.has(item.name)) throw new Error(`Unmapped registry component: ${item.name}`);
  }
  for (const name of logical) {
    if (!Object.hasOwn(sourceMap, name)) throw new Error(`Missing style mapping: ${name}`);
  }
  for (const item of Object.keys(sourceMap).sort()) {
    const sourceItem = items.get(sourceMap[item]);
    if (!sourceItem) throw new Error(`Unknown registry mapping: ${item}/${sourceMap[item]}`);
    if (physical.has(sourceItem.name)) {
      throw new Error(`Duplicate source mapping: ${sourceItem.name}`);
    }
    physical.add(sourceItem.name);
    if (!VISUAL_TYPES.has(sourceItem.type)) continue;
    const alias = aliases[item];
    if (alias && (alias === item || contracts.has(item))) {
      throw new Error(`Stale contract alias: ${item}/${alias}`);
    }
    const contract = contracts.get(alias ?? item);
    if (!contract) throw new Error(`Missing contract for registry item: ${item}`);
    if (!contract.shipped) throw new Error(`Unshipped registry contract: ${item}/${contract.name}`);
    if (claimedContracts.has(contract.name)) {
      throw new Error(`Duplicate contract mapping: ${contract.name}`);
    }
    claimedContracts.add(contract.name);
    const sources = sourceItem.files?.filter((f) => /\.(?:tsx|ts)$/.test(f.path)) ?? [];
    if (sources.length > 1) throw new Error(`Ambiguous component source: ${item}`);
    const source = sources[0]?.path;
    if (
      !source || source.startsWith('/') || source.includes('\\') ||
      source.split('/').some((segment) => segment === '..' || segment === '.') ||
      /[\r\n<>]/.test(source) || /^[a-z]+:/i.test(source)
    ) throw new Error(`Missing or unsafe component source: ${item}`);
    entries.push({ item, sourceItem, contract, source });
  }
  for (const [item, contract] of Object.entries(aliases)) {
    if (!entries.some((entry) => entry.item === item && entry.contract.name === contract)) {
      throw new Error(`Unknown or stale contract alias: ${item}/${contract}`);
    }
  }
  if (entries.length === 0) throw new Error('No visual registry components');
  const available = entries.map((entry) => entry.item);
  const selected = options.items ? [...options.items].sort() : available;
  if (selected.length === 0) throw new Error('Empty component selection');
  if (new Set(selected).size !== selected.length) throw new Error('Duplicate selected item');
  for (const item of selected) {
    if (!available.includes(item)) throw new Error(`Unknown selected item: ${item}`);
  }
  const used = new Set(entries.map((entry) => entry.contract.name));
  const omitted = available.filter((item) => !selected.includes(item));
  return {
    entries: entries.filter((entry) => selected.includes(entry.item)),
    coverage: {
      complete: omitted.length === 0,
      available,
      selected,
      omitted,
      unregisteredContracts: catalog.components.filter((c) => !used.has(c.name))
        .map(({ name, shipped }) => ({ name, shipped })).sort((a, b) =>
          a.name < b.name ? -1 : a.name > b.name ? 1 : 0
        ),
    },
  };
}
