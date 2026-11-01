import type { FigmaCollection } from '../../../packages/fresh-ui/src/tokens/domain/token-contract.ts';
import type {
  CollectionHandle,
  FigmaValue,
  FigmaVariablesPort,
  VariableHandle,
} from '../src/figma-port.ts';

/** Stateful fake follows Figma's IDs, mode handles and two-pass alias behavior. */
export class MockFigma implements FigmaVariablesPort {
  readonly collections: CollectionHandle[] = [];
  readonly variables: VariableHandle[] = [];
  mutations = 0;
  getLocalVariableCollectionsAsync(): Promise<readonly CollectionHandle[]> {
    return Promise.resolve(this.collections);
  }
  getLocalVariablesAsync(): Promise<readonly VariableHandle[]> {
    return Promise.resolve(this.variables);
  }
  createVariableCollection(name: string): CollectionHandle {
    this.mutations++;
    const modes = [{ modeId: `m${this.collections.length}-0`, name: 'Mode 1' }];
    const collection = {
      id: `c${this.collections.length}`,
      name,
      modes,
      addMode: (name: string) => {
        this.mutations++;
        const id = `${collection.id}-m${modes.length}`;
        modes.push({ modeId: id, name });
        return id;
      },
      renameMode: (id: string, name: string) => {
        this.mutations++;
        modes.find((mode) => mode.modeId === id)!.name = name;
      },
    };
    this.collections.push(collection);
    return collection;
  }
  createVariable(
    name: string,
    collection: CollectionHandle,
    type: VariableHandle['resolvedType'],
  ): VariableHandle {
    this.mutations++;
    const valuesByMode: Record<string, FigmaValue> = {};
    const codeSyntax: { WEB?: string } = {};
    const variable: VariableHandle = {
      id: `v${this.variables.length}`,
      name,
      variableCollectionId: collection.id,
      resolvedType: type,
      scopes: [],
      description: '',
      codeSyntax,
      valuesByMode,
      setValueForMode: (mode, value) => {
        this.mutations++;
        valuesByMode[mode] = value;
      },
      removeVariableCodeSyntax: (_) => {
        this.mutations++;
        delete codeSyntax.WEB;
      },
      setVariableCodeSyntax: (_, value) => {
        this.mutations++;
        codeSyntax.WEB = value;
      },
    };
    this.variables.push(variable);
    return variable;
  }
}

/** Seed the mock independently from the exporter, using the checked-in fixture contract. */
export function fixtureFigma(collections: readonly FigmaCollection[]): MockFigma {
  const api = new MockFigma();
  const targets = new Map<string, VariableHandle>();
  collections.forEach((collection) => {
    const handle = api.createVariableCollection(collection.collection);
    handle.renameMode(handle.modes[0].modeId, collection.modes[0]);
    collection.modes.slice(1).forEach((mode) => handle.addMode(mode));
    collection.variables.forEach((variable) => {
      const entry = api.createVariable(variable.name, handle, variable.type);
      entry.scopes = [...variable.scopes];
      entry.description = variable.description ?? '';
      if (variable.codeSyntax) entry.setVariableCodeSyntax('WEB', variable.codeSyntax);
      targets.set(`${collection.collection}/${variable.name}`, entry);
    });
  });
  collections.forEach((collection, c) =>
    collection.variables.forEach((variable) => {
      const entry = targets.get(`${collection.collection}/${variable.name}`)!;
      collection.modes.forEach((mode, m) => {
        const value = variable.values[mode];
        entry.setValueForMode(
          api.collections[c].modes[m].modeId,
          typeof value === 'object'
            ? { type: 'VARIABLE_ALIAS', id: targets.get(value.alias)!.id }
            : variable.type === 'COLOR'
            ? rgba(String(value))
            : value,
        );
      });
    })
  );
  api.mutations = 0;
  return api;
}

/** Hex conversion is independent of the production upstream channel normalizer. */
export function rgba(hex: string): { r: number; g: number; b: number; a: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
    a: hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1,
  };
}

/** Change one literal Scheme color and one routed Theme scalar without changing identity. */
export function modifiedFixture(input: readonly FigmaCollection[]): readonly FigmaCollection[] {
  return input.map((collection) => ({
    ...collection,
    variables: collection.variables.map((variable) => {
      if (collection.collection === 'Scheme' && variable.name === 'bevel/edge') {
        return { ...variable, values: { ...variable.values, Light: '#2233441a' } };
      }
      if (
        collection.collection === 'Theme' &&
        variable === collection.variables.find((entry) => typeof entry.values.Studio === 'number')
      ) {
        return {
          ...variable,
          values: { ...variable.values, Studio: Number(variable.values.Studio) + 1 },
        };
      }
      return variable;
    }),
  }));
}
