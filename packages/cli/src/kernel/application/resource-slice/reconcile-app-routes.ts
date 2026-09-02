export type AppRoutesReconcileResult =
  | Readonly<{ status: 'exact'; content: string }>
  | Readonly<{ status: 'insert'; content: string }>
  | Readonly<{ status: 'conflict'; reason: string }>;

export interface AppRoutesRequirement {
  readonly alias: string;
  readonly routeKeyPath: readonly [string, ...string[]];
}

const MANIFEST_IMPORT =
  /import\s*\{\s*routePatterns\s*\}\s*from\s*['"]\.\/\.generated\/manifest\.ts['"]\s*;/;
const ROUTES_IMPORT =
  /import\s*\{\s*routes\s+as\s+generatedRoutes\s*\}\s*from\s*['"]\.\/\.generated\/routes\.ts['"]\s*;/;
const APP_ROUTES_START = /^export const appRoutes = \{\s*$/gm;

/** Reconcile one generated-route property chain into a recognized `appRoutes` object. */
export function reconcileAppRoutes(
  source: string,
  requirement: AppRoutesRequirement,
): AppRoutesReconcileResult {
  if (!isIdentifier(requirement.alias) || !requirement.routeKeyPath.every(isIdentifier)) {
    return conflict('The appRoutes alias and Fresh route key path must be identifiers.');
  }
  if (!MANIFEST_IMPORT.test(source) || !ROUTES_IMPORT.test(source)) {
    return conflict('The standard generated route imports are missing or customized.');
  }

  const starts = [...source.matchAll(APP_ROUTES_START)];
  if (starts.length !== 1) {
    return conflict('The appRoutes declaration is missing or has an unsupported shape.');
  }
  const openBrace = source.indexOf('{', starts[0].index);
  const closeBrace = matchingBrace(source, openBrace);
  if (closeBrace < 0 || !/^\} as const;[ \t]*(?:\n|$)/.test(source.slice(closeBrace))) {
    return conflict('The appRoutes declaration has no recognized closing anchor.');
  }
  const start = starts[0].index + starts[0][0].length;
  const laterStart = source.slice(start).search(/^export const appRoutes = \{/m);
  if (laterStart >= 0) return conflict('More than one appRoutes declaration was found.');

  const block = source.slice(start, closeBrace);
  const properties = parseTopLevelProperties(block);
  if (!properties) return conflict('The appRoutes object contains an unsupported entry shape.');
  const value = `generatedRoutes.${requirement.routeKeyPath.join('.')}`;
  const aliases = properties.filter((property) => property.key === requirement.alias);
  const sameValues = properties.filter((property) => property.value === value);
  if (aliases.length > 1) {
    return conflict(`appRoutes.${requirement.alias} is declared more than once.`);
  }
  if (aliases.length === 1) {
    if (aliases[0].value !== value) {
      return conflict(`appRoutes.${requirement.alias} already has another value.`);
    }
    if (sameValues.some((property) => property.key !== requirement.alias)) {
      return conflict('Another appRoutes alias already resolves the requested Fresh route key.');
    }
    return { status: 'exact', content: source };
  }
  if (sameValues.length) {
    return conflict(
      `appRoutes.${sameValues[0].key} already resolves the requested Fresh route key path.`,
    );
  }

  const entry = `  ${requirement.alias}: ${value},\n`;
  return {
    status: 'insert',
    content: source.slice(0, closeBrace) + entry + source.slice(closeBrace),
  };
}

function parseTopLevelProperties(
  block: string,
): readonly Readonly<{ key: string; value: string }>[] | undefined {
  const entries = splitTopLevelEntries(block);
  if (!entries) return undefined;
  const properties: Array<Readonly<{ key: string; value: string }>> = [];
  for (const entry of entries) {
    const candidate = stripLeadingTrivia(entry);
    if (!candidate) continue;
    const match = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*([\s\S]+?)\s*$/.exec(candidate);
    if (!match) return undefined;
    properties.push({ key: match[1], value: match[2].trim() });
  }
  return properties;
}

function splitTopLevelEntries(block: string): readonly string[] | undefined {
  const entries: string[] = [];
  let start = 0;
  let curly = 0;
  let parentheses = 0;
  let square = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = 0; index < block.length; index++) {
    const character = block[index];
    const next = block[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') curly++;
    else if (character === '}' && --curly < 0) return undefined;
    else if (character === '(') parentheses++;
    else if (character === ')' && --parentheses < 0) return undefined;
    else if (character === '[') square++;
    else if (character === ']' && --square < 0) return undefined;
    else if (character === ',' && curly === 0 && parentheses === 0 && square === 0) {
      entries.push(block.slice(start, index));
      start = index + 1;
    }
  }
  if (quote || blockComment || curly || parentheses || square) return undefined;
  entries.push(block.slice(start));
  return entries;
}

function stripLeadingTrivia(value: string): string {
  let candidate = value.trimStart();
  while (candidate.startsWith('//') || candidate.startsWith('/*')) {
    const end = candidate.startsWith('//') ? candidate.indexOf('\n') : candidate.indexOf('*/') + 2;
    if (end <= 1) return '';
    candidate = candidate.slice(end).trimStart();
  }
  return candidate.trim();
}

function matchingBrace(source: string, openBrace: number): number {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openBrace; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth++;
    if (character === '}' && --depth === 0) return index;
  }
  return -1;
}

function conflict(reason: string): AppRoutesReconcileResult {
  return { status: 'conflict', reason };
}

function isIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}
