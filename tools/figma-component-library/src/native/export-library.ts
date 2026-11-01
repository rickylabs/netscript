import type { ContractPart } from '../../../../packages/fresh-ui/contracts.ts';
import {
  type ImportReceipt,
  LIBRARY_OWNER,
  type LibraryBundle,
  type LibraryComponent,
  type LibraryInput,
} from '../contract.ts';
import { libraryHash, serializeLibrary, validateLibrary } from '../validate-library.ts';
import {
  DATA_KEYS,
  type FigmaComponentsPort,
  type NativeContext,
  type NativePage,
  type NativeScene,
} from './figma-port.ts';
import { bindingIdentity, preflightVariables } from './preflight.ts';

/** Only element anatomy becomes layers; native/pseudo/context anatomy stays in the source contract. */
export function elementParts(component: LibraryComponent): readonly ContractPart[] {
  return component.contract.parts.filter((part) =>
    part.name !== 'root' && (!part.representation || part.representation === 'element')
  );
}

function same(actual: unknown, expected: unknown, label: string): void {
  if (serializeLibrary(actual) !== serializeLibrary(expected)) {
    throw new Error(`Native library drift: ${label}`);
  }
}

function onlyBindings(node: NativeScene, allowed: readonly string[], label: string): void {
  const unknown = Object.entries(node.boundVariables ?? {}).filter(([key, value]) =>
    value !== undefined && !allowed.includes(key)
  ).map(([key]) => key);
  same(unknown, [], `${label}/unknown node binding`);
}

function inspectVariant(
  node: NativeScene,
  component: LibraryComponent,
  index: number,
  variables: ReadonlyMap<string, { readonly id: string }>,
): void {
  if (node.type !== 'COMPONENT') throw new Error(`Native variant type mismatch: ${component.item}`);
  onlyBindings(node, [], component.item);
  const variant = component.variants[index];
  if (component.axes.length) {
    same(node.name, variant.name, `${component.item}/variant name`);
    same(node.variantProperties, variant.attributes, `${component.item}/variant attributes`);
  } else {
    same(node.variantProperties, null, `${component.item}/unexpected variant properties`);
  }
  same(
    node.getPluginData(DATA_KEYS.part),
    serializeLibrary(component.contract.parts.find((p) => p.name === 'root')),
    `${component.item}/root`,
  );
  const parts = elementParts(component);
  same(
    node.children.length,
    parts.length + component.bindings.length,
    `${component.item}/anatomy/binding count`,
  );
  parts.forEach((part, i) => {
    const child = node.children[i];
    onlyBindings(child, [], `${component.item}/${part.name}`);
    same(child.type, 'FRAME', `${component.item}/${part.name}/type`);
    same(child.name, `part:${part.name}`, `${component.item}/${part.name}/name`);
    same(
      child.getPluginData(DATA_KEYS.part),
      serializeLibrary(part),
      `${component.item}/${part.name}/metadata`,
    );
    if (child.type === 'FRAME') {
      same(child.children.length, 0, `${component.item}/${part.name}/children`);
    }
  });
  component.bindings.forEach((binding, i) => {
    const child = node.children[parts.length + i];
    const identity = bindingIdentity(binding);
    onlyBindings(child, [binding.field], `${component.item}/${identity}`);
    same(child.name, `token:${identity}`, `${component.item}/${identity}/name`);
    same(
      child.getPluginData(DATA_KEYS.binding),
      serializeLibrary(binding),
      `${component.item}/${identity}/metadata`,
    );
    same(
      child.type,
      binding.type === 'STRING' ? 'TEXT' : 'FRAME',
      `${component.item}/${identity}/type`,
    );
    const id = variables.get(identity)?.id;
    if (!id) throw new Error(`Missing native token: ${identity}`);
    if (binding.field === 'fills') {
      if (child.type !== 'FRAME') throw new Error('Native paint carrier mismatch');
      same(child.fills.length, 1, `${component.item}/${identity}/paint count`);
      same(
        child.fills[0].boundVariables?.color?.id ?? null,
        id,
        `${component.item}/${identity}/paint binding`,
      );
    } else {
      const alias = child.boundVariables?.[binding.field];
      same(
        alias ?? null,
        { type: 'VARIABLE_ALIAS', id },
        `${component.item}/${identity}/node binding`,
      );
    }
    if (child.type === 'FRAME') {
      same(child.children.length, 0, `${component.item}/${identity}/children`);
    }
  });
}

/** Audit real native structure, variant definitions, anatomy and aliases before issuing a receipt. */
export async function inspectLibraryPage(
  api: FigmaComponentsPort,
  page: NativePage,
  bundle: LibraryBundle,
  sources: LibraryInput,
  context: NativeContext,
): Promise<ImportReceipt> {
  const variables = await preflightVariables(api, bundle, sources, context);
  await page.loadAsync();
  context.signal.throwIfAborted();
  same(page.children.length, bundle.components.length, 'component coverage');
  const components = bundle.components.map((component, index) => {
    const node = page.children[index];
    if (node.type === 'COMPONENT_SET') onlyBindings(node, [], component.item);
    same(node.name, `${bundle.style}/${component.item}`, `${component.item}/name`);
    same(
      node.getPluginData(DATA_KEYS.item),
      serializeLibrary({
        item: component.item,
        registryItem: component.registryItem,
        source: component.source,
        specId: component.contract.specId,
      }),
      `${component.item}/registry identity`,
    );
    if (component.axes.length) {
      if (node.type !== 'COMPONENT_SET') {
        throw new Error(`Native component set missing: ${component.item}`);
      }
      same(node.children.length, component.variants.length, `${component.item}/variant coverage`);
      same(
        Object.keys(node.componentPropertyDefinitions).sort(),
        component.axes.map((a) => a.property).sort(),
        `${component.item}/property coverage`,
      );
      for (const axis of component.axes) {
        const property = node.componentPropertyDefinitions[axis.property];
        same(property.type, 'VARIANT', `${component.item}/${axis.property}/property type`);
        same(
          [...(property.variantOptions ?? [])].sort(),
          [...axis.values].sort(),
          `${component.item}/${axis.property}/values`,
        );
        same(
          property.defaultValue,
          axis.default ?? axis.values[0],
          `${component.item}/${axis.property}/default`,
        );
      }
      node.children.forEach((variant, i) => inspectVariant(variant, component, i, variables));
    } else inspectVariant(node, component, 0, variables);
    return { item: component.item, registryItem: component.registryItem, nodeId: node.id };
  });
  return {
    schemaVersion: 1,
    provenance: context.provenance,
    bundleHash: await libraryHash(bundle, context.digest),
    fileKey: context.fileKey,
    pageId: page.id,
    components,
  };
}

/** Reconstruct the source bundle only when its native page and every binding still agree. */
export async function exportLibrary(
  api: FigmaComponentsPort,
  input: unknown,
  sources: LibraryInput,
  context: NativeContext,
): Promise<{ readonly bundle: LibraryBundle; readonly receipt: ImportReceipt }> {
  const bundle = validateLibrary(input, sources);
  const pages = api.root.children.filter((p) => p.getPluginData(DATA_KEYS.owner) === LIBRARY_OWNER);
  if (pages.length !== 1) throw new Error('Missing or ambiguous generated library page');
  const page = pages[0];
  same(page.getPluginData(DATA_KEYS.status), 'complete', 'incomplete prior import');
  same(
    page.getPluginData(DATA_KEYS.hash),
    await libraryHash(bundle, context.digest),
    'source hash',
  );
  same(
    page.getPluginData(DATA_KEYS.selection),
    serializeLibrary(bundle.coverage.selected),
    'selection',
  );
  return { bundle, receipt: await inspectLibraryPage(api, page, bundle, sources, context) };
}
