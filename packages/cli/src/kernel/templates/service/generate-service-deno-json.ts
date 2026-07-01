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
  /** Whether this service imports the scaffolded database facade. */
  readonly hasDatabase?: boolean;
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
 * - `@database` when the service is database-backed
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
      // `--unstable-no-legacy-abort` opts into the non-legacy Deno.serve behavior
      // where `request.signal` aborts only on a genuine client disconnect, not on
      // a successful response. The service runtime's oRPC handler observes
      // `request.signal` for request cancellation; without this flag Deno 2.9 logs
      // a deprecation warning on every successful request (denoland/deno#29111).
      dev: 'deno run -A --unstable-no-legacy-abort --watch src/main.ts',
      start: 'deno run -A --unstable-no-legacy-abort src/main.ts',
      test: 'deno test -A src/',
    },
    imports: {
      [`@${options.projectName}/contracts`]: contractsImport,
      ...(options.hasDatabase ? { '@database': '../../database/mod.ts' } : {}),
      [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE],
    },
    compilerOptions: {
      lib: ['dom', 'deno.ns', 'deno.unstable'],
      strict: true,
    },
  };

  return JSON.stringify(config, null, 2) + '\n';
}
