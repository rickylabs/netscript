import { fresh } from '@fresh/plugin-vite';
import type { Plugin, UserConfig } from 'vite';

const workspaceConfig = JSON.parse(
  await Deno.readTextFile(new URL('../../../../../deno.json', import.meta.url)),
) as { readonly catalog: Readonly<Record<string, string>> };
const workspaceLock = JSON.parse(
  await Deno.readTextFile(new URL('../../../../../deno.lock', import.meta.url)),
) as { readonly specifiers: Readonly<Record<string, string>> };
function lockedSpecifier(name: string): string {
  const range = workspaceConfig.catalog[name];
  const version = (workspaceLock.specifiers[`npm:${name}@${range}`] ??
    workspaceLock.specifiers[`npm:${name}@${range.replace(/^\^(0\.)/, '~$1')}`])?.split('_')[0];
  if (!version) throw new Error(`Missing locked fixture dependency: ${name}`);
  return `npm:${name}@${version}`;
}
const packageImports: Plugin = {
  name: 'collection-fixture-package-imports',
  enforce: 'post',
  async resolveId(id, importer) {
    if (workspaceConfig.catalog[id]) {
      return await this.resolve(lockedSpecifier(id), importer, { skipSelf: true });
    }
    return null;
  },
  load(id) {
    if (id === 'catalog:') {
      return `export * from '${lockedSpecifier('zod')}';`;
    }
    return null;
  },
};
const config: UserConfig = {
  root: import.meta.dirname,
  plugins: [fresh({ islandSpecifiers: ['./app.tsx'] }), packageImports],
};
export default config;
