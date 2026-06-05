import type { AspireResource, EnvSource } from '../domain/mod.ts';

/** Options for resolving plugin environment variable sources. */
export interface ResolveEnvSourceOptions {
  readonly resources?: ReadonlyMap<string, AspireResource>;
  readonly secrets?: ReadonlyMap<string, string>;
}

/**
 * Resolve an environment source into a concrete string.
 *
 * @param source - Literal, resource-backed, secret-backed, or raw string source.
 * @param options - Optional resource and secret lookup tables.
 * @returns The resolved environment variable value.
 */
export function resolveEnvSource(
  source: EnvSource | string,
  options: ResolveEnvSourceOptions = {},
): string {
  if (typeof source === 'string') {
    return source;
  }
  if (source.kind === 'literal') {
    return source.value;
  }
  if (source.kind === 'secret') {
    return options.secrets?.get(source.name) ?? `\${${source.name}}`;
  }

  const resource = options.resources?.get(source.resource);
  const value = resource?.metadata?.[source.key];
  return typeof value === 'string' ? value : `\${${source.resource}.${source.key}}`;
}
