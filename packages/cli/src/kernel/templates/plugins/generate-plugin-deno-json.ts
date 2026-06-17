/**
 * @module templates/plugins/generate-plugin-deno-json
 *
 * Tier 1 generator for a scaffolded plugin package's `deno.json`.
 */

import { resolveNetScriptImports } from '../../adapters/scaffold/import-resolver.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import type { PluginKindProvider, PluginScaffoldOptions } from '../../domain/plugin-kind.ts';

const ORPC_SERVER_SPECIFIER = 'npm:@orpc/server@^1.14.6';
const ZOD_SPECIFIER = 'npm:zod@^4.3.6';

/**
 * Generate `plugins/<name>/deno.json`.
 *
 * The generated plugin package declares only the imports used by the scaffolded
 * stub files. Workspace-local aliases such as `@database` and `@contracts`
 * are intentionally omitted.
 */
export function generatePluginDenoJson(
  provider: PluginKindProvider,
  options: Pick<
    PluginScaffoldOptions,
    'projectName' | 'pluginName' | 'importMode' | 'localBase' | 'includeSamples'
  >,
): string {
  const resolvedImports = resolveNetScriptImports(options.importMode, options.localBase);
  const primaryEntrypoint = provider.defaultEntrypoint;
  const includeSamples = options.includeSamples ?? true;
  const includeBackgroundSamples = includeSamples && provider.category === 'background-processor';
  const sampleCheckTargets = includeBackgroundSamples ? ' jobs/**/*.ts tasks/**/*.ts' : '';
  const checkTargets = provider.category === 'plugin'
    ? 'mod.ts src/**/*.ts contracts/v1/mod.ts'
    : `mod.ts bin/**/*.ts services/src/**/*.ts contracts/v1/mod.ts${sampleCheckTargets}`;
  const runPermissions = provider.defaultPermissions.join(' ');
  const exports: Record<string, string> = {
    '.': './mod.ts',
    './contracts': './contracts/v1/mod.ts',
  };

  if (provider.defaultServiceEntrypoint) {
    exports['./services'] = `./${provider.defaultServiceEntrypoint}`;
  }

  const config = {
    name: `@${options.projectName}/plugin-${options.pluginName}`,
    version: '0.1.0',
    exports,
    tasks: {
      check: `deno check ${checkTargets}`,
      dev: `deno run ${runPermissions} ${provider.watchFlag} ${primaryEntrypoint}`,
      start: `deno run ${runPermissions} ${primaryEntrypoint}`,
      test: 'deno test --allow-all',
    },
    imports: {
      [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN]: resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN],
      [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE],
      [SCAFFOLD_PACKAGES.NETSCRIPT_CONTRACTS]:
        resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_CONTRACTS],
      [SCAFFOLD_PACKAGES.NETSCRIPT_KV]: resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_KV],
      ...(includeSamples && provider.category === 'background-processor'
        ? {
          [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS]:
            resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS],
        }
        : {}),
      '@orpc/server': ORPC_SERVER_SPECIFIER,
      [SCAFFOLD_PACKAGES.ZOD]: resolvedImports[SCAFFOLD_PACKAGES.ZOD] ?? ZOD_SPECIFIER,
    },
    compilerOptions: {
      lib: ['deno.ns', 'deno.unstable', 'dom', 'dom.iterable'],
      strict: true,
    },
  };

  return JSON.stringify(config, null, 2) + '\n';
}
