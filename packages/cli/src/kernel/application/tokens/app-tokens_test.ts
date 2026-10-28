import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import type { TokenEnginePort } from '../../ports/token-engine-port.ts';
import { TOKEN_CONFIG_FILE, TOKEN_OVERRIDE_FILE } from '../../domain/tokens/token-config.ts';
import { buildAppTokens } from './build-app-tokens.ts';
import { cleanAppTokens } from './clean-app-tokens.ts';
import { initAppTokens } from './init-app-tokens.ts';
import { appTokenPath } from './token-files.ts';

const ROOT = '/workspace/apps/dashboard';
const OUTPUTS = [
  'tokens.css',
  'theme-bridge.css',
  'tokens.json',
  'fonts.json',
  'theme-preset.json',
  'presets/studio-utility.css',
];

async function fixture() {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(`${ROOT}/deno.json`, '{}');
  await fs.createDir(`${ROOT}/routes`);
  const calls: Parameters<TokenEnginePort['build']>[0][] = [];
  const tokenEngine: TokenEnginePort = {
    outputFiles: () => Promise.resolve(OUTPUTS),
    defaults: () =>
      Promise.resolve({
        preset: 'ns-one',
        presets: ['ns-one', 'studio-utility'],
        sources: {
          'tokens.resolver.json':
            '{"version":"2025.10","sets":{},"modifiers":{},"resolutionOrder":[]}',
          'semantic.tokens.json': '{}',
        },
      }),
    build: (options) => {
      calls.push(options);
      return Promise.resolve({
        preset: options.preset ?? 'ns-one',
        files: Object.fromEntries(OUTPUTS.map((name) => [name, `generated ${name}`])),
      });
    },
  };
  return { fs, tokenEngine, calls };
}

Deno.test('tokens init checks every planned file before writes and requires force', async () => {
  const dependencies = await fixture();
  await dependencies.fs.writeFile(`${ROOT}/${TOKEN_OVERRIDE_FILE}`, 'app-owned');
  const before = dependencies.fs.getFiles();
  await assertRejects(() => initAppTokens({ root: ROOT }, dependencies), Error, '--force');
  assertEquals(dependencies.fs.getFiles(), before);
  const result = await initAppTokens(
    { root: ROOT, preset: 'studio-utility', force: true },
    dependencies,
  );
  assertEquals(result.files.length, 4);
  assertEquals(JSON.parse(await dependencies.fs.readFile(`${ROOT}/${TOKEN_CONFIG_FILE}`)), {
    version: 1,
    preset: 'studio-utility',
    sourceRoot: 'tokens/source',
    override: TOKEN_OVERRIDE_FILE,
  });
  assertEquals(await dependencies.fs.exists(`${ROOT}/assets/tokens.css`), false);
});

Deno.test('tokens build reads initialized sources and applies explicit override after settings', async () => {
  const dependencies = await fixture();
  await initAppTokens({ root: ROOT }, dependencies);
  const override = {
    semantic: { 'radius-md': { $type: 'dimension', $value: '{primitive.radius-lg}' } },
  };
  await dependencies.fs.writeFile(`${ROOT}/custom.tokens.json`, JSON.stringify(override));
  const result = await buildAppTokens({
    root: ROOT,
    preset: 'studio-utility',
    override: 'custom.tokens.json',
  }, dependencies);
  assertEquals(result.files.length, 6);
  assertEquals(dependencies.calls[0], {
    preset: 'studio-utility',
    sources: {
      'tokens.resolver.json': '{"version":"2025.10","sets":{},"modifiers":{},"resolutionOrder":[]}',
      'semantic.tokens.json': '{}',
    },
    override: JSON.stringify(override),
    previews: undefined,
  });
});

Deno.test('tokens build retains an installed registry preset and detects conventional override', async () => {
  const dependencies = await fixture();
  await dependencies.fs.writeFile(`${ROOT}/assets/theme-preset.json`, '{"id":"studio-utility"}');
  await dependencies.fs.writeFile(`${ROOT}/${TOKEN_OVERRIDE_FILE}`, '{"semantic":{}}');
  await buildAppTokens({ root: ROOT }, dependencies);
  assertEquals(dependencies.calls[0], {
    preset: 'studio-utility',
    sources: undefined,
    override: '{"semantic":{}}',
    previews: undefined,
  });
});

Deno.test('tokens build errors leave existing generated assets untouched', async () => {
  const dependencies = await fixture();
  await dependencies.fs.writeFile(`${ROOT}/assets/tokens.css`, 'before');
  dependencies.tokenEngine.build = () =>
    Promise.reject(new Error('Semantic token must be an alias'));
  const before = dependencies.fs.getFiles();
  await assertRejects(
    () => buildAppTokens({ root: ROOT }, dependencies),
    Error,
    'must be an alias',
  );
  assertEquals(dependencies.fs.getFiles(), before);
});

Deno.test('tokens build rejects missing configured inputs instead of silently dropping them', async () => {
  const dependencies = await fixture();
  await dependencies.fs.writeFile(
    `${ROOT}/${TOKEN_CONFIG_FILE}`,
    JSON.stringify({ version: 1, preset: 'ns-one', override: 'missing.json' }),
  );
  await assertRejects(() => buildAppTokens({ root: ROOT }, dependencies), Error, 'missing.json');
  assertEquals(dependencies.calls.length, 0);
  await dependencies.fs.writeFile(
    `${ROOT}/${TOKEN_CONFIG_FILE}`,
    JSON.stringify({ version: 1, preset: 'ns-one', sourceRoot: 'missing' }),
  );
  await assertRejects(
    () => buildAppTokens({ root: ROOT }, dependencies),
    Error,
    'tokens.resolver.json',
  );
  assertEquals(dependencies.calls.length, 0);
});

Deno.test('tokens clean removes known files and retains all app-owned files', async () => {
  const dependencies = await fixture();
  await initAppTokens({ root: ROOT }, dependencies);
  await buildAppTokens({ root: ROOT }, dependencies);
  await dependencies.fs.writeFile(`${ROOT}/assets/styles.css`, 'app stylesheet');
  await dependencies.fs.writeFile(`${ROOT}/assets/unrelated.json`, 'app data');
  await dependencies.fs.writeFile(`${ROOT}/static/owned.css`, 'app-owned static');
  assertEquals(await dependencies.fs.exists(`${ROOT}/static/presets/studio-utility.css`), true);
  assertEquals((await cleanAppTokens(ROOT, dependencies)).length, 5);
  assertEquals(await cleanAppTokens(ROOT, dependencies), []);
  assertEquals(await dependencies.fs.readFile(`${ROOT}/assets/styles.css`), 'app stylesheet');
  assertEquals(await dependencies.fs.readFile(`${ROOT}/assets/unrelated.json`), 'app data');
  assertEquals(await dependencies.fs.readFile(`${ROOT}/static/owned.css`), 'app-owned static');
  assertEquals(await dependencies.fs.exists(`${ROOT}/static/presets/studio-utility.css`), false);
  assertStringIncludes(
    await dependencies.fs.readFile(`${ROOT}/${TOKEN_CONFIG_FILE}`),
    'sourceRoot',
  );
  assertEquals(await dependencies.fs.exists(`${ROOT}/tokens/source/semantic.tokens.json`), true);
});

Deno.test('token operations reject workspace roots and escaping input paths', async () => {
  const dependencies = await fixture();
  for (const path of ['../outside.json', '/outside.json', 'tokens/../../outside.json']) {
    assertThrows(
      () => {
        appTokenPath(ROOT, path);
      },
      Error,
      'inside the Fresh app',
    );
  }
  await assertRejects(
    () => initAppTokens({ root: '/workspace' }, dependencies),
    Error,
    'Fresh app',
  );
  await assertRejects(
    () => buildAppTokens({ root: ROOT, override: '../outside.json' }, dependencies),
    Error,
    'inside the Fresh app',
  );
  assertEquals(dependencies.calls.length, 0);
});

Deno.test('tokens clean uses only output metadata and preserves a non-default preset for rebuild', async () => {
  const dependencies = await fixture();
  await dependencies.fs.writeFile(`${ROOT}/assets/theme-preset.json`, '{"id":"studio-utility"}');
  const defaults = dependencies.tokenEngine.defaults;
  dependencies.tokenEngine.defaults = () => {
    throw new Error('clean must not load sources/compiler');
  };
  await cleanAppTokens(ROOT, dependencies);
  assertEquals(
    await dependencies.fs.readFile(`${ROOT}/assets/theme-preset.json`),
    '{"id":"studio-utility"}',
  );
  dependencies.tokenEngine.defaults = defaults;
  await buildAppTokens({ root: ROOT }, dependencies);
  assertEquals(dependencies.calls[0].preset, 'studio-utility');
});

Deno.test('tokens init force replaces stale managed source files', async () => {
  const dependencies = await fixture();
  await initAppTokens({ root: ROOT }, dependencies);
  await dependencies.fs.writeFile(`${ROOT}/tokens/source/obsolete.tokens.json`, '{}');
  await dependencies.fs.writeFile(`${ROOT}/tokens/notes.txt`, 'keep');
  await initAppTokens({ root: ROOT, force: true }, dependencies);
  assertEquals(await dependencies.fs.exists(`${ROOT}/tokens/source/obsolete.tokens.json`), false);
  assertEquals(await dependencies.fs.readFile(`${ROOT}/tokens/notes.txt`), 'keep');
});
