/**
 * @module infra/templates/app/generate-app-deno-json
 *
 * Tier 1 generator for the Fresh app's `deno.json`.
 *
 * Produces a workspace member config with the app's direct Fresh, Preact,
 * Vite, and NetScript imports plus a scoped package name.
 */

import { resolveNetScriptImports } from '../../scaffold/import-resolver.ts';
import { SCAFFOLD_PACKAGES } from '../../../constants/scaffold/scaffold-packages.ts';
import type { JsrResolverPort } from '../../../ports/jsr-resolver-port.ts';
import type { PackageSourceMode } from '../../../domain/scaffold/scaffold-options.ts';

/** Options for generating the app-level `deno.json`. */
export interface AppDenoJsonOptions {
  /** Project name for scoped package name. */
  readonly projectName: string;
  /** App name (e.g. `dashboard`). */
  readonly appName: string;
  /** Import mode for NetScript package references. */
  readonly importMode: PackageSourceMode;
  /** Depth-adjusted local base path (when `importMode` is `'local'`). */
  readonly localBase?: string;
  /**
   * Retained for backward compatibility with older scaffold callers.
   * Resource deno.json files always declare their direct imports now.
   */
  readonly packagesAsWorkspaceMembers?: boolean;
  /** Registry resolver used for public scaffold imports. */
  readonly jsrResolver?: JsrResolverPort;
}

/**
 * Generate the contents of `apps/{appName}/deno.json`.
 *
 * NetScript packages are resolved via {@link resolveNetScriptImports}
 * using the caller's depth-adjusted `localBase`, then narrowed to the
 * direct imports used by the scaffolded app source files.
 *
 * @param options - Project, app naming, and import resolution options.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateAppDenoJson(options: AppDenoJsonOptions): string {
  const resolvedImports = options.importMode === 'jsr' && options.jsrResolver
    ? options.jsrResolver.resolveImports([
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH,
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS,
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY,
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE,
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER,
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE,
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI,
      SCAFFOLD_PACKAGES.NETSCRIPT_SDK,
      SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT,
      SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY,
      SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT,
    ])
    : resolveNetScriptImports(options.importMode, options.localBase);
  const contractsImport = {
    [`@${options.projectName}/contracts`]: '../../contracts/mod.ts',
  };
  const directNetScriptImports = {
    [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH]: resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_FRESH],
    [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: resolvedImports[SCAFFOLD_PACKAGES.NETSCRIPT_SDK],
    [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY
    ],
    [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT]: resolvedImports[
      SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT
    ],
  };

  const config = {
    name: `@${options.projectName}/${options.appName}`,
    version: '0.0.0',
    exports: './main.ts',
    // Note: `workspace` field is intentionally omitted — it is only valid on
    // the root `deno.json`. Having it on a workspace member triggers
    // `Warning "workspace" field can only be specified in the workspace root`
    // in Deno 2.x.
    tasks: {
      check: 'deno fmt --check . && deno lint . && deno check',
      dev: 'deno run -A npm:vite --configLoader native',
      build: 'deno run -A npm:vite build',
      serve: 'deno run -A npm:vite preview',
      start: 'deno serve -A _fresh/server.js',
      update: 'deno run -A -r jsr:@fresh/update .',
    },
    lint: {
      rules: {
        tags: ['fresh', 'recommended'],
      },
    },
    exclude: ['**/_fresh/*'],
    imports: {
      '@app/': './',
      ...contractsImport,
      ...directNetScriptImports,
      'fresh': 'jsr:@fresh/core@^2.3.0',
      'preact': 'npm:preact@^10.29.1',
      'preact/hooks': 'npm:preact@^10.29.1/hooks',
      '@preact/signals': 'npm:@preact/signals@^2.9.0',
      '@fresh/plugin-vite': 'jsr:@fresh/plugin-vite@^1.1.2',
      '@tailwindcss/vite': 'npm:@tailwindcss/vite@^4.1.12',
      'tailwindcss': 'npm:tailwindcss@^4.2.2',
      'vite': 'npm:vite@^7.1.4',
      'vite/client': 'npm:vite@^7.1.4/client',
    },
    compilerOptions: {
      lib: ['dom', 'dom.asynciterable', 'dom.iterable', 'deno.ns', 'deno.unstable'],
      jsx: 'precompile',
      jsxImportSource: 'preact',
      jsxPrecompileSkipElements: [
        'a',
        'img',
        'source',
        'body',
        'html',
        'head',
        'title',
        'meta',
        'script',
        'link',
        'style',
        'base',
        'noscript',
        'template',
      ],
      types: ['vite/client'],
    },
  };
  return JSON.stringify(config, null, 2) + '\n';
}
