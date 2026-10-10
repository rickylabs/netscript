/**
 * @module
 *
 * Shared preamble for the populated `register-background.mts` and
 * `register-plugins.mts` helpers. The registration blocks consume database,
 * telemetry, and cache wiring only for the entries that declare it, so each
 * preamble piece (import, binding, parameter) is emitted only when some block
 * reads it. Generated output therefore stays `deno lint`-clean for every
 * entry mix, not only the empty one.
 */

/** Infrastructure flags a registration entry declares. */
export interface RegistrationEntryNeeds {
  /** Whether the entry is wired to the primary database. */
  readonly RequiresDb?: boolean;
  /** Whether the entry is wired to the primary KV cache. */
  readonly RequiresKv?: boolean;
}

/** Preamble pieces the emitted registration blocks consume. */
export interface RegistrationPreambleNeeds {
  /** Database env bindings and the SQLite URL helper. */
  readonly database: boolean;
  /** `buildOtelEnvVars` and `OtlpProtocol`. */
  readonly telemetry: boolean;
  /** The cache-reference helper. */
  readonly cache: boolean;
}

/** Module specifiers and the cache-helper import form a generator emits. */
export interface RegistrationPreambleImports {
  /** Aspire SDK module that exports `OtlpProtocol`. */
  readonly sdkModule: string;
  /** Named import for the cache-reference helper, e.g. `withCacheReference`. */
  readonly cacheImport: string;
}

/** Template slots that carry the preamble. */
export interface RegistrationPreambleSlots extends Record<string, string> {
  /** `OtlpProtocol` import line, or empty. */
  readonly otlpImport: string;
  /** Named imports from the Aspire compat module, one per line. */
  readonly compatImports: string;
  /** Name of the infrastructure parameter; underscore-prefixed when unread. */
  readonly infrastructureParameter: string;
  /** Function-scope database bindings, or empty. */
  readonly databaseBindings: string;
}

/**
 * Derives which preamble pieces a set of registration entries consumes.
 *
 * @param entries - Every entry the generator emits a block for
 * @param telemetry - Whether some emitted block wires OTEL
 * @returns The consumed preamble pieces
 */
export function resolveRegistrationPreambleNeeds(
  entries: readonly RegistrationEntryNeeds[],
  telemetry: boolean,
): RegistrationPreambleNeeds {
  return {
    database: entries.some((entry) => entry.RequiresDb === true),
    telemetry,
    cache: entries.some((entry) => entry.RequiresKv === true),
  };
}

/**
 * Renders the preamble slots for the consumed pieces only.
 *
 * @param needs - Consumed preamble pieces
 * @param imports - Module specifiers and cache-helper import form
 * @returns Template slot values
 */
export function renderRegistrationPreamble(
  needs: RegistrationPreambleNeeds,
  imports: RegistrationPreambleImports,
): RegistrationPreambleSlots {
  const compatImports = [
    ...(needs.database
      ? ['buildDatabaseUriEnvKey', 'buildDatabaseProviderEnvVars', 'buildSqliteDatabaseUrl']
      : []),
    ...(needs.telemetry ? ['buildOtelEnvVars'] : []),
    'resolvePermissions',
    'resolveWorkspacePath',
    ...(needs.cache ? [imports.cacheImport] : []),
  ];

  return {
    otlpImport: needs.telemetry ? `import { OtlpProtocol } from '${imports.sdkModule}';\n` : '',
    compatImports: compatImports.map((name) => `  ${name},`).join('\n'),
    infrastructureParameter: needs.database || needs.cache ? 'infrastructure' : '_infrastructure',
    databaseBindings: needs.database
      ? '  const databaseEnvKey = buildDatabaseUriEnvKey(config);\n' +
        '  const databaseProviderEnv = buildDatabaseProviderEnvVars(config);\n'
      : '',
  };
}
