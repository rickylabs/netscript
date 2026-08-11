/**
 * @module
 *
 * The declared service environment the #1447 runtime gates agree on — one case
 * per documented precedence category, with the outcome each category promises.
 *
 * Two gates share it: the pre-start fixture writes these entries into the
 * scaffolded `appsettings.json` and regenerates, and the behavior gate reads the
 * AppHost-started process's own environment back. Both derive the case list from
 * the same discovered topology, so neither can drift into asserting something the
 * other did not write.
 *
 * The categories mirror `packages/aspire/README.md` § Resource environment. The
 * expectation attached to each case is the *documented contract*, not a model of
 * how Aspire resolves duplicate keys: what actually resolved them is read out of
 * the running process, and a category whose rule stopped holding fails here.
 */

import { databaseUriEnvKey, type DiscoveredService } from './discover-service-subjects.ts';

/** What the documented rule says happens to a declared key. */
export type PrecedenceRule = 'declared-wins' | 'generated-wins' | 'refused';

/** What the running process must show for a declared key. */
export type DeclaredExpectation =
  /** The declared value itself reached the process. */
  | { readonly kind: 'declared' }
  /** A generated value replaced it; the value is not knowable before start. */
  | { readonly kind: 'differs'; readonly prefix?: string }
  /** A generated value replaced it, and the replacement is known deterministically. */
  | { readonly kind: 'equals'; readonly value: string }
  /** A generated value replaced it, and it must match another key's value. */
  | { readonly kind: 'matches'; readonly key: string }
  /** It was never applied; Aspire supplies its own value through another mechanism. */
  | { readonly kind: 'refused' };

/** One declared entry and the category rule it exercises. */
export interface DeclaredEnvironmentCase {
  /** Documented category name. */
  readonly category: string;
  /** Environment key a consumer declares. */
  readonly key: string;
  /** Value the consumer declares — chosen so that winning is visible and harmless. */
  readonly value: string;
  /** Documented rule for the category. */
  readonly rule: PrecedenceRule;
  /** What the AppHost-started process must show. */
  readonly expectation: DeclaredExpectation;
}

/** Infrastructure key the AppHost allocates; the collision half of the rule. */
export const GENERATED_DATABASE_URL_KEY = 'DATABASE_URL';

/**
 * A stale literal for {@link GENERATED_DATABASE_URL_KEY}, declared on purpose.
 *
 * The precedence rule says the generated value wins, so this address must never
 * reach the running process. It names nothing real: if it ever did win, the
 * service would point at a host that does not exist rather than fail quietly.
 */
export const DECLARED_STALE_DATABASE_URL = 'postgres://declared-by-appsettings:5432/stale';

/**
 * A port that is valid, unprivileged, and not what Aspire allocates.
 *
 * `PORT` is refused by the generator rather than overridden (see
 * `resolve-resource-environment.ts`), so this value must be absent from the
 * running process's environment entirely.
 */
export const DECLARED_REFUSED_PORT = '59147';

/**
 * Builds the declared environment for a discovered subject.
 *
 * The plain entries are fixed; the database-URI and service-discovery keys are
 * derived from the topology, because their names depend on the primary database
 * and on what the subject references. Deriving them on both sides is what lets
 * the verifier recompute the same expectations from `appsettings.json` alone,
 * with no handoff file to fall out of date.
 *
 * @param subject - Service the fixture declares on, or the verifier found.
 * @param primaryDatabase - Primary database key from the same topology.
 * @param reference - Reference whose discovery key is collided with, when there is one.
 * @returns One case per documented category.
 */
export function buildDeclaredEnvironmentCases(
  subject: Pick<DiscoveredService, 'name'>,
  primaryDatabase: string | undefined,
  reference: string | undefined,
): readonly DeclaredEnvironmentCase[] {
  const cases: DeclaredEnvironmentCase[] = [
    {
      category: 'plain',
      key: 'NETSCRIPT_E2E_SERVICE_ENV',
      value: 'declared',
      rule: 'declared-wins',
      expectation: { kind: 'declared' },
    },
    {
      // Stands in for the transport switch in #1447 — the class of value where
      // losing it changes what the process does, not just what it logs.
      category: 'plain',
      key: 'NETSCRIPT_E2E_SERVICE_MODE',
      value: 'http',
      rule: 'declared-wins',
      expectation: { kind: 'declared' },
    },
    {
      category: 'OTel',
      key: 'OTEL_SERVICE_NAME',
      value: 'declared-by-appsettings',
      rule: 'generated-wins',
      expectation: { kind: 'equals', value: subject.name },
    },
    {
      category: 'database URL',
      key: GENERATED_DATABASE_URL_KEY,
      value: DECLARED_STALE_DATABASE_URL,
      rule: 'generated-wins',
      expectation: { kind: 'differs' },
    },
    {
      category: 'PORT / endpoint',
      key: 'PORT',
      value: DECLARED_REFUSED_PORT,
      rule: 'refused',
      expectation: { kind: 'refused' },
    },
  ];

  if (primaryDatabase) {
    cases.push({
      category: 'database provider',
      key: 'DB_PROVIDER',
      value: 'declared-by-appsettings',
      rule: 'generated-wins',
      expectation: { kind: 'equals', value: primaryDatabase },
    });
    const uriKey = databaseUriEnvKey(primaryDatabase);
    if (uriKey) {
      cases.push({
        category: 'database engine URI',
        key: uriKey,
        value: `${DECLARED_STALE_DATABASE_URL}-uri`,
        rule: 'generated-wins',
        // The generated helper assigns the engine URI the same allocated
        // connection string as DATABASE_URL, so this is a cross-check between two
        // live values rather than a literal this module chose.
        expectation: { kind: 'matches', key: GENERATED_DATABASE_URL_KEY },
      });
    }
  }

  if (reference) {
    cases.push({
      category: 'service discovery',
      key: `services__${reference}__http__0`,
      value: 'http://declared-by-appsettings:9/stale',
      rule: 'generated-wins',
      expectation: { kind: 'differs', prefix: 'http' },
    });
  }

  return cases;
}

/** Collapses cases into the environment map the fixture writes into config. */
export function declaredEnvironment(
  cases: readonly DeclaredEnvironmentCase[],
): Record<string, string> {
  return Object.fromEntries(cases.map((entry) => [entry.key, entry.value]));
}
