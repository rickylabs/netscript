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
  type NetScriptRouteManifestOptions,
  resolveNetScriptRouteManifestOptions,
  writeNetScriptRouteManifestSync,
} from '../route/manifest.ts';

const ROUTE_MANIFEST_WATCH_DEBOUNCE_MS = 25;

function resolveWatchedFilePath(appRoot: string, filePath: string): string {
  const normalized = normalizePath(filePath);
  return /^(?:[A-Za-z]:\/|\/)/.test(normalized)
    ? normalized
    : normalizePath(resolve(appRoot, normalized));
}

interface NetScriptViteAlias {
  find: string;
  replacement: string;
}

export interface NetScriptViteEnvMapping {
  source: string;
  target: string;
  fallback?: string;
}

export interface NetScriptVitePluginOptions {
  appRoot?: string;
  workspaceRoot?: string;
  aliasEntries?: NetScriptViteAlias[];
  aliasDirectories?: string[];
  aliasPrefix?: string;
  watchPaths?: string[];
  envMappings?: NetScriptViteEnvMapping[];
  env?: Record<string, string | undefined>;
  allowFsPaths?: string[];
  includeWorkspaceRootInFsAllow?: boolean;
  routeManifest?: NetScriptRouteManifestOptions;
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
      replacement: normalizePath(resolve(appRoot, directory)),
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
      return normalizePath(resolve(alias.replacement, suffix));
    }
  }

  return undefined;
}

function logRouteManifestResult(
  phase: 'init' | 'build' | 'watch',
  result: {
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

export function createNetScriptVitePlugin(options: NetScriptVitePluginOptions = {}): Plugin {
  const appRoot = resolve(options.appRoot ?? Deno.cwd());
  const workspaceRoot = resolve(options.workspaceRoot ?? resolve(appRoot, '../..'));
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

  return {
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
        server.watcher.on('all', (_event, filePath) => {
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
}
