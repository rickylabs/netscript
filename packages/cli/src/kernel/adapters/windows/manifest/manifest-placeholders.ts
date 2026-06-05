/** Resolve Aspire manifest placeholders to production deployment values. */
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import type { AspireManifest, ManifestResource } from './manifest-types.ts';

// ============================================================================
// GENERIC PLACEHOLDER RESOLVER
// ============================================================================

/**
 * Build a lookup table `{expr}` → resolved value without hardcoding any
 * engine or resource names.
 *
 * The algorithm:
 * 1. Iterate all manifest resources
 * 2. For `container.v0` / `value.v0` with a connectionString:
 *    - If it matches the primary DB (by resolved connection string), map all
 *      binding expressions for that resource using InfrastructureConfig.database
 *    - If it matches the primary cache, map using InfrastructureConfig.cache
 *    - Otherwise map using connectionStrings (additional DBs)
 * 3. For `executable.v0`:
 *    - Map `{name.bindings.http.url}` using allTargets port, falling back to
 *      manifest binding port
 * 4. For `parameter.v0` (secrets/passwords):
 *    - Map `{name.value}` using the password extracted from InfrastructureConfig
 */
export function buildPlaceholderLookup(
  manifest: AspireManifest,
  infra: InfrastructureConfig,
  connectionStrings: Record<string, string>,
  allTargets: CompileTarget[],
): Record<string, string> {
  const lookup: Record<string, string> = {};

  // Parse the primary DB connection string once to extract host/port for binding expressions
  const dbUri = infra.database.connectionString;
  let dbHost = 'localhost';
  let dbPort = '';

  try {
    const u = new URL(dbUri);
    dbHost = u.hostname || dbHost;
    dbPort = u.port || dbPort;
  } catch { /* non-URL format — leave defaults */ }

  // Parse primary cache connection string
  const cacheStackExchange = infra.cache.password
    ? `${infra.cache.host}:${infra.cache.port},password=${infra.cache.password}`
    : `${infra.cache.host}:${infra.cache.port}`;

  // Build target name / manifest alias → production binding map
  const targetBindings = new Map<string, { url: string; port: string }>();
  for (const t of allTargets) {
    if (!t.port) continue;

    const binding = {
      url: `http://localhost:${t.port}`,
      port: String(t.port),
    };

    const bindingKeys = [t.name, t.manifestResourceName].filter(
      (key): key is string => typeof key === 'string' && key.length > 0,
    );

    for (const key of new Set(bindingKeys)) {
      targetBindings.set(key, binding);
    }
  }

  // ── Walk manifest resources ────────────────────────────────────────────────
  for (const [resourceName, resource] of Object.entries(manifest.resources)) {
    const type = resource.type;

    // ── container.v0 / value.v0 with connectionString ─────────────────────
    if (type === 'container.v0' || type === 'value.v0') {
      // Determine which infra role this resource maps to by comparing resolved
      // connection strings (provider-agnostic — works for any DB engine).
      const resolvedCs = resolveConnectionStringForResource(
        resourceName,
        resource,
        infra,
        connectionStrings,
      );

      if (resolvedCs !== null) {
        lookup[`${resourceName}.connectionString`] = resolvedCs;
      }

      // For container.v0, also resolve the individual binding components
      if (type === 'container.v0' && resource.bindings) {
        for (const [bindingName, binding] of Object.entries(resource.bindings)) {
          // Match this container to infra by checking if connection strings align
          if (isDbContainer(resourceName, infra)) {
            lookup[`${resourceName}.bindings.${bindingName}.host`] = dbHost;
            lookup[`${resourceName}.bindings.${bindingName}.port`] = dbPort;
          }
          // Service containers may have http bindings
          if (binding.port) {
            lookup[`${resourceName}.bindings.${bindingName}.url`] =
              `http://localhost:${binding.port}`;
            lookup[`${resourceName}.bindings.${bindingName}.targetPort`] = String(
              binding.targetPort ?? binding.port,
            );
          }
        }
      }
    }

    // ── annotated.string (URI-encoded password variants) ──────────────────
    // e.g. postgres-password-uri-encoded → encodeURIComponent(password)
    if (type === 'annotated.string') {
      // Find which parameter resource this annotation wraps by checking value
      const wrappedExpr = (resource as { value?: string }).value ?? '';
      const innerMatch = wrappedExpr.match(/^\{([^}]+)\.value\}$/);
      if (innerMatch) {
        const paramName = innerMatch[1];
        // Resolve the password for the wrapped parameter
        const plainPassword = resolveParameterPassword(paramName, infra);
        if (plainPassword !== null) {
          lookup[`${resourceName}.value`] = encodeURIComponent(plainPassword);
          // Also resolve the inner parameter while we're here
          lookup[`${paramName}.value`] = plainPassword;
        }
      }
    }

    // ── parameter.v0 (secrets / passwords) ────────────────────────────────
    if (type === 'parameter.v0') {
      const password = resolveParameterPassword(resourceName, infra);
      if (password !== null) {
        lookup[`${resourceName}.value`] = password;
        lookup[`${resourceName}.inputs.value`] = password;
      }
    }

    // ── executable.v0 (services / plugins / workers / apps) ───────────────
    if (type === 'executable.v0' && resource.bindings?.http) {
      const binding = resource.bindings.http;
      // Use production port from allTargets if available, fall back to manifest port
      const targetBinding = targetBindings.get(resourceName);
      const url = targetBinding?.url ??
        (binding.port ? `http://localhost:${binding.port}` : null);

      if (url) {
        lookup[`${resourceName}.bindings.http.url`] = url;
        const port = targetBinding?.port ?? String(binding.targetPort ?? binding.port ?? '');
        lookup[`${resourceName}.bindings.http.targetPort`] = port;
      }
    }
  }

  // Ensure cache connectionString is always resolvable — value.v0 resources with
  // a plain host:port string (garnet, redis) need this in the lookup.
  lookup[`${infra.cache.name}.connectionString`] = cacheStackExchange;

  return lookup;
}

/**
 * Determine if a manifest container resource corresponds to the primary DB.
 * Comparison is by logical name matching, not by engine name.
 */
function isDbContainer(resourceName: string, infra: InfrastructureConfig): boolean {
  // Primary DB container name is typically the provider name (e.g. "postgres", "mysql")
  // but can also be any logical name. We match by checking if infra.database.name
  // or infra.database.provider starts with or equals the resource name.
  const dbName = infra.database.name.toLowerCase();
  const dbProvider = infra.database.provider.toLowerCase();
  const rn = resourceName.toLowerCase();
  return rn === dbProvider || rn === dbName || dbName.startsWith(rn) || rn.startsWith(dbProvider);
}

/**
 * Resolve the connection string for a manifest resource, matched against
 * InfrastructureConfig by resource name (provider-agnostic).
 */
function resolveConnectionStringForResource(
  resourceName: string,
  _resource: ManifestResource,
  infra: InfrastructureConfig,
  connectionStrings: Record<string, string>,
): string | null {
  const rn = resourceName.toLowerCase();
  const dbProvider = infra.database.provider.toLowerCase();
  const dbName = infra.database.name.toLowerCase();

  // Primary DB resource (by provider name or logical name)
  if (rn === dbProvider || rn === dbName || dbName.startsWith(rn) || rn.startsWith(dbProvider)) {
    return infra.database.connectionString;
  }

  // Named DB resource (e.g. "postgresdb" is the database resource, not the server)
  if (infra.database.databaseName && rn === infra.database.databaseName.toLowerCase()) {
    return infra.database.connectionString;
  }

  // Cache resource
  if (rn === infra.cache.name.toLowerCase() || rn === infra.cache.provider.toLowerCase()) {
    // Aspire uses StackExchange format for garnet/redis connectionString
    return infra.cache.password
      ? `${infra.cache.host}:${infra.cache.port},password=${infra.cache.password}`
      : `${infra.cache.host}:${infra.cache.port}`;
  }

  // Additional databases
  for (const [name, db] of Object.entries(infra.additionalDatabases)) {
    if (rn === name.toLowerCase()) return db.connectionString;
  }

  // Fall back to raw connection strings from appsettings
  if (connectionStrings[resourceName]) return connectionStrings[resourceName];

  return null;
}

/**
 * Resolve the password value for a parameter resource.
 * Matches the parameter name against infra DB/cache password fields generically.
 */
function resolveParameterPassword(
  paramName: string,
  infra: InfrastructureConfig,
): string | null {
  const pn = paramName.toLowerCase();

  // DB password parameter: typically named "<provider>-password"
  if (pn.includes(infra.database.provider.toLowerCase()) && pn.includes('password')) {
    return extractPasswordFromUri(infra.database.connectionString);
  }

  // Cache password parameter
  if (pn.includes(infra.cache.provider.toLowerCase()) && pn.includes('password')) {
    return infra.cache.password ?? '';
  }

  // Fallback: check additional databases
  for (const [, db] of Object.entries(infra.additionalDatabases)) {
    if (pn.includes(db.provider.toLowerCase()) && pn.includes('password')) {
      return extractPasswordFromUri(db.connectionString);
    }
  }

  return null;
}

/** Extract password from a URI-format connection string. */
function extractPasswordFromUri(uri: string): string {
  try {
    return decodeURIComponent(new URL(uri).password || '');
  } catch {
    return '';
  }
}

/**
 * Resolve all placeholder expressions in a string value.
 * Replaces every `{expr}` with its resolved value; unknown expressions → empty string.
 */
export function resolvePlaceholders(value: string, lookup: Record<string, string>): string {
  return value.replace(/\{([^}]+)\}/g, (_match, expr: string) => lookup[expr] ?? '');
}
