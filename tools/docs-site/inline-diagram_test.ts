import { assert, assertEquals, assertThrows } from '@std/assert';
import { inlineUtilityDiagram } from './inline-diagram.ts';

Deno.test('real Mermaid SVGs inherit Utility paint, keep labels and isolate every ID', async () => {
  const source = await Deno.readTextFile(
    new URL('../../docs/site/assets/diagrams/contract-flow.svg', import.meta.url),
  );
  const a = inlineUtilityDiagram(source, 'A contract & its "types"', 'first');
  const b = inlineUtilityDiagram(source, 'Another contract', 'second');
  const ids = [...(a + b).matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assertEquals(ids.length, new Set(ids).size);
  assert(a.includes('role="img" aria-label="A contract &amp; its &quot;types&quot;"'));
  assert(a.includes('var(--ns-fg)'));
  assert(a.includes('var(--ns-surface)'));
  assert(!/(?:fill|stroke|color)\s*[:=]\s*["']?(?:#[\da-f]{3,8}|rgba?\()/i.test(a));
  assertEquals(
    source,
    await Deno.readTextFile(
      new URL('../../docs/site/assets/diagrams/contract-flow.svg', import.meta.url),
    ),
  );
});

Deno.test('diagram instance and accessible-name contracts fail closed', () => {
  assertThrows(() => inlineUtilityDiagram('<svg></svg>', '', 'one'), Error, 'accessible name');
  assertThrows(
    () => inlineUtilityDiagram('<svg></svg>', 'Name', 'invalid id'),
    Error,
    'identifier',
  );
});
