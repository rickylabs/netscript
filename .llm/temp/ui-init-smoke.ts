// One-off smoke: run the ui:init install path into a scratch dir and report results.
import { DenoFileSystem } from '../../packages/cli/src/kernel/adapters/runtime/file-system/deno-file-system.ts';
import {
  DEFAULT_UI_INIT_ITEMS,
  installUiRegistryItems,
} from '../../packages/cli/src/public/features/ui/registry.ts';

const projectRoot = Deno.args[0];
if (!projectRoot) {
  console.error('usage: ui-init-smoke.ts <projectRoot> [theme]');
  Deno.exit(2);
}

const result = await installUiRegistryItems({
  projectRoot,
  names: DEFAULT_UI_INIT_ITEMS,
  overwrite: true,
  theme: Deno.args[1],
}, { fs: new DenoFileSystem() });

console.log(`items=${result.installedItems.length}`);
console.log(`files=${result.copiedFiles.length}`);
console.log(`styles=${result.stylesPath}`);
console.log(`installed=${result.installedItems.join(',')}`);
