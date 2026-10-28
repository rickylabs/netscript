import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import type { Registry } from '@netscript/fresh-ui/registry-v2';
import { MemoryFileSystemAdapter } from '../../../../adapters/scaffold/memory-fs.ts';
import type { TokenEnginePort } from '../../../../ports/token-engine-port.ts';
import { encodeUiPreset } from '../../../../domain/ui/ui-preset.ts';
import { installUiRegistry, UiRegistryConflictError } from '../install-registry.ts';
import { applyUiPreset } from '../apply-preset.ts';
import { buildAppTokens } from '../../../tokens/build-app-tokens.ts';
import { readUiConfig, readUiLock } from '../config-lock.ts';

Deno.test('Utility selection preserves real component copies and fixture style regenerates stable logical targets', async () => {
  const { freshUiRegistryJson, FRESH_UI_REGISTRY_CONTENT } = await import(
    '@netscript/fresh-ui/registry'
  );
  const fs = new MemoryFileSystemAdapter();
  const utility = freshUiRegistryJson.items.find((item) => item.name === 'style-utility')!;
  const registry: Registry = {
    ...freshUiRegistryJson,
    items: [...freshUiRegistryJson.items, {
      name: 'fixture-style',
      type: 'registry:style',
      meta: {
        components: {
          ...(utility.meta?.components as Record<string, string>),
          button: 'fixture-button',
        },
      },
    }, {
      name: 'fixture-button',
      type: 'registry:component',
      registryDependencies: ['public-types'],
      files: [
        {
          path: 'fixture/button.tsx',
          type: 'registry:component',
          target: '@ui/button.tsx',
          content: 'export const Button = () => "fixture";\n',
        },
        {
          path: 'fixture/button.css',
          type: 'registry:file',
          target: '@assets/ui/button.css',
          content: '.fixture-button {}\n',
        },
      ],
    }],
  };
  const deps = {
    fs,
    builtin: () => Promise.resolve({ registry, content: FRESH_UI_REGISTRY_CONTENT }),
  };
  await installUiRegistry({ root: '/app', names: ['button'] }, deps);
  const original = await fs.readFile('/app/components/ui/button.tsx');
  await installUiRegistry({ root: '/app', names: ['style-utility'] }, deps);
  assertEquals(await fs.readFile('/app/components/ui/button.tsx'), original);
  await fs.writeFile('/app/components/ui/button.tsx', original + '// edited\n');
  const before = new Map(fs.getFiles());
  const error = await assertRejects(
    () => installUiRegistry({ root: '/app', names: ['fixture-style'], force: true }, deps),
    UiRegistryConflictError,
  );
  assertStringIncludes(error.message, 'components/ui/button.tsx');
  assertStringIncludes(error.message, '+// edited');
  assertEquals(fs.getFiles(), before);
  await fs.writeFile('/app/components/ui/button.tsx', original);
  await installUiRegistry({ root: '/app', names: ['fixture-style'] }, deps);
  assertStringIncludes(await fs.readFile('/app/components/ui/button.tsx'), 'fixture');
  assertEquals((await readUiConfig('/app', fs)).style, 'fixture-style');
  const lock = (await readUiLock('/app', fs))!;
  assertEquals(lock.items.button.source, 'builtin:fixture-button');
  assertEquals(lock.items['fixture-button'], undefined);
  await installUiRegistry({ root: '/app', names: ['button'] }, deps);
  assertStringIncludes(await fs.readFile('/app/components/ui/button.tsx'), 'fixture');
  await installUiRegistry({ root: '/app', names: ['style-utility'] }, deps);
  assertEquals(await fs.readFile('/app/components/ui/button.tsx'), original);
});

async function presetFixture() {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/deno.json', '{}');
  await fs.createDir('/app/routes');
  const calls: Parameters<TokenEnginePort['build']>[0][] = [];
  const names = [
    'tokens.css',
    'tokens.json',
    'fonts.json',
    'theme-preset.json',
    'theme-bridge.css',
  ];
  const tokenEngine: TokenEnginePort = {
    defaults: () =>
      Promise.resolve({ preset: 'ns-one', presets: ['ns-one', 'studio-utility'], sources: {} }),
    outputFiles: () => Promise.resolve(names),
    build: (options) => {
      calls.push(options);
      return Promise.resolve({
        preset: options.preset!,
        files: Object.fromEntries(names.map((name) => [name, `${options.preset}:${name}`])),
      });
    },
  };
  return { fs, tokenEngine, calls };
}

Deno.test('token-only preset application delegates to S1 and preserves app code, fonts, source and semantic overrides', async () => {
  const deps = await presetFixture();
  const { fs } = deps;
  await fs.writeFile('/app/components/ui/button.tsx', 'app-customized component');
  await fs.writeFile('/app/assets/fonts.json', 'app fonts');
  const override = '{"semantic":{}}';
  await fs.writeFile('/app/tokens/semantic.tokens.json', override);
  await applyUiPreset({ root: '/app', preset: 'studio-utility', only: 'theme' }, deps);
  assertEquals(deps.calls[0].override, override);
  const themeLock = (await readUiLock('/app', fs))!;
  assertEquals(
    themeLock.items['theme-studio-utility'].files.filter((file) =>
      file.managed && file.target.endsWith('tokens.css')
    ).map((file) => file.content),
    ['studio-utility:tokens.css'],
  );
  assertEquals(await fs.readFile('/app/components/ui/button.tsx'), 'app-customized component');
  assertEquals(await fs.readFile('/app/assets/fonts.json'), 'app fonts');
  assertStringIncludes(
    await fs.readFile('/app/.agents/skills/fresh-ui-theme-studio-utility/DESIGN.md'),
    'Studio',
  );
  assertEquals(JSON.parse(await fs.readFile('/app/tokens.config.json')), {
    version: 1,
    preset: 'studio-utility',
    override: 'tokens/semantic.tokens.json',
  });
  await buildAppTokens({ root: '/app' }, deps);
  assertEquals(deps.calls[1].preset, 'studio-utility');
  assertEquals(deps.calls[1].override, override);
  const tokens = await fs.readFile('/app/assets/tokens.css');
  const config = await fs.readFile('/app/tokens.config.json');
  await applyUiPreset({ root: '/app', preset: 'ns-one', only: 'font' }, deps);
  assertEquals(await fs.readFile('/app/assets/tokens.css'), tokens);
  assertEquals(await fs.readFile('/app/tokens.config.json'), config);
  assertEquals(await fs.readFile('/app/assets/fonts.json'), 'ns-one:fonts.json');
});

Deno.test('bad preset, edited docs, missing sources and font failures leave the entire initialization/apply plan untouched', async () => {
  const deps = await presetFixture();
  const { fs } = deps;
  const initial = new Map(fs.getFiles());
  await assertRejects(
    () =>
      applyUiPreset({ root: '/app', preset: 'invalid-theme', initializeNames: ['button'] }, deps),
    Error,
    'Unknown token preset',
  );
  assertEquals(fs.getFiles(), initial);
  await applyUiPreset({ root: '/app', preset: 'studio-utility' }, deps);
  await fs.writeFile('/app/.agents/skills/fresh-ui-theme-studio-utility/SKILL.md', 'edited docs');
  const before = new Map(fs.getFiles());
  await assertRejects(
    () => applyUiPreset({ root: '/app', preset: 'studio-utility' }, deps),
    UiRegistryConflictError,
    'SKILL.md',
  );
  assertEquals(fs.getFiles(), before);
  await fs.writeFile(
    '/app/tokens.config.json',
    '{"version":1,"preset":"ns-one","sourceRoot":"missing"}',
  );
  const withConfig = new Map(fs.getFiles());
  await assertRejects(() => applyUiPreset({ root: '/app', preset: 'ns-one' }, deps));
  assertEquals(fs.getFiles(), withConfig);
  await fs.remove('/app/tokens.config.json');
  const beforeFont = new Map(fs.getFiles());
  await assertRejects(
    () =>
      applyUiPreset({
        root: '/app',
        preset: encodeUiPreset({ version: 1, theme: 'ns-one', font: 'button' }),
      }, deps),
    Error,
    'font',
  );
  assertEquals(fs.getFiles(), beforeFont);
});

Deno.test('preset filters retain custom token sources and install a font without rewriting theme or component code', async () => {
  const deps = await presetFixture();
  const { fs } = deps;
  const { freshUiRegistryJson, FRESH_UI_REGISTRY_CONTENT } = await import(
    '@netscript/fresh-ui/registry'
  );
  const registry: Registry = {
    ...freshUiRegistryJson,
    items: [...freshUiRegistryJson.items, {
      name: 'font-fixture',
      type: 'registry:font',
      font: {
        family: 'Inter',
        provider: 'google',
        import: 'Inter',
        variable: '--app-font',
        selector: '.app-heading',
        weight: ['400'],
        dependency: 'npm:clsx@^2.1.1',
      },
    }],
  };
  const edges = {
    ...deps,
    builtin: () => Promise.resolve({ registry, content: FRESH_UI_REGISTRY_CONTENT }),
  };
  await fs.writeFile(
    '/app/tokens.config.json',
    JSON.stringify({
      version: 1,
      preset: 'ns-one',
      sourceRoot: 'tokens/source',
      override: 'semantic.json',
    }),
  );
  await fs.writeFile('/app/tokens/source/tokens.resolver.json', '{}');
  await fs.writeFile('/app/tokens/source/base.tokens.json', '{}');
  await fs.writeFile('/app/semantic.json', '{"semantic":{}}');
  await applyUiPreset({ root: '/app', preset: 'studio-utility' }, edges);
  assertEquals(deps.calls[0].sources, { 'tokens.resolver.json': '{}', 'base.tokens.json': '{}' });
  assertEquals(JSON.parse(await fs.readFile('/app/tokens.config.json')), {
    version: 1,
    preset: 'studio-utility',
    sourceRoot: 'tokens/source',
    override: 'semantic.json',
  });
  const tokens = await fs.readFile('/app/assets/tokens.css');
  const calls = deps.calls.length;
  await applyUiPreset({
    root: '/app',
    preset: encodeUiPreset({ version: 1, theme: 'ns-one', font: 'font-fixture' }),
    only: 'font',
  }, edges);
  assertEquals(deps.calls.length, calls);
  assertEquals(await fs.readFile('/app/assets/tokens.css'), tokens);
  const css = [...fs.getFiles()].find(([path]) => path.includes('/registry/font-fixture-'))![1];
  assertStringIncludes(css, 'family=Inter:wght@400');
  assertStringIncludes(css, '.app-heading { font-family: var(--app-font); }');
  assertStringIncludes(await fs.readFile('/app/deno.json'), 'npm:clsx@^2.1.1');
});
