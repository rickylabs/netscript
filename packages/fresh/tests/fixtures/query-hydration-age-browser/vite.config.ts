import { fresh } from '@fresh/plugin-vite';
import type { Plugin, UserConfig } from 'vite';

const workspaceConfig = JSON.parse(
  await Deno.readTextFile(new URL('../../../../../deno.json', import.meta.url)),
) as { readonly catalog: Readonly<Record<string, string>> };
const catalogSpecifier = (name: string): string => {
  const version = workspaceConfig.catalog[name];
  if (!version) throw new Error(`Missing workspace catalog entry: ${name}`);
  return `npm:${name}@${version}`;
};

const packageImports: Plugin = {
  name: 'query-hydration-age-fixture-package-imports',
  enforce: 'post',
  resolveId(id) {
    if (id === '@opentelemetry/api') {
      return '\0query-hydration-age-fixture-opentelemetry';
    }
    return null;
  },
  load(id) {
    if (id === '\0query-hydration-age-fixture-opentelemetry') {
      return `export * from '${catalogSpecifier('@opentelemetry/api')}';`;
    }
    return null;
  },
};

const config: UserConfig = {
  root: import.meta.dirname,
  plugins: [fresh({ islandSpecifiers: ['./app.tsx'] }), packageImports],
};

export default config;
