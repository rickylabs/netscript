import type { FigmaTokenBundle } from '../../../packages/fresh-ui/src/tokens/domain/figma/figma-token-bundle.ts';
import type { FigmaCollection } from '../../../packages/fresh-ui/src/tokens/domain/token-contract.ts';
import { normalizeRGBAColor } from '../upstream/normalize-rgba.ts';
import type { FigmaValue, FigmaVariablesPort } from './figma-port.ts';

/** Stable collection order and filenames from the approved nine-collection handoff. */
export const COLLECTION_FILES = {
  Primitives: 'primitives.json',
  Theme: 'theme.json',
  'Base accent': 'base-accent.json',
  Scheme: 'scheme.json',
  Density: 'density.json',
  'Base gray': 'base-gray.json',
  'Studio flavor': 'studio-flavor.json',
  'Theme B': 'theme-b.json',
  'Theme set': 'theme-set.json',
} as const;
/** The handoff's value representation preserves FLOAT precision and rounds color channels only. */
export function snapshotValue(
  value: FigmaValue,
  aliases: ReadonlyMap<string, string>,
): string | number | boolean | { alias: string } {
  if (typeof value !== 'object') return value;
  if ('type' in value) {
    const target = aliases.get(value.id);
    if (!target) throw new Error('Cannot export an alias outside the local variable inventory');
    return { alias: target };
  }
  const rgba = normalizeRGBAColor(value);
  return '#' + [rgba.r, rgba.g, rgba.b, ...(rgba.a === 1 ? [] : [Math.round(rgba.a * 255)])]
    .map((channel) => channel.toString(16).padStart(2, '0')).join('');
}
/** Read all local variables without changing names, scopes, syntax, descriptions or routing. */
export async function exportSnapshot(api: FigmaVariablesPort): Promise<readonly FigmaCollection[]> {
  const collections = await api.getLocalVariableCollectionsAsync();
  const variables = await api.getLocalVariablesAsync();
  const byId = new Map(collections.map((collection) => [collection.id, collection.name]));
  const aliases = new Map(
    variables.map((
      variable,
    ) => [variable.id, `${byId.get(variable.variableCollectionId)}/${variable.name}`]),
  );
  const order = Object.keys(COLLECTION_FILES);
  return [...collections].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)).map((
    collection,
  ) => ({
    collection: collection.name,
    modes: collection.modes.map((mode) => mode.name),
    variables: variables.filter((variable) => variable.variableCollectionId === collection.id)
      .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0).map((variable) => ({
        name: variable.name,
        type: variable.resolvedType,
        scopes: [...variable.scopes],
        ...(variable.codeSyntax.WEB ? { codeSyntax: variable.codeSyntax.WEB } : {}),
        ...(variable.description ? { description: variable.description } : {}),
        values: Object.fromEntries(collection.modes.map((mode) => {
          const value = variable.valuesByMode[mode.modeId];
          if (value === undefined) {
            throw new Error(`Missing Figma mode value: ${variable.name}/${mode.name}`);
          }
          return [mode.name, snapshotValue(value, aliases)];
        })),
      })),
  }));
}
/** Serialize the exact fixture contract, including field order, indentation and final newline. */
export function snapshotFiles(
  collections: readonly FigmaCollection[],
  fileKey: string,
  exportDate: string,
): Readonly<Record<string, string>> {
  const files: Record<string, string> = {};
  const entries = collections.map((collection) => {
    const file = Object.entries(COLLECTION_FILES).find(([name]) => name === collection.collection)
      ?.[1];
    if (!file) throw new Error(`Unknown Figma collection: ${collection.collection}`);
    files[file] = JSON.stringify(collection, null, 2) + '\n';
    return {
      collection: collection.collection,
      file,
      modes: collection.modes,
      variableCount: collection.variables.length,
    };
  });
  files['index.json'] = JSON.stringify({ fileKey, exportDate, collections: entries }, null, 2) +
    '\n';
  return files;
}

/** Downloadable DTCG documents and the resolver retain the transport bundle for lossless import. */
export function dtcgFiles(bundle: FigmaTokenBundle): Readonly<Record<string, string>> {
  const json = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';
  return {
    'figma.tokens.json': json(bundle),
    'tokens.resolver.json': json({
      $schema: 'https://www.designtokens.org/schemas/2025.10/resolver.json',
      ...bundle.sources.resolver,
    }),
    ...Object.fromEntries(
      Object.entries(bundle.sources.documents).map(([name, document]) => [name, json(document)]),
    ),
  };
}
