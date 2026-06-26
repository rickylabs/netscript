import {
  DEFAULT_UI_INIT_ITEMS,
  installUiRegistryItems,
  registryManifestModuleUrl,
  resolveRegistryItems,
  type UiRegistryManifest,
} from './registry.ts';
import type { FileSystemPort } from '../../../kernel/ports/file-system-port.ts';

const manifest: UiRegistryManifest = {
  items: [
    {
      name: 'ns-one',
      kind: 'theme',
      files: [
        { source: 'registry/theme/styles.css', target: '@assets/styles.css' },
        { source: 'registry/theme/tokens.css', target: '@assets/tokens.css' },
      ],
    },
    {
      name: 'midnight',
      kind: 'theme',
      files: [
        { source: 'registry/themes/midnight/styles.css', target: '@assets/styles.css' },
        { source: 'registry/themes/midnight/tokens.css', target: '@assets/tokens.css' },
      ],
    },
    {
      name: 'button',
      kind: 'component',
      files: [{ source: 'registry/components/ui/button.tsx', target: '@ui/button.tsx' }],
      registryDependencies: ['ns-one'],
    },
  ],
  collections: [{ name: 'starter', items: ['button'] }],
};

function names(items: readonly { name: string }[]): string {
  return items.map((item) => item.name).join(',');
}

Deno.test('resolveRegistryItems installs the official theme by default', () => {
  const items = resolveRegistryItems(manifest, ['button']);
  if (names(items) !== 'ns-one,button') {
    throw new Error(`Expected default theme before button, got: ${names(items)}`);
  }
});

Deno.test('resolveRegistryItems substitutes a theme override for theme dependencies', () => {
  const items = resolveRegistryItems(manifest, ['button'], 'midnight');
  if (names(items) !== 'midnight,button') {
    throw new Error(`Expected the override theme to replace ns-one, got: ${names(items)}`);
  }
});

Deno.test('resolveRegistryItems applies theme overrides through collections', () => {
  const items = resolveRegistryItems(manifest, ['starter'], 'midnight');
  if (names(items) !== 'midnight,button') {
    throw new Error(`Expected the override theme through the collection, got: ${names(items)}`);
  }
});

Deno.test('resolveRegistryItems rejects a theme override that is not a theme item', () => {
  let message = '';
  try {
    resolveRegistryItems(manifest, ['button'], 'button');
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  if (!message.includes('is not a theme')) {
    throw new Error(`Expected a not-a-theme error, got: ${message || 'no error'}`);
  }
});

Deno.test('resolveRegistryItems rejects an unknown theme override', () => {
  let message = '';
  try {
    resolveRegistryItems(manifest, ['button'], 'solarized');
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  if (!message.includes('Unknown Fresh UI theme')) {
    throw new Error(`Expected an unknown-theme error, got: ${message || 'no error'}`);
  }
});

Deno.test('registryManifestModuleUrl resolves manifest outside the copy payload', () => {
  const url = registryManifestModuleUrl('/workspace/packages/fresh-ui');
  if (!url.endsWith('/workspace/packages/fresh-ui/registry.manifest.ts')) {
    throw new Error(`Expected root registry.manifest.ts URL, got: ${url}`);
  }
  if (url.includes('/registry/manifest.ts')) {
    throw new Error(`Manifest URL must not point inside the copy payload: ${url}`);
  }
});

Deno.test('DEFAULT_UI_INIT_ITEMS installs the scaffold foundation and floating styles', () => {
  if (DEFAULT_UI_INIT_ITEMS.join(',') !== 'foundation,floating-styles,control-props') {
    throw new Error(`Unexpected ui:init defaults: ${DEFAULT_UI_INIT_ITEMS.join(',')}`);
  }
});

Deno.test('installUiRegistryItems uses embedded content by default', async () => {
  const writes = new Map<string, string>();
  const fs: FileSystemPort = {
    readFile(path: string): Promise<string> {
      throw new Error(`Unexpected registry filesystem read: ${path}`);
    },
    writeFile(path: string, content: string): Promise<void> {
      writes.set(path.replaceAll('\\', '/'), content);
      return Promise.resolve();
    },
    exists(): Promise<boolean> {
      return Promise.resolve(false);
    },
    stat(): Promise<never> {
      return Promise.reject(new Error('stat not used'));
    },
    createDir(): Promise<void> {
      return Promise.resolve();
    },
    readDir(): Promise<never> {
      return Promise.reject(new Error('readDir not used'));
    },
    remove(): Promise<void> {
      return Promise.resolve();
    },
    copy(): Promise<void> {
      return Promise.resolve();
    },
    async *walk(): AsyncIterable<never> {
    },
  };

  const result = await installUiRegistryItems({
    projectRoot: '/workspace/app',
    names: ['cn'],
    overwrite: true,
  }, { fs });

  const cnPath = '/workspace/app/lib/cn.ts';
  const stylesPath = '/workspace/app/assets/styles.css';
  if (!writes.get(cnPath)?.includes('export const cn')) {
    throw new Error(`Expected embedded cn.ts content at ${cnPath}`);
  }
  if (!writes.get(stylesPath)?.includes('App-specific custom styles below.')) {
    throw new Error(`Expected embedded styles aggregator at ${stylesPath}`);
  }
  if (!result.copiedFiles.map((path) => path.replaceAll('\\', '/')).includes(cnPath)) {
    throw new Error(`Expected copiedFiles to include ${cnPath}`);
  }
});
