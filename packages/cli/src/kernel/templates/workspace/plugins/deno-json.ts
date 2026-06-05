import type { PackageDenoJsonOptions } from '../../../domain/scaffold/scaffold-options.ts';

/**
 * Generates the `deno.json` configuration for the plugins package.
 *
 * The scaffolded plugin registry has no direct imports by default, so the
 * generated file stays minimal unless the caller adds explicit imports.
 *
 * @param options - Configuration options for the plugins package.
 * @returns Serialized JSON string for `plugins/deno.json` with trailing newline.
 */
export function generatePluginsDenoJson(options: PackageDenoJsonOptions): string {
  const config: Record<string, unknown> = {
    name: options.packageName,
    version: '0.1.0',
    exports: './mod.ts',
  };

  // Merge any additional imports provided by the caller
  if (options.imports && Object.keys(options.imports).length > 0) {
    config.imports = { ...(config.imports as Record<string, string> ?? {}), ...options.imports };
  }

  return JSON.stringify(config, null, 2) + '\n';
}
