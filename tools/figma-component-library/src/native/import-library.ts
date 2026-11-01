import { z } from 'npm:zod@^4.6.5';
import {
  type ImportReceipt,
  LIBRARY_OWNER,
  type LibraryInput,
  type TokenBinding,
} from '../contract.ts';
import { libraryHash, serializeLibrary, validateLibrary } from '../validate-library.ts';
import { elementParts, exportLibrary, inspectLibraryPage } from './export-library.ts';
import {
  DATA_KEYS,
  type FigmaComponentsPort,
  type NativeComponent,
  type NativeContext,
  type NativeScene,
  type NativeVariable,
} from './figma-port.ts';
import { bindingIdentity, preflightVariables } from './preflight.ts';

const SPECIMEN_FONT = { family: 'Inter', style: 'Regular' } as const;
const color = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).optional(),
});

function bindToken(
  api: FigmaComponentsPort,
  node: NativeScene,
  binding: TokenBinding,
  variable: NativeVariable,
): void {
  if (binding.field === 'characters') {
    if (node.type !== 'TEXT') throw new Error('String token carrier must be text');
    node.fontName = SPECIMEN_FONT;
    node.characters = binding.variable;
    node.setBoundVariable('characters', variable);
  } else if (node.type === 'FRAME') {
    node.resize(24, 24);
    node.layoutMode = 'HORIZONTAL';
    if (binding.field === 'fills') {
      const resolved = variable.resolveForConsumer(node);
      if (resolved.resolvedType !== 'COLOR') throw new Error('Native resolved color type mismatch');
      const rgb = color.parse(resolved.value);
      // Seed the actual resolved color; Figma can otherwise render a stale stored paint value.
      node.fills = [
        api.variables.setBoundVariableForPaint(
          { type: 'SOLID', color: { r: rgb.r, g: rgb.g, b: rgb.b }, opacity: rgb.a ?? 1 },
          'color',
          variable,
        ),
      ];
    } else node.setBoundVariable(binding.field, variable);
  } else throw new Error('Token carrier must be a frame');
  node.name = `token:${bindingIdentity(binding)}`;
  node.setPluginData(DATA_KEYS.binding, serializeLibrary(binding));
}

/** Validate the whole selected library and host variables before transactional page creation. */
export async function importLibrary(
  api: FigmaComponentsPort,
  input: unknown,
  sources: LibraryInput,
  context: NativeContext,
): Promise<ImportReceipt> {
  const bundle = validateLibrary(input, sources);
  const variables = await preflightVariables(api, bundle, sources, context);
  const pages = api.root.children.filter((p) => p.getPluginData(DATA_KEYS.owner) === LIBRARY_OWNER);
  if (pages.length) return (await exportLibrary(api, bundle, sources, context)).receipt;
  if (bundle.components.some((c) => c.bindings.some((b) => b.type === 'STRING'))) {
    await api.loadFontAsync(SPECIMEN_FONT);
  }
  context.signal.throwIfAborted();
  const hash = await libraryHash(bundle, context.digest);
  const created: NativeScene[] = [];
  const page = api.createPage();
  const track = <T extends NativeScene>(node: T): T => {
    created.push(node);
    return node;
  };
  try {
    page.name = `${LIBRARY_OWNER} — staging`;
    page.setPluginData(DATA_KEYS.owner, LIBRARY_OWNER);
    page.setPluginData(DATA_KEYS.status, 'staging');
    for (const [index, component] of bundle.components.entries()) {
      context.signal.throwIfAborted();
      const variants: NativeComponent[] = [];
      for (const variant of component.variants) {
        const node = track(api.createComponent());
        page.appendChild(node);
        node.name = variant.name;
        node.layoutMode = 'VERTICAL';
        node.primaryAxisSizingMode = 'AUTO';
        node.counterAxisSizingMode = 'AUTO';
        node.itemSpacing = 4;
        node.fills = [];
        node.setPluginData(
          DATA_KEYS.part,
          serializeLibrary(component.contract.parts.find((p) => p.name === 'root')),
        );
        for (const part of elementParts(component)) {
          const child = track(api.createFrame());
          node.appendChild(child);
          child.name = `part:${part.name}`;
          child.resize(24, 24);
          child.fills = [];
          child.setPluginData(DATA_KEYS.part, serializeLibrary(part));
        }
        for (const binding of component.bindings) {
          const variable = variables.get(bindingIdentity(binding));
          if (!variable) throw new Error('Preflight native variable disappeared');
          const child = track(binding.type === 'STRING' ? api.createText() : api.createFrame());
          node.appendChild(child);
          bindToken(api, child, binding, variable);
        }
        variants.push(node);
      }
      const node = component.axes.length
        ? track(api.combineAsVariants(variants, page))
        : variants[0];
      node.name = `${bundle.style}/${component.item}`;
      node.x = (index % 4) * 480;
      node.y = Math.floor(index / 4) * 600;
      node.setPluginData(
        DATA_KEYS.item,
        serializeLibrary({
          item: component.item,
          registryItem: component.registryItem,
          source: component.source,
          specId: component.contract.specId,
        }),
      );
    }
    const receipt = await inspectLibraryPage(api, page, bundle, sources, context);
    page.setPluginData(DATA_KEYS.hash, hash);
    page.setPluginData(DATA_KEYS.selection, serializeLibrary(bundle.coverage.selected));
    page.setPluginData(DATA_KEYS.status, 'complete');
    page.name = `NetScript ${bundle.style} — ${
      bundle.coverage.complete ? 'registry inventory' : 'selected subset'
    }`;
    return receipt;
  } catch (error) {
    // Native creators initially attach to the current page; track handles before reparenting as well.
    for (const node of created.reverse()) if (!node.removed) node.remove();
    if (!page.removed) page.remove();
    throw error;
  }
}
