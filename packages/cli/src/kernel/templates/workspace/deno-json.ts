/**
 * @module templates/workspace/deno-json
 *
 * Root workspace `deno.json` generator.
 *
 * The root file is a workspace manifest only. Import maps belong on each
 * resource `deno.json` so direct dependencies stay explicit at the consumer
 * boundary, while the root keeps workspace discovery and shared tasks.
 */

import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import {
  SCAFFOLD_ENGINE_WORKSPACE_PACKAGES,
  SCAFFOLD_JSR_RELEASE_PACKAGES,
  SCAFFOLD_WORKSPACE_PACKAGES,
} from '../../constants/scaffold/scaffold-workspace-packages.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import type { WorkspaceDenoJsonOptions } from '../../domain/scaffold/scaffold-options.ts';

const ASPIRE_START_TASK =
  `deno eval "const timeout=Deno.env.get('ASPIRE_CLI_START_TIMEOUT')??'300';` +
  `const isolated=Deno.args.includes('--isolated');` +
  `const child=new Deno.Command('aspire',{args:['start',...Deno.args],` +
  `env:{ASPIRE_CLI_START_TIMEOUT:timeout,...(isolated?{DcpPublisher__RandomizePorts:'true'}:{})},` +
  `stdin:'inherit',stdout:'inherit',stderr:'inherit'}).spawn();` +
  `Deno.exit((await child.status).code)" --`;

/**
 * Generates the root `deno.json` workspace configuration file.
 *
 * The root file is a workspace manifest only. Import maps belong on the
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
      '@database/zod': `./${SCAFFOLD_DIRS.DATABASE}/${dbEngine}/schema/.generated/zod/crud.ts`,
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
      exclude: SCAFFOLD_JSR_RELEASE_PACKAGES.map((packageName) =>
        netscriptJsrSpecifier(packageName)
      ),
    }
    : undefined;

  const config: Record<string, unknown> = {
    workspace: [...userMembers, ...packageMembers],
    ...(Object.keys(imports).length > 0 ? { imports } : {}),
    ...(minimumDependencyAge ? { minimumDependencyAge } : {}),
    // Single workspace-root node_modules shared across all members.
    nodeModulesDir: 'auto',
    // Deno unstable features used by generated NetScript workspaces:
    // - `raw-imports`: required by dependency-owned raw asset modules.
    // - `kv`: `@netscript/kv` depends on the unstable `Deno.Kv` API.
    unstable: ['raw-imports', 'kv'],
    tasks: {
      dev: `deno run --allow-all ${SCAFFOLD_DIRS.APPS}/${options.appName}/main.ts`,
      ...(!options.noAspire
        ? {
          'aspire:start':
            `cd aspire && ${ASPIRE_START_TASK}`,
        }
        : {}),
      check: 'deno check apps/**/*.ts services/**/*.ts contracts/**/*.ts',
      lint: 'deno lint',
      fmt: 'deno fmt',
      test: 'deno test --allow-all',
    },
  };

  config.exclude = [
    '**/node_modules',
    '**/.data',
    'dotnet',
    '**/.git',
    `${SCAFFOLD_DIRS.ASPIRE_TS}/${SCAFFOLD_DIRS.ASPIRE_GENERATED}`,
    `${SCAFFOLD_DIRS.ASPIRE_TS}/${SCAFFOLD_DIRS.HELPERS}`,
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
