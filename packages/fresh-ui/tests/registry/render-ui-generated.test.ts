import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { FRESH_UI_REGISTRY_CONTENT } from '../../registry.generated.ts';

Deno.test('generated render-ui preserves bounded nested-array behavior', async () => {
  const source = await Deno.readTextFile(
    new URL('../../src/ai/render-ui.tsx', import.meta.url),
  );
  const embedded = FRESH_UI_REGISTRY_CONTENT['src/ai/render-ui.tsx'];

  assertEquals(embedded, source);
  assertStringIncludes(embedded, 'renderNode(child, depth + 1, context)');
  assertFalse(embedded.includes('renderNode(child, depth, context)'));
});
