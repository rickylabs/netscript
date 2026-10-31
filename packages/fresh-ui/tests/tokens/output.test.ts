import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { APP_TOKEN_FILES, buildTokens, defaultTokenSources, TOKEN_PRESETS } from '../../tokens.ts';
import type {
  DesignToken,
  TokenBuildResult,
  TokenContextOutput,
  TokenDocument,
} from '../../tokens.ts';
import type { FigmaCollection } from '../../src/tokens/domain/token-contract.ts';
import legacy from '../../tokens/legacy.json' with { type: 'json' };
import figmaIndex from '../../tokens/figma/index.json' with { type: 'json' };
import { figmaCollections } from '../../src/tokens/adapters/figma-collections.ts';
import { formatFigmaPreset } from '../../src/tokens/adapters/format-figma.ts';
import { normalizeFontStyle, roundTokenNumber } from '../../src/tokens/domain/figma-aliases.ts';
import compatibilityNames from './ns-one-css-names.json' with { type: 'json' };
import nameMigrations from '../../tokens/name-migrations.json' with { type: 'json' };
import { LEGACY_ROLE_MAP } from '../../src/tokens/domain/preset-role-map.ts';
import contrastExclusions from '../../tokens/contrast-exclusions.json' with { type: 'json' };
import { defaultContrastCoverage } from '../../src/tokens/adapters/default-token-quality.ts';
import Color from 'npm:colorjs.io@0.5.2';
import { tokenContrastColor } from '../../src/tokens/adapters/contrast-color.ts';

let cached: Promise<TokenBuildResult> | undefined;
const built = () => cached ??= buildTokens();

for (const hex of ['#ff0000', undefined]) {
  Deno.test(`app sRGB primitive emits matching native, fallback and Figma colors (${hex ?? 'no hex'})`, async () => {
    const sources = structuredClone(defaultTokenSources());
    const primitives = sources.documents['primitives.tokens.json'].primitive as TokenDocument;
    primitives['app-red'] = {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 0.5, ...(hex ? { hex } : {}) },
    };
    const build = await buildTokens({
      sources,
      override: { semantic: { primary: { $type: 'color', $value: '{primitive.app-red}' } } },
    });
    const context = build.contexts[0];
    const primary = context.tokens.primary;
    const native = new Color(primary.value).to('srgb');
    for (const [index, expected] of [1, 0, 0].entries()) {
      assertEquals(Math.abs(Number(native.coords[index]) - expected) < 0.0001, true);
    }
    assertEquals(Number(native.alpha), 0.5);
    assertEquals(primary.fallback, '#ff000080');
    assertEquals(primary.hex, '#ff000080');
    const figma = JSON.parse(build.files['figma/ns-one.json']);
    assertEquals(
      figma.variables.find((entry: { name: string }) => entry.name === 'primary').values.Light,
      '#ff000080',
    );
    const measured = tokenContrastColor.measure(primary.resolved, ['#ffffff'], '#ffffff');
    assertEquals(measured.foreground, '#ff8080');
    assertEquals(measured.ratio > 1, true);
  });
}

Deno.test('app CSS contains only its preset and NS One compatibility with bounded size', async () => {
  const build = await built();
  assertEquals(APP_TOKEN_FILES.length, 5);
  const ns = build.files['tokens.css'];
  const themes = (css: string) =>
    [...new Set([...css.matchAll(/data-theme='([^']+)'/g)].map((match) => match[1]))].sort();
  const contexts = (css: string) => [...css.matchAll(/\/\* Preset [^*]+\*\//g)].length;
  const declarations = (css: string) => [...css.matchAll(/--ns-[a-z0-9-]+:/g)].length;
  assertEquals(themes(ns), ['dark', 'light', 'ns-one']);
  assertEquals(contexts(ns), 2);
  assertEquals(declarations(ns) < 4000, true);
  assertEquals(new TextEncoder().encode(ns).length < 200_000, true);
  for (const preset of TOKEN_PRESETS) {
    const css = build.files[`presets/${preset.id}.css`];
    assertEquals(contexts(css), preset.id === 'ns-one' ? 2 : 4);
    assertEquals(declarations(css) < 7000, true, preset.id);
    assertEquals(new TextEncoder().encode(css).length < 400_000, true, preset.id);
  }
  const utility = build.files['presets/studio-utility.css'];
  assertEquals(themes(utility), ['dark', 'light', 'ns-one', 'studio']);
  assertEquals([
    ...new Set([...utility.matchAll(/data-flavor='([^']+)'/g)].map((match) => match[1])),
  ], ['utility']);
  const selected = await buildTokens({ preset: 'studio-utility' });
  assertEquals(selected.files['tokens.css'], utility);
  const items = JSON.parse(build.files['theme-items.json']);
  for (const preset of TOKEN_PRESETS) {
    const item = items.find((entry: { name: string }) => entry.name === `theme-${preset.id}`);
    assertEquals(
      new Set(item.files.map((file: { source: string }) => file.source)).size,
      item.files.length,
    );
    assertEquals(
      item.files.find((file: { target: string }) => file.target === '@assets/tokens.css').source,
      `registry/theme/presets/${preset.id}.css`,
    );
  }
});

Deno.test('SD formats cover all requested inputs and retain every legacy declaration', async () => {
  const build = await built();
  assertEquals(build.contexts.length, TOKEN_PRESETS.length * 4);
  assertEquals(
    Object.keys(build.files).length,
    6 + TOKEN_PRESETS.length * 3 + figmaIndex.collections.length + 1,
  );
  assertStringIncludes(build.files['tokens.css'], legacy.css.trim());
  assertStringIncludes(build.files['theme-bridge.css'], legacy.bridge.trim());
  const fallbackCss = build.files['tokens.css'].split('@supports')[0].replace(
    legacy.css.trimEnd(),
    '',
  );
  assertEquals(fallbackCss.includes('oklch('), false);
  assertEquals(fallbackCss.includes('color-mix('), false);
  assertStringIncludes(build.files['tokens.css'], '@supports (color: oklch(');
  assertStringIncludes(build.files['tokens.css'], 'and (color: color-mix(in oklab, red, blue))');
  for (const scheme of ['light', 'dark']) {
    const context = build.contexts.find((entry) =>
      entry.preset.id === 'ns-one' && entry.scheme === scheme
    )!;
    const old = { ...legacy.tokens, ...(scheme === 'dark' ? legacy.themes.dark : {}) };
    for (const [name, token] of Object.entries(old)) {
      assertEquals(context.tokens[name].value, token.value, `${scheme}/${name}`);
    }
  }
  const manifest = JSON.parse(build.files['tokens.json']);
  const nsOne = build.contexts.filter((context) => context.preset.id === 'ns-one');
  const light = nsOne.find((context) => context.scheme === 'light')!;
  const dark = nsOne.find((context) => context.scheme === 'dark')!;
  for (const [name, token] of Object.entries(light.tokens)) {
    assertEquals(
      /^(oklch|color-mix)\(/.test(token.value),
      /^(oklch|color-mix)\(/.test(dark.tokens[name].value),
      `Legacy selector native-value symmetry: ${name}`,
    );
  }
  assertEquals(manifest.inputs.length, TOKEN_PRESETS.length * 4);
  assertEquals(Object.keys(manifest.presets).length, TOKEN_PRESETS.length);
  assertEquals(manifest.ramps.flatMap((ramp: { steps: string[] }) => ramp.steps).length > 0, true);
  assertEquals(manifest.generatedBy, 'Style Dictionary 5.7.1');
  assertEquals(JSON.parse(build.files['fonts.json']).imports['ns-one'], legacy.fontImports);
});

Deno.test('computed Figma mixes retain alpha while CSS retains native color-mix', async () => {
  const build = await built();
  const context = build.contexts.find((entry) =>
    entry.preset.id === 'liquid' && entry.scheme === 'light'
  )!;
  const tint = context.tokens['liquid-success-tint'];
  assertStringIncludes(tint.value, 'color-mix(in oklab, var(--ns-liquid-tag-green) 12%,');
  assertEquals(Number((tint.resolved as Record<string, unknown>).alpha), 0.12);
  const figma = JSON.parse(build.files['figma/liquid.json']);
  assertEquals(
    figma.variables.find((entry: { name: string }) => entry.name === 'liquid-success-tint').values
      .Light,
    tint.hex,
  );
  const fluent = build.contexts.find((entry) =>
    entry.preset.id === 'fluent' && entry.scheme === 'dark'
  )!;
  assertEquals(fluent.tokens.primary.hex?.toLowerCase(), '#60cdff');
  assertEquals(fluent.tokens['primary-fg'].hex?.toLowerCase(), '#000000');
});

Deno.test('semantic overrides propagate to component values, derived mixes and shadow recipes', async () => {
  const build = await buildTokens({
    override: {
      semantic: {
        'radius-md': { $type: 'dimension', $value: '{semantic.radius-lg}' },
        'liquid-tag-green': { $type: 'color', $value: '{semantic.liquid-tag-pink}' },
        'shadow-blur': { $type: 'dimension', $value: '{semantic.shadow-offset-y}' },
      },
    },
  });
  const baseline = await built();
  for (const context of build.contexts) {
    if (context.preset.id === 'ns-one') {
      assertEquals(
        context.tokens['component-input-radius'].resolved,
        context.tokens['radius-lg'].resolved,
      );
      assertEquals(context.tokens['radius-md'].value, 'var(--ns-radius-lg)');
    } else {
      const shadow = context.tokens['shadow-md'].resolved as Record<string, unknown>;
      assertEquals(shadow.blur, context.tokens['shadow-offset-y'].resolved);
    }
    const tint = context.tokens['liquid-success-tint'];
    assertEquals(tint.hex?.slice(0, 7), context.tokens['liquid-tag-pink'].hex?.slice(0, 7));
    assertEquals(Number((tint.resolved as Record<string, unknown>).alpha), 0.12);
  }
  assertEquals(build.files['tokens.css'] === baseline.files['tokens.css'], false);
});

Deno.test('component source edits reach SD output without editing CSS', async () => {
  const sources = structuredClone(defaultTokenSources());
  const component = sources.documents['component.tokens.json'].component as TokenDocument;
  const button = component.button as TokenDocument;
  button.radius = { ...button.radius as DesignToken, $value: '{semantic.radius-card}' };
  const build = await buildTokens({ sources });
  for (const context of build.contexts) {
    assertEquals(
      context.tokens['component-button-radius'].resolved,
      context.tokens['radius-card'].resolved,
    );
    assertEquals(context.tokens['component-button-radius'].value, 'var(--ns-radius-card)');
  }
});

Deno.test('Figma output preserves original index, collection shape, aliases, scopes and syntax', async () => {
  const build = await built();
  const index = JSON.parse(build.files['figma/index.json']);
  assertEquals(index.fileKey, figmaIndex.fileKey);
  assertEquals(index.exportDate, figmaIndex.exportDate);
  assertEquals(index.collections.slice(0, figmaIndex.collections.length), figmaIndex.collections);
  for (const collection of figmaCollections()) {
    const file = figmaIndex.collections.find((entry) =>
      entry.collection === collection.collection
    )!.file;
    const exported: FigmaCollection = JSON.parse(build.files[`figma/${file}`]);
    assertEquals(exported.collection, collection.collection);
    assertEquals(exported.modes, collection.modes);
    assertEquals(exported.variables.length, collection.variables.length);
    for (const [index, original] of collection.variables.entries()) {
      const variable = exported.variables[index];
      const migration = nameMigrations.migrations.find((entry) =>
        entry.collection === collection.collection && entry.variable === original.name
      );
      assertEquals(variable, {
        ...original,
        ...(migration ? { codeSyntax: `var(${migration.cssVar})` } : {}),
        values: Object.fromEntries(
          Object.entries(original.values).map(([mode, value]) => [
            mode,
            typeof value === 'number'
              ? roundTokenNumber(value)
              : typeof value === 'string'
              ? normalizeFontStyle(value)
              : value,
          ]),
        ),
      });
      if (!variable.codeSyntax) continue;
      const name = variable.codeSyntax.slice('var(--ns-'.length, -1);
      for (const context of build.contexts) {
        const token = context.tokens[name];
        assertEquals(
          !!token,
          true,
          `${collection.collection}/${variable.name}: ${name} is unregistered`,
        );
        const compatible = variable.type === 'COLOR'
          ? ['color']
          : variable.type === 'FLOAT'
          ? ['dimension', 'number']
          : variable.type === 'STRING'
          ? ['fontFamily', 'fontWeight']
          : ['number'];
        assertEquals(
          compatible.includes(token.type),
          true,
          `${variable.codeSyntax}: ${variable.type} cannot bind ${token.type}`,
        );
      }
    }
  }
});

Deno.test('every computed Figma dimension is in pixels and durations are milliseconds', async () => {
  const build = await built();
  for (const preset of Object.keys(JSON.parse(build.files['tokens.json']).presets)) {
    const collection: FigmaCollection = JSON.parse(build.files[`figma/${preset}.json`]);
    for (const context of build.contexts.filter((entry) => entry.preset.id === preset)) {
      for (const variable of collection.variables) {
        const token = context.tokens[variable.name];
        if (token.type !== 'dimension' && token.type !== 'duration') continue;
        const value = token.resolved as { value: number; unit: string };
        const factor = value.unit === 'px' || value.unit === 'ms'
          ? 1
          : value.unit === 'rem'
          ? 16
          : value.unit === 's'
          ? 1000
          : NaN;
        assertEquals(Number.isFinite(factor), true, `${preset}/${variable.name}/${value.unit}`);
        assertEquals(variable.type, 'FLOAT');
        assertEquals(
          variable.values[context.scheme === 'light' ? 'Light' : 'Dark'],
          roundTokenNumber(value.value * factor),
          `${preset}/${context.scheme}/${variable.name}`,
        );
      }
    }
  }
  const invalid = build.contexts.filter((entry) => entry.preset.id === 'ns-one').map((
    context,
  ): TokenContextOutput => ({
    ...context,
    tokens: {
      invalid: {
        type: 'dimension',
        cssVar: '--ns-invalid',
        path: ['test'],
        value: '2em',
        resolved: { value: 2, unit: 'em' },
      },
    },
  }));
  assertThrows(
    () => formatFigmaPreset(invalid, 'ns-one'),
    Error,
    'Unsupported Figma dimension unit',
  );
});

Deno.test('builder rejects resolver contexts that have no registered preset', async () => {
  const sources = structuredClone(defaultTokenSources());
  const contexts = sources.resolver.modifiers.theme.contexts as Record<string, unknown>;
  contexts.invented = contexts['ns-one'];
  await assertRejects(() => buildTokens({ sources }), Error, 'registered public contexts');
});

Deno.test('S0-tagged NS One exclusions contain only legacy roles or exact inherited component colors', async () => {
  const build = await built();
  for (
    const entry of contrastExclusions.exclusions.filter((entry) =>
      entry.preset === 'ns-one' && !entry.source.startsWith('S0')
    )
  ) {
    assertStringIncludes(entry.source, 'Figma export #2493');
  }
  const pairs = new Map(defaultContrastCoverage().pairs.map((pair) => [pair.id, pair]));
  const inherited: Readonly<Record<string, string>> = {
    'component-button-fg': 'primary-fg',
    'component-button-hover': 'primary-hover',
    'component-input-bg': 'surface',
    'component-tabs-ring': 'ring',
    'component-tabs-bg': 'muted',
  };
  for (
    const exclusion of contrastExclusions.exclusions.filter((entry) =>
      entry.preset === 'ns-one' && entry.source.startsWith('S0')
    )
  ) {
    const pair = pairs.get(exclusion.pair)!;
    const context = build.contexts.find((entry) =>
      entry.preset.id === 'ns-one' && entry.scheme === exclusion.scheme
    )!;
    for (const name of [pair.foreground, ...pair.background]) {
      if (Object.hasOwn(legacy.tokens, name)) continue;
      if (Object.hasOwn(LEGACY_ROLE_MAP, name)) {
        assertEquals(context.tokens[name].resolved, context.tokens[LEGACY_ROLE_MAP[name]].resolved);
        continue;
      }
      assertEquals(
        name.startsWith('component-') && Object.hasOwn(inherited, name),
        true,
        `A new NS One gap cannot be excluded as S0: ${name}`,
      );
      assertEquals(
        context.tokens[name].resolved,
        context.tokens[inherited[name]].resolved,
        `Component color must exactly match its S0 role: ${name}`,
      );
    }
  }
});

Deno.test('default CSS keeps the legacy byte prefix and fits its six-KB gzip budget', async () => {
  const build = await built();
  const css = build.files['tokens.css'];
  const original = await Deno.readTextFile(
    new URL('../../registry/theme/tokens.css', import.meta.url),
  );
  assertEquals(css, original);
  assertEquals(css.startsWith(legacy.css), true);
  assertEquals(css.includes('--ns-liquid-tag-green:'), false);
  const bytes = new TextEncoder().encode(css);
  const compressed = await new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),
  ).arrayBuffer();
  assertEquals(
    compressed.byteLength <= 6_000,
    true,
    `Default token CSS gzip: ${compressed.byteLength}`,
  );
  // Every retained native alias still resolves after unused ramps/packs are trimmed.
  const declared = new Set([...css.matchAll(/(--ns-[a-z0-9-]+):/g)].map((match) => match[1]));
  for (const name of compatibilityNames.names) assertEquals(declared.has(name), true, name);
  for (const match of (css + build.files['theme-bridge.css']).matchAll(/var\((--ns-[a-z0-9-]+)/g)) {
    assertEquals(declared.has(match[1]), true, match[1]);
  }
});

Deno.test('app build skips Figma and preview assets unless requested without changing core bytes', async () => {
  const full = await built();
  const app = await buildTokens({ target: 'app' });
  assertEquals(Object.keys(app.files).sort(), [...APP_TOKEN_FILES].sort());
  for (const file of APP_TOKEN_FILES) assertEquals(app.files[file], full.files[file], file);
  const previews = await buildTokens({ target: 'app', previews: true });
  assertEquals(Object.keys(previews.files).length, 5 + TOKEN_PRESETS.length);
  for (const preset of TOKEN_PRESETS) {
    assertEquals(
      previews.files[`presets/${preset.id}.css`],
      full.files[`presets/${preset.id}.css`],
    );
  }
  for (const context of app.contexts) {
    const matching = full.contexts.find((candidate) =>
      candidate.preset.id === context.preset.id && candidate.scheme === context.scheme
    )!;
    assertEquals(context.tokens, matching.tokens);
  }
});

Deno.test('new font-style and opacity roles retain schema-valid CSS and Figma source meaning', async () => {
  const build = await built();
  for (const id of ['bloom', 'macos-27', 'apple-classic', 'fluent-2-web']) {
    const context = build.contexts.find((entry) =>
      entry.preset.id === id && entry.scheme === 'light'
    )!;
    assertEquals(context.tokens['weight-em'].type, 'fontWeight');
    assertEquals(context.tokens['weight-em'].value, 'italic');
    assertEquals(context.tokens['weight-em'].sourceStyle, 'Italic');
    const collection = formatFigmaPreset(build.contexts, id);
    assertEquals(
      collection.variables.find((variable) => variable.name === 'weight-em')!.values.Light,
      'Italic',
    );
    assertEquals(context.tokens['state-disabled-opacity'].type, 'number');
    assertEquals(context.tokens['state-disabled-opacity'].value.endsWith('px'), false);
  }
});
