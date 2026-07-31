import { assertEquals } from '@std/assert';

import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { importEntryForDependency, mergeDenoJsonImports } from './registry-deno-json.ts';
import type { UiRegistryItem } from './registry.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../constants/jsr-specifiers.ts';

const PRIOR_RELEASE_VERSION = ['0', '0', '1-beta', '9'].join('.');
const TEST_PRERELEASE_VERSION = ['0', '0', '1-alpha', '1'].join('.');
const sdkSpecifier = `jsr:@netscript/sdk@${NETSCRIPT_RELEASE_VERSION}`;

function item(name: string, dependencies: readonly string[]): UiRegistryItem {
  return { name, files: [], dependencies };
}

async function mergedImports(
  items: readonly UiRegistryItem[],
): Promise<Record<string, string>> {
  const fs = new MemoryFileSystemAdapter();
  await mergeDenoJsonImports('/app', items, fs);
  const config = JSON.parse(await fs.readFile('/app/deno.json')) as {
    imports: Record<string, string>;
  };
  return config.imports;
}

Deno.test('a subpath dependency maps the package root so the subpath import resolves', async () => {
  const imports = await mergedImports([
    item('desktop-only', [`${sdkSpecifier}/desktop`]),
  ]);

  // Mapping the alias to a value that already carries `/desktop` makes Deno resolve
  // `@netscript/sdk/desktop` to `./desktop/desktop` — the #953 failure.
  assertEquals(imports['@netscript/sdk'], sdkSpecifier);
});

Deno.test('two subpaths of one package collapse to a single package-root entry', async () => {
  const imports = await mergedImports([
    item('desktop-only', [`${sdkSpecifier}/desktop`]),
    item('desktop-update-prompt', [`${sdkSpecifier}/auto-update`]),
  ]);

  assertEquals(imports['@netscript/sdk'], sdkSpecifier);
  assertEquals(
    Object.keys(imports).filter((key) => key.startsWith('@netscript/')),
    ['@netscript/sdk'],
  );
});

Deno.test('dependencies without a subpath keep their specifier verbatim', async () => {
  const imports = await mergedImports([
    item('cn', ['npm:clsx@^2.1.1', 'npm:tailwind-merge@^3.5.0']),
  ]);

  assertEquals(imports.clsx, 'npm:clsx@^2.1.1');
  assertEquals(imports['tailwind-merge'], 'npm:tailwind-merge@^3.5.0');
});

Deno.test('existing workspace imports are never overwritten', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/app/deno.json',
    JSON.stringify({ imports: { '@netscript/sdk': `jsr:@netscript/sdk@${PRIOR_RELEASE_VERSION}` } }),
  );
  await mergeDenoJsonImports(
    '/app',
    [item('desktop-only', [`${sdkSpecifier}/desktop`])],
    fs,
  );
  const config = JSON.parse(await fs.readFile('/app/deno.json')) as {
    imports: Record<string, string>;
  };

  assertEquals(config.imports['@netscript/sdk'], `jsr:@netscript/sdk@${PRIOR_RELEASE_VERSION}`);
});

Deno.test('importEntryForDependency normalises every specifier shape', () => {
  const cases: readonly (readonly [string, { key: string; value: string } | undefined])[] = [
    [
      `${sdkSpecifier}/desktop`,
      { key: '@netscript/sdk', value: sdkSpecifier },
    ],
    [
      `jsr:@netscript/telemetry@${NETSCRIPT_RELEASE_VERSION}/query`,
      {
        key: '@netscript/telemetry',
        value: `jsr:@netscript/telemetry@${NETSCRIPT_RELEASE_VERSION}`,
      },
    ],
    [
      `jsr:@netscript/ai@^${TEST_PRERELEASE_VERSION}`,
      { key: '@netscript/ai', value: `jsr:@netscript/ai@^${TEST_PRERELEASE_VERSION}` },
    ],
    // A version-less subpath still has to lose the subpath, or the alias doubles it.
    ['jsr:@netscript/sdk/desktop', { key: '@netscript/sdk', value: 'jsr:@netscript/sdk' }],
    ['npm:preact@^10.29.2', { key: 'preact', value: 'npm:preact@^10.29.2' }],
    [
      'npm:@preact/signals@^2.0.1/runtime',
      { key: '@preact/signals', value: 'npm:@preact/signals@^2.0.1' },
    ],
    ['npm:tailwind-merge@^3.5.0', { key: 'tailwind-merge', value: 'npm:tailwind-merge@^3.5.0' }],
    ['npm:lodash@^4.17.21/fp', { key: 'lodash', value: 'npm:lodash@^4.17.21' }],
    ['./local/thing.ts', undefined],
    ['jsr:@netscript', undefined],
  ];

  for (const [specifier, expected] of cases) {
    assertEquals(importEntryForDependency(specifier), expected, specifier);
  }
});
