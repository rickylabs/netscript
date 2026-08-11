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
 * **Precedence.** The rendered block is emitted *before* the generated
 * telemetry, database, and service-discovery assignments. `withEnvironment` is
 * last-write-wins per key, so a declared `DATABASE_URL`, `OTEL_SERVICE_NAME` or
 * `services__<name>__http__0` is overwritten by the generated value. Those
 * values are allocated at AppHost start rather than authored, so honoring a
 * stale literal would point the resource at an address nothing listens on while
 * the config still looked valid. `PORT` never appears here at all: it comes from
 * Aspire's endpoint binding, and is pinned with `HostPort`.
 */

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

/** Identifier the generated block binds the declared environment to. */
const DECLARED_ENVIRONMENT_BINDING = 'configuredEnvironment';

/** Indentation of a statement inside a generated resource registration block. */
const BLOCK_INDENT = '    ';

/**
 * Resolves the environment a config entry declares, preferring `Environment`
 * over the deprecated `Env` alias. Returns `undefined` when the entry declares
 * none, so callers emit nothing rather than an empty loop.
 */
export function resolveResourceEnvironment(
  entry: ResourceEnvironmentEntry,
): Readonly<Record<string, string>> | undefined {
  const declared = entry.Environment ?? entry.Env;
  return declared && Object.keys(declared).length > 0 ? declared : undefined;
}

/**
 * Renders the lines that apply a resource's declared environment, or no lines
 * when it declares none.
 *
 * @param entry - Config entry that may carry `Environment` or the `Env` alias
 * @returns Source lines for the registration block, already indented
 */
export function renderDeclaredEnvironmentLines(entry: ResourceEnvironmentEntry): string[] {
  const declared = resolveResourceEnvironment(entry);
  if (!declared) return [];

  return [
    `${BLOCK_INDENT}const ${DECLARED_ENVIRONMENT_BINDING} = ${JSON.stringify(declared)};`,
    `${BLOCK_INDENT}for (const [key, value] of Object.entries(${DECLARED_ENVIRONMENT_BINDING})) {`,
    `${BLOCK_INDENT}  await resource.withEnvironment(key, value);`,
    `${BLOCK_INDENT}}`,
  ];
}
