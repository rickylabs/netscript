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
  if (/^ {2}(?:\.\.\.|\[)/m.test(block)) {
    return conflict('Spread or computed appRoutes entries are not safe to transform.');
  }
  const value = `generatedRoutes.${requirement.routeKeyPath.join('.')}`;
  const aliasLine = new RegExp(
    `^  ${escapePattern(requirement.alias)}\\s*:\\s*([^\\n]+)$`,
    'm',
  ).exec(block);
  if (aliasLine) {
    return aliasLine[1].trim() === `${value},`
      ? { status: 'exact', content: source }
      : conflict(`appRoutes.${requirement.alias} already has another value.`);
  }

  const sameValue = new RegExp(
    `^  ([A-Za-z_$][A-Za-z0-9_$]*)\\s*:\\s*${escapePattern(value)},\\s*$`,
    'm',
  ).exec(block);
  if (sameValue) {
    return conflict(
      `appRoutes.${sameValue[1]} already resolves the requested Fresh route key path.`,
    );
  }

  const entry = `  ${requirement.alias}: ${value},\n`;
  return {
    status: 'insert',
    content: source.slice(0, closeBrace) + entry + source.slice(closeBrace),
  };
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

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
