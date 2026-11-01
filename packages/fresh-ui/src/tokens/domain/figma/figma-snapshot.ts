import { z } from 'zod';
import type { FigmaCollection } from '../token-contract.ts';

const variable = z.object({
  name: z.string().min(1),
  type: z.enum(['COLOR', 'FLOAT', 'STRING', 'BOOLEAN']),
  scopes: z.array(z.string()),
  codeSyntax: z.string().optional(),
  description: z.string().optional(),
  values: z.record(
    z.string(),
    z.union([
      z.string(),
      z.number().finite(),
      z.boolean(),
      z.object({ alias: z.string().min(1) }).strict(),
    ]),
  ),
}).strict();
const collection = z.object({
  collection: z.string().min(1),
  modes: z.array(z.string().min(1)).min(1),
  variables: z.array(variable),
}).strict();

/** Validate every variable and alias before the first Figma or filesystem write. */
export function validateFigmaSnapshot(input: unknown): readonly FigmaCollection[] {
  const parsed = z.array(collection).min(1).parse(input);
  const targets = new Map<string, string>();
  for (const entry of parsed) {
    if (new Set(entry.modes).size !== entry.modes.length) {
      throw new Error(`Duplicate Figma modes: ${entry.collection}`);
    }
    for (const value of entry.variables) {
      const key = `${entry.collection}/${value.name}`;
      if (targets.has(key)) throw new Error(`Duplicate Figma variable: ${key}`);
      targets.set(key, value.type);
    }
  }
  for (const entry of parsed) {
    for (const variable of entry.variables) {
      if (
        Object.keys(variable.values).length !== entry.modes.length ||
        entry.modes.some((mode) => !Object.hasOwn(variable.values, mode))
      ) {
        throw new Error(`Incomplete Figma modes: ${entry.collection}/${variable.name}`);
      }
      for (const value of Object.values(variable.values)) {
        if (typeof value === 'object') {
          if (targets.get(value.alias) !== variable.type) {
            throw new Error(`Unknown or mistyped Figma alias: ${value.alias}`);
          }
        } else if (
          variable.type === 'COLOR'
            ? typeof value !== 'string' || !/^#[a-f0-9]{6}(?:[a-f0-9]{2})?$/.test(value)
            : variable.type === 'FLOAT'
            ? typeof value !== 'number'
            : variable.type === 'BOOLEAN'
            ? typeof value !== 'boolean'
            : typeof value !== 'string'
        ) throw new Error(`Invalid Figma ${variable.type}: ${entry.collection}/${variable.name}`);
      }
    }
  }
  return parsed;
}
