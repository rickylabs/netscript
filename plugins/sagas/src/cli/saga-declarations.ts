/** Static syntax and validation for the existing saga config declaration. */

/** Config companion suffix; these modules never belong in the runtime registry. */
export const SAGA_CONFIG_SUFFIX: string = '.config.ts';
/** Root config is also a documented home for literal saga declarations. */
export const SAGA_ROOT_CONFIG: string = 'netscript.config.ts';
const CONFIG_BUILDER = 'defineSagaConfig';
const RUNTIME_EXPORTS = new Set(['default', 'saga', 'definition']);
const REGEX_PREFIXES = new Set([
  '(',
  '[',
  '{',
  '=',
  ':',
  ',',
  ';',
  '?',
  '!',
  '&',
  '|',
  '+',
  '-',
  '*',
  '%',
  '^',
  '~',
  '<',
  '>',
  '/',
  'return',
  'throw',
  'case',
  'yield',
  'await',
]);

/** One config-time identity and its project-relative runtime entrypoint. */
export interface SagaRuntimeDeclaration {
  /** Expected saga identity from the config builder. */
  readonly id: string;
  /** Project-relative runtime module, before path normalization. */
  readonly entrypoint: string;
}

/** Read direct literal config calls without evaluating config or application code. */
export function readSagaDeclarations(
  source: string,
  configPath: string,
): readonly SagaRuntimeDeclaration[] {
  const tokens = sourceTokens(source);
  const builders = new Set([CONFIG_BUILDER]);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== 'import' || tokens[i + 1] !== '{') continue;
    for (let j = i + 2; j < tokens.length && tokens[j] !== '}'; j++) {
      if (tokens[j] === CONFIG_BUILDER && tokens[j + 1] === 'as' && tokens[j + 2]) {
        builders.add(tokens[j + 2]);
      }
    }
  }
  const declarations: SagaRuntimeDeclaration[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!builders.has(tokens[i]) || tokens[i + 1] !== '(') continue;
    const id = staticString(tokens[i + 2]);
    const entrypoint = staticString(tokens[i + 4]);
    if (
      !id?.trim() || tokens[i + 3] !== ',' || !entrypoint?.trim() ||
      (tokens[i + 5] !== ')' && !(tokens[i + 5] === ',' && tokens[i + 6] === ')'))
    ) {
      throw new Error(
        `Invalid saga declaration in ${configPath}${id ? ` for "${id}"` : ''}. ` +
          'Use defineSagaConfig with a literal id and project-relative entrypoint, ' +
          "for example defineSagaConfig('agent-action', 'sagas/agent-action.ts').",
      );
    }
    declarations.push(Object.freeze({ id, entrypoint }));
  }
  return Object.freeze(declarations);
}

/** Recognize the export names accepted by the generated runtime resolver. */
export function hasSagaRuntimeExport(source: string): boolean {
  const tokens = sourceTokens(source);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== 'export') continue;
    if (tokens[i + 1] === 'default') return true;
    if (['const', 'let', 'var'].includes(tokens[i + 1]) && RUNTIME_EXPORTS.has(tokens[i + 2])) {
      return true;
    }
    if (tokens[i + 1] !== '{') continue;
    let start = i + 2;
    for (let j = start; j < tokens.length; j++) {
      if (tokens[j] !== ',' && tokens[j] !== '}') continue;
      // The last name in each value specifier is the exported name, after any `as`.
      if (tokens[start] !== 'type' && RUNTIME_EXPORTS.has(tokens[j - 1])) return true;
      if (tokens[j] === '}') break;
      start = j + 1;
    }
  }
  return false;
}

/** Tokenize only the declaration/export syntax; comments and quoted bodies stay opaque. */
function sourceTokens(source: string): readonly string[] {
  const pattern =
    /\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|`(?:\\[\s\S]|[^`\\])*`|[A-Za-z_$][\w$]*|[^\s]/g;
  const regexLiteral = /\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\\r\n])+\/[a-z]*/y;
  const tokens: string[] = [];
  for (let match; (match = pattern.exec(source));) {
    const token = match[0];
    if (token.startsWith('//') || token.startsWith('/*')) continue;
    if (token === '/' && (!tokens.length || REGEX_PREFIXES.has(tokens.at(-1) ?? ''))) {
      regexLiteral.lastIndex = match.index;
      const regex = regexLiteral.exec(source);
      if (regex) {
        tokens.push(regex[0]);
        pattern.lastIndex = regexLiteral.lastIndex;
        continue;
      }
    }
    tokens.push(token);
  }
  return tokens;
}

function staticString(token: string | undefined): string | undefined {
  if (!token || !["'", '"', '`'].includes(token[0]) || token.at(-1) !== token[0]) {
    return undefined;
  }
  const value = token.slice(1, -1);
  if (/[\r\n]/.test(value) || (token[0] === '`' && value.includes('${'))) return undefined;
  // Keep unsupported escape expressions explicit rather than evaluating JavaScript.
  if (/\\(?![\\'"`])/.test(value)) return undefined;
  return value.replace(/\\([\\'"`])/g, '$1');
}
