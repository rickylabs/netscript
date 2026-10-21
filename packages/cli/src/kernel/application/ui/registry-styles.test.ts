import { assert, assertEquals } from '@std/assert';
import { resolve } from '@std/path';

import { APP_CUSTOM_STYLES_MARKER, writeStylesAggregator } from './registry-styles.ts';
import type { UiRegistryItem, UiRegistryManifest } from './registry.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';

const THEME_STYLES = [
  "@import 'tailwindcss';",
  "@import './tokens.css';",
  '',
  '@layer base {\n  html { color-scheme: dark; }\n}',
  '',
].join('\n');

const themeItem: UiRegistryItem = {
  name: 'ns-one',
  kind: 'theme',
  files: [
    { source: 'registry/theme/styles.css', target: '@assets/styles.css' },
    { source: 'registry/theme/tokens.css', target: '@assets/tokens.css' },
  ],
};

function component(name: string): UiRegistryItem {
  return {
    name,
    kind: 'component',
    files: [{ source: `registry/components/ui/${name}.tsx`, target: `@ui/${name}.tsx` }],
    css: [{ layer: 'components', content: `@import './ui/${name}.css';` }],
  };
}

const manifest: UiRegistryManifest = {
  items: [themeItem, component('button'), component('avatar'), component('message')],
  collections: [
    { name: 'foundation', items: ['ns-one', 'button', 'avatar'] },
    { name: 'ai', items: ['ns-one', 'avatar', 'message'] },
  ],
};

/** Stateful in-memory filesystem so the aggregator reads observe prior writes. */
function statefulFs(disk: Map<string, string>): FileSystemPort {
  const key = (path: string) => path.replaceAll('\\', '/');
  // The aggregator reads the theme's styles.css from the registry root via
  // resolve(registryRoot, source); seed under the same resolved path so the
  // in-memory lookup matches on every platform.
  disk.set(key(resolve('/registry', 'registry/theme/styles.css')), THEME_STYLES);
  return {
    readFile(path: string): Promise<string> {
      const value = disk.get(key(path));
      if (value === undefined) {
        return Promise.reject(new Error(`Unexpected read: ${path}`));
      }
      return Promise.resolve(value);
    },
    writeFile(path: string, content: string): Promise<void> {
      disk.set(key(path), content);
      return Promise.resolve();
    },
    exists(path: string): Promise<boolean> {
      return Promise.resolve(disk.has(key(path)));
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
}

function readStyles(disk: Map<string, string>): string {
  const target = resolve('/app', 'assets', 'styles.css').replaceAll('\\', '/');
  return disk.get(target) ?? '';
}

function perItemImports(styles: string): string[] {
  return styles.replace(/\r\n/g, '\n').split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@import './ui/"));
}

function collectionItems(name: string): readonly UiRegistryItem[] {
  const byName = new Map(manifest.items.map((item) => [item.name, item]));
  const collection = manifest.collections.find((entry) => entry.name === name);
  if (!collection) throw new Error(`unknown collection ${name}`);
  return collection.items.map((itemName) => {
    const item = byName.get(itemName);
    if (!item) throw new Error(`unknown item ${itemName}`);
    return item;
  });
}

Deno.test("writeStylesAggregator registers a collection install's per-item CSS imports", async () => {
  const disk = new Map<string, string>();
  const fs = statefulFs(disk);

  await writeStylesAggregator({
    registryRoot: '/registry',
    projectRoot: '/app',
    manifest,
    items: collectionItems('ai'),
    fs,
  });

  const imports = perItemImports(readStyles(disk));
  for (const expected of ['avatar', 'message']) {
    if (!imports.includes(`@import './ui/${expected}.css';`)) {
      throw new Error(
        `Collection install must register @import './ui/${expected}.css'; got: ${
          imports.join(', ')
        }`,
      );
    }
  }
});

Deno.test('writeStylesAggregator appends a collection install onto an existing aggregator', async () => {
  const disk = new Map<string, string>();
  const fs = statefulFs(disk);

  // First install seeds the aggregator (mirrors ui:init writing the foundation).
  await writeStylesAggregator({
    registryRoot: '/registry',
    projectRoot: '/app',
    manifest,
    items: collectionItems('foundation'),
    fs,
  });
  const afterFoundation = perItemImports(readStyles(disk));
  if (!afterFoundation.includes("@import './ui/button.css';")) {
    throw new Error(
      `Expected the foundation install to register button.css, got: ${afterFoundation.join(', ')}`,
    );
  }

  // A later collection install must append, not regenerate from the theme base.
  await writeStylesAggregator({
    registryRoot: '/registry',
    projectRoot: '/app',
    manifest,
    items: collectionItems('ai'),
    fs,
  });
  const afterAi = perItemImports(readStyles(disk));

  if (!afterAi.includes("@import './ui/button.css';")) {
    throw new Error(
      `Collection install dropped the foundation's button.css import: ${afterAi.join(', ')}`,
    );
  }
  if (!afterAi.includes("@import './ui/message.css';")) {
    throw new Error(`Collection install failed to append message.css: ${afterAi.join(', ')}`);
  }
  // Items shared between both installs (avatar) must not be duplicated.
  const avatarCount = afterAi.filter((line) => line === "@import './ui/avatar.css';").length;
  if (avatarCount !== 1) {
    throw new Error(
      `Expected a single avatar.css import, found ${avatarCount}: ${afterAi.join(', ')}`,
    );
  }
});

Deno.test('writeStylesAggregator keeps the app-owned styles below the custom marker across installs', async () => {
  const disk = new Map<string, string>();
  const fs = statefulFs(disk);
  const install = (collection: string) =>
    writeStylesAggregator({
      registryRoot: '/registry',
      projectRoot: '/app',
      manifest,
      items: collectionItems(collection),
      fs,
    });

  await install('foundation');
  const target = resolve('/app', 'assets', 'styles.css').replaceAll('\\', '/');
  const brand = [
    "@import './brand.css';",
    '',
    ':root {\n  --ns-primary: oklch(62% 0.19 255);\n}',
    "[data-theme='dark'] {\n  --ns-primary: oklch(72% 0.16 255);\n}",
    '',
  ].join('\n');
  disk.set(
    target,
    readStyles(disk).replace(
      `${APP_CUSTOM_STYLES_MARKER}\n`,
      `${APP_CUSTOM_STYLES_MARKER}\n${brand}`,
    ),
  );

  // Regression (#2406): every `ui:add <item>` rebuilt the aggregator from the theme base and
  // silently deleted app-wide theme overrides written below the marker.
  await install('ai');
  await install('ai');
  const styles = readStyles(disk);
  assertEquals(
    styles.slice(styles.indexOf(APP_CUSTOM_STYLES_MARKER)),
    `${APP_CUSTOM_STYLES_MARKER}\n${brand}`,
  );
  // The tail's own @import is the app's, so it is not hoisted into the managed import block.
  assertEquals(styles.split("@import './brand.css';").length - 1, 1);
  assert(perItemImports(styles).includes("@import './ui/message.css';"));
});

Deno.test('writeStylesAggregator ends a fresh aggregator with an empty custom section', async () => {
  const disk = new Map<string, string>();
  await writeStylesAggregator({
    registryRoot: '/registry',
    projectRoot: '/app',
    manifest,
    items: collectionItems('foundation'),
    fs: statefulFs(disk),
  });
  assert(readStyles(disk).endsWith(`\n\n${APP_CUSTOM_STYLES_MARKER}\n`));
});
