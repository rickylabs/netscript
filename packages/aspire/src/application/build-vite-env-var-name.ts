/**
 * @module
 *
 * VITE environment variable name generation for Aspire service discovery.
 *
 * Generates `VITE_`-prefixed env var names that Vite statically replaces in
 * client bundles. Two names are generated per resource: a full isomorphic
 * format matching the server-side pattern, and a shorthand alias.
 *
 * Ported from `ViteEnvironmentExtensions.cs`.
 */

import { RESOURCE_DEFAULTS } from '../../constants.ts';

/** Generated VITE environment variable name pair. */
export interface ViteEnvVarNames {
  /**
   * Full isomorphic format: `VITE_services__{name}__http__0`.
   * Invalid identifier characters are replaced with underscores.
   */
  readonly full: string;

  /**
   * Shorthand format: `VITE_{NORMALISED}_URL`.
   * Resource name is uppercased with hyphens replaced by underscores.
   */
  readonly shorthand: string;
}

/**
 * Generates VITE-prefixed environment variable names for a resource.
 *
 * Vite's built-in behavior: every process environment variable whose name
 * starts with `VITE_` is statically replaced in client bundles at build time
 * via `import.meta.env.VITE_*`.
 *
 * @param resourceName - The Aspire resource name (e.g., "orders", "workers-api")
 * @param endpointName - The endpoint name (defaults to "http")
 * @returns Object with `full` and `shorthand` environment variable names
 *
 * @example
 * ```ts
 * buildViteEnvVarName('orders');
 * // { full: "VITE_services__orders__http__0", shorthand: "VITE_ORDERS_URL" }
 *
 * buildViteEnvVarName('workers-api');
 * // { full: "VITE_services__workers_api__http__0", shorthand: "VITE_WORKERS_API_URL" }
 * ```
 */
export function buildViteEnvVarName(
  resourceName: string,
  endpointName: string = RESOURCE_DEFAULTS.HttpEndpointName,
): ViteEnvVarNames {
  const normalisedResource = normalizeViteIdentifierSegment(resourceName);
  const normalisedEndpoint = normalizeViteIdentifierSegment(endpointName);
  const full = `VITE_services__${normalisedResource}__${normalisedEndpoint}__0`;

  const shorthand = `VITE_${normalisedResource.toUpperCase()}_URL`;

  return { full, shorthand };
}

function normalizeViteIdentifierSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, '_');
}
