import { assertEquals } from '@std/assert';
import { freshUiRegistryManifest } from '../registry.ts';

Deno.test('registry.ts JSDoc collection names match manifest collections', () => {
  const registryTsPath = new URL('../registry.ts', import.meta.url);
  const content = Deno.readTextFileSync(registryTsPath);

  const collectionsDocSection = content.match(/Collections:\n([\s\S]*?)\*\//);
  if (!collectionsDocSection) {
    throw new Error('Could not find Collections: section in registry.ts JSDoc');
  }

  const matches = [...collectionsDocSection[1].matchAll(/[\s\t]*- `([a-z0-9-]+)`:/g)];
  const docCollections = matches.map((m) => m[1]);

  const manifestCollections = freshUiRegistryManifest.collections.map((c) => c.name);

  assertEquals(docCollections, manifestCollections);
});
