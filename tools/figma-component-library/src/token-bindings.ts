import type { FigmaCollection } from '../../../packages/fresh-ui/tokens.ts';
import { BINDING_FIELDS, type TokenBinding } from './contract.ts';

/** Semantic collections preserve theme routing; backing palette/theme collections are never targets. */
export const ROLE_COLLECTIONS = ['Scheme', 'Theme set', 'Density'] as const;
const MAX_EXPANSIONS = 128;

function alternatives(segment: string): string[] {
  const siblings = segment.split('|');
  const first = siblings[0];
  return siblings.flatMap((sibling) => {
    const suffix = first.includes('-') && sibling.length < first.length && !sibling.includes('-')
      ? first.slice(0, first.lastIndexOf('-') + 1) + sibling
      : sibling;
    if (/^[0-9]+\.\.[0-9]+$/.test(suffix)) {
      if (!/^(?:0|[1-9][0-9]*)\.\.(?:0|[1-9][0-9]*)$/.test(suffix)) {
        throw new Error('Invalid token role range: leading zeros');
      }
      const [start, end] = suffix.split('..').map(Number);
      if (start > end || end - start >= MAX_EXPANSIONS) throw new Error('Invalid token role range');
      return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(suffix)) {
      throw new Error(`Malformed token role segment: ${segment}`);
    }
    return [suffix];
  });
}

/** Expand the contract's ranges/alternatives, including padding-x|y suffix shorthand. */
export function expandTokenRole(role: string): readonly string[] {
  const name = role.startsWith('SF:') ? role.slice(3) : role;
  let paths = [''];
  for (const segment of name.split('/')) {
    const choices = alternatives(segment);
    if (paths.length * choices.length > MAX_EXPANSIONS) {
      throw new Error('Token role expansion limit');
    }
    paths = paths.flatMap((prefix) =>
      choices.map((value) => prefix ? `${prefix}/${value}` : value)
    );
  }
  if (new Set(paths).size !== paths.length) {
    throw new Error(`Duplicate token role expansion: ${role}`);
  }
  return paths;
}

/** Resolve every expanded role exactly; missing variables never become literals or loose matches. */
export function resolveBindings(
  roles: readonly string[],
  collections: readonly FigmaCollection[],
): readonly TokenBinding[] {
  const bindings: TokenBinding[] = [];
  for (const role of [...roles].sort()) {
    for (const variable of expandTokenRole(role)) {
      const order = role.startsWith('SF:') ? ['Theme set'] : ROLE_COLLECTIONS;
      const collection = order.map((name) => collections.find((c) => c.collection === name))
        .find((c) => c?.variables.some((v) => v.name === variable));
      const entry = collection?.variables.find((v) => v.name === variable);
      if (!collection || !entry) throw new Error(`Missing token binding: ${role} -> ${variable}`);
      bindings.push({
        role,
        collection: collection.collection,
        variable,
        type: entry.type,
        field: BINDING_FIELDS[entry.type],
        ...(entry.codeSyntax ? { codeSyntax: entry.codeSyntax } : {}),
      });
    }
  }
  const identities = bindings.map((b) => `${b.collection}/${b.variable}`);
  if (new Set(identities).size !== identities.length) throw new Error('Duplicate token binding');
  return bindings;
}
