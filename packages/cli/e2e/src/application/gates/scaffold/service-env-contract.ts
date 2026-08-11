/**
 * @module
 *
 * The declared service environment the #1447 runtime gates agree on.
 *
 * Two gates share it: the pre-start fixture writes these entries into the
 * scaffolded `appsettings.json` and regenerates, and the behavior gate reads
 * them back off the running AppHost resource. Keeping the values in one module
 * is what stops the fixture and the verifier from drifting into a pair that
 * always passes because neither asserts what the other wrote.
 */

/**
 * Entries a consumer declares for a service. `NETSCRIPT_E2E_SERVICE_MODE`
 * stands in for the transport switch in #1447 — the class of value where
 * losing it changes what the process does, not just what it logs.
 */
export const DECLARED_SERVICE_ENV: Readonly<Record<string, string>> = {
  NETSCRIPT_E2E_SERVICE_ENV: 'declared',
  NETSCRIPT_E2E_SERVICE_MODE: 'http',
};

/** Infrastructure key the AppHost allocates; the collision half of the rule. */
export const GENERATED_DATABASE_URL_KEY = 'DATABASE_URL';

/**
 * A stale literal for {@link GENERATED_DATABASE_URL_KEY}, declared on purpose.
 *
 * The precedence rule says the generated value wins, so this address must never
 * reach the live resource. It names nothing real: if it ever did win, the
 * service would point at a host that does not exist rather than fail quietly.
 */
export const DECLARED_STALE_DATABASE_URL = 'postgres://declared-by-appsettings:5432/stale';
