import { validateFigmaSnapshot } from '../../../packages/fresh-ui/src/tokens/domain/figma/figma-snapshot.ts';
import { assertFigmaAliasCycles } from '../../../packages/fresh-ui/src/tokens/domain/figma/figma-alias-cycles.ts';
import {
  type GenerateOptions,
  LIBRARY_OWNER,
  LIBRARY_VERSION,
  type LibraryAxis,
  type LibraryBundle,
  type LibraryInput,
  type LibraryVariant,
  VARIANT_LIMITS,
} from './contract.ts';
import { resolveInventory } from './inventory.ts';
import { resolveBindings } from './token-bindings.ts';

function isDataAttribute(name: string): name is `data-${string}` {
  return /^data-[a-z][a-z0-9-]*$/.test(name);
}

/** Derive finite variant combinations without expanding planned/compatibility metadata. */
export function generateVariants(axes: readonly LibraryAxis[]): readonly LibraryVariant[] {
  let count = 1;
  for (const axis of axes) {
    count *= axis.values.length;
    if (count > VARIANT_LIMITS.component) throw new Error('Component variant limit exceeded');
  }
  let combinations: Readonly<Record<string, string>>[] = [{}];
  for (const axis of axes) {
    const values = axis.default === undefined
      ? axis.values
      : [axis.default, ...axis.values.filter((value) => value !== axis.default)];
    combinations = combinations.flatMap((attributes) =>
      values.map((value) => ({
        ...attributes,
        [axis.property]: value,
      }))
    );
  }
  return combinations.map((attributes) => ({
    name: Object.entries(attributes).map(([name, value]) => `${name}=${value}`).join(', ') ||
      'default',
    attributes,
  }));
}

/** Build the complete selected document in memory; this function has no IO or native effects. */
export function generateLibrary(input: LibraryInput, options: GenerateOptions = {}): LibraryBundle {
  const inventory = resolveInventory(input, options);
  const collections = validateFigmaSnapshot(input.collections);
  if (new Set(collections.map((c) => c.collection)).size !== collections.length) {
    throw new Error('Duplicate token collection');
  }
  assertFigmaAliasCycles(collections);
  let variants = 0;
  const components = inventory.entries.map(({ item, sourceItem, source, contract }) => {
    const axes: LibraryAxis[] = Object.entries(contract.attributes).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0
    ).map(([property, attribute]) => {
      if (!isDataAttribute(property)) throw new Error(`Invalid contract attribute: ${property}`);
      return {
        property,
        values: [...attribute.values],
        parts: attribute.parts?.length ? [...attribute.parts] : ['root'],
        ...(attribute.default !== undefined ? { default: attribute.default } : {}),
      };
    });
    const states = generateVariants(axes);
    variants += states.length;
    if (variants > VARIANT_LIMITS.library) throw new Error('Library variant limit exceeded');
    return {
      item,
      registryItem: sourceItem.name,
      source,
      contract,
      axes,
      variants: states,
      bindings: resolveBindings(contract.tokenRoles, collections),
    };
  });
  return {
    schemaVersion: LIBRARY_VERSION,
    kind: LIBRARY_OWNER,
    style: input.style,
    coverage: inventory.coverage,
    components,
  };
}
