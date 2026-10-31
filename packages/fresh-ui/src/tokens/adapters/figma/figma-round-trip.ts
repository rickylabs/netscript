import Color from 'npm:colorjs.io@0.5.2';
import { z } from 'zod';
import type { FigmaCollection, TokenDocument } from '../../domain/token-contract.ts';
import { validateFigmaSnapshot } from '../../domain/figma/figma-snapshot.ts';
import { assertFigmaAliasCycles } from '../../domain/figma/figma-alias-cycles.ts';
import { assertFigmaTokenNames } from './figma-token-names.ts';
import { parseFigmaTokenBundle } from './parse-figma-round-trip.ts';

import {
  dtcgType,
  FIGMA_DTCG_SCHEMA,
  figmaModeFile,
  type FigmaTokenBundle,
  figmaVariableResolver,
} from '../../domain/figma/figma-token-bundle.ts';
/** Convert a complete variable snapshot to DTCG 2025.10, retaining oklch in extensions. */
export function exportFigmaTokenBundle(input: readonly FigmaCollection[]): FigmaTokenBundle {
  const collections = validateFigmaSnapshot(input);
  assertFigmaTokenNames(collections);
  assertFigmaAliasCycles(collections);
  const ids = new Map<string, string>(
    collections.flatMap((collection, c) =>
      collection.variables.map((variable, v) =>
        [`${collection.collection}/${variable.name}`, `c${c}.v${v}`] as const
      )
    ),
  );
  const documents: Record<string, TokenDocument> = {};
  collections.forEach((collection, c) =>
    collection.modes.forEach((mode, m) => {
      const tokens: TokenDocument = {};
      collection.variables.forEach((variable, v) => {
        const value = variable.values[mode];
        if (typeof value === 'object') {
          tokens[`v${v}`] = { $type: dtcgType(variable.type), $value: `{${ids.get(value.alias)}}` };
        } else if (variable.type === 'COLOR') {
          const color = new Color(String(value));
          const srgb = color.to('srgb');
          const oklch = color.to('oklch');
          tokens[`v${v}`] = {
            $type: 'color',
            $value: {
              colorSpace: 'srgb',
              components: srgb.coords.map(Number),
              alpha: Number(color.alpha),
              hex: String(value).slice(0, 7),
            },
            $extensions: {
              netscript: {
                oklch: {
                  components: oklch.coords.map((value) =>
                    Number.isFinite(Number(value)) ? Number(value) : 0
                  ),
                  alpha: Number(color.alpha),
                  sourceHex: String(value),
                },
              },
            },
          };
        } else {tokens[`v${v}`] = {
            $type: dtcgType(variable.type),
            $value: typeof value === 'boolean' ? Number(value) : value,
          };}
      });
      documents[figmaModeFile(c, m)] = { $schema: FIGMA_DTCG_SCHEMA, [`c${c}`]: tokens };
    })
  );
  return {
    version: '2025.10',
    collections: collections.map((collection) => ({
      ...collection,
      variables: collection.variables.map(({ values: _values, ...metadata }) => metadata),
    })),
    sources: { resolver: figmaVariableResolver(collections), documents },
  };
}
/** Validate untrusted transport data and recover all variable values from the DTCG documents. */
export function importFigmaTokenBundle(input: unknown): readonly FigmaCollection[] {
  const bundle = parseFigmaTokenBundle(input);
  const aliases = new Map<string, string>(
    bundle.collections.flatMap((collection, c) =>
      collection.variables.map((variable, v) =>
        [`c${c}.v${v}`, `${collection.collection}/${variable.name}`] as const
      )
    ),
  );
  const collections = bundle.collections.map((collection, c) => ({
    ...collection,
    variables: collection.variables.map((variable, v) => ({
      ...variable,
      values: Object.fromEntries(collection.modes.map((mode, m) => {
        const group = bundle.sources.documents[figmaModeFile(c, m)][`c${c}`];
        if (typeof group === 'string' || '$value' in group) {
          throw new Error('Invalid Figma DTCG group');
        }
        const token = group[`v${v}`];
        if (typeof token === 'string' || !('$value' in token)) {
          throw new Error('Missing Figma DTCG token');
        }
        if (token.$type !== dtcgType(variable.type)) {
          throw new Error(`Figma DTCG type changed: ${collection.collection}/${variable.name}`);
        }
        const value = token.$value;
        const alias = typeof value === 'string'
          ? value.match(/^\{(c\d+\.v\d+)\}$/)?.[1]
          : undefined;
        if (alias) {
          const target = aliases.get(alias);
          if (!target) throw new Error(`Unknown Figma DTCG alias: ${alias}`);
          return [mode, { alias: target }];
        }
        if (variable.type === 'BOOLEAN') {
          if (value !== 0 && value !== 1) throw new Error('Figma boolean carrier must be 0 or 1');
          return [mode, value === 1];
        }
        if (variable.type !== 'COLOR') return [mode, value];
        const color = z.object({
          colorSpace: z.literal('srgb'),
          components: z.tuple([
            z.number().min(0).max(1),
            z.number().min(0).max(1),
            z.number().min(0).max(1),
          ]),
          alpha: z.number().min(0).max(1),
          hex: z.string().optional(),
        }).parse(value);
        const channels = [
          ...color.components.map((channel) => Math.round(channel * 255)),
          ...(color.alpha === 1 ? [] : [Math.round(color.alpha * 255)]),
        ];
        const hex = '#' + channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
        const sourceHex = z.object({
          netscript: z.object({ oklch: z.object({ sourceHex: z.string().optional() }) }),
        }).safeParse(token.$extensions).data?.netscript.oklch.sourceHex;
        return [mode, sourceHex === hex + 'ff' ? sourceHex : hex];
      })),
    })),
  }));
  const result = validateFigmaSnapshot(collections);
  assertFigmaTokenNames(result);
  assertFigmaAliasCycles(result);
  return result;
}
