import type { FigmaCollection, FigmaVariable } from './token-contract.ts';

/** Figma FLOAT noise is not part of the design contract. */
export function roundTokenNumber(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Token number must be finite');
  return Math.round(value * 1_000_000) / 1_000_000;
}

/** Figma uses both SemiBold and Semi Bold for the same font style. */
export function normalizeFontStyle(value: string): string {
  return value.replace(/Semi\s*Bold/gi, 'Semi Bold').replace(/Extra\s*Bold/gi, 'Extra Bold');
}

/** Resolve exported aliases against each target collection's active mode. */
export function resolveFigmaValue(
  collections: readonly FigmaCollection[],
  collectionName: string,
  variableName: string,
  modes: Readonly<Record<string, string>>,
): { value: string | number | boolean; variable: FigmaVariable; mode: string } {
  const active = new Set<string>();
  function visit(collectionName: string, variableName: string): {
    value: string | number | boolean;
    variable: FigmaVariable;
    mode: string;
  } {
    const key = `${collectionName}/${variableName}`;
    if (active.has(key)) throw new Error(`Figma alias cycle at ${key}`);
    const collection = collections.find((entry) => entry.collection === collectionName);
    const variable = collection?.variables.find((entry) => entry.name === variableName);
    if (!collection || !variable) throw new Error(`Unknown Figma alias: ${key}`);
    const mode = modes[collectionName] ?? collection.modes[0];
    const raw = variable.values[mode];
    if (raw === undefined) throw new Error(`Unknown mode ${mode} for ${key}`);
    if (typeof raw === 'object') {
      active.add(key);
      const slash = raw.alias.indexOf('/');
      if (slash < 1) throw new Error(`Invalid Figma alias: ${raw.alias}`);
      const result = visit(raw.alias.slice(0, slash), raw.alias.slice(slash + 1));
      active.delete(key);
      return result;
    }
    return {
      value: typeof raw === 'number'
        ? roundTokenNumber(raw)
        : typeof raw === 'string'
        ? normalizeFontStyle(raw)
        : raw,
      variable,
      mode,
    };
  }
  return visit(collectionName, variableName);
}
