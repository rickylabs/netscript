import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl, join, relative } from '@std/path';
import { TEMPLATE_MANIFEST } from '../../assets/manifest.ts';
import { TemplateRegistry } from './template-registry.ts';

const ASSET_ROOT = fromFileUrl(new URL('../../assets/', import.meta.url));
const sortKeys = (keys: readonly string[]): string[] =>
  [...keys].sort((left, right) => left.localeCompare(right));

async function* walkTemplateFiles(
  root: string,
  base: string = root,
): AsyncIterableIterator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);
    if (entry.isDirectory) {
      yield* walkTemplateFiles(path, base);
      continue;
    }
    if (entry.isFile && path.endsWith('.template')) {
      yield relative(base, path).replaceAll('\\', '/');
    }
  }
}

Deno.test('TemplateRegistry manifest matches checked-in template assets', async () => {
  const fileKeys: string[] = [];
  for await (const path of walkTemplateFiles(ASSET_ROOT)) {
    fileKeys.push(path);
  }

  const manifestKeys = sortKeys(TEMPLATE_MANIFEST.map((item) => item.key));
  assertEquals(manifestKeys, sortKeys(fileKeys));

  const registry = new TemplateRegistry();
  const loadedKeys = (await registry.load()).map((entry) => entry.key);
  assertEquals(loadedKeys, manifestKeys);
});

Deno.test('TemplateRegistry reads registered template content', () => {
  const registry = new TemplateRegistry();
  const asset = registry.get('workspace/gitignore.template');
  assertStringIncludes(asset?.url.href ?? '', 'workspace/gitignore.template');
});
