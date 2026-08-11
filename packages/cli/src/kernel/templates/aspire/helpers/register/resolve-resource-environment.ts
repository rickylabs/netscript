/**
 * @module
 *
 * Resolves and renders the environment variables a config entry declares for a
 * generated Aspire resource.
 *
 * Two names reach this function. `Environment` is canonical; `Env` is a
 * deprecated alias read only when `Environment` is absent — the same pairing as
 * `HostPort` / `Port` in `render-http-endpoint.ts`. Both service and plugin
 * entries accept both spellings, and both go through here, so exactly one place
 * decides which name wins and both resource kinds emit the same registration
 * shape.
 *
 * ## Precedence, per category
 *
 * The rendered block is emitted *before* the generated telemetry, database, and
 * service-discovery assignments, and every one of those is another
 * `withEnvironment` call on the same resource. Within that one mechanism the
 * last write per key wins, so a declared `DATABASE_URL`, `DB_PROVIDER`,
 * `<PRIMARY>_URI`, `OTEL_*` or `services__<name>__http__0` is overwritten by the
 * generated value. Those values are allocated at AppHost start rather than
 * authored, so honoring a stale literal would point the resource at an address
 * nothing listens on while the config still looked valid.
 *
 * `PORT` is the one key that does **not** follow that rule, because it does not
 * come from a `withEnvironment` call at all: Aspire injects it from the endpoint
 * binding (`withHttpEndpoint({ env: 'PORT' })`). Two different mechanisms write
 * it, and their relative order is Aspire's internal business, not something this
 * generator can observe or promise. A declared `PORT` that won would leave the
 * process listening on one port while Aspire probes and proxies another — the
 * resource looks configured and is unreachable. So `PORT` is **refused** here
 * rather than emitted and hoped to lose: the generated block names it in a
 * comment and does not apply it, which makes the documented rule true by
 * construction instead of true by race. Consumers pin ports with `HostPort`.
 */

import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';

/** Config entry shape that can declare environment variables for its resource. */
export interface ResourceEnvironmentEntry {
  /** Environment variables supplied to the resource. */
  readonly Environment?: Readonly<Record<string, string>>;
  /**
   * Deprecated alias for `Environment`, read when `Environment` is absent.
   *
   * @deprecated Use `Environment`.
   */
  readonly Env?: Readonly<Record<string, string>>;
}

/**
 * Keys a declared environment may not set, because Aspire's endpoint allocation
 * owns them through a different mechanism than `withEnvironment`.
 *
 * Only `PORT` qualifies: it is injected by the endpoint binding this generator
 * emits for every service and plugin resource. See the module doc for why a
 * refusal is safer than an ordering promise.
 */
export const ENDPOINT_OWNED_ENVIRONMENT_KEYS: readonly string[] = [
  RESOURCE_DEFAULTS.PortEnvVar,
];

/** A declared environment split into what the resource receives and what it may not set. */
export interface DeclaredEnvironmentPartition {
  /** Entries applied to the resource, in declaration order. */
  readonly applied: Readonly<Record<string, string>>;
  /** Declared keys refused because Aspire's endpoint allocation owns them. */
  readonly refused: readonly string[];
}

/** Identifier the generated block binds the declared environment to. */
const DECLARED_ENVIRONMENT_BINDING = 'configuredEnvironment';

/** Indentation of a statement inside a generated resource registration block. */
const BLOCK_INDENT = '    ';

/**
 * Resolves the environment a config entry declares, preferring `Environment`
 * over the deprecated `Env` alias. Returns `undefined` when the entry declares
 * none, so callers emit nothing rather than an empty loop.
 *
 * Refused keys are still present in the result: this function answers "what did
 * the consumer declare", and {@link partitionDeclaredEnvironment} answers "what
 * does the resource get".
 */
export function resolveResourceEnvironment(
  entry: ResourceEnvironmentEntry,
): Readonly<Record<string, string>> | undefined {
  const declared = entry.Environment ?? entry.Env;
  return declared && Object.keys(declared).length > 0 ? declared : undefined;
}

/**
 * Splits a declared environment into the entries the resource receives and the
 * keys Aspire's endpoint allocation owns.
 *
 * @param entry - Config entry that may carry `Environment` or the `Env` alias
 * @returns Applied entries and refused keys; both empty when nothing is declared
 */
export function partitionDeclaredEnvironment(
  entry: ResourceEnvironmentEntry,
): DeclaredEnvironmentPartition {
  const declared = resolveResourceEnvironment(entry);
  if (!declared) return { applied: {}, refused: [] };

  const applied: Record<string, string> = {};
  const refused: string[] = [];
  for (const [key, value] of Object.entries(declared)) {
    if (ENDPOINT_OWNED_ENVIRONMENT_KEYS.includes(key)) {
      refused.push(key);
      continue;
    }
    applied[key] = value;
  }
  return { applied, refused };
}

/**
 * Renders the lines that apply a resource's declared environment, or no lines
 * when it declares none.
 *
 * A refused key is named in a generated comment rather than dropped in silence:
 * a consumer reading the generated helper has to be able to see why the value
 * they wrote is not there. Silent stripping is the #1447 failure mode.
 *
 * @param entry - Config entry that may carry `Environment` or the `Env` alias
 * @returns Source lines for the registration block, already indented
 */
export function renderDeclaredEnvironmentLines(entry: ResourceEnvironmentEntry): string[] {
  const { applied, refused } = partitionDeclaredEnvironment(entry);
  const lines: string[] = [];

  for (const key of refused) {
    lines.push(
      `${BLOCK_INDENT}// Declared \`${key}\` is not applied: Aspire's endpoint allocation owns it.`,
    );
    lines.push(`${BLOCK_INDENT}// Pin a host port with \`HostPort\` instead.`);
  }

  if (Object.keys(applied).length === 0) return lines;

  lines.push(
    `${BLOCK_INDENT}const ${DECLARED_ENVIRONMENT_BINDING} = ${JSON.stringify(applied)};`,
    `${BLOCK_INDENT}for (const [key, value] of Object.entries(${DECLARED_ENVIRONMENT_BINDING})) {`,
    `${BLOCK_INDENT}  await resource.withEnvironment(key, value);`,
    `${BLOCK_INDENT}}`,
  );
  return lines;
}
