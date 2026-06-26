import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl, join } from '@std/path';
import { EMBEDDED_TEMPLATE_CONTENT } from '../../assets/embedded.generated.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { readTemplateAsset, readTemplateAssetSync } from './template-asset.ts';

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

Deno.test('template asset adapter reads embedded content without hydration', async () => {
  const templateKey = TEMPLATE_KEYS.workspaceGitignore;
  const expected = EMBEDDED_TEMPLATE_CONTENT[templateKey];
  const checkedIn = await Deno.readTextFile(join(ASSET_ROOT, templateKey));

  assertEquals(expected, checkedIn);
  assertEquals(readTemplateAssetSync(templateKey), expected);
  assertEquals(await readTemplateAsset(templateKey), expected);
  assertStringIncludes(expected, '# Dependencies');
});
