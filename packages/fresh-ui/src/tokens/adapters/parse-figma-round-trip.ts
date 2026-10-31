import { z } from 'zod';
import type { DesignToken, TokenDocument } from '../domain/token-contract.ts';
import {
  dtcgType,
  FIGMA_DTCG_SCHEMA,
  figmaModeFile,
  type FigmaTokenBundle,
  figmaVariableResolver,
} from '../domain/figma-token-bundle.ts';

const metadata = z.object({
  name: z.string().min(1),
  type: z.enum(['COLOR', 'FLOAT', 'STRING', 'BOOLEAN']),
  scopes: z.array(z.string()),
  codeSyntax: z.string().optional(),
  description: z.string().optional(),
}).strict();
const color = z.object({
  colorSpace: z.literal('srgb'),
  components: z.tuple([
    z.number().min(0).max(1),
    z.number().min(0).max(1),
    z.number().min(0).max(1),
  ]),
  alpha: z.number().min(0).max(1),
  hex: z.string().regex(/^#[a-f0-9]{6}$/).optional(),
}).strict();
const token = z.object({
  $type: z.string(),
  $value: z.union([z.string(), z.number().finite(), z.boolean(), color]),
  $extensions: z.object({
    netscript: z.object({
      oklch: z.object({
        components: z.array(z.number().finite()).length(3),
        alpha: z.number().min(0).max(1),
        sourceHex: z.string().regex(/^#[a-f0-9]{6}(?:[a-f0-9]{2})?$/).optional(),
      }).strict(),
    }).strict(),
  }).strict().optional(),
}).strict();

/** Parse each expected document and reject extra tokens, modes, resolver edits or unsupported metadata. */
export function parseFigmaTokenBundle(input: unknown): FigmaTokenBundle {
  const parsed = z.object({
    version: z.literal('2025.10'),
    collections: z.array(
      z.object({
        collection: z.string().min(1),
        modes: z.array(z.string().min(1)).min(1),
        variables: z.array(metadata),
      }).strict(),
    ).min(1),
    sources: z.object({ resolver: z.unknown(), documents: z.record(z.string(), z.unknown()) })
      .strict(),
  }).strict().parse(input);
  const resolver = figmaVariableResolver(parsed.collections);
  // Exported resolver is declarative; import cannot introduce additional sources or fetch URLs.
  if (canonical(parsed.sources.resolver) !== canonical(resolver)) {
    throw new Error('Figma DTCG resolver does not match the declared collection modes');
  }
  const documents: Record<string, TokenDocument> = {};
  parsed.collections.forEach((collection, c) =>
    collection.modes.forEach((_, m) => {
      const file = figmaModeFile(c, m);
      const document = z.object({
        $schema: z.literal(FIGMA_DTCG_SCHEMA),
        [`c${c}`]: z.record(z.string(), token),
      }).strict().parse(parsed.sources.documents[file]);
      const entries = z.record(z.string(), token).parse(document[`c${c}`]);
      if (Object.keys(entries).length !== collection.variables.length) {
        throw new Error(`Figma DTCG token inventory changed: ${file}`);
      }
      collection.variables.forEach((variable, v) => {
        if (entries[`v${v}`]?.$type !== dtcgType(variable.type)) {
          throw new Error(
            `Missing or mistyped Figma DTCG token: ${collection.collection}/${variable.name}`,
          );
        }
      });
      const values: Record<string, DesignToken> = entries;
      documents[file] = { $schema: FIGMA_DTCG_SCHEMA, [`c${c}`]: values };
    })
  );
  if (Object.keys(parsed.sources.documents).length !== Object.keys(documents).length) {
    throw new Error('Figma DTCG document inventory changed');
  }
  return {
    version: parsed.version,
    collections: parsed.collections,
    sources: { resolver, documents },
  };
}

/** Stable structural comparison does not depend on JSON object property order. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.entries(value).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0
    ).map(([key, value]) => JSON.stringify(key) + ':' + canonical(value)).join(',') + '}';
  }
  return JSON.stringify(value);
}
