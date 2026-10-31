import { assertEquals } from '@std/assert';
import { figmaTokenSources } from '../../src/tokens/adapters/figma/figma-token-sources.ts';
import { figmaCollections } from '../../src/tokens/adapters/figma-collections.ts';
import { defaultTokenSources } from '../../src/tokens/adapters/default-token-sources.ts';
import { TOKEN_PRESETS } from '../../src/tokens/domain/token-presets.ts';
import { validateDtcgSources } from '../../src/tokens/adapters/dtcg-validation.ts';

Deno.test('shared Figma composition reproduces every canonical v2 document byte-for-byte', () => {
  const sources = figmaTokenSources(figmaCollections());
  const baseline = defaultTokenSources();
  assertEquals(sources.resolver, baseline.resolver);
  assertEquals(
    Object.keys(sources.resolver.modifiers.theme.contexts),
    TOKEN_PRESETS.map((preset) => preset.id),
  );
  for (const [name, document] of Object.entries(sources.documents)) {
    assertEquals(
      JSON.stringify(document, null, 2),
      JSON.stringify(baseline.documents[name], null, 2),
      name,
    );
  }
  validateDtcgSources(sources);
});
