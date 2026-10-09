import { fresh } from '@fresh/plugin-vite';
import type { Plugin, UserConfig } from 'vite';

const fixtureImporter = new URL('./app.tsx', import.meta.url).pathname;

// fresh-ui source imports `@preact/signals` through the workspace catalog; resolve it from this
// package's import map so the island bundles the same locked copy Fresh hydrates with.
const freshUiImports: Plugin = {
  name: 'fresh-ui-modal-fixture-imports',
  enforce: 'post',
  async resolveId(id, importer) {
    if (id === '@preact/signals' && importer !== fixtureImporter) {
      return await this.resolve(id, fixtureImporter, { skipSelf: true });
    }
    return null;
  },
};

const config: UserConfig = {
  root: import.meta.dirname,
  plugins: [fresh({ islandSpecifiers: ['./app.tsx'] }), freshUiImports],
};

export default config;
