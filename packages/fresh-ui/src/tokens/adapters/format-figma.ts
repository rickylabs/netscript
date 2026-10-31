import { normalizeFontStyle, roundTokenNumber } from '../domain/figma-aliases.ts';
import type { FigmaCollection, TokenValue } from '../domain/token-contract.ts';
import type { BuiltToken, TokenContextOutput } from '../domain/token-output.ts';
import { effectiveContexts } from './format-css.ts';
import { nameMigrations } from '../assets/metadata.generated.ts';

/** Preserve source collections and apply the explicit code-syntax migrations. */
export function formatFigmaCollection(collection: FigmaCollection): FigmaCollection {
  return {
    ...collection,
    variables: collection.variables.map((variable) => {
      const migration = nameMigrations.migrations.find((entry) =>
        entry.collection === collection.collection && entry.variable === variable.name
      );
      if (migration && variable.codeSyntax !== `var(${migration.originalCssVar})`) {
        throw new Error(`Stale Figma name migration: ${collection.collection}/${variable.name}`);
      }
      return {
        ...variable,
        ...(migration ? { codeSyntax: `var(${migration.cssVar})` } : {}),
        values: Object.fromEntries(
          Object.entries(variable.values).map(([mode, value]) => [
            mode,
            typeof value === 'number'
              ? roundTokenNumber(value)
              : typeof value === 'string'
              ? normalizeFontStyle(value)
              : value,
          ]),
        ),
      };
    }),
  };
}

function figmaValue(token: BuiltToken): string | number {
  if (token.hex) return token.hex;
  const value: TokenValue = token.resolved;
  if (
    value && typeof value === 'object' && !Array.isArray(value) && typeof value.value === 'number'
  ) {
    if (token.type === 'dimension') {
      if (value.unit === 'px') return value.value;
      if (value.unit === 'rem') return roundTokenNumber(value.value * 16);
      throw new Error(`Unsupported Figma dimension unit: ${value.unit}`);
    }
    if (token.type === 'duration') {
      if (value.unit === 'ms') return value.value;
      if (value.unit === 's') return roundTokenNumber(value.value * 1000);
      throw new Error(`Unsupported Figma duration unit: ${value.unit}`);
    }
    throw new Error(`Unexpected scalar object: ${token.type}`);
  }
  if (typeof value === 'number') return value;
  if (Array.isArray(value) && token.type === 'fontFamily') return value.join(', ');
  if (typeof value === 'string') return value;
  // Figma has no composite variable type. Keep composites losslessly as STRING.
  return JSON.stringify(value);
}

/** Dedicated collections remove Figma's prototype Theme-mode ceiling in the round-trip data. */
export function formatFigmaPreset(
  contexts: readonly TokenContextOutput[],
  id: string,
): FigmaCollection {
  const effective = effectiveContexts(contexts).filter((context) => context.preset.id === id);
  const light = effective.find((context) => context.scheme === 'light')!;
  const dark = effective.find((context) => context.scheme === 'dark')!;
  return {
    collection: `NetScript ${id}`,
    modes: ['Light', 'Dark'],
    variables: Object.entries(light.tokens).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(
      ([name, token]) => {
        const value = figmaValue(token);
        return {
          name,
          type: token.type === 'color' ? 'COLOR' : typeof value === 'number' ? 'FLOAT' : 'STRING',
          scopes: [],
          codeSyntax: `var(${token.cssVar})`,
          values: { Light: value, Dark: figmaValue(dark.tokens[name]) },
        };
      },
    ),
  };
}
