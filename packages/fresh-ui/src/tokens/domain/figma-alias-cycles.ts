import type { FigmaCollection, FigmaVariable } from './token-contract.ts';

/** Reject an alias cycle in any consistent selection of active collection modes. */
export function assertFigmaAliasCycles(collections: readonly FigmaCollection[]): void {
  const variables = new Map<string, { collection: FigmaCollection; variable: FigmaVariable }>();
  for (const collection of collections) {
    for (const variable of collection.variables) {
      variables.set(`${collection.collection}/${variable.name}`, { collection, variable });
    }
  }
  function visit(
    key: string,
    modes: ReadonlyMap<string, string>,
    active: ReadonlySet<string>,
  ): void {
    if (active.has(key)) throw new Error(`Figma alias cycle: ${key}`);
    const entry = variables.get(key);
    if (!entry) throw new Error(`Unknown Figma alias: ${key}`);
    const selected = modes.get(entry.collection.collection);
    for (const mode of selected ? [selected] : entry.collection.modes) {
      const value = entry.variable.values[mode];
      if (typeof value !== 'object') continue;
      visit(
        value.alias,
        new Map([...modes, [entry.collection.collection, mode]]),
        new Set([...active, key]),
      );
    }
  }
  for (const key of variables.keys()) visit(key, new Map(), new Set());
}
