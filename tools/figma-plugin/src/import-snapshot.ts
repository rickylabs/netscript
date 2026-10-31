import { validateFigmaSnapshot } from '../../../packages/fresh-ui/src/tokens/domain/figma-snapshot.ts';
import { assertFigmaAliasCycles } from '../../../packages/fresh-ui/src/tokens/domain/figma-alias-cycles.ts';
import { assertFigmaTokenNames } from '../../../packages/fresh-ui/src/tokens/adapters/figma-token-names.ts';
import type {
  CollectionHandle,
  FigmaValue,
  FigmaVariablesPort,
  VariableHandle,
} from './figma-port.ts';

/** Validate everything before two-pass creation; keep existing Figma IDs on repeated imports. */
export async function importSnapshot(api: FigmaVariablesPort, input: unknown): Promise<void> {
  const collections = validateFigmaSnapshot(input);
  assertFigmaTokenNames(collections);
  assertFigmaAliasCycles(collections);
  const existingCollections = await api.getLocalVariableCollectionsAsync();
  const existingVariables = await api.getLocalVariablesAsync();
  const handles = new Map<string, CollectionHandle>();
  const variables = new Map<string, VariableHandle>();
  // Existing mode and type incompatibilities must fail before creating even one collection.
  for (const collection of collections) {
    const matching = existingCollections.filter((entry) => entry.name === collection.collection);
    if (matching.length > 1) {
      throw new Error(`Ambiguous Figma collection: ${collection.collection}`);
    }
    const handle = matching[0];
    if (!handle) continue;
    if (
      JSON.stringify(handle.modes.map((mode) => mode.name)) !==
        JSON.stringify(collection.modes.slice(0, handle.modes.length))
    ) throw new Error(`Incompatible existing Figma modes: ${collection.collection}`);
    for (const variable of collection.variables) {
      const matches = existingVariables.filter((entry) =>
        entry.variableCollectionId === handle.id && entry.name === variable.name
      );
      if (matches.length > 1 || matches[0] && matches[0].resolvedType !== variable.type) {
        throw new Error(
          `Incompatible existing Figma variable: ${collection.collection}/${variable.name}`,
        );
      }
    }
  }
  for (const collection of collections) {
    let handle = existingCollections.find((entry) => entry.name === collection.collection);
    if (!handle) {
      handle = api.createVariableCollection(collection.collection);
      handle.renameMode(handle.modes[0].modeId, collection.modes[0]);
    }
    for (const mode of collection.modes) {
      if (!handle.modes.some((entry) => entry.name === mode)) handle.addMode(mode);
    }
    handles.set(collection.collection, handle);
    for (const variable of collection.variables) {
      const entry = existingVariables.find((entry) =>
        entry.variableCollectionId === handle.id && entry.name === variable.name
      ) ??
        api.createVariable(variable.name, handle, variable.type);
      variables.set(`${collection.collection}/${variable.name}`, entry);
    }
  }
  const aliases: { entry: VariableHandle; mode: string; value: FigmaValue }[] = [];
  const neutral: Record<VariableHandle['resolvedType'], FigmaValue> = {
    COLOR: { r: 0, g: 0, b: 0, a: 0 },
    FLOAT: 0,
    STRING: '',
    BOOLEAN: false,
  };
  for (const collection of collections) {
    for (const variable of collection.variables) {
      const entry = variables.get(`${collection.collection}/${variable.name}`)!;
      entry.scopes = [...variable.scopes];
      entry.description = variable.description ?? '';
      if (variable.codeSyntax) entry.setVariableCodeSyntax('WEB', variable.codeSyntax);
      else if (entry.codeSyntax.WEB) entry.removeVariableCodeSyntax('WEB');
      for (const mode of collection.modes) {
        const value = variable.values[mode];
        let native: FigmaValue;
        if (typeof value === 'object') {
          const modeId = handles.get(collection.collection)!.modes.find((entry) =>
            entry.name === mode
          )!.modeId;
          aliases.push({
            entry,
            mode: modeId,
            value: { type: 'VARIABLE_ALIAS', id: variables.get(value.alias)!.id },
          });
          native = neutral[variable.type];
        } else if (variable.type === 'COLOR') {
          const hex = String(value);
          native = {
            r: parseInt(hex.slice(1, 3), 16) / 255,
            g: parseInt(hex.slice(3, 5), 16) / 255,
            b: parseInt(hex.slice(5, 7), 16) / 255,
            a: hex.length === 9
              ? (hex.slice(7) === 'ff'
                ? Math.fround(1 - 2 ** -24)
                : parseInt(hex.slice(7), 16) / 255)
              : 1,
          };
        } else native = value;
        entry.setValueForMode(
          handles.get(collection.collection)!.modes.find((entry) => entry.name === mode)!.modeId,
          native,
        );
      }
    }
  }
  // Remove every old alias edge before adding final edges, avoiding transient cycles on reimport.
  for (const alias of aliases) alias.entry.setValueForMode(alias.mode, alias.value);
}
