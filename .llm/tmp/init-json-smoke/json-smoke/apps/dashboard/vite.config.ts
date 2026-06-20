import { fresh } from '@fresh/plugin-vite';
import tailwindCSS from '@tailwindcss/vite';
import { resolve } from 'node:path';
import process from 'node:process';
import { createNetScriptVitePlugin } from '@netscript/fresh/vite';
import { defineConfig, loadEnv } from 'vite';

const appRoot = resolve(import.meta.dirname!, '.');
const workspaceRoot = resolve(import.meta.dirname!, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, '');
  const aliasEntries = [
    { find: '@app/assets', replacement: resolve(appRoot, 'assets') },
    { find: '@app/components', replacement: resolve(appRoot, 'components') },
    { find: '@app/islands', replacement: resolve(appRoot, 'islands') },
    { find: '@app/lib', replacement: resolve(appRoot, 'lib') },
    { find: '@app/routes', replacement: resolve(appRoot, 'routes') },
    { find: '@app', replacement: appRoot },
    {
      find: '@plugins/workers/streams',
      replacement: resolve(workspaceRoot, 'plugins/workers/streams/mod.ts'),
    },
    {
      find: '@plugins/sagas/streams',
      replacement: resolve(workspaceRoot, 'plugins/sagas/streams/mod.ts'),
    },
    {
      find: '@plugins/triggers/streams',
      replacement: resolve(workspaceRoot, 'plugins/triggers/streams/mod.ts'),
    },
  ];

  return {
    server: {
      port: Number.parseInt(env.NETSCRIPT_VITE_PORT ?? process.env.PORT ?? '5173', 10),
      host: env.NETSCRIPT_VITE_HOST ?? '0.0.0.0',
    },
    plugins: [
      fresh(),
      tailwindCSS(),
      createNetScriptVitePlugin({
        appRoot,
        workspaceRoot,
        aliasEntries,
        watchPaths: [
          resolve(workspaceRoot, 'packages'),
          resolve(workspaceRoot, 'contracts'),
          resolve(workspaceRoot, 'plugins'),
        ],
        routeManifest: {},
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `[name].mjs`,
          chunkFileNames: `[name].mjs`,
        },
      },
    },
  };
});
