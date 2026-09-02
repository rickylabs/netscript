import { fresh } from '@fresh/plugin-vite';
import { resolve } from 'node:path';
import type { Plugin, UserConfig } from 'vite';

const workspaceConfig = JSON.parse(
  await Deno.readTextFile(new URL('../../../../../deno.json', import.meta.url)),
) as { readonly catalog: Readonly<Record<string, string>> };
const catalogSpecifier = (name: string): string => {
  const version = workspaceConfig.catalog[name];
  if (!version) throw new Error(`Missing workspace catalog entry: ${name}`);
  return `npm:${name}@${version}`;
};

const catalogImports: Plugin = {
  name: 'defer-navigation-fixture-catalog-imports',
  enforce: 'post',
  load(id) {
    if (id === 'catalog:') {
      return `export * from '${catalogSpecifier('zod')}';`;
    }
    return null;
  },
};

const config: UserConfig = {
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@opentelemetry/api': resolve(
        import.meta.dirname!,
        '../defer-island-client/otel-api.ts',
      ),
    },
  },
  plugins: [
    fresh({ islandSpecifiers: ['@netscript/fresh/defer/island'] }),
    catalogImports,
  ],
};

export default config;
