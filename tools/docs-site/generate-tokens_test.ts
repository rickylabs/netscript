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
