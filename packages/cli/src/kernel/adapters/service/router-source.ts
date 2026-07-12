import { toCamelCase, toPascalCase } from '@std/text';
import type { ContractVersion } from '../contracts/types.ts';

/** Append a compiling handler stub to a generated service version router. */
export function appendServiceHandler(
  source: string,
  serviceName: string,
  procedure: string,
  version: ContractVersion,
): string {
  if (!/^[A-Za-z_$][\w$]*$/.test(procedure)) {
    throw new Error(`Invalid procedure name "${procedure}". Expected a TypeScript identifier.`);
  }
  const suffix = version.slice(1);
  const declaration = `export const ${toPascalCase(serviceName)}V${suffix} =`;
  const declarationIndex = source.indexOf(declaration);
  if (declarationIndex < 0) throw new Error(`Service router declaration was not found.`);
  const objectStart = source.indexOf('{', declarationIndex + declaration.length);
  const objectEnd = matchingBrace(source, objectStart);
  if (new RegExp(`\\b${escapeRegExp(procedure)}\\s*:`).test(
    source.slice(objectStart, objectEnd),
  )) {
    throw new Error(`Handler "${procedure}" already exists in ${serviceName} ${version}.`);
  }
  const camel = toCamelCase(serviceName);
  const contextual = `${camel}V${suffix}`;
  const route = new RegExp(`const\\s+${escapeRegExp(contextual)}\\s*=`).test(source)
    ? `${contextual}.${procedure}`
    : `${version}.${camel}.${procedure}`;
  const handler = [
    `  ${procedure}: ${route}.handler(async ({ input }) => {`,
    '    void input;',
    `    throw new Error('Not implemented: ${procedure}');`,
    '  }),',
  ].join('\n');
  return `${source.slice(0, objectEnd)}${handler}\n${source.slice(objectEnd)}`;
}

function matchingBrace(source: string, open: number): number {
  if (open < 0) throw new Error('Service router opening brace was not found.');
  let depth = 0;
  let quote: string | undefined;
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (char === '\\') index++;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return index;
  }
  throw new Error('Service router closing brace was not found.');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
