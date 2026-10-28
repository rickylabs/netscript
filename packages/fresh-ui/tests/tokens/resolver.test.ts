import { assertEquals, assertThrows } from '@std/assert';
import {
  normalizeFontStyle,
  resolveFigmaValue,
  roundTokenNumber,
} from '../../src/tokens/domain/figma-aliases.ts';
import { defaultTokenSources } from '../../src/tokens/adapters/default-token-sources.ts';
import { validateDtcgSources } from '../../src/tokens/adapters/dtcg-validation.ts';
import {
  assertSemanticAliases,
  assertTokenReferences,
  mergeTokenDocuments,
  resolveTokenSources,
} from '../../src/tokens/domain/resolve-tokens.ts';
import { TOKEN_PRESETS } from '../../src/tokens/domain/token-presets.ts';
import { type FigmaCollection, tokenEntries } from '../../src/tokens/domain/token-contract.ts';
import legacy from '../../tokens/legacy.json' with { type: 'json' };

Deno.test('source merging keeps JSON keys and metadata without touching inherited objects', () => {
  const source = JSON.parse(
    '{"__proto__":{"s1TokenMergeProbe":{"$type":"number","$value":1}},"$deprecated":true}',
  );
  const prototype = Object.prototype as Record<string, unknown>;
  try {
    const merged = mergeTokenDocuments({}, source);
    assertEquals(Object.getPrototypeOf(merged), Object.prototype);
    assertEquals(Object.hasOwn(merged, '__proto__'), true);
    assertEquals(Object.hasOwn(prototype, 's1TokenMergeProbe'), false);
    assertEquals(merged, source);
  } finally {
    Reflect.deleteProperty(prototype, 's1TokenMergeProbe');
  }
  const sources = defaultTokenSources();
  assertThrows(
    () =>
      resolveTokenSources({
        ...sources,
        resolver: {
          ...sources.resolver,
          resolutionOrder: [{ $ref: 'semantic.tokens.json#/__proto__' }],
        },
      }, {}),
    Error,
    'Unknown resolver pointer',
  );
});

Deno.test('NS One line heights fit their paired text sizes in both schemes', () => {
  const sources = defaultTokenSources();
  for (const scheme of ['light', 'dark']) {
    const tokens = new Map(
      tokenEntries(resolveTokenSources(sources, { theme: 'ns-one', scheme }))
        .map(({ path, token }) => [path, token]),
    );
    const size = (path: string): number => {
      const token = tokens.get(path)!;
      if (typeof token.$value === 'string') return size(token.$value.slice(1, -1));
      const value = token.$value;
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Not a dimension: ${path}`);
      }
      return Number(value.value) * (value.unit === 'rem' ? 16 : 1);
    };
    for (
      const role of [
        'caption',
        'small',
        'label',
        'body',
        'strong',
        'heading',
        'kpi-sm',
        'title',
        'kpi',
        'display',
      ]
    ) {
      const line = size(`semantic.leading-${role}`);
      const text = size(`semantic.text-${role}`);
      assertEquals(line >= text, true, `${scheme}/${role}: ${line}px line height < ${text}px text`);
    }
  }
});

Deno.test('Figma aliases select the target collection mode and reject cycles', () => {
  const collections: FigmaCollection[] = [
    {
      collection: 'Scheme',
      modes: ['Light', 'Dark'],
      variables: [{
        name: 'bg',
        type: 'COLOR',
        scopes: [],
        values: { Dark: { alias: 'Theme/bg' } },
      }],
    },
    {
      collection: 'Theme',
      modes: ['Studio', 'Glass'],
      variables: [{
        name: 'bg',
        type: 'COLOR',
        scopes: [],
        values: { Studio: '#ffffff', Glass: { alias: 'Base/gray' } },
      }],
    },
    {
      collection: 'Base',
      modes: ['Blue', 'Gray'],
      variables: [{
        name: 'gray',
        type: 'COLOR',
        scopes: [],
        values: { Blue: '#aabbcc', Gray: '#112233' },
      }],
    },
  ];
  assertEquals(
    resolveFigmaValue(collections, 'Scheme', 'bg', { Scheme: 'Dark', Theme: 'Glass', Base: 'Gray' })
      .value,
    '#112233',
  );
  const cycle: FigmaCollection[] = [{
    collection: 'A',
    modes: ['a'],
    variables: [{ name: 'x', type: 'COLOR', scopes: [], values: { a: { alias: 'A/x' } } }],
  }];
  assertThrows(() => resolveFigmaValue(cycle, 'A', 'x', {}), Error, 'cycle');
  assertEquals(roundTokenNumber(-2.4000000953674316), -2.4);
  assertEquals(normalizeFontStyle('SemiBold'), 'Semi Bold');
  assertEquals(normalizeFontStyle('Semi Bold'), 'Semi Bold');
});

Deno.test('official schemas accept source documents and reject malformed DTCG', () => {
  const sources = defaultTokenSources();
  validateDtcgSources(sources);
  assertThrows(
    () =>
      validateDtcgSources({
        ...sources,
        documents: { bad: { x: { $type: 'dimension', $value: '12px' } } },
      }),
    Error,
    'Invalid DTCG',
  );
  assertThrows(
    () => validateDtcgSources({ ...sources, resolver: { ...sources.resolver, version: 'draft' } }),
    Error,
    'Invalid DTCG',
  );
});

Deno.test('72 resolver inputs keep complete core maps and fixed preset geometry', () => {
  const sources = defaultTokenSources();
  let count = 0;
  for (const preset of TOKEN_PRESETS) {
    for (const scheme of ['light', 'dark']) {
      const a = resolveTokenSources(sources, { theme: preset.id, scheme, density: 'comfortable' });
      const b = resolveTokenSources(sources, { theme: preset.id, scheme, density: 'compact' });
      assertEquals(a, b, 'preset geometry ignores an unsupported free density override');
      const paths = new Set(tokenEntries(a).map((entry) => entry.path));
      for (
        const name of [
          'bg',
          'fg',
          'primary',
          'primary-fg',
          'ring',
          'container',
          'font-sans',
          'radius-card',
        ]
      ) {
        assertEquals(paths.has(`semantic.${name}`), true, `${preset.id}/${scheme}/${name}`);
      }
      count += 2;
    }
  }
  assertEquals(count, 72);
  assertThrows(
    () => resolveTokenSources(sources, { theme: 'invented' }),
    Error,
    'Unknown theme context',
  );
  assertThrows(
    () => resolveTokenSources(sources, { density: 'airy' }),
    Error,
    'Unknown density context',
  );
});

Deno.test('alias-only and app semantic boundaries fail closed', () => {
  assertThrows(
    () => assertSemanticAliases({ x: { $type: 'color', $value: '#ffffff' } }),
    Error,
    'must be an alias',
  );
  const sources = defaultTokenSources();
  assertThrows(
    () =>
      resolveTokenSources(sources, {}, { primitive: { x: { $type: 'color', $value: '#fff' } } }),
    Error,
    'semantic tier',
  );
  assertThrows(
    () =>
      resolveTokenSources(sources, {}, {
        semantic: { primary: { $type: 'color', $value: '#fff' } },
      }),
    Error,
    'must be an alias',
  );
  const result = resolveTokenSources(sources, {}, {
    semantic: { primary: { $type: 'color', $value: '{semantic.secondary}' } },
  });
  const primary = tokenEntries(result).find((entry) => entry.path === 'semantic.primary')!;
  assertEquals(primary.token.$extensions?.netscript?.cssVar, '--ns-primary');
});

Deno.test('NS One keeps every legacy declaration and imports no Figma core values', () => {
  const sources = defaultTokenSources();
  for (const scheme of ['light', 'dark']) {
    const document = resolveTokenSources(sources, { theme: 'ns-one', scheme });
    assertTokenReferences(document);
    const tokens = new Map(tokenEntries(document).map(({ path, token }) => [path, token]));
    const old = { ...legacy.tokens, ...(scheme === 'dark' ? legacy.themes.dark : {}) };
    for (const [name, token] of Object.entries(old)) {
      const context = tokens.get(`context.${scheme}.${name}`)!;
      const ref = token.value.match(/^var\(--ns-(.+)\)$/);
      if (ref) assertEquals(context.$value, `{context.${scheme}.${ref[1]}}`, name);
      else {
        const target = String(context.$value).slice(1, -1);
        assertEquals(tokens.get(target)?.$extensions?.netscript?.css, token.value, name);
      }
    }
    for (const { path, token } of tokenEntries(document)) {
      if (!path.startsWith(`context.${scheme}.`)) continue;
      const name = path.split('.').at(-1)!;
      if (/^(studio|bloom|liquid|cupertino|tactile|fluent|pixel|terminal)-/.test(name)) continue;
      assertEquals(token.$extensions?.netscript?.figma, undefined, name);
    }
  }
});

Deno.test('override aliases reject unknown targets, self cycles and two-token cycles', () => {
  const sources = defaultTokenSources();
  assertThrows(
    () =>
      resolveTokenSources(sources, {}, {
        semantic: { primary: { $type: 'color', $value: '{semantic.radius-md}' } },
      }),
    Error,
    'type mismatch',
  );
  for (const target of ['semantic.primary', 'semantic.unknown']) {
    assertThrows(() =>
      resolveTokenSources(sources, {}, {
        semantic: { primary: { $type: 'color', $value: `{${target}}` } },
      })
    );
  }
  assertThrows(
    () =>
      resolveTokenSources(sources, {}, {
        semantic: {
          primary: { $type: 'color', $value: '{semantic.secondary}' },
          secondary: { $type: 'color', $value: '{semantic.primary}' },
        },
      }),
    Error,
    'cycle',
  );
});

Deno.test('all alias targets exist, Terminal keys are scheme-aware, and transitions retain curves', () => {
  const sources = defaultTokenSources();
  for (const preset of TOKEN_PRESETS) {
    for (const scheme of ['light', 'dark']) {
      const document = resolveTokenSources(sources, { theme: preset.id, scheme });
      assertTokenReferences(document);
      const tokens = new Map(tokenEntries(document).map(({ path, token }) => [path, token]));
      if (preset.id === 'terminal' && scheme === 'dark') {
        assertEquals(tokens.get('context.dark.terminal-key-bg')?.$value, '{context.dark.muted}');
        assertEquals(
          tokens.get('context.dark.terminal-key-fg')?.$value,
          '{context.dark.primary-text}',
        );
      }
      const ease = tokens.get(`context.${scheme}.ease-spring`)!;
      const primitive = tokens.get(String(ease.$value).slice(1, -1))!;
      assertEquals(primitive.$type, 'transition');
      assertEquals(primitive.$value, {
        duration: { value: 300, unit: 'ms' },
        delay: { value: 0, unit: 'ms' },
        timingFunction: [0.34, 1.56, 0.64, 1],
      });
    }
  }
});
