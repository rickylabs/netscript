/**
 * @module templates/workspace/deno-json
 *
 * Root workspace `deno.json` generator.
 *
 * The root owns workspace discovery, shared tasks, and catalog entries used by
 * local-source packages. Import maps belong on each resource `deno.json` so
 * direct dependencies stay explicit at the consumer boundary.
 */

import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import {
  SCAFFOLD_ENGINE_WORKSPACE_PACKAGES,
  SCAFFOLD_JSR_RELEASE_PACKAGES,
  SCAFFOLD_WORKSPACE_PACKAGES,
} from '../../constants/scaffold/scaffold-workspace-packages.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import type { WorkspaceDenoJsonOptions } from '../../domain/scaffold/scaffold-options.ts';

/**
 * Generates the root `deno.json` workspace configuration file.
 *
 * The root owns workspace-wide catalog entries. Import maps belong on the
 * resource-level `deno.json` files that directly consume those packages.
 *
 * @param options - Configuration options for the workspace deno.json.
 * @returns Serialized JSON string with a trailing newline.
 */
export function generateDenoJson(options: WorkspaceDenoJsonOptions): string {
  const useWorkspaceMembers = options.importMode === 'local' &&
    options.packagesAsWorkspaceMembers === true;

  const userMembers = options.workspaceMembers.map((m) => m.startsWith('./') ? m : `./${m}`);

  const enginePackages = (options.dbEngines ?? []).flatMap(
    (engine) => SCAFFOLD_ENGINE_WORKSPACE_PACKAGES[engine] ?? [],
  );
  const packageMembers = useWorkspaceMembers
    ? [...new Set([...SCAFFOLD_WORKSPACE_PACKAGES, ...enginePackages])]
      .map((p) => `./${SCAFFOLD_DIRS.PACKAGES}/${p}`)
    : [];
  const dbEngine = options.dbEngines?.[0];
  const generatedImports = dbEngine
    ? {
      '@database/zod':
        `./${SCAFFOLD_DIRS.DATABASE}/${dbEngine}/schema/.generated/zod/crud.ts`,
    }
    : {};
  const jsrImports = options.importMode === 'jsr'
    ? {
      '@netscript/config': netscriptJsrSpecifier('config'),
      '@netscript/contracts': netscriptJsrSpecifier('contracts'),
      '@netscript/kv': netscriptJsrSpecifier('kv'),
      '@netscript/plugin': netscriptJsrSpecifier('plugin'),
    }
    : {};
  const imports = { ...jsrImports, ...generatedImports };
  const minimumDependencyAge = options.importMode === 'jsr'
    ? {
      age: 'P1D',
      // Deno matches minimum-age exclusions by package identity. Adding the release version here
      // leaves newly published packages subject to the age window and breaks generated apps for
      // roughly 24 hours after every release.
      exclude: SCAFFOLD_JSR_RELEASE_PACKAGES.map((packageName) =>
        `jsr:@netscript/${packageName}`
      ),
    }
    : undefined;

  const config: Record<string, unknown> = {
    workspace: [...userMembers, ...packageMembers],
    catalog: SCAFFOLD_WORKSPACE_CATALOG,
    ...(Object.keys(imports).length > 0 ? { imports } : {}),
    ...(minimumDependencyAge ? { minimumDependencyAge } : {}),
    // Single workspace-root node_modules shared across all members.
    nodeModulesDir: 'auto',
    // Deno unstable features used by generated NetScript workspaces:
    // - `raw-imports`: required by dependency-owned raw asset modules.
    // - `kv`: `@netscript/kv` depends on the unstable `Deno.Kv` API.
    unstable: ['raw-imports', 'kv'],
    tasks: {
      dev:
        `deno task deps:closure && deno task deps:verify && deno run --allow-all ${SCAFFOLD_DIRS.APPS}/${options.appName}/main.ts`,
      'deps:closure': `deno task --cwd ${SCAFFOLD_DIRS.APPS}/${options.appName} deps:closure`,
      'deps:verify':
        'deno run --allow-read --allow-env=DENO_DIR,LOCALAPPDATA,XDG_CACHE_HOME,HOME,USERPROFILE .netscript/verify-node-modules.ts',
      ...(!options.noAspire
        ? {
          'aspire:start': 'cd aspire && ASPIRE_CLI_START_TIMEOUT=300 aspire start',
          'aspire:start:isolated':
            'cd aspire && ASPIRE_CLI_START_TIMEOUT=300 DcpPublisher__RandomizePorts=true aspire start --isolated',
          'aspire:otel': 'deno run --allow-run=aspire --allow-read .netscript/aspire-cli.ts otel',
          'aspire:export':
            'deno run --allow-run=aspire --allow-read .netscript/aspire-cli.ts export',
        }
        : {}),
      check:
        'deno run --allow-read --allow-run=deno .netscript/quality-runner.ts check',
      lint:
        'deno run --allow-read --allow-run=deno .netscript/quality-runner.ts lint',
      'fmt:check':
        'deno run --allow-read --allow-run=deno .netscript/quality-runner.ts fmt-check',
      fmt:
        'deno run --allow-read --allow-run=deno .netscript/quality-runner.ts fmt-write',
      test: 'deno test --allow-all',
    },
  };

  config.exclude = [
    '**/node_modules',
    '**/.data',
    'dotnet',
    '**/.git',
    `${SCAFFOLD_DIRS.ASPIRE_TS}/${SCAFFOLD_DIRS.ASPIRE_GENERATED}`,
    '**/.generated',
  ];

  config.fmt = {
    useTabs: false,
    lineWidth: 100,
    indentWidth: 2,
    semiColons: true,
    singleQuote: true,
  };
  config.compilerOptions = SCAFFOLD_DEFAULTS.COMPILER_OPTIONS;

  return JSON.stringify(config, null, 2) + '\n';
}
