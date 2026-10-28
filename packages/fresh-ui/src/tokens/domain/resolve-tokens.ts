import {
  type DesignToken,
  type ResolverSource,
  type TokenDocument,
  tokenEntries,
  type TokenResolver,
} from './token-contract.ts';

/** Documents are supplied by the caller; the resolver performs no IO. */
export interface TokenSources {
  readonly resolver: TokenResolver;
  readonly documents: Readonly<Record<string, TokenDocument>>;
}

function pointer(document: object, fragment: string): unknown {
  let value: unknown = document;
  for (const part of fragment.replace(/^#\//, '').split('/')) {
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!value || typeof value !== 'object' || !(key in value)) {
      throw new Error(`Unknown resolver pointer: ${fragment}`);
    }
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

/** Merge DTCG groups in source order; a later token replaces the whole token. */
export function mergeTokenDocuments(target: TokenDocument, source: TokenDocument): TokenDocument {
  for (const [key, value] of Object.entries(source)) {
    const old = target[key];
    target[key] = typeof value !== 'string' && !('$value' in value) && old &&
        typeof old !== 'string' && !('$value' in old)
      ? mergeTokenDocuments(old, value)
      : structuredClone(value);
  }
  return target;
}

/** Expand the supported resolver subset; Style Dictionary resolves token aliases. */
export function resolveTokenSources(
  sources: TokenSources,
  inputs: Readonly<Record<string, string>>,
  override?: TokenDocument,
): TokenDocument {
  if (sources.resolver.version !== '2025.10') throw new Error('Expected DTCG resolver 2025.10');
  for (const name of Object.keys(inputs)) {
    if (!sources.resolver.modifiers[name]) throw new Error(`Unknown token modifier: ${name}`);
  }
  const active = new Set<string>();
  const result: TokenDocument = {};
  function expand(source: ResolverSource): void {
    if (!('$ref' in source)) {
      mergeTokenDocuments(result, source);
      return;
    }
    const ref = source.$ref;
    if (typeof ref !== 'string') throw new Error('Invalid resolver reference');
    if (active.has(ref)) throw new Error(`Resolver reference cycle: ${ref}`);
    active.add(ref);
    if (ref.startsWith('#/sets/')) {
      const set = sources.resolver.sets[ref.slice('#/sets/'.length)];
      if (!set) throw new Error(`Unknown token set: ${ref}`);
      set.sources.forEach(expand);
    } else if (ref.startsWith('#/modifiers/')) {
      const name = ref.slice('#/modifiers/'.length);
      const modifier = sources.resolver.modifiers[name];
      if (!modifier) throw new Error(`Unknown token modifier: ${name}`);
      const input = inputs[name] ?? modifier.default;
      if (!input || !Object.hasOwn(modifier.contexts, input)) {
        throw new Error(`Unknown ${name} context: ${input}`);
      }
      modifier.contexts[input].forEach(expand);
    } else {
      const [file, fragment] = ref.split('#');
      const document = sources.documents[file];
      if (!document) throw new Error(`Unknown token document: ${file}`);
      const selected = fragment ? pointer(document, `#${fragment}`) : document;
      if (!selected || typeof selected !== 'object') throw new Error(`Invalid source: ${ref}`);
      expand(selected as TokenDocument);
    }
    active.delete(ref);
  }
  sources.resolver.resolutionOrder.forEach(expand);
  if (override) {
    validateSemanticOverride(override, result);
    mergeTokenDocuments(result, applyOverrideMetadata(override, result));
  }
  return result;
}

/** A semantic source never contains a literal value, including derived tokens. */
export function assertSemanticAliases(document: TokenDocument): void {
  for (const { path, token } of tokenEntries(document)) {
    if (!isTokenAlias(token.$value)) throw new Error(`Semantic token must be an alias: ${path}`);
  }
}

/** Test the full-token curly reference syntax, not strings containing a reference. */
export function isTokenAlias(value: unknown): value is string {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

/** App overrides can only reassign registered semantic tokens of the same type. */
export function validateSemanticOverride(override: TokenDocument, base: TokenDocument): void {
  if (Object.keys(override).some((key) => key !== 'semantic' && !key.startsWith('$'))) {
    throw new Error('App overrides may only change the semantic tier');
  }
  assertSemanticAliases(override);
  const known = new Map(tokenEntries(base).map(({ path, token }) => [path, token]));
  for (const { path, token } of tokenEntries(override)) {
    const original = known.get(path);
    if (!original?.$extensions?.netscript?.cssVar || original.$type !== token.$type) {
      throw new Error(`Unknown semantic override or changed type: ${path}`);
    }
    if (token.$extensions) throw new Error(`Overrides cannot change metadata: ${path}`);
  }
  assertTokenReferences(mergeTokenDocuments(structuredClone(base), override));
}

/** Check alias edges without substituting values, which remains SD's job. */
export function assertTokenReferences(document: TokenDocument): void {
  const tokens = new Map(tokenEntries(document).map(({ path, token }) => [path, token]));
  const complete = new Set<string>();
  const active = new Set<string>();
  function visit(path: string): void {
    if (complete.has(path)) return;
    if (active.has(path)) throw new Error(`Token alias cycle: ${path}`);
    const token = tokens.get(path);
    if (!token) throw new Error(`Unknown token alias target: ${path}`);
    active.add(path);
    if (isTokenAlias(token.$value)) visit(token.$value.slice(1, -1));
    active.delete(path);
    complete.add(path);
  }
  tokens.forEach((_token, path) => visit(path));
}

/** Preserve role metadata when applying a validated app alias. */
export function applyOverrideMetadata(override: TokenDocument, base: TokenDocument): TokenDocument {
  const known = new Map(tokenEntries(base).map(({ path, token }) => [path, token]));
  const result = structuredClone(override);
  function visit(document: TokenDocument, prefix = ''): void {
    for (const [key, value] of Object.entries(document)) {
      if (key.startsWith('$') || typeof value === 'string') continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if ('$value' in value) {
        document[key] = { ...(value as DesignToken), $extensions: known.get(path)?.$extensions };
      } else visit(value, path);
    }
  }
  visit(result);
  return result;
}
