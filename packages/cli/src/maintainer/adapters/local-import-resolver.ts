import { normalize as normalizePosix } from '@std/path/posix';

import { SCAFFOLD_PACKAGES } from '../../kernel/constants/scaffold/scaffold-packages.ts';
import type { LocalImportResolverPort } from '../ports/local-import-resolver-port.ts';

const PACKAGE_TO_LOCAL_PATH: Readonly<Record<string, string>> = {
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONFIG]: 'packages/config/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: 'packages/service/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN]: 'packages/plugin/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONTRACTS]: 'packages/contracts/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: 'packages/sdk/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: 'packages/sdk/client/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY]: 'packages/sdk/query/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT]: 'packages/sdk/query-client/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER]: 'packages/logger/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_MIDDLEWARE]: 'packages/logger/middleware.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_ORPC]: 'packages/logger/orpc.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_TELEMETRY]: 'packages/telemetry/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]: 'packages/database/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]: 'packages/database/scripts/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]: 'packages/database/prisma-tracing.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS]: 'packages/plugin-workers-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE]: 'packages/plugin-sagas-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN]:
    'packages/plugin-sagas-core/src/domain/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PRISMA_ADAPTER_MYSQL]: 'packages/prisma-adapter-mysql/src/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE]: 'packages/aspire/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH]: 'packages/fresh/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS]: 'packages/fresh/src/application/builders/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY]: 'packages/fresh/src/application/query/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE]: 'packages/fresh/src/application/route/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER]: 'packages/fresh/src/runtime/server/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE]: 'packages/fresh/src/application/vite/vite.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_KV]: 'packages/kv/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI]: 'packages/fresh-ui/mod.ts',
};

const EXTERNAL_DEPS: Readonly<Record<string, string>> = {
  [SCAFFOLD_PACKAGES.STD_PATH]: 'jsr:@std/path@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_FS]: 'jsr:@std/fs@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_ASSERT]: 'jsr:@std/assert@^1.0.0',
  [SCAFFOLD_PACKAGES.ZOD]: 'npm:zod@^4.3.6',
};

/** Maintainer resolver for monorepo-local NetScript package imports. */
export class LocalImportResolver implements LocalImportResolverPort {
  /** Resolve one import-map key using local monorepo paths when needed. */
  resolveImport(specifier: string, localBase = '../..'): string {
    const external = EXTERNAL_DEPS[specifier];
    if (external !== undefined) {
      return external;
    }

    const localPath = PACKAGE_TO_LOCAL_PATH[specifier];
    if (localPath === undefined) {
      throw new Error(`No local import mapping registered for "${specifier}".`);
    }
    return resolveLocalImportSpecifier(localBase, localPath);
  }

  /** Resolve many import-map keys using local monorepo paths when needed. */
  resolveImports(
    specifiers: readonly string[],
    localBase = '../..',
  ): Record<string, string> {
    const imports: Record<string, string> = {};
    for (const specifier of specifiers) {
      imports[specifier] = this.resolveImport(specifier, localBase);
    }
    return imports;
  }

  /** Resolve all known NetScript and external dependency imports. */
  resolveAllImports(localBase = '../..'): Record<string, string> {
    return this.resolveImports([
      ...Object.keys(PACKAGE_TO_LOCAL_PATH),
      ...Object.keys(EXTERNAL_DEPS),
    ], localBase);
  }
}

/** Create the maintainer local import resolver adapter. */
export function createLocalImportResolver(): LocalImportResolverPort {
  return new LocalImportResolver();
}

/** Resolve a local import target while preserving import-map-safe URL syntax. */
export function resolveLocalImportSpecifier(localBase: string, localPath: string): string {
  const combined = normalizePosix(`${localBase}/${localPath}`);
  return combined.startsWith('./') || combined.startsWith('../') ||
      combined.startsWith('/')
    ? combined
    : `./${combined}`;
}
