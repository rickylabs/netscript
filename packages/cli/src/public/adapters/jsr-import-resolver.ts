/**
 * Registry-backed import resolver for public scaffold output.
 */

import { SCAFFOLD_PACKAGES } from '../../kernel/constants/scaffold/scaffold-packages.ts';
import { JSR_SPECIFIERS } from '../../kernel/constants/jsr-specifiers.ts';
import type { JsrResolverPort } from '../../kernel/ports/jsr-resolver-port.ts';

const REGISTRY_SPECIFIERS: Readonly<Record<string, string>> = {
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONFIG]: JSR_SPECIFIERS.config,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: JSR_SPECIFIERS.service,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN]: JSR_SPECIFIERS.plugin,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SHARED]: 'jsr:@netscript/shared@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: JSR_SPECIFIERS.sdk,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: `${JSR_SPECIFIERS.sdk}/client`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY]: `${JSR_SPECIFIERS.sdk}/query`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT]: `${JSR_SPECIFIERS.sdk}/query-client`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER]: JSR_SPECIFIERS.logger,
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_MIDDLEWARE]: `${JSR_SPECIFIERS.logger}/middleware`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_ORPC]: `${JSR_SPECIFIERS.logger}/orpc`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_TELEMETRY]: JSR_SPECIFIERS.telemetry,
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]: JSR_SPECIFIERS.database,
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]: `${JSR_SPECIFIERS.database}/scripts`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]: `${JSR_SPECIFIERS.database}/tracing`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS]: JSR_SPECIFIERS.workers,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE]: JSR_SPECIFIERS['plugin-sagas-core'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN]: `${
    JSR_SPECIFIERS['plugin-sagas-core']
  }/domain`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PRISMA_ADAPTER_MYSQL]: 'jsr:@netscript/prisma-adapter-mysql@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE]: JSR_SPECIFIERS.aspire,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH]: JSR_SPECIFIERS.fresh,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS]: `${JSR_SPECIFIERS.fresh}/builders`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY]: `${JSR_SPECIFIERS.fresh}/query`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE]: `${JSR_SPECIFIERS.fresh}/route`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER]: `${JSR_SPECIFIERS.fresh}/server`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE]: `${JSR_SPECIFIERS.fresh}/vite`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_KV]: JSR_SPECIFIERS.kv,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI]: JSR_SPECIFIERS['fresh-ui'],
  [SCAFFOLD_PACKAGES.STD_PATH]: 'jsr:@std/path@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_FS]: 'jsr:@std/fs@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_ASSERT]: 'jsr:@std/assert@^1.0.0',
  [SCAFFOLD_PACKAGES.ZOD]: 'npm:zod@^4.3.6',
};

/** Scaffold import resolver that always returns registry specifiers. */
export class JsrImportResolver implements JsrResolverPort {
  /** Resolve a single import-map key. */
  resolveImport(specifier: string): string {
    const resolved = REGISTRY_SPECIFIERS[specifier];
    if (resolved === undefined) {
      throw new Error(`No JSR import mapping registered for "${specifier}".`);
    }
    return resolved;
  }

  /** Resolve a set of import-map keys. */
  resolveImports(specifiers: readonly string[]): Record<string, string> {
    const imports: Record<string, string> = {};
    for (const specifier of specifiers) {
      imports[specifier] = this.resolveImport(specifier);
    }
    return imports;
  }
}
