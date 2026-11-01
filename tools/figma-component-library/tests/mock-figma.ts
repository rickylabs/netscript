import { validateFigmaSnapshot } from '../../../packages/fresh-ui/src/tokens/domain/figma/figma-snapshot.ts';
import type { FigmaVariable } from '../../../packages/fresh-ui/tokens.ts';
import type {
  FigmaComponentsPort,
  NativeAlias,
  NativeComponent,
  NativeFrame,
  NativeLayout,
  NativeNode,
  NativePage,
  NativeScene,
  NativeSet,
  NativeText,
  NativeVariable,
} from '../src/native/figma-port.ts';

type Collection = { id: string; name: string; modes: { modeId: string; name: string }[] };

/** Stateful native tree with automatic original-page attachment and real reparent/remove semantics. */
export class MockFigma implements FigmaComponentsPort {
  readonly fileKey = 'FixtureFileKey123';
  readonly root: { children: NativePage[] } = { children: [] };
  readonly localCollections: Collection[] = [];
  readonly localVariables: NativeVariable[] = [];
  readonly originalPage: NativePage;
  readonly mutableChildren: Map<string, NativeScene[]> = new Map();
  readonly nodes: Map<string, NativeNode> = new Map();
  readonly parent: Map<string, string> = new Map();
  mutations = 0;
  failFrameAfter?: number;
  failReparent = false;
  failFont = false;
  private sequence = 1;
  private frames = 0;
  constructor(snapshot: unknown) {
    const collections = validateFigmaSnapshot(snapshot);
    const valueByIdentity = new Map<string, { type: FigmaVariable['type']; value: unknown }>();
    collections.forEach((collection, index) => {
      const id = `collection-${index}`;
      this.localCollections.push({
        id,
        name: collection.collection,
        modes: collection.modes.map((name, index) => ({ name, modeId: `mode-${index}` })),
      });
      collection.variables.forEach((variable, index) => {
        valueByIdentity.set(`${collection.collection}/${variable.name}`, {
          type: variable.type,
          value: variable.values[collection.modes[0]],
        });
        this.localVariables.push({
          id: `v-${id}-${index}`,
          name: variable.name,
          variableCollectionId: id,
          resolvedType: variable.type,
          codeSyntax: variable.codeSyntax ? { WEB: variable.codeSyntax } : {},
          resolveForConsumer: () => {
            let current = valueByIdentity.get(`${collection.collection}/${variable.name}`);
            const seen = new Set<string>();
            while (
              current?.value && typeof current.value === 'object' && 'alias' in current.value
            ) {
              const alias = String(current.value.alias);
              if (seen.has(alias)) throw new Error('Mock alias cycle');
              seen.add(alias);
              current = valueByIdentity.get(alias);
            }
            let value = current?.value;
            if (variable.type === 'COLOR' && typeof value === 'string') {
              const hex = value.slice(1);
              value = {
                r: parseInt(hex.slice(0, 2), 16) / 255,
                g: parseInt(hex.slice(2, 4), 16) / 255,
                b: parseInt(hex.slice(4, 6), 16) / 255,
                a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
              };
            }
            return { value, resolvedType: variable.type };
          },
        });
      });
    });
    this.originalPage = this.createPage();
    this.originalPage.name = 'Existing design — never mutate';
    this.mutations = 0;
  }
  readonly variables: FigmaComponentsPort['variables'] = {
    getLocalVariableCollectionsAsync: () => Promise.resolve(this.localCollections),
    getLocalVariablesAsync: () => Promise.resolve(this.localVariables),
    setBoundVariableForPaint: (paint, _field, variable) => {
      this.mutations++;
      return { ...paint, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: variable.id } } };
    },
  };
  loadFontAsync(): Promise<void> {
    return this.failFont ? Promise.reject(new Error('Mock unavailable font')) : Promise.resolve();
  }
  private base(): NativeNode {
    const id = `10:${this.sequence++}`;
    const data = new Map<string, string>();
    let removed = false;
    const node: NativeNode = {
      id,
      name: '',
      get removed() {
        return removed;
      },
      getPluginData: (key) => data.get(key) ?? '',
      setPluginData: (key, value) => {
        this.mutations++;
        data.set(key, value);
      },
      remove: () => {
        if (removed) return;
        this.mutations++;
        for (const child of [...this.mutableChildren.get(id) ?? []]) child.remove();
        this.detach(id);
        const index = this.root.children.findIndex((p) => p.id === id);
        if (index >= 0) this.root.children.splice(index, 1);
        removed = true;
      },
    };
    this.nodes.set(id, node);
    return node;
  }
  private detach(id: string): void {
    const siblings = this.mutableChildren.get(this.parent.get(id) ?? '');
    const index = siblings?.findIndex((node) => node.id === id) ?? -1;
    if (siblings && index >= 0) siblings.splice(index, 1);
    this.parent.delete(id);
  }
  private append(parent: NativeNode, child: NativeScene): void {
    if (this.failReparent && parent.name.includes('staging')) {
      throw new Error('Mock reparent failure');
    }
    this.mutations++;
    this.detach(child.id);
    this.mutableChildren.get(parent.id)?.push(child);
    this.parent.set(child.id, parent.id);
  }
  private layout(): NativeLayout {
    const base = this.base();
    const bound: Record<string, NativeAlias> = {};
    const node: NativeLayout = {
      ...base,
      get removed() {
        return base.removed;
      },
      x: 0,
      y: 0,
      layoutMode: 'NONE',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'FIXED',
      itemSpacing: 0,
      fills: [],
      boundVariables: bound,
      resize: () => {},
      setBoundVariable: (field, variable) => {
        this.mutations++;
        if (variable) bound[field] = { type: 'VARIABLE_ALIAS', id: variable.id };
        else delete bound[field];
      },
    };
    return node;
  }
  createPage(): NativePage {
    this.mutations++;
    const base = this.base();
    const children: NativeScene[] = [];
    const page: NativePage = {
      ...base,
      get removed() {
        return base.removed;
      },
      type: 'PAGE',
      children,
      loadAsync: () => Promise.resolve(),
      appendChild: (node) => this.append(page, node),
    };
    this.mutableChildren.set(page.id, children);
    this.root.children.push(page);
    return page;
  }
  createFrame(): NativeFrame {
    if (this.failFrameAfter !== undefined && this.frames++ >= this.failFrameAfter) {
      throw new Error('Mock frame creation failed');
    }
    this.mutations++;
    const layout = this.layout();
    const children: NativeScene[] = [];
    const frame: NativeFrame = {
      ...layout,
      get removed() {
        return layout.removed;
      },
      type: 'FRAME',
      children,
      appendChild: (node) => this.append(frame, node),
    };
    this.mutableChildren.set(frame.id, children);
    this.originalPage.appendChild(frame);
    return frame;
  }
  createComponent(): NativeComponent {
    this.mutations++;
    const layout = this.layout();
    const children: NativeScene[] = [];
    const component: NativeComponent = {
      ...layout,
      get removed() {
        return layout.removed;
      },
      type: 'COMPONENT',
      children,
      get variantProperties() {
        return component.name.includes('=')
          ? Object.fromEntries(component.name.split(', ').map((p) => p.split('=')))
          : null;
      },
      appendChild: (node) => this.append(component, node),
    };
    this.mutableChildren.set(component.id, children);
    this.originalPage.appendChild(component);
    return component;
  }
  createText(): NativeText {
    this.mutations++;
    const base = this.base();
    const bound: Record<string, NativeAlias> = {};
    const text: NativeText = {
      ...base,
      get removed() {
        return base.removed;
      },
      type: 'TEXT',
      fontName: { family: 'Inter', style: 'Regular' },
      characters: '',
      boundVariables: bound,
      setBoundVariable: (field, variable) => {
        this.mutations++;
        if (variable) bound[field] = { type: 'VARIABLE_ALIAS', id: variable.id };
        else delete bound[field];
      },
    };
    this.originalPage.appendChild(text);
    return text;
  }
  combineAsVariants(nodes: readonly NativeComponent[], parent: NativePage): NativeSet {
    this.mutations++;
    const layout = this.layout();
    const children: NativeScene[] = [];
    const definitions: Record<
      string,
      { type: string; defaultValue: string; variantOptions: string[] }
    > = {};
    for (const node of nodes) {
      for (const [key, value] of Object.entries(node.variantProperties ?? {})) {
        definitions[key] ??= { type: 'VARIANT', defaultValue: value, variantOptions: [] };
        if (!definitions[key].variantOptions.includes(value)) {
          definitions[key].variantOptions.push(value);
        }
      }
    }
    const set: NativeSet = {
      ...layout,
      get removed() {
        return layout.removed;
      },
      type: 'COMPONENT_SET',
      children,
      componentPropertyDefinitions: definitions,
    };
    this.mutableChildren.set(set.id, children);
    for (const node of nodes) this.append(set, node);
    parent.appendChild(set);
    return set;
  }
}
