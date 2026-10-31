import {
  figmaNameInventory as inventory,
  figmaNameMigrations,
  figmaRegisteredNames,
} from '../assets/figma-names.generated.ts';
import type { FigmaCollection } from '../domain/token-contract.ts';

/** Enforce code-owned variable identities and WEB names before export or installation. */
export function assertFigmaTokenNames(collections: readonly FigmaCollection[]): void {
  if (collections.length !== inventory.length) {
    throw new Error('Figma collection inventory changed');
  }
  const seen = new Set<string>();
  for (const collection of collections) {
    if (seen.has(collection.collection)) {
      throw new Error(`Duplicate Figma collection: ${collection.collection}`);
    }
    seen.add(collection.collection);
    const expected = inventory.find((entry) => entry.collection === collection.collection);
    if (!expected) throw new Error(`Unknown Figma collection: ${collection.collection}`);
    if (JSON.stringify(collection.modes) !== JSON.stringify(expected.modes)) {
      throw new Error(`Figma mode inventory changed: ${collection.collection}`);
    }
    const names = new Set<string>();
    for (const variable of collection.variables) {
      const location = `${collection.collection}/${variable.name}`;
      const known = expected.variables.find((entry) => entry.name === variable.name);
      if (!known) {
        throw new Error(
          `Unknown Figma token name: ${location} (${variable.codeSyntax ?? 'no WEB syntax'})`,
        );
      }
      if (names.has(variable.name)) throw new Error(`Duplicate Figma token name: ${location}`);
      names.add(variable.name);
      if (known.type !== variable.type) throw new Error(`Figma token type changed: ${location}`);
      if (variable.codeSyntax) {
        const migration = figmaNameMigrations.find((entry) =>
          entry.collection === collection.collection && entry.variable === variable.name
        );
        const css = migration?.cssVar ??
          variable.codeSyntax.replace(/^var\(/, '').replace(/\)$/, '');
        if (
          !figmaRegisteredNames.includes(css) ||
          !/^var\(--ns-[a-z0-9-]+\)$/.test(variable.codeSyntax)
        ) {
          throw new Error(`Unknown exported token name: ${location} (${variable.codeSyntax})`);
        }
      }
      if (known.codeSyntax !== variable.codeSyntax) {
        throw new Error(
          `Figma WEB name changed: ${location} (${variable.codeSyntax ?? 'missing'})`,
        );
      }
    }
    if (names.size !== expected.variables.length) {
      throw new Error(`Missing Figma token names: ${collection.collection}`);
    }
  }
}
