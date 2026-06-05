/**
 * @module templates/service/generate-service-deno-json
 *
 * Tier 1 generator for a scaffolded service's `deno.json`.
 *
 * Produces a workspace-member config wired for a scaffolded NetScript service.
 * The generated file declares only the service's direct imports.
 */

import { resolveNetScriptImports } from '../../adapters/scaffold/import-resolver.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';

/** Options for generating a service's `deno.json`. */
export interface ServiceDenoJsonOptions {
  /** Project name (for scoped package name + contracts import). */
  readonly projectName: string;
  /** Service name (e.g. `users`). */
  readonly serviceName: string;
  /** Import mode for cross-package references. */
  readonly importMode: PackageSourceMode;
  /** Depth-adjusted local base path (when `importMode` is `'local'`). */
  readonly localBase?: string;
  /**
   * Retained for backward compatibility with older scaffold callers.
   * Resource deno.json files always declare their direct imports now.
   */
  readonly packagesAsWorkspaceMembers?: boolean;
}

/**
 * Generate the contents of `services/{serviceName}/deno.json`.
 *
 * Resolves the service's direct imports:
 * - `@<project>/contracts`
 * - `@netscript/service`
 *
 * `@netscript/telemetry` is intentionally omitted here. The scaffolded service
 * imports only `defineService`, and that preset owns telemetry/tracing
 * behavior internally until a template directly imports a telemetry API.
 *
 * @param options - Project, service, and import-mode options.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateServiceDenoJson(options: ServiceDenoJsonOptions): string {
  const contractsImport = '../../contracts/mod.ts';
  const resolvedImports = resolveNetScriptImports(options.importMode, options.localBase);

  const config = {
    name: `@${options.projectName}/${options.serviceName}`,
    version: '0.0.0',
    exports: './src/main.ts',
    tasks: {
      check: 'deno check src/**/*.ts',
      dev: 'deno run -A --watch src/main.ts',
      start: 'deno run -A src/main.ts',
      test: 'deno test -A src/',
    },
    imports: {
      [`@${options.projectName}/contracts`]: contractsImport,
      [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE],
    },
    compilerOptions: {
      lib: ['dom', 'deno.ns', 'deno.unstable'],
      strict: true,
    },
  };

  return JSON.stringify(config, null, 2) + '\n';
}
