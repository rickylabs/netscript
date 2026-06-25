import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl, join, normalize } from '@std/path';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { readTemplateAssetSync } from './template-asset.ts';

const PACKAGE_ROOT = fromFileUrl(new URL('../../../../', import.meta.url));
const ASSET_ROOT = join(PACKAGE_ROOT, 'src/kernel/assets');

const PACKAGE_ASSET_READER_FILES = [
  'src/kernel/adapters/scaffold/editor-config.ts',
  'src/kernel/adapters/templates/template-asset.ts',
  'src/kernel/adapters/contracts/templates/generate-v1-mod.ts',
  'src/kernel/adapters/contracts/templates/contract-template-registry.ts',
] as const;

Deno.test('package asset adapters do not perform direct Deno.read template reads', async () => {
  for (const relativePath of PACKAGE_ASSET_READER_FILES) {
    const source = await Deno.readTextFile(join(PACKAGE_ROOT, relativePath));
    assertEquals(
      /Deno\.read(?:Text)?File(?:Sync)?\(/.test(source),
      false,
      `${relativePath} must use hydrated template cache or JSON module imports`,
    );
  }
});

Deno.test('TemplateRegistry hydrates HTTP assets for sync template reads', async () => {
  const templateKey = TEMPLATE_KEYS.workspaceGitignore;
  const expected = await Deno.readTextFile(join(ASSET_ROOT, templateKey));
  const server = Deno.serve({ port: 0, onListen: () => undefined }, async (request) => {
    const url = new URL(request.url);
    const relativePath = normalize(decodeURIComponent(url.pathname).replace(/^\/+/, ''));
    const content = await Deno.readTextFile(join(ASSET_ROOT, relativePath));
    return new Response(content, {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  });

  try {
    DEFAULT_TEMPLATE_REGISTRY.register(templateKey, {
      path: templateKey,
      url: new URL(`http://localhost:${server.addr.port}/${templateKey}`),
    });

    await DEFAULT_TEMPLATE_REGISTRY.hydrate();

    const actual = readTemplateAssetSync(templateKey);
    assertEquals(actual, expected);
    assertStringIncludes(actual, '# Dependencies');
  } finally {
    await server.shutdown();
  }
});
