import { resolve } from '@std/path';
import {
  type ConfigEnv,
  normalizePath,
  type Plugin,
  type UserConfig,
  type ViteDevServer,
} from 'vite';
import {
  isRouteManifestWatchPath,
  resolveNetScriptRouteManifestOptions,
  writeNetScriptRouteManifestSync,
} from '../route/manifest.ts';
import type { NetScriptRouteManifestOptions } from '../route/manifest.ts';

export type { NetScriptRouteManifestOptions } from '../route/manifest.ts';

const ROUTE_MANIFEST_WATCH_DEBOUNCE_MS = 25;
const ABSOLUTE_PATH_PATTERN = /^(?:[A-Za-z]:\/|\/)/;

function resolveConfigPath(path: string): string {
  return ABSOLUTE_PATH_PATTERN.test(path) ? normalizePath(path) : normalizePath(resolve(path));
}

function joinConfigPath(basePath: string, childPath: string): string {
  const normalizedChild = normalizePath(childPath);
  if (ABSOLUTE_PATH_PATTERN.test(normalizedChild)) {
    return normalizedChild;
  }
  if (/^[A-Za-z]:\//.test(basePath)) {
    return normalizePath(`${basePath}/${normalizedChild}`);
  }
  return normalizePath(resolve(basePath, normalizedChild));
}

function defaultWorkspaceRoot(appRoot: string): string {
  if (/^[A-Za-z]:\//.test(appRoot)) {
    return normalizePath(appRoot.split('/').slice(0, -2).join('/'));
  }
  return normalizePath(resolve(appRoot, '../..'));
}

function resolveWatchedFilePath(appRoot: string, filePath: string): string {
  const normalized = normalizePath(filePath);
  return ABSOLUTE_PATH_PATTERN.test(normalized) ? normalized : joinConfigPath(appRoot, normalized);
}

/** Resolved Vite alias entry generated or accepted by the NetScript Vite plugin. */
export interface NetScriptViteAlias {
  /** Import specifier prefix or exact specifier to match. */
  find: string;
  /** Filesystem path that replaces the matched import specifier. */
  replacement: string;
}

/** Environment variable mapping injected into `import.meta.env`. */
export interface NetScriptViteEnvMapping {
  /** Source key read from the provided environment map. */
  source: string;
  /** Target `import.meta.env` key to define. */
  target: string;
  /** Fallback value used when the source key is absent. */
  fallback?: string;
}

/** Options accepted by the NetScript Fresh Vite plugin. */
export interface NetScriptVitePluginOptions {
  /** Fresh app root used for aliases and route manifest output. */
  appRoot?: string;
  /** Workspace root allowed through the Vite dev-server filesystem guard. */
  workspaceRoot?: string;
  /** Explicit Vite aliases to use instead of generated aliases. */
  aliasEntries?: NetScriptViteAlias[];
  /** App-root-relative directories used to generate aliases. */
  aliasDirectories?: string[];
  /** Alias prefix used for generated aliases. */
  aliasPrefix?: string;
  /** Additional paths watched by the Vite dev server. */
  watchPaths?: string[];
  /** Environment variable mappings to expose through `import.meta.env`. */
  envMappings?: NetScriptViteEnvMapping[];
  /** Environment source values used by `envMappings`. */
  env?: Record<string, string | undefined>;
  /** Additional filesystem paths allowed by the Vite dev server. */
  allowFsPaths?: string[];
  /** Whether to include `workspaceRoot` in the Vite filesystem allow-list. */
  includeWorkspaceRootInFsAllow?: boolean;
  /** Route manifest generation options. */
  routeManifest?: NetScriptRouteManifestOptions;
}

/** Package-owned view of the Vite plugin hooks used by NetScript Fresh. */
export interface NetScriptVitePlugin {
  /** Vite plugin name. */
  readonly name: string;
  /** Vite hook ordering. */
  readonly enforce: 'pre';
  /** Return Vite config defaults for NetScript Fresh workspaces. */
  config(config: Record<string, unknown>, env: Record<string, unknown>): Record<string, unknown>;
  /** Resolve NetScript app aliases to absolute file paths. */
  resolveId(source: string): string | undefined;
  /** Generate route manifests when the Vite build starts. */
  buildStart(): void;
  /** Register development-server watchers for route manifests. */
  configureServer(server: unknown): void;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function createAliasEntries(
  appRoot: string,
  aliasDirectories: string[],
  aliasPrefix: string,
): NetScriptViteAlias[] {
  return [
    ...aliasDirectories.map((directory) => ({
      find: `${aliasPrefix}/${directory}`,
      replacement: joinConfigPath(appRoot, directory),
    })),
    {
      find: aliasPrefix,
      replacement: normalizePath(appRoot),
    },
  ];
}

function buildDefineEntries(
  mappings: NetScriptViteEnvMapping[],
  envValues: Record<string, string | undefined>,
): Record<string, string> {
  const defineEntries: Record<string, string> = {};

  for (const mapping of mappings) {
    const value = envValues[mapping.source] ?? mapping.fallback;
    if (value === undefined) {
      continue;
    }

    defineEntries[`import.meta.env.${mapping.target}`] = JSON.stringify(value);
  }

  return defineEntries;
}

function resolveAliasImport(
  source: string,
  aliasEntries: NetScriptViteAlias[],
): string | undefined {
  const sortedEntries = [...aliasEntries].sort((left, right) =>
    right.find.length - left.find.length
  );

  for (const alias of sortedEntries) {
    if (source === alias.find) {
      return alias.replacement;
    }

    if (source.startsWith(`${alias.find}/`)) {
      const suffix = source.slice(alias.find.length + 1);
      if (ABSOLUTE_PATH_PATTERN.test(alias.replacement)) {
        return normalizePath(`${alias.replacement}/${suffix}`);
      }
      return normalizePath(resolve(alias.replacement, suffix));
    }
  }

  return undefined;
}

function logRouteManifestResult(
  _phase: 'init' | 'build' | 'watch',
  _result: {
    changed: boolean;
    manifestChanged: boolean;
    routesChanged: boolean;
    manifestOutputPath: string;
    routesOutputPath: string;
    routeCount: number;
    boundRouteCount: number;
  },
  logLevel: 'silent' | 'changes' | 'verbose',
): void {
  if (logLevel === 'silent') {
    return;
  }
}

/** Create the NetScript Fresh Vite plugin for aliases, env mapping, and route manifests. */
export function createNetScriptVitePlugin(
  options: NetScriptVitePluginOptions = {},
): NetScriptVitePlugin {
  const appRoot = resolveConfigPath(options.appRoot ?? Deno.cwd());
  const workspaceRoot = resolveConfigPath(options.workspaceRoot ?? defaultWorkspaceRoot(appRoot));
  const aliasPrefix = options.aliasPrefix ?? '@app';
  const aliasEntries = options.aliasEntries ??
    createAliasEntries(appRoot, options.aliasDirectories ?? [], aliasPrefix);
  const routeManifest = options.routeManifest && options.routeManifest.enabled !== false
    ? resolveNetScriptRouteManifestOptions(appRoot, options.routeManifest)
    : undefined;
  const allowFsPaths = dedupe([
    ...(options.includeWorkspaceRootInFsAllow === false ? [] : [normalizePath(workspaceRoot)]),
    ...(options.allowFsPaths ?? []).map((value) => normalizePath(value)),
  ]);

  if (routeManifest) {
    const result = writeNetScriptRouteManifestSync(routeManifest);
    logRouteManifestResult('init', result, routeManifest.logLevel);
  }

  const plugin: Plugin = {
    name: 'vite-plugin-netscript',
    enforce: 'pre',
    config(_config: UserConfig, _env: ConfigEnv) {
      const define = {
        ...buildDefineEntries(options.envMappings ?? [], options.env ?? {}),
      };
      const config: UserConfig = {};

      if (aliasEntries.length > 0) {
        config.resolve = {
          alias: aliasEntries,
        };
      }

      if (allowFsPaths.length > 0) {
        config.server = {
          fs: {
            allow: allowFsPaths,
          },
        };
      }

      if (Object.keys(define).length > 0) {
        config.define = define;
      }

      // Externalize server-only packages with native CJS dynamic require()
      // calls that Vite cannot bundle correctly (e.g. ioredis, redis-errors).
      // Deno resolves these natively via npm: specifiers at runtime through
      // the app's deno.json import map.
      //
      // A single filter function covers each package and all its sub-paths.
      //
      // IMPORTANT: ssr.external only works in DEV mode. For production builds,
      // packages must also be in build.rollupOptions.external — otherwise Vite
      // inlines CJS shims (createRequire + require('./lib/modern')) that fail
      // at runtime under Deno. See: https://github.com/vitejs/vite/issues/11048
      const SERVER_ONLY_PREFIXES = [
        'ioredis',
        'redis-errors',
        'redis-parser',
        'cluster-key-slot',
        'standard-as-callback',
        'denque',
        '@fedify/redis',
      ];

      const isServerOnlyPackage = (id: string): boolean | undefined => {
        for (const prefix of SERVER_ONLY_PREFIXES) {
          if (id === prefix || id.startsWith(`${prefix}/`)) return true;
        }
        return undefined;
      };

      // Dev mode: prevents SSR module runner from evaluating these packages.
      config.ssr = {
        external: SERVER_ONLY_PREFIXES,
      };

      // Production build: prevents Rollup from bundling these into the server
      // output. Deno resolves them at runtime via the app's deno.json import map.
      config.build = {
        rollupOptions: {
          external: isServerOnlyPackage,
        },
      };

      return config;
    },
    resolveId(source: string) {
      return resolveAliasImport(source, aliasEntries);
    },
    buildStart() {
      if (routeManifest) {
        const result = writeNetScriptRouteManifestSync(routeManifest);
        logRouteManifestResult('build', result, routeManifest.logLevel);
      }
    },
    configureServer(server: ViteDevServer) {
      let routeManifestTimer: ReturnType<typeof setTimeout> | undefined;

      for (const path of options.watchPaths ?? []) {
        server.watcher.add(path);
      }

      if (routeManifest) {
        server.watcher.add(routeManifest.routesDir);
        server.watcher.on('all', (_event: string, filePath: string) => {
          const watchedFilePath = resolveWatchedFilePath(appRoot, filePath);
          if (!isRouteManifestWatchPath(watchedFilePath, routeManifest)) {
            return;
          }

          if (routeManifestTimer) {
            clearTimeout(routeManifestTimer);
          }

          routeManifestTimer = setTimeout(() => {
            const result = writeNetScriptRouteManifestSync(routeManifest);
            logRouteManifestResult('watch', result, routeManifest.logLevel);
            if (result.changed) {
              server.ws.send({ type: 'full-reload' });
            }
          }, ROUTE_MANIFEST_WATCH_DEBOUNCE_MS);
        });
      }
    },
  };

  return plugin as unknown as NetScriptVitePlugin;
}
