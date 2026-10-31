import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, resolve } from '@std/path';
import type { Registry } from '@netscript/fresh-ui/registry-v2';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import { UiConfigSchema } from '../../../../domain/ui/ui-config.ts';
import { installUiRegistry } from '../install-registry.ts';
import { removeUiRegistry } from '../registry-lifecycle.ts';
import type { UiRegistryDependencies } from '../registry-client.ts';

Deno.test('installer rejects target collisions and traversal before writing any metadata or copy', async () => {
  for (const traversal of [false, true]) {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile('/app/deno.json', '{}');
    const registry: Registry = {
      items: [
        {
          name: 'x',
          type: 'registry:ui',
          registryDependencies: ['other'],
          files: [{
            path: 'x.ts',
            type: 'registry:ui',
            target: traversal ? '../escape.ts' : '@ui/shared.ts',
            content: 'x',
          }],
        },
        {
          name: 'other',
          type: 'registry:ui',
          files: [{
            path: 'other.ts',
            type: 'registry:ui',
            target: '@ui/shared.ts',
            content: 'other',
          }],
        },
      ],
    };
    const before = new Map(fs.getFiles());
    await assertRejects(() =>
      installUiRegistry({ root: '/app', names: ['x'] }, {
        fs,
        builtin: () => Promise.resolve({ registry, content: {} }),
      })
    );
    assertEquals(fs.getFiles(), before);
  }
});

Deno.test('install copy rewriting follows configured aliases, dynamic imports and safe explicit force', async () => {
  const fs = new MemoryFileSystemAdapter();
  const registry: Registry = {
    items: [
      {
        name: 'x',
        type: 'registry:ui',
        registryDependencies: ['helper'],
        files: [{
          path: 'ui/x.ts',
          type: 'registry:ui',
          target: '@ui/x.ts',
          content:
            "import { helper } from '@/lib/helper';\nexport const load = () => import('../lib/helper');\n",
        }],
      },
      {
        name: 'helper',
        type: 'registry:lib',
        files: [{
          path: 'lib/helper.ts',
          type: 'registry:lib',
          target: '@lib/helper.ts',
          content: 'export const helper = 1;\n',
        }],
      },
    ],
  };
  const deps: UiRegistryDependencies = {
    fs,
    builtin: () => Promise.resolve({ registry, content: {} }),
  };
  const config = UiConfigSchema.parse({ aliases: { ui: 'widgets', lib: 'runtime' } });
  await installUiRegistry({ root: '/app', names: ['x'], config }, deps);
  assertStringIncludes(await fs.readFile('/app/widgets/x.ts'), "import('../runtime/helper.ts')");
  assertStringIncludes(await fs.readFile('/app/widgets/x.ts'), "from '../runtime/helper.ts'");
  await fs.writeFile('/app/widgets/x.ts', '// local edit');
  const skipped = await installUiRegistry({ root: '/app', names: ['x'] }, deps);
  assertEquals(skipped.drifted, ['widgets/x.ts']);
  assertEquals(await fs.readFile('/app/widgets/x.ts'), '// local edit');
  await installUiRegistry({ root: '/app', names: ['x'], force: true }, deps);
  assertStringIncludes(await fs.readFile('/app/widgets/x.ts'), 'export const load');
  await fs.writeFile('/app/runtime/helper.ts', '// local helper edit');
  await assertRejects(() => removeUiRegistry('/app', 'helper', deps), Error, 'still required');
});

Deno.test('builtin installs retain compiled dark mode without redundant registry CSS', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/deno.json', '{}');
  const result = await installUiRegistry({ root: '/app', names: ['button'] }, { fs });
  assertEquals(result.copies.filter((copy) => copy.source.startsWith('registry-css:')), []);
  assertEquals([...fs.getFiles().keys()].filter((path) => path.includes('/registry/')), []);
  const styles = await fs.readFile('/app/assets/styles.css');
  assertEquals(styles.includes("@import './registry/"), false);
  assertStringIncludes(await fs.readFile('/app/assets/tokens.css'), "[data-theme='dark']");
});

for (const ui of ['client/widgets', 'components/ui']) {
  Deno.test(`copy imports prefer the most specific alias with ui=${ui}`, async () => {
    const fs = new MemoryFileSystemAdapter();
    const config = UiConfigSchema.parse({
      aliases: ui === 'components/ui' ? {} : { components: 'client/components', ui },
    });
    const registry: Registry = {
      items: [{
        name: 'consumer',
        type: 'registry:component',
        registryDependencies: ['x', 'shell'],
        files: [{
          path: 'consumer.ts',
          type: 'registry:component',
          target: '@components/consumer.ts',
          content: [
            "import { x } from '@/components/ui/x';",
            "export { x } from '@/components/ui/x.ts';",
            "export const load = () => import('@/components/ui/x');",
            "export { shell } from '@/components/shell';",
            "export { x as short } from '@ui/x';",
            "export { other } from '@/components/uikit/other';",
            '',
          ].join('\n'),
        }],
      }, {
        name: 'x',
        type: 'registry:ui',
        files: [{
          path: 'x.ts',
          type: 'registry:ui',
          target: '@ui/x.ts',
          content: 'export const x = 1;\n',
        }],
      }, {
        name: 'shell',
        type: 'registry:component',
        files: [{
          path: 'shell.ts',
          type: 'registry:component',
          target: '@components/shell.ts',
          content: 'export const shell = 1;\n',
        }],
      }],
    };
    await installUiRegistry({ root: '/app', names: ['consumer'], config }, {
      fs,
      builtin: () => Promise.resolve({ registry, content: {} }),
    });
    const consumer = resolve('/app', config.aliases.components, 'consumer.ts');
    const content = await fs.readFile(consumer);
    const specifiers = [...content.matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g)]
      .map((match) => resolve(dirname(consumer), match[1]));
    assertEquals(specifiers.slice(0, 3), Array(3).fill(resolve('/app', ui, 'x.ts')));
    assertEquals(specifiers[3], resolve('/app', config.aliases.components, 'shell.ts'));
    assertEquals(specifiers[4], resolve('/app', ui, 'x.ts'));
    assertEquals(specifiers[5], resolve('/app', config.aliases.components, 'uikit/other'));
    for (const path of specifiers.slice(0, 5)) assertEquals(await fs.exists(path), true, path);
  });
}
