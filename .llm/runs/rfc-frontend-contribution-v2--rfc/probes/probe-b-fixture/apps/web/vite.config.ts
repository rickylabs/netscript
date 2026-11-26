import { fresh } from '@fresh/plugin-vite';
import tailwindCSS from '@tailwindcss/vite';
import { resolve } from 'node:path';
import process from 'node:process';
import { createNetScriptVitePlugin } from '@netscript/fresh/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const appRoot = resolve(import.meta.dirname!, '.');
const fixtureRoot = resolve(import.meta.dirname!, '../..');
const repoRoot = resolve(import.meta.dirname!, '../../../../../../..');

const workspaceOtelShim: Plugin = {
  name: 'probe-b-otel-resolver',
  enforce: 'post',
  resolveId(id) {
    if (id === '@opentelemetry/api') {
      return '\0probe-b-otel-api';
    }
    return null;
  },
  load(id) {
    if (id === '\0probe-b-otel-api') {
      return `export * from 'npm:@opentelemetry/api@^1.9.1';`;
    }
    return null;
  },
};

// Pin @fresh/core's internal @preact/signals import to the host app's catalog/deno.json
// entry when running without a lockfile (--no-lock), without masking remote http:// island tests (M6).
const hostFreshSignalsPin: Plugin = {
  name: 'probe-b-host-fresh-signals-pin',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (
      importer &&
      (importer.includes('@fresh/core') || importer.startsWith('\0fresh:')) &&
      /^(?:npm:\/?)?@preact\/signals(?:-core)?(?:@[^/]+)?$/.test(source)
    ) {
      const target = source.includes('signals-core') ? '@preact/signals-core' : '@preact/signals';
      return await this.resolve(target, resolve(appRoot, 'main.ts'), {
        ...options,
        skipSelf: true,
      });
    }
    return null;
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, '');
  const extraIslands = (env.PROBE_EXTRA_ISLAND_SPECIFIERS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const aliasEntries = [
    { find: '@app/assets', replacement: resolve(appRoot, 'assets') },
    { find: '@app/components', replacement: resolve(appRoot, 'components') },
    { find: '@app/islands', replacement: resolve(appRoot, 'islands') },
    { find: '@app/lib', replacement: resolve(appRoot, 'lib') },
    { find: '@app/routes', replacement: resolve(appRoot, 'routes') },
    { find: '@app', replacement: appRoot },
  ];

  const cssMode = env.PROBE_CSS_MODE ?? 'split-app-wins';
  const remoteIslandSpecifier = env.PROBE_REMOTE_ISLAND_SPECIFIER ?? '';
  const allIslandSpecifiers = [
    '@netscript/fresh/defer/island',
    '@acme/local-plugin/island',
    ...extraIslands,
  ];

  return {
    server: {
      port: Number.parseInt(env.NETSCRIPT_VITE_PORT ?? process.env.PORT ?? '5179', 10),
      host: env.NETSCRIPT_VITE_HOST ?? '127.0.0.1',
    },
    define: {
      __PROBE_CSS_MODE__: JSON.stringify(cssMode),
      __PROBE_REMOTE_ISLAND_SPECIFIER__: JSON.stringify(remoteIslandSpecifier),
    },
    plugins: [
      hostFreshSignalsPin,
      fresh({
        islandSpecifiers: allIslandSpecifiers,
      }),
      tailwindCSS(),
      createNetScriptVitePlugin({
        appRoot,
        workspaceRoot: fixtureRoot,
        allowFsPaths: [repoRoot],
        aliasEntries,
        watchPaths: [
          resolve(fixtureRoot, 'packages/local-plugin'),
          resolve(repoRoot, 'packages/fresh'),
        ],
        routeManifest: {},
        pageModuleRouteBinding: false,
      }),
      workspaceOtelShim,
    ],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `[name].mjs`,
          chunkFileNames: `[name].mjs`,
        },
      },
    },
    environments: {
      client: {
        build: {
          rollupOptions: {
            output: {
              // Fresh serves the filenames from the client manifest as immutable assets.
              entryFileNames: '[name]-[hash].mjs',
              chunkFileNames: '[name]-[hash].mjs',
            },
          },
        },
      },
    },
  };
});
