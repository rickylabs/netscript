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
  SCAFFOLD_WORKSPACE_PACKAGES,
} from '../../constants/scaffold/scaffold-workspace-packages.ts';
import type { WorkspaceDenoJsonOptions } from '../../domain/scaffold/scaffold-options.ts';

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

  const config: Record<string, unknown> = {
    workspace: [...userMembers, ...packageMembers],
    // Single workspace-root node_modules shared across all members.
    nodeModulesDir: 'auto',
    // Deno unstable features used by generated NetScript workspaces:
    // - `raw-imports`: required by dependency-owned raw asset modules.
    // - `kv`: `@netscript/kv` depends on the unstable `Deno.Kv` API.
    unstable: ['raw-imports', 'kv'],
    tasks: {
      dev: `deno run --allow-all ${SCAFFOLD_DIRS.APPS}/${options.appName}/main.ts`,
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
