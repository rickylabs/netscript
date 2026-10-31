import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  generateTokens,
  loadCollections,
  resolveVariable,
  UTILITY_MODES,
} from './generate-tokens.ts';

Deno.test('Utility export resolves target collection contexts and both schemes', async () => {
  const collections = await loadCollections();
  const light = { ...UTILITY_MODES, Scheme: 'Light' };
  const dark = { ...UTILITY_MODES, Scheme: 'Dark' };
  assertEquals(resolveVariable(collections, 'Scheme/surface/bg', light), '#ffffff');
  assertEquals(resolveVariable(collections, 'Scheme/surface/bg', dark), '#18181a');
  const css = generateTokens(collections);
  assert(css.includes('--ns-font-sans: "Host Grotesk", sans-serif;'));
  assert(css.includes('--ns-font-mono: "Fragment Mono", monospace;'));
  assert(css.includes('--ns-studio-prose-measure: 544px;'));
  assert(css.includes('--ns-studio-topbar-rule: #e0e0e0;'));
  assert(css.includes('--ns-space-3: var(--ns-control-padding-x);'));
  assert(css.includes('--ns-text-xs: var(--ns-text-label);'));
  assert(css.includes('--ns-leading-relaxed: var(--ns-studio-prose-lede-line);'));
  assert(!css.includes('--ns-studio-topbar-rule: 1px'));
  assert(!css.includes('--ns-fluent-'));
  assertEquals(css, generateTokens(collections));
});

Deno.test('Figma resolver fails closed on missing aliases, modes and cycles', () => {
  const collections = [{
    collection: 'Test',
    modes: ['A'],
    variables: [{
      name: 'loop',
      type: 'COLOR' as const,
      values: { A: { alias: 'Test/loop' } },
    }],
  }];
  assertThrows(
    () => resolveVariable(collections, 'Test/missing', { Test: 'A' }),
    Error,
    'Missing Figma variable',
  );
  assertThrows(() => resolveVariable(collections, 'Test/loop', {}), Error, 'Missing Figma mode');
  assertThrows(
    () => resolveVariable(collections, 'Test/loop', { Test: 'A' }),
    Error,
    'Cyclic Figma alias',
  );
});

Deno.test('unknown CSS name collisions fail instead of shadowing a role', async () => {
  const collections = await loadCollections();
  const theme = collections.find((collection) => collection.collection === 'Theme')!;
  const colour = theme.variables.find((variable) => variable.type === 'COLOR')!;
  theme.variables.push({ ...colour, name: 'unexpected-collision', codeSyntax: 'var(--ns-fg)' });
  assertThrows(() => generateTokens(collections), Error, 'CSS token collision');
});

Deno.test('Theme set A preserves all existing declarations except the approved input border', async () => {
  const before = await Deno.readTextFile(new URL('./fixtures/pre-s8c-tokens.css', import.meta.url));
  const after = generateTokens(await loadCollections());
  for (
    const [scheme, oldBorder, newBorder] of [
      ['light', '#838383', '#8d8d8d'],
      ['dark', '#7b7b7b', '#6e6e6e'],
    ]
  ) {
    const declarations = (source: string) => {
      const body = source.split(`:root[data-scheme="${scheme}"] {`)[1].split('}')[0];
      return new Map([...body.matchAll(/^ {2}(--ns-[\w-]+): (.*);$/gm)]
        .map(([line, name]) => [name, line]));
    };
    const old = declarations(before);
    const current = declarations(after);
    assertEquals(old.size, 281, 'The compatibility fixture must cover every pre-S8c role');
    assertEquals(old.get('--ns-input-border'), `  --ns-input-border: ${oldBorder};`);
    assertEquals(current.get('--ns-input-border'), `  --ns-input-border: ${newBorder};`);
    for (const [name, line] of old) {
      if (name === '--ns-input-border') continue;
      assertEquals(current.get(name), line, `${scheme}: existing declaration ${name} changed`);
    }
    assert(current.has('--ns-code-bg'));
    assert(current.has('--ns-important-text'));
  }
});
