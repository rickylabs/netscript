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

function resolveCatalogImport(id: string): string | null {
  const parts = id.split('/');
  const pkg = id.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  if (!pkg || !workspaceConfig.catalog[pkg]) return null;
  return `${catalogSpecifier(pkg)}${id.slice(pkg.length)}`;
}

const packageImports: Plugin = {
  name: 'query-hydration-age-fixture-package-imports',
  enforce: 'post',
  async resolveId(id, importer) {
    if (id === '@opentelemetry/api') {
      return '\0query-hydration-age-fixture-opentelemetry';
    }
    const specifier = resolveCatalogImport(id);
    if (specifier) {
      return await this.resolve(specifier, importer, { skipSelf: true });
    }
    return null;
  },
  load(id) {
    if (id === 'catalog:') {
      return `export * from '${catalogSpecifier('zod')}';`;
    }
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
