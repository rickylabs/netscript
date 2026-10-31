import type { FigmaVariable, TokenResolver } from './token-contract.ts';
import type { TokenSources } from './resolve-tokens.ts';

/** Official format URI shared by variable documents and their parser. */
export const FIGMA_DTCG_SCHEMA = 'https://www.designtokens.org/schemas/2025.10/format.json';
/** Variable identity metadata stays outside DTCG values and never depends on Figma IDs. */
export interface FigmaTokenBundle {
  /** DTCG revision supported by this portable boundary. */
  readonly version: '2025.10';
  /** Ordered collection, mode and variable metadata needed to restore the file. */
  readonly collections: readonly {
    readonly collection: string;
    readonly modes: readonly string[];
    readonly variables: readonly Omit<FigmaVariable, 'values'>[];
  }[];
  /** Mode documents plus one resolver; aliases follow active target-collection modes. */
  readonly sources: TokenSources;
}
/** Stable source identity independent of Figma mode/variable IDs and token values. */
export function figmaModeFile(collection: number, mode: number): string {
  return `c${collection}-m${mode}.tokens.json`;
}
/** Compose collection modes through the official resolver contract rather than hardcoding alias modes. */
export function figmaVariableResolver(collections: FigmaTokenBundle['collections']): TokenResolver {
  const sets: Record<string, { sources: { $ref: string }[] }> = {};
  const modifiers: Record<
    string,
    { default: string; contexts: Record<string, { $ref: string }[]> }
  > = {};
  const resolutionOrder: { $ref: string }[] = [];
  collections.forEach((collection, c) => {
    if (collection.modes.length === 1) {
      sets[`c${c}`] = { sources: [{ $ref: figmaModeFile(c, 0) }] };
      resolutionOrder.push({ $ref: `#/sets/c${c}` });
    } else {
      modifiers[`c${c}`] = {
        default: collection.modes[0],
        contexts: Object.fromEntries(
          collection.modes.map((mode, m) => [mode, [{ $ref: figmaModeFile(c, m) }]]),
        ),
      };
      resolutionOrder.push({ $ref: `#/modifiers/c${c}` });
    }
  });
  return { version: '2025.10', sets, modifiers, resolutionOrder };
}
/** Translate the finite Figma type vocabulary to transport token types. */
export function dtcgType(type: FigmaVariable['type']): string {
  // DTCG has no generic string/boolean types. Identity metadata disambiguates lossless carriers.
  return { COLOR: 'color', FLOAT: 'number', STRING: 'fontFamily', BOOLEAN: 'number' }[type];
}
