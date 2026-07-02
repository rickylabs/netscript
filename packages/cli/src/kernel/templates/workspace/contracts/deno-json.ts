import type { PackageDenoJsonOptions } from '../../../domain/scaffold/scaffold-options.ts';

/**
 * Direct third-party deps imported from the scaffolded contract files
 * (`{{serviceName}}.contract.ts`, `health.contract.ts`): oRPC contract,
 * oRPC server (for `implement()`), shared NetScript contract primitives, and Zod.
 *
 * Always emitted — contracts are a first-party consumer of these
 * packages regardless of import mode.
 */
const CONTRACTS_DIRECT_DEPS: Readonly<Record<string, string>> = {
  '@orpc/contract': 'npm:@orpc/contract@^1.14.6',
  '@orpc/server': 'npm:@orpc/server@^1.14.6',
  '@netscript/contracts': 'jsr:@netscript/contracts@^0.0.1-alpha.18',
  'zod': 'npm:zod@^4.3.6',
};

/**
 * Generates the `deno.json` configuration for the contracts package.
 *
 * Emits only the direct deps used by the contract templates.
 *
 * @param options - Configuration options for the contracts package.
 * @returns Serialized JSON string for `contracts/deno.json` with trailing newline.
 */
export function generateContractsDenoJson(options: PackageDenoJsonOptions): string {
  const config: Record<string, unknown> = {
    name: options.packageName,
    version: '0.1.0',
    exports: {
      '.': './mod.ts',
      './versions/v1': './versions/v1/mod.ts',
    },
    imports: {
      ...CONTRACTS_DIRECT_DEPS,
      // Caller-supplied additions (tests, downstream overrides).
      ...(options.imports ?? {}),
    },
  };

  return JSON.stringify(config, null, 2) + '\n';
}
