import { type TokenDocument, tokenEntries } from './token-contract.ts';

/** Independently maintained code vocabulary; neither source import nor build updates it. */
export interface TokenRoleRegistry {
  /** Full custom-property names mapped to their required DTCG type. */
  readonly roles: Readonly<Record<string, string>>;
}

/** Reject unknown, missing, duplicate, malformed or type-changed exported roles. */
export function assertRegisteredTokenNames(
  document: TokenDocument,
  registry: TokenRoleRegistry,
): void {
  const seen = new Set<string>();
  for (const { path, token } of tokenEntries(document)) {
    const name = token.$extensions?.netscript?.cssVar;
    if (!name) continue;
    if (!/^--ns-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      throw new Error(`Invalid exported token name: ${name}`);
    }
    if (!Object.hasOwn(registry.roles, name)) {
      throw new Error(`Unknown exported token name: ${name} (${path})`);
    }
    if (seen.has(name)) throw new Error(`Duplicate exported token name: ${name}`);
    if (registry.roles[name] !== token.$type) {
      throw new Error(`Registered token type changed: ${name}`);
    }
    seen.add(name);
  }
  const missing = Object.keys(registry.roles).filter((name) => !seen.has(name));
  if (missing.length) throw new Error(`Missing registered token names: ${missing.join(', ')}`);
}
