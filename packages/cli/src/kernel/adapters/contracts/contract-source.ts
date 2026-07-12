import type { ContractProcedure, ContractVersion } from './types.ts';

/** HTTP methods supported by generated contract routes. */
export const CONTRACT_HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

/** HTTP method accepted by `contract add-route`. */
export type ContractHttpMethod = typeof CONTRACT_HTTP_METHODS[number];

/** Rewrite versioned symbols and prose while promoting a contract source file. */
export function promoteContractSource(
  source: string,
  from: ContractVersion,
  to: ContractVersion,
): string {
  const fromNumber = from.slice(1);
  const toNumber = to.slice(1);
  return source
    .replaceAll(`V${fromNumber}`, `V${toNumber}`)
    .replaceAll(`Version ${fromNumber}`, `Version ${toNumber}`)
    .replaceAll(`version ${fromNumber}`, `version ${toNumber}`);
}

/** Append a top-level typed oRPC route to a generated contract object. */
export function appendContractRoute(
  source: string,
  contractName: string,
  version: ContractVersion,
  procedure: string,
  method: ContractHttpMethod,
  path: string,
  input = 'z.object({})',
  output = 'z.unknown()',
): string {
  if (!/^[A-Za-z_$][\w$]*$/.test(procedure)) {
    throw new Error(`Invalid procedure name "${procedure}". Expected a TypeScript identifier.`);
  }
  if (!path.startsWith('/')) {
    throw new Error(`Invalid route path "${path}". Paths must start with '/'.`);
  }
  const suffix = version.slice(1);
  const pascal = contractName.split(/[-_\s]+/).filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1)).join('');
  const declaration = `export const ${pascal}ContractV${suffix} =`;
  const declarationIndex = source.indexOf(declaration);
  if (declarationIndex < 0) {
    throw new Error(`Contract declaration ${pascal}ContractV${suffix} was not found.`);
  }
  if (new RegExp(`\\b${escapeRegExp(procedure)}\\s*:`).test(
    source.slice(declarationIndex),
  )) {
    throw new Error(`Procedure "${procedure}" already exists in ${contractName} ${version}.`);
  }
  const objectStart = source.indexOf('{', declarationIndex + declaration.length);
  const objectEnd = matchingBrace(source, objectStart);
  const builder = source.slice(objectStart, objectEnd).match(/\b(oc|baseContract)\s*\.\s*route\s*\(/)?.[1] ??
    'oc';
  const route = [
    `  ${procedure}: ${builder}`,
    `    .route({ method: '${method}', path: '${path.replaceAll("'", "\\'")}' })`,
    `    .input(${input})`,
    `    .output(${output}),`,
  ].join('\n');
  return `${source.slice(0, objectEnd)}${route}\n${source.slice(objectEnd)}`;
}

/** Parse route metadata from a generated contract source file. */
export function inspectContractSource(source: string): ContractProcedure[] {
  const procedures: ContractProcedure[] = [];
  const routePattern = /([A-Za-z_$][\w$]*)\s*:\s*(?:oc|baseContract)\s*\.\s*route\s*\(\s*\{([\s\S]*?)\}\s*\)([\s\S]*?)(?=,\s*\n\s*(?:[A-Za-z_$}]|\.\.\.))/g;
  for (const match of source.matchAll(routePattern)) {
    const route = match[2];
    const chain = match[3];
    const method = route.match(/\bmethod\s*:\s*['"]([A-Za-z]+)['"]/)?.[1]?.toUpperCase();
    if (!method) continue;
    procedures.push({
      name: match[1],
      method,
      path: route.match(/\bpath\s*:\s*['"]([^'"]+)['"]/)?.[1] ?? null,
      input: chainExpression(chain, 'input'),
      output: chainExpression(chain, 'output'),
    });
  }
  return procedures;
}

function chainExpression(chain: string, method: string): string | null {
  const marker = `.${method}`;
  const markerIndex = chain.indexOf(marker);
  if (markerIndex < 0) return null;
  const open = chain.indexOf('(', markerIndex + marker.length);
  if (open < 0) return null;
  let depth = 0;
  for (let index = open; index < chain.length; index++) {
    if (chain[index] === '(') depth++;
    if (chain[index] === ')' && --depth === 0) {
      return chain.slice(open + 1, index).trim().replace(/\s+/g, ' ');
    }
  }
  return null;
}

function matchingBrace(source: string, open: number): number {
  if (open < 0) throw new Error('Contract object opening brace was not found.');
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
  throw new Error('Contract object closing brace was not found.');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
