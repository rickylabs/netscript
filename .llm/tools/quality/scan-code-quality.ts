import { dirname, relative, resolve } from '@std/path';
import { extractFencedBlocks } from '../docs/snippet-extractor.ts';

export type QualityRule =
  | 'explicit-any-ignore'
  | 'unsafe-cast'
  | 'explicit-any'
  | 'public-any'
  | 'public-export-unresolved'
  | 'plugin-name-check'
  | 'ts-error-suppression';

export type PublicDeclarationKind = 'type' | 'interface' | 'function' | 'class' | 'value';

export interface QualityFinding {
  readonly rule: QualityRule;
  readonly file: string;
  readonly line: number;
  readonly text: string;
  readonly fenceOrdinal?: number;
  readonly declarationKind?: PublicDeclarationKind | 'export-edge';
  readonly exportPath?: string;
}

const PLUGIN_NAMES = ['ai', 'auth', 'sagas', 'streams', 'triggers', 'workers'];
// Root policy: the default `quality:scan` half of `quality:gate` covers CLI
// host code plus first-party plugins. Package-wide auditing, including the
// publishable plugin-*-core packages and fitness/quality tool sources, is the
// explicit `quality:scan:repo` task.
// The companion `arch:check` independently evaluates every doctrine root.
const DEFAULT_ROOTS = ['packages/cli/src', 'plugins'];
const ALLOWANCE_OWNER_REPOSITORY = 'rickylabs/netscript';
const ALLOWANCE_RECORD = /^#([1-9]\d*)\s+—\s+(\S(?:.*\S)?)$/u;
const ISSUE_REFERENCE = /#\d+/g;
const EMPTY_TAINT: Set<string> = new Set();
const GENERATED_OR_VENDOR_DIRS = new Set([
  '.deno',
  '.deploy',
  '.git',
  '.output',
  '_cache',
  '_site',
  'node_modules',
  'vendor',
]);

/**
 * Same-file identifiers bound to a plugin name — `const target = 'auth'` or an
 * array literal containing one. Host code that compares `plugin.name` against
 * such an identifier is the plugin-identity anti-pattern hidden behind an
 * innocent-looking extraction, so these idents are treated as plugin names.
 */
function collectPluginNameIdents(lines: readonly string[]): Set<string> {
  const names = PLUGIN_NAMES.join('|');
  const stringBind = new RegExp(
    `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*(?::[^=]+)?=\\s*[\"'](?:${names})[\"']`,
  );
  const arrayBind = new RegExp(
    `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*(?::[^=]+)?=\\s*\\[[^\\]]*[\"'](?:${names})[\"']`,
  );
  const tainted = new Set<string>();
  for (const line of lines) {
    const s = stringBind.exec(line);
    if (s) tainted.add(s[1]);
    const a = arrayBind.exec(line);
    if (a) tainted.add(a[1]);
  }
  return tainted;
}

function ruleFor(line: string, file: string, tainted: Set<string>): QualityRule | undefined {
  // Template/fixture source strings are data, not syntax in the scanned module.
  if (/^\s*[`'\"]/.test(line)) return undefined;
  if (/deno-lint-ignore(?:-file)?\s+no-explicit-any/.test(line)) return 'explicit-any-ignore';
  if (/@ts-(?:ignore|expect-error|nocheck)\b/.test(line)) return 'ts-error-suppression';
  if (/\bas\s+unknown\s+as\b|\bas\s+any\b|\bas\s+never\b/.test(line)) return 'unsafe-cast';
  const commentOnly = /^\s*(?:\/\/|\/\*|\*)/.test(line);
  if (!commentOnly && /(?:<|:\s*)any(?:\s*[,>;)\]}]|\b)/.test(line)) return 'explicit-any';
  // Host-side plugin identity: equality/predicate against a plugin name whether
  // written as a quoted literal OR a same-file identifier bound to one (const
  // indirection). Requiring the closing quote on literals keeps `'auth-backend'`
  // (a capability id) from matching the `auth` plugin name.
  if (file.includes('/features/plugins/')) {
    const names = PLUGIN_NAMES.join('|');
    const literalEquality = new RegExp(
      `(?:===|!==)\\s*[\"'](?:${names})[\"']|[\"'](?:${names})[\"']\\s*(?:===|!==)`,
    );
    const literalPredicate = new RegExp(
      `\\.(?:startsWith|endsWith|includes)\\(\\s*[\"'](?:${names})[\"']`,
    );
    if (literalEquality.test(line) || literalPredicate.test(line)) return 'plugin-name-check';
    if (tainted.size > 0) {
      const idents = [...tainted].map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      // `.name`/`kind` compared to a tainted ident, or a predicate on it, or a
      // tainted array `.includes(plugin.name)`.
      const identEquality = new RegExp(
        `(?:\\.name|\\bkind)\\s*(?:===|!==)\\s*(?:${idents})\\b|\\b(?:${idents})\\s*(?:===|!==)\\s*(?:[\\w.]*\\.name|kind)\\b`,
      );
      const identPredicate = new RegExp(
        `\\.(?:startsWith|endsWith|includes)\\(\\s*(?:${idents})\\b`,
      );
      const arrayIncludes = new RegExp(
        `\\b(?:${idents})\\.includes\\(\\s*[\\w.]*(?:\\.name|kind)\\b`,
      );
      if (identEquality.test(line) || identPredicate.test(line) || arrayIncludes.test(line)) {
        return 'plugin-name-check';
      }
    }
  }
  return undefined;
}

function isTypeFixture(file: string): boolean {
  const normalized = file.replaceAll('\\', '/');
  return normalized.includes('/tests/type-fixtures/') && normalized.endsWith('_type.ts');
}

function isSoundnessFixture(file: string): boolean {
  return file.replaceAll('\\', '/').endsWith('-soundness_test.ts');
}

function isDocsSiteFile(file: string): boolean {
  const normalized = file.replaceAll('\\', '/');
  return normalized.includes('/docs/site/') || normalized.startsWith('docs/site/');
}

function isScannable(file: string): boolean {
  if (isDocsSiteFile(file) && /\.md$/.test(file)) return true;
  if (!/\.[cm]?[jt]sx?$/.test(file) || file.endsWith('.generated.ts') || isTypeFixture(file)) {
    return false;
  }
  const testFile = /(?:_test|\.test|\.spec)\.[cm]?[jt]sx?$/.test(file);
  return !testFile || isDocsSiteFile(file) || isSoundnessFixture(file);
}

async function collect(path: string): Promise<string[]> {
  try {
    const stat = await Deno.stat(path);
    if (stat.isFile) return isScannable(path) ? [path] : [];
  } catch {
    return [];
  }
  const files: string[] = [];
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory && GENERATED_OR_VENDOR_DIRS.has(entry.name)) continue;
    const child = resolve(path, entry.name);
    if (entry.isDirectory) files.push(...await collect(child));
    else if (entry.isFile && isScannable(child)) files.push(child);
  }
  return files;
}

interface SourceToken {
  readonly value: string;
  readonly kind: 'identifier' | 'string' | 'punctuation';
  readonly line: number;
}

type ExportSelection = '*' | ReadonlySet<string>;

interface PublicModuleRequest {
  readonly file: string;
  readonly selection: ExportSelection;
  readonly exportPath: readonly string[];
}

interface PublicExportGraph {
  readonly pending: PublicModuleRequest[];
  readonly selections: Map<string, '*' | Set<string>>;
}

interface PublicAnyFinding extends QualityFinding {
  readonly rule: 'public-any' | 'public-export-unresolved';
  readonly declarationKind: PublicDeclarationKind | 'export-edge';
  readonly exportPath: string;
}

interface NamedSpecifier {
  readonly original: string;
  readonly exported: string;
}

interface Declaration {
  readonly kind: PublicDeclarationKind;
  readonly kindIndex: number;
  readonly name: string;
}

interface ImportBinding {
  readonly imported: string;
  readonly specifier: string;
  readonly line: number;
}

function tokenizeSource(source: string): SourceToken[] {
  const tokens: SourceToken[] = [];
  let index = 0;
  let line = 1;
  while (index < source.length) {
    const char = source[index];
    if (char === '\n') {
      line++;
      index++;
      continue;
    }
    if (/\s/.test(char)) {
      index++;
      continue;
    }
    if (source.startsWith('//', index)) {
      index = source.indexOf('\n', index);
      if (index < 0) break;
      continue;
    }
    if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2);
      const slice = source.slice(index, end < 0 ? source.length : end + 2);
      line += slice.match(/\n/g)?.length ?? 0;
      index += slice.length;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      const startLine = line;
      let value = '';
      index++;
      while (index < source.length) {
        const current = source[index];
        if (current === '\n') line++;
        if (current === '\\') {
          value += current + (source[index + 1] ?? '');
          index += 2;
          continue;
        }
        if (current === quote) {
          index++;
          break;
        }
        value += current;
        index++;
      }
      tokens.push({ value, kind: 'string', line: startLine });
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      const start = index++;
      while (index < source.length && /[\w$]/.test(source[index])) index++;
      tokens.push({ value: source.slice(start, index), kind: 'identifier', line });
      continue;
    }
    const pair = source.slice(index, index + 2);
    if (pair === '=>') {
      tokens.push({ value: pair, kind: 'punctuation', line });
      index += 2;
      continue;
    }
    tokens.push({ value: char, kind: 'punctuation', line });
    index++;
  }
  return tokens;
}

function matchingToken(
  tokens: readonly SourceToken[],
  start: number,
  open: string,
  close: string,
): number {
  let depth = 0;
  for (let index = start; index < tokens.length; index++) {
    if (tokens[index].value === open) depth++;
    if (tokens[index].value === close && --depth === 0) return index;
  }
  return tokens.length - 1;
}

function braceDepths(tokens: readonly SourceToken[]): number[] {
  const depths: number[] = [];
  let depth = 0;
  for (const token of tokens) {
    depths.push(depth);
    if (token.value === '{') depth++;
    else if (token.value === '}') depth--;
  }
  return depths;
}

function namedSpecifiers(
  tokens: readonly SourceToken[],
  open: number,
  close: number,
): NamedSpecifier[] {
  const result: NamedSpecifier[] = [];
  let start = open + 1;
  for (let index = start; index <= close; index++) {
    if (index !== close && tokens[index].value !== ',') continue;
    const identifiers = tokens.slice(start, index)
      .filter((token) => token.kind === 'identifier')
      .map((token) => token.value);
    if (identifiers[0] === 'type' && identifiers.length > 1) identifiers.shift();
    const asIndex = identifiers.indexOf('as');
    if (identifiers.length > 0) {
      result.push({
        original: identifiers[0],
        exported: asIndex >= 0 ? identifiers[asIndex + 1] : identifiers[0],
      });
    }
    start = index + 1;
  }
  return result;
}

function declarationAt(tokens: readonly SourceToken[], start: number): Declaration | undefined {
  let index = start;
  if (tokens[index]?.value === 'export') index++;
  while (['default', 'declare', 'abstract', 'async'].includes(tokens[index]?.value)) index++;
  const keyword = tokens[index]?.value;
  const kind = keyword === 'type' || keyword === 'interface' || keyword === 'function' ||
      keyword === 'class'
    ? keyword
    : ['const', 'let', 'var'].includes(keyword)
    ? 'value'
    : undefined;
  if (!kind) return undefined;
  index++;
  if (keyword === 'function' && tokens[index]?.value === '*') index++;
  const name = tokens[index];
  if (name?.kind !== 'identifier') return undefined;
  return { kind, kindIndex: index - 1, name: name.value };
}

function selectionIncludes(selection: ExportSelection, name: string): boolean {
  return selection === '*' || selection.has(name);
}

function anyTokensInClass(
  tokens: readonly SourceToken[],
  kindIndex: number,
  bodyStart: number,
  bodyEnd: number,
): SourceToken[] {
  const found = tokens.slice(kindIndex, bodyStart).filter((token) => token.value === 'any');
  let index = bodyStart + 1;
  while (index < bodyEnd) {
    while (tokens[index]?.value === ';') index++;
    const start = index;
    let parens = 0;
    let brackets = 0;
    for (; index < bodyEnd; index++) {
      const value = tokens[index].value;
      if (value === '(') parens++;
      else if (value === ')') parens--;
      else if (value === '[') brackets++;
      else if (value === ']') brackets--;
      const boundary = parens === 0 && brackets === 0 && ['{', '=', ';'].includes(value);
      if (!boundary) continue;
      const header = tokens.slice(start, index);
      const isPrivate = header.some((token) =>
        token.value === 'private' || token.value === 'protected' || token.value === '#'
      );
      if (!isPrivate) found.push(...header.filter((token) => token.value === 'any'));
      if (value === '{') index = matchingToken(tokens, index, '{', '}');
      else if (value === '=') {
        while (index < bodyEnd && tokens[index].value !== ';') index++;
      }
      index++;
      break;
    }
  }
  return found;
}

function declarationAnyTokens(
  tokens: readonly SourceToken[],
  depths: readonly number[],
  declaration: Declaration,
): SourceToken[] {
  const { kind, kindIndex } = declaration;
  if (kind === 'interface' || kind === 'class') {
    const bodyStart = tokens.findIndex((token, index) =>
      index > kindIndex && depths[index] === 0 && token.value === '{'
    );
    if (bodyStart < 0) return [];
    const bodyEnd = matchingToken(tokens, bodyStart, '{', '}');
    if (kind === 'class') return anyTokensInClass(tokens, kindIndex, bodyStart, bodyEnd);
    return tokens.slice(kindIndex, bodyEnd + 1).filter((token) => token.value === 'any');
  }

  let end = tokens.length;
  for (let index = kindIndex + 1; index < tokens.length; index++) {
    if (depths[index] !== 0) continue;
    const value = tokens[index].value;
    if (kind === 'function' && (value === '{' || value === ';')) {
      end = index;
      break;
    }
    if (kind === 'value' && (value === '=' || value === ';')) {
      end = index;
      break;
    }
    if (kind === 'type' && value === ';') {
      end = index;
      break;
    }
  }
  return tokens.slice(kindIndex, end).filter((token) => token.value === 'any');
}

async function existingFile(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}

async function resolveLocalModule(file: string, specifier: string): Promise<string | undefined> {
  if (!specifier.startsWith('.')) return undefined;
  const target = resolve(dirname(file), specifier);
  const candidates = /\.[cm]?[jt]sx?$/.test(target) ? [target] : [
    target,
    `${target}.ts`,
    `${target}.tsx`,
    resolve(target, 'mod.ts'),
    resolve(target, 'index.ts'),
  ];
  for (const candidate of candidates) {
    if (await existingFile(candidate)) return candidate;
  }
  return undefined;
}

async function collectDenoConfigs(path: string, configs: Set<string>): Promise<void> {
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(path);
  } catch {
    return;
  }
  if (stat.isFile) {
    if (path.endsWith('/deno.json') || path.endsWith('\\deno.json')) configs.add(path);
    return;
  }
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory && GENERATED_OR_VENDOR_DIRS.has(entry.name)) continue;
    const child = resolve(path, entry.name);
    if (entry.isDirectory) await collectDenoConfigs(child, configs);
    else if (entry.isFile && entry.name === 'deno.json') configs.add(child);
  }
}

async function publicEntries(paths: readonly string[], cwd: string): Promise<string[]> {
  const configs = new Set<string>();
  const boundary = resolve(cwd);
  for (const path of paths) {
    const absolute = resolve(cwd, path);
    await collectDenoConfigs(absolute, configs);
    let current = (await Deno.stat(absolute).catch(() => undefined))?.isDirectory
      ? absolute
      : dirname(absolute);
    while (current === boundary || current.startsWith(`${boundary}/`)) {
      const config = resolve(current, 'deno.json');
      if (await existingFile(config)) configs.add(config);
      if (current === boundary) break;
      current = dirname(current);
    }
  }
  const entries = new Set<string>();
  for (const config of configs) {
    const parsed = JSON.parse(await Deno.readTextFile(config)) as { exports?: unknown };
    const values = typeof parsed.exports === 'string'
      ? [parsed.exports]
      : parsed.exports && typeof parsed.exports === 'object'
      ? Object.values(parsed.exports)
      : [];
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const entry = resolve(dirname(config), value);
      if (/\.[cm]?[jt]sx?$/.test(entry) && await existingFile(entry)) entries.add(entry);
    }
  }
  return [...entries].sort();
}

async function scanPublicAny(paths: readonly string[], cwd: string): Promise<PublicAnyFinding[]> {
  const entryFiles = await publicEntries(paths, cwd);
  const graph: PublicExportGraph = {
    pending: entryFiles.map((file) => ({
      file,
      selection: '*',
      exportPath: [relative(cwd, file).replaceAll('\\', '/')],
    })),
    selections: new Map(),
  };
  const findings = new Map<string, PublicAnyFinding>();

  const enqueue = (
    file: string,
    selection: ExportSelection,
    exportPath: readonly string[],
  ): void => {
    const previous = graph.selections.get(file);
    if (previous === '*') return;
    if (selection === '*') {
      graph.selections.set(file, '*');
      graph.pending.push({ file, selection, exportPath });
      return;
    }
    const additions = new Set([...selection].filter((name) => !previous?.has(name)));
    if (additions.size === 0) return;
    const combined = new Set(previous ?? []);
    additions.forEach((name) => combined.add(name));
    graph.selections.set(file, combined);
    graph.pending.push({ file, selection: additions, exportPath });
  };
  for (const request of graph.pending) graph.selections.set(request.file, '*');

  const addUnresolved = (
    file: string,
    line: number,
    text: string,
    exportPath: readonly string[],
  ): void => {
    const relativeFile = relative(cwd, file).replaceAll('\\', '/');
    const finding: PublicAnyFinding = {
      rule: 'public-export-unresolved',
      file: relativeFile,
      line,
      text,
      declarationKind: 'export-edge',
      exportPath: exportPath.join(' -> '),
    };
    findings.set(`${finding.rule}:${finding.file}:${finding.line}`, finding);
  };

  while (graph.pending.length > 0) {
    const { file, selection, exportPath } = graph.pending.shift()!;
    const source = await Deno.readTextFile(file);
    const lines = source.split(/\r?\n/);
    const tokens = tokenizeSource(source);
    const depths = braceDepths(tokens);
    const localExports = new Map<string, { readonly line: number; readonly exported: string }>();
    const imports = new Map<string, ImportBinding>();
    const declarations = new Map<string, Declaration>();

    for (let index = 0; index < tokens.length; index++) {
      if (depths[index] !== 0) continue;
      const declaration = declarationAt(tokens, index);
      if (declaration) declarations.set(declaration.name, declaration);

      if (tokens[index].value === 'import') {
        let cursor = index + 1;
        if (tokens[cursor]?.value === 'type') cursor++;
        const bindings: NamedSpecifier[] = [];
        if (tokens[cursor]?.kind === 'identifier') {
          bindings.push({ original: 'default', exported: tokens[cursor].value });
          cursor++;
          if (tokens[cursor]?.value === ',') cursor++;
        }
        if (tokens[cursor]?.value === '*') {
          bindings.push({ original: '*', exported: tokens[cursor + 2]?.value });
        } else if (tokens[cursor]?.value === '{') {
          const close = matchingToken(tokens, cursor, '{', '}');
          bindings.push(...namedSpecifiers(tokens, cursor, close));
          cursor = close + 1;
        }
        while (
          cursor < tokens.length && tokens[cursor].value !== 'from' && tokens[cursor].value !== ';'
        ) {
          cursor++;
        }
        const specifier = tokens[cursor]?.value === 'from' ? tokens[cursor + 1] : undefined;
        if (specifier?.kind === 'string') {
          for (const binding of bindings) {
            imports.set(binding.exported, {
              imported: binding.original,
              specifier: specifier.value,
              line: tokens[index].line,
            });
          }
        }
        continue;
      }

      if (tokens[index].value !== 'export') continue;
      let cursor = index + 1;
      if (tokens[cursor]?.value === 'type' && tokens[cursor + 1]?.value === '{') cursor++;
      if (tokens[cursor]?.value === '*') {
        const namespace = tokens[cursor + 1]?.value === 'as'
          ? tokens[cursor + 2]?.value
          : undefined;
        while (cursor < tokens.length && tokens[cursor].value !== 'from') cursor++;
        const specifier = tokens[cursor + 1];
        const edgeIsPublic = namespace
          ? selectionIncludes(selection, namespace)
          : selection === '*' || selection.size > 0;
        if (!edgeIsPublic || specifier?.kind !== 'string' || !specifier.value.startsWith('.')) {
          continue;
        }
        const target = await resolveLocalModule(file, specifier.value);
        if (!target) {
          addUnresolved(
            file,
            tokens[index].line,
            lines[tokens[index].line - 1]?.trim() ?? '',
            [...exportPath, namespace ?? '*'],
          );
        } else {
          enqueue(target, namespace ? '*' : selection, [
            ...exportPath,
            namespace ?? '*',
            relative(cwd, target).replaceAll('\\', '/'),
          ]);
        }
        continue;
      }
      if (tokens[cursor]?.value === '{') {
        const close = matchingToken(tokens, cursor, '{', '}');
        const specs = namedSpecifiers(tokens, cursor, close);
        const from = tokens[close + 1]?.value === 'from' ? tokens[close + 2] : undefined;
        for (const spec of specs) {
          if (!selectionIncludes(selection, spec.exported)) continue;
          if (from?.kind === 'string' && from.value.startsWith('.')) {
            const target = await resolveLocalModule(file, from.value);
            if (!target) {
              addUnresolved(
                file,
                tokens[index].line,
                lines[tokens[index].line - 1]?.trim() ?? '',
                [...exportPath, spec.exported],
              );
            } else {
              enqueue(target, new Set([spec.original]), [
                ...exportPath,
                spec.exported,
                relative(cwd, target).replaceAll('\\', '/'),
              ]);
            }
          } else if (!from) {
            localExports.set(spec.original, {
              line: tokens[index].line,
              exported: spec.exported,
            });
          }
        }
        continue;
      }

      const direct = declarationAt(tokens, index);
      if (direct) {
        const publicName = tokens[index + 1]?.value === 'default' ? 'default' : direct.name;
        if (selectionIncludes(selection, publicName)) {
          localExports.set(direct.name, { line: tokens[index].line, exported: publicName });
        }
      }
    }

    for (const [name, exported] of localExports) {
      const declaration = declarations.get(name);
      if (declaration) {
        for (const token of declarationAnyTokens(tokens, depths, declaration)) {
          const relativeFile = relative(cwd, file).replaceAll('\\', '/');
          const finding: PublicAnyFinding = {
            rule: 'public-any',
            file: relativeFile,
            line: token.line,
            text: lines[token.line - 1]?.trim() ?? '',
            declarationKind: declaration.kind,
            exportPath: [...exportPath, exported.exported].join(' -> '),
          };
          findings.set(`${finding.rule}:${finding.file}:${finding.line}`, finding);
        }
        continue;
      }
      const binding = imports.get(name);
      if (binding) {
        if (binding.specifier.startsWith('.')) {
          const target = await resolveLocalModule(file, binding.specifier);
          if (target) {
            enqueue(target, binding.imported === '*' ? '*' : new Set([binding.imported]), [
              ...exportPath,
              exported.exported,
              relative(cwd, target).replaceAll('\\', '/'),
            ]);
            continue;
          }
        } else {
          // External imports are beyond the checked-in local graph. Their public
          // types remain covered by the dependency package's own export roots.
          continue;
        }
      }
      addUnresolved(
        file,
        exported.line,
        lines[exported.line - 1]?.trim() ?? '',
        [...exportPath, exported.exported],
      );
    }
  }

  return [...findings.values()].sort((a, b) =>
    a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule)
  );
}

/** State required from the durable issue that owns an allowance. */
export interface AllowanceIssueState {
  readonly issue: number;
  readonly state: 'open' | 'closed';
  readonly milestone: string | null;
}

/** External state boundary used to verify allowance owners. */
export interface AllowanceIssueResolver {
  resolve(issue: number): Promise<AllowanceIssueState>;
}

/** Fetch subset used by the GitHub allowance-owner adapter. */
export type AllowanceIssueFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Configuration for the fixed-repository GitHub allowance-owner adapter. */
export interface GitHubAllowanceIssueResolverOptions {
  readonly fetch?: AllowanceIssueFetch;
  readonly token?: string | null;
}

export type AllowancePolicyFailureKind =
  | 'malformed-registration'
  | 'owner-unavailable'
  | 'owner-closed'
  | 'owner-unmilestoned';

/** A fail-closed reason that prevents an allowance registration from passing. */
export interface AllowancePolicyFailure {
  readonly kind: AllowancePolicyFailureKind;
  readonly file: string;
  readonly line: number;
  readonly issue?: number;
  readonly message: string;
  readonly fenceOrdinal?: number;
}

/** Options for deterministic scanner tests and alternate issue-state adapters. */
export interface QualityScanOptions {
  readonly allowanceIssueResolver?: AllowanceIssueResolver;
}

/** A syntactically valid allowance record counted by the non-increasing budget. */
export interface QualityAllowance {
  readonly file: string;
  readonly line: number;
  readonly issue: number;
  readonly reason: string;
  readonly fenceOrdinal?: number;
}

/** Full scan result: real findings plus every honored allowance (for audit). */
export interface QualityScan {
  readonly findings: QualityFinding[];
  readonly allowances: QualityAllowance[];
  readonly allowanceFailures: AllowancePolicyFailure[];
}

function optionalGitHubToken(): string | undefined {
  try {
    return Deno.env.get('GITHUB_TOKEN') ?? Deno.env.get('GH_TOKEN') ?? undefined;
  } catch {
    // A token is optional. A caller without env permission deliberately uses
    // the public unauthenticated API and remains subject to its rate limit.
    return undefined;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function githubIssuePayload(value: unknown, issue: number): AllowanceIssueState {
  if (!value || typeof value !== 'object') {
    throw new Error(`GitHub issue #${issue} returned a non-object response`);
  }
  const payload = value as Record<string, unknown>;
  if (payload.number !== issue || (payload.state !== 'open' && payload.state !== 'closed')) {
    throw new Error(`GitHub issue #${issue} returned malformed identity or state`);
  }
  let milestone: string | null;
  if (payload.milestone === null) {
    milestone = null;
  } else if (
    payload.milestone && typeof payload.milestone === 'object' &&
    typeof (payload.milestone as Record<string, unknown>).title === 'string' &&
    ((payload.milestone as Record<string, unknown>).title as string).trim().length > 0
  ) {
    milestone = ((payload.milestone as Record<string, unknown>).title as string).trim();
  } else {
    throw new Error(`GitHub issue #${issue} returned a malformed milestone`);
  }
  return { issue, state: payload.state, milestone };
}

/**
 * Resolve allowance owners from the fixed public NetScript issue tracker.
 *
 * Tokenless developer and fork runs intentionally use GitHub's anonymous API.
 * Offline, permission-denied, malformed, and rate-limited responses throw so
 * the scanner can fail closed. A token only raises the rate limit; it never
 * changes the repository whose issue state is trusted.
 */
export function createGitHubAllowanceIssueResolver(
  options: GitHubAllowanceIssueResolverOptions = {},
): AllowanceIssueResolver {
  const request = options.fetch ?? fetch;
  const token = options.token === undefined ? optionalGitHubToken() : options.token ?? undefined;
  return {
    async resolve(issue: number): Promise<AllowanceIssueState> {
      const url = `https://api.github.com/repos/${ALLOWANCE_OWNER_REPOSITORY}/issues/${issue}`;
      const headers = new Headers({
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'netscript-quality-scan',
      });
      if (token) headers.set('authorization', `Bearer ${token}`);
      let response: Response;
      try {
        response = await request(url, { headers });
      } catch (error: unknown) {
        throw new Error(
          `GitHub issue #${issue} is unavailable: ${errorMessage(error)}. ` +
            'Grant --allow-net=api.github.com; a token is optional.',
        );
      }
      if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        throw new Error(
          `GitHub issue #${issue} is unavailable: HTTP ${response.status}` +
            `${remaining === null ? '' : ` (rate-limit remaining ${remaining})`}. ` +
            'Anonymous runs fail closed at the public rate limit; provide GITHUB_TOKEN or GH_TOKEN.',
        );
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error: unknown) {
        throw new Error(`GitHub issue #${issue} returned invalid JSON: ${errorMessage(error)}`);
      }
      return githubIssuePayload(payload, issue);
    },
  };
}

interface ScanUnit {
  readonly sourcePath: string;
  readonly lines: readonly string[];
  readonly lineOffset: number;
  readonly fenceOrdinal?: number;
  readonly exemptTsErrorSuppression: boolean;
}

async function scanUnits(file: string, cwd: string): Promise<ScanUnit[]> {
  const sourcePath = relative(cwd, file).replaceAll('\\', '/');
  const source = await Deno.readTextFile(file);
  if (!sourcePath.startsWith('docs/site/') || !sourcePath.endsWith('.md')) {
    return [{
      sourcePath,
      lines: source.split(/\r?\n/),
      lineOffset: 0,
      exemptTsErrorSuppression: isSoundnessFixture(sourcePath),
    }];
  }

  return extractFencedBlocks(source, sourcePath)
    .filter((block) =>
      block.compilationExtension !== undefined && block.exemptionReason === undefined
    )
    .map((block) => ({
      sourcePath: block.sourcePath,
      lines: block.body.split(/\r?\n/),
      lineOffset: block.codeStartLine - 1,
      fenceOrdinal: block.fenceOrdinal,
      exemptTsErrorSuppression: false,
    }));
}

/** Scan selected source paths, returning findings and honored allowances. */
export async function scanCodeQualityDetailed(
  paths: readonly string[],
  cwd: string = Deno.cwd(),
  options: QualityScanOptions = {},
): Promise<QualityScan> {
  const files = (await Promise.all(paths.map((path) => collect(resolve(cwd, path))))).flat();
  const publicFindings = await scanPublicAny(paths, cwd);
  const publicLocations = new Set(
    publicFindings
      .filter((finding) => finding.rule === 'public-any')
      .map((finding) => `${finding.file}:${finding.line}`),
  );
  const suppressedPublicLocations = new Set<string>();
  const findings: QualityFinding[] = [];
  const allowances: QualityAllowance[] = [];
  const allowanceFailures: AllowancePolicyFailure[] = [];
  for (const file of files) {
    for (const unit of await scanUnits(file, cwd)) {
      const normalized = unit.sourcePath.replaceAll('\\', '/');
      const tainted = normalized.includes('/features/plugins/')
        ? collectPluginNameIdents(unit.lines)
        : EMPTY_TAINT;
      for (let index = 0; index < unit.lines.length; index++) {
        const line = unit.lines[index];
        const allowanceMarkers = [...line.matchAll(/\/\/\s*quality-allow:/g)];
        if (allowanceMarkers.length > 0) {
          // A quality-allow only suppresses a line that would otherwise fire a
          // rule — an allowance on a clean line is dead weight, not counted.
          const locationKey = `${unit.sourcePath}:${unit.lineOffset + index + 1}`;
          if (
            !ruleFor(line.replace(/\/\/\s*quality-allow:.*$/, ''), normalized, tainted) &&
            !publicLocations.has(locationKey)
          ) {
            continue;
          }
          suppressedPublicLocations.add(locationKey);
          const location = {
            file: unit.sourcePath,
            line: unit.lineOffset + index + 1,
            ...(unit.fenceOrdinal === undefined ? {} : { fenceOrdinal: unit.fenceOrdinal }),
          };
          const recordText = line.match(/\/\/\s*quality-allow:\s*(.*)$/)?.[1].trim() ?? '';
          const record = allowanceMarkers.length === 1 ? ALLOWANCE_RECORD.exec(recordText) : null;
          const references = recordText.match(ISSUE_REFERENCE) ?? [];
          if (!record || references.length !== 1) {
            allowanceFailures.push({
              kind: 'malformed-registration',
              ...location,
              message: 'Expected exactly `quality-allow: #<issue> — <specific nonblank reason>`.',
            });
          } else {
            allowances.push({
              ...location,
              issue: Number(record[1]),
              reason: record[2],
            });
          }
          continue;
        }
        const rule = ruleFor(line, normalized, tainted);
        if (rule && !(unit.exemptTsErrorSuppression && rule === 'ts-error-suppression')) {
          findings.push({
            rule,
            file: unit.sourcePath,
            line: unit.lineOffset + index + 1,
            text: line.trim(),
            ...(unit.fenceOrdinal === undefined ? {} : { fenceOrdinal: unit.fenceOrdinal }),
          });
        }
      }
    }
  }
  findings.push(...publicFindings.filter((finding) =>
    finding.rule !== 'public-any' ||
    !suppressedPublicLocations.has(`${finding.file}:${finding.line}`)
  ));
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  allowances.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  const resolver = options.allowanceIssueResolver ?? createGitHubAllowanceIssueResolver();
  const issueStates = new Map<number, AllowanceIssueState | Error>();
  await Promise.all(
    [...new Set(allowances.map((allowance) => allowance.issue))].map(async (issue) => {
      try {
        issueStates.set(issue, await resolver.resolve(issue));
      } catch (error: unknown) {
        issueStates.set(issue, error instanceof Error ? error : new Error(String(error)));
      }
    }),
  );
  for (const allowance of allowances) {
    const resolved = issueStates.get(allowance.issue);
    if (resolved instanceof Error || !resolved || resolved.issue !== allowance.issue) {
      allowanceFailures.push({
        kind: 'owner-unavailable',
        file: allowance.file,
        line: allowance.line,
        issue: allowance.issue,
        message: resolved instanceof Error
          ? resolved.message
          : `Issue resolver returned no authoritative state for #${allowance.issue}.`,
        ...(allowance.fenceOrdinal === undefined ? {} : { fenceOrdinal: allowance.fenceOrdinal }),
      });
    } else if (resolved.state !== 'open') {
      allowanceFailures.push({
        kind: 'owner-closed',
        file: allowance.file,
        line: allowance.line,
        issue: allowance.issue,
        message: `Allowance owner #${allowance.issue} is closed.`,
        ...(allowance.fenceOrdinal === undefined ? {} : { fenceOrdinal: allowance.fenceOrdinal }),
      });
    } else if (resolved.milestone === null) {
      allowanceFailures.push({
        kind: 'owner-unmilestoned',
        file: allowance.file,
        line: allowance.line,
        issue: allowance.issue,
        message: `Allowance owner #${allowance.issue} has no milestone.`,
        ...(allowance.fenceOrdinal === undefined ? {} : { fenceOrdinal: allowance.fenceOrdinal }),
      });
    }
  }
  allowanceFailures.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { findings, allowances, allowanceFailures };
}

/** Scan selected source paths for code-quality violations. */
export async function scanCodeQuality(
  paths: readonly string[],
  cwd: string = Deno.cwd(),
  options: QualityScanOptions = {},
): Promise<QualityFinding[]> {
  return (await scanCodeQualityDetailed(paths, cwd, options)).findings;
}

if (import.meta.main) {
  const pretty = Deno.args.includes('--pretty');
  const changed = Deno.args.flatMap((arg, index, args) =>
    arg === '--changed-file' ? [args[index + 1]] : []
  );
  const roots = Deno.args.flatMap((arg, index, args) => arg === '--root' ? [args[index + 1]] : []);
  const maxAllowArg = Deno.args.flatMap((arg, index, args) =>
    arg === '--max-allow' ? [args[index + 1]] : []
  )[0];
  const maxAllow = maxAllowArg === undefined ? undefined : Number(maxAllowArg);
  const mode = changed.length > 0 ? 'changed-files' : 'repository';
  const scanned = changed.length > 0 ? changed : roots.length > 0 ? roots : DEFAULT_ROOTS;
  const { findings, allowances, allowanceFailures } = await scanCodeQualityDetailed(scanned);
  const allowExceeded = maxAllow !== undefined && Number.isFinite(maxAllow) &&
    allowances.length > maxAllow;
  const result = {
    ok: findings.length === 0 && allowanceFailures.length === 0 && !allowExceeded,
    mode,
    scanned,
    findings,
    allowCount: allowances.length,
    allowances,
    allowanceFailures,
    ...(allowExceeded ? { allowLimitExceeded: { limit: maxAllow, count: allowances.length } } : {}),
  };
  console.log(JSON.stringify(result, null, pretty ? 2 : undefined));
  if (!result.ok) Deno.exit(1);
}
