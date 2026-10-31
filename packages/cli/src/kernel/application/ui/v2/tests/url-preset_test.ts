import type { TokenEnginePort } from '../../../../ports/token-engine-port.ts';
import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import { FreshUiTokenEngine } from '../../../../adapters/tokens/fresh-ui-token-engine.ts';
import { applyUiPreset } from '../presets/apply-preset.ts';
import { readUiLock } from '../config-lock.ts';
import { buildAppTokens } from '../../../tokens/build-app-tokens.ts';
import { themeItem } from '../../../../../../../../tools/figma-plugin/src/theme-item.ts';
import { collections } from '../../../../../../../fresh-ui/src/tokens/assets/figma.generated.ts';
import { modifiedFixture } from '../../../../../../../../tools/figma-plugin/tests/mock-figma.ts';
import { encodeUiPreset } from '../../../../domain/ui/ui-preset.ts';

const URL = 'https://theme.test/studio-utility.json';
async function fixture() {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/deno.json', '{}');
  await fs.createDir('/app/routes');
  const tokenEngine = new FreshUiTokenEngine();
  let payload = JSON.stringify(themeItem(modifiedFixture(collections), 'studio-utility'));
  let calls = 0;
  const transport = {
    read: () => {
      calls++;
      return Promise.resolve(payload);
    },
  };
  return {
    fs,
    tokenEngine,
    transport,
    set: (value: unknown) => {
      payload = typeof value === 'string' ? value : JSON.stringify(value);
    },
    calls: () => calls,
  };
}

Deno.test('URL Figma theme installs persistent sources, docs and lock, and later token builds preserve values', async () => {
  const deps = await fixture();
  await deps.fs.writeFile('/app/components/ui/custom.tsx', '// app-owned');
  await applyUiPreset({ root: '/app', preset: URL }, deps);
  assertEquals(deps.calls(), 1);
  const config = JSON.parse(await deps.fs.readFile('/app/tokens.config.json'));
  assertEquals(config.sourceRoot, 'tokens/source');
  assertEquals(config.preset, 'studio-utility');
  assert(await deps.fs.exists('/app/tokens/source/tokens.resolver.json'));
  assert(await deps.fs.exists('/app/.agents/skills/fresh-ui-theme-studio-utility/DESIGN.md'));
  const lock = (await readUiLock('/app', deps.fs))!;
  assert(lock.items[URL].files.some((file) => file.target === 'tokens.config.json'));
  assert(
    lock.items[URL].files.some((file) => file.target === 'tokens/source/primitives.tokens.json'),
  );
  const css = await deps.fs.readFile('/app/assets/tokens.css');
  assertStringIncludes(css, '#223344');
  await buildAppTokens({ root: '/app' }, deps);
  assertEquals(await deps.fs.readFile('/app/assets/tokens.css'), css);
  assertEquals(await deps.fs.readFile('/app/components/ui/custom.tsx'), '// app-owned');
  // A second URL replaces managed sources rather than treating them as a custom sourceRoot.
  deps.set(themeItem(collections, 'studio-utility'));
  await applyUiPreset({ root: '/app', preset: 'https://theme.test/second.json' }, deps);
  const next = (await readUiLock('/app', deps.fs))!;
  assert(
    next.items['https://theme.test/second.json'].files.some((file) =>
      file.target === 'tokens/source/primitives.tokens.json'
    ),
  );
  assertEquals(next.items[URL], undefined);
});

Deno.test('bad URL, JSON, schema, item type and name failures leave every file unchanged', async () => {
  const deps = await fixture();
  const before = deps.fs.getFiles();
  for (
    const preset of [
      'https://',
      'file:///theme.json',
      'https://user:secret@theme.test/item',
      'https://theme.test/?preset=',
    ]
  ) {
    await assertRejects(() => applyUiPreset({ root: '/app', preset }, deps));
    assertEquals(deps.fs.getFiles(), before);
  }
  for (
    const payload of ['not-json', {}, { name: 'not-a-theme', type: 'registry:component' }, {
      version: 1,
      theme: 'https://untrusted.test/nested.json',
    }]
  ) {
    deps.set(payload);
    await assertRejects(() => applyUiPreset({ root: '/app', preset: URL }, deps));
    assertEquals(deps.fs.getFiles(), before);
  }
  const item = themeItem(collections, 'studio-utility');
  const bundle = item.meta!.netscript as {
    version: number;
    preset: string;
    figma: { collections: unknown[] };
  };
  deps.set({
    ...item,
    meta: { netscript: { ...bundle, figma: { ...bundle.figma, collections: [] } } },
  });
  await assertRejects(() => applyUiPreset({ root: '/app', preset: URL }, deps));
  assertEquals(deps.fs.getFiles(), before);
  const unavailable = { ...deps, transport: { read: () => Promise.reject(new Error('offline')) } };
  await assertRejects(
    () => applyUiPreset({ root: '/app', preset: URL }, unavailable),
    Error,
    'Could not fetch UI preset URL',
  );
  assertEquals(deps.fs.getFiles(), before);
});

Deno.test('custom roots and edited installed sources are protected; semantic overrides are retained', async () => {
  const deps = await fixture();
  await deps.fs.writeFile(
    '/app/tokens.config.json',
    JSON.stringify({ version: 1, preset: 'studio-utility', sourceRoot: 'my-tokens' }),
  );
  const before = deps.fs.getFiles();
  await assertRejects(
    () => applyUiPreset({ root: '/app', preset: URL }, deps),
    Error,
    'custom token sourceRoot',
  );
  assertEquals(deps.fs.getFiles(), before);
  await deps.fs.writeFile(
    '/app/tokens.config.json',
    JSON.stringify({ version: 1, preset: 'studio-utility', override: 'tokens/custom.json' }),
  );
  await deps.fs.writeFile('/app/tokens/custom.json', '{}');
  await applyUiPreset({ root: '/app', preset: URL }, deps);
  assertEquals(
    JSON.parse(await deps.fs.readFile('/app/tokens.config.json')).override,
    'tokens/custom.json',
  );
  await deps.fs.writeFile('/app/tokens/source/primitives.tokens.json', '// local edit');
  const edited = deps.fs.getFiles();
  await assertRejects(() =>
    applyUiPreset({ root: '/app', preset: 'https://theme.test/other.json' }, deps)
  );
  assertEquals(deps.fs.getFiles(), edited);
});

Deno.test('generic published-schema themes and preset JSON URLs use S2, while share links remain local', async () => {
  const deps = await fixture();
  deps.set({
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: 'simple-theme',
    type: 'registry:theme',
    cssVars: { light: { '--ns-bg': '#123456' } },
  });
  await applyUiPreset({ root: '/app', preset: URL }, deps);
  assert((await readUiLock('/app', deps.fs))!.items[URL]);
  assertStringIncludes([...deps.fs.getFiles().values()].join('\n'), '#123456');
  deps.set({ version: 1, theme: 'studio-utility' });
  await applyUiPreset({ root: '/app', preset: 'https://theme.test/preset.json' }, deps);
  assertEquals(
    JSON.parse(await deps.fs.readFile('/app/assets/theme-preset.json')).id,
    'studio-utility',
  );
  const calls = deps.calls();
  await applyUiPreset({
    root: '/app',
    preset: `https://theme.test/create/?preset=${
      encodeUiPreset({ version: 1, theme: 'studio-utility' })
    }`,
  }, deps);
  assertEquals(deps.calls(), calls);
});

Deno.test('an emptied previous theme remains locked while an installed item depends on it', async () => {
  const deps = await fixture();
  const tokenEngine: TokenEnginePort = {
    defaults: () =>
      Promise.resolve({ preset: 'studio-utility', presets: ['studio-utility'], sources: {} }),
    outputFiles: () => Promise.resolve(['tokens.css']),
    figmaSources: () =>
      Promise.resolve({ 'tokens.resolver.json': '{}', 'primitives.tokens.json': '{}' }),
    build: () => Promise.resolve({ preset: 'studio-utility', files: { 'tokens.css': ':root {}' } }),
  };
  const fast = { ...deps, tokenEngine };
  await applyUiPreset({ root: '/app', preset: URL }, fast);
  const previous = (await readUiLock('/app', deps.fs))!;
  previous.items.dependent = {
    ...previous.items[URL],
    source: 'builtin:dependent',
    type: 'registry:component',
    files: [],
    registryDependencies: [URL],
  };
  await deps.fs.writeFile('/app/fresh-ui.lock.json', JSON.stringify(previous, null, 2) + '\n');
  await applyUiPreset(
    { root: '/app', preset: 'https://theme.test/dependent-replacement.json' },
    fast,
  );
  const current = (await readUiLock('/app', deps.fs))!;
  assert(current.items[URL]);
  assertEquals(current.items[URL].files, []);
  assertEquals(current.items.dependent.registryDependencies, [URL]);
});
