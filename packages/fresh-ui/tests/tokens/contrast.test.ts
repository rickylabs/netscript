import { assertAlmostEquals, assertEquals, assertThrows } from '@std/assert';
import { tokenContrastColor } from '../../src/tokens/adapters/contrast-color.ts';
import {
  assertTokenContrast,
  evaluateTokenContrast,
} from '../../src/tokens/domain/check-token-contrast.ts';
import type {
  TokenContrastCoverage,
  TokenContrastExclusion,
} from '../../src/tokens/domain/contrast-contract.ts';
import type { BuiltToken, TokenContextOutput } from '../../src/tokens/domain/token-output.ts';
import { tokenPreset } from '../../src/tokens/domain/token-presets.ts';

const coverage: TokenContrastCoverage = {
  decorativeRoles: {},
  pairs: [
    { id: 'fg/bg', foreground: 'fg', background: ['bg'], minimum: 4.5 },
    ...['ring', 'input-border', 'border-control'].map((foreground) => ({
      id: `${foreground}/bg`,
      foreground,
      background: ['bg'],
      minimum: 3 as const,
    })),
  ],
};

function context(foreground = '#000000'): TokenContextOutput {
  const token = (name: string, value: string): BuiltToken => ({
    type: 'color',
    value,
    cssVar: `--ns-${name}`,
    path: ['semantic', name],
    resolved: value,
  });
  return {
    preset: tokenPreset('ns-one'),
    scheme: 'light',
    requestedDensity: 'comfortable',
    tokens: Object.fromEntries(
      ['fg', 'bg', 'ring', 'input-border', 'border-control'].map((
        name,
      ) => [name, token(name, name === 'bg' ? '#ffffff' : name === 'fg' ? foreground : '#000000')]),
    ),
  };
}

Deno.test('contrast uses WCAG AA math and source-over alpha on nested surfaces', () => {
  assertEquals(tokenContrastColor.measure('#000000', ['#ffffff'], '#ffffff').ratio, 21);
  const halfBlack = { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0.5, hex: '#000000' };
  const halfWhite = { colorSpace: 'oklch', components: [1, 0, 0], alpha: 0.5, hex: '#ffffff' };
  const text = tokenContrastColor.measure(halfBlack, ['#ffffff'], '#ffffff');
  assertEquals(text.foreground, '#808080');
  assertAlmostEquals(text.ratio, 3.976653024912438, 1e-10);
  const layered = tokenContrastColor.measure(halfWhite, [halfBlack], '#ffffff');
  assertEquals(layered.background, '#808080');
  assertEquals(layered.foreground, '#bfbfbf');
  assertThrows(
    () => tokenContrastColor.measure('#000000', ['#ffffff'], halfWhite),
    Error,
    'opaque preset ground',
  );
});

Deno.test('contrast gate goes red on a seeded AA violation and accepts only its exact exclusion', () => {
  const good = evaluateTokenContrast([context()], coverage, [], tokenContrastColor);
  assertEquals(good.checks, 4);
  assertTokenContrast(good);
  const bad = evaluateTokenContrast([context('#ffffff')], coverage, [], tokenContrastColor);
  assertEquals(bad.failures.length, 1);
  assertEquals(bad.failures[0].ratio, 1);
  assertThrows(() => assertTokenContrast(bad), Error, 'WCAG AA contrast failed');
  const exclusion: TokenContrastExclusion = {
    ...bad.failures[0],
    source: 'Deliberate test fixture',
    reason: 'Prove an exact exclusion cannot hide a different failure.',
  };
  const accepted = evaluateTokenContrast(
    [context('#ffffff')],
    coverage,
    [exclusion],
    tokenContrastColor,
  );
  assertEquals(accepted.excluded.length, 1);
  assertTokenContrast(accepted);
  for (
    const changed of [{ ...exclusion, ratio: 1.1 }, { ...exclusion, foreground: '#eeeeee' }, {
      ...exclusion,
      minimum: 3,
    }]
  ) {
    assertThrows(
      () => evaluateTokenContrast([context('#ffffff')], coverage, [changed], tokenContrastColor),
      Error,
      'Stale or unused',
    );
  }
  assertThrows(
    () => evaluateTokenContrast([context()], coverage, [exclusion], tokenContrastColor),
    Error,
    'Stale or unused',
  );
});

Deno.test('coverage rejects missing foregrounds, backgrounds, focus checks and weakened text thresholds', () => {
  const base = context();
  const missingText = {
    ...coverage,
    pairs: coverage.pairs.filter((pair) => pair.foreground !== 'fg'),
  };
  assertThrows(
    () => evaluateTokenContrast([base], missingText, [], tokenContrastColor),
    Error,
    'Unpaired foreground',
  );
  const missingFocus = {
    ...coverage,
    pairs: coverage.pairs.filter((pair) => pair.foreground !== 'ring'),
  };
  assertThrows(
    () => evaluateTokenContrast([base], missingFocus, [], tokenContrastColor),
    Error,
    'Missing control/focus',
  );
  const weakened = {
    ...coverage,
    pairs: coverage.pairs.map((pair) =>
      pair.foreground === 'fg' ? { ...pair, minimum: 3 as const } : pair
    ),
  };
  assertThrows(
    () => evaluateTokenContrast([base], weakened, [], tokenContrastColor),
    Error,
    'Text contrast threshold',
  );
  const extra = {
    ...base,
    tokens: { ...base.tokens, 'new-bg': { ...base.tokens.bg, cssVar: '--ns-new-bg' } },
  };
  assertThrows(
    () => evaluateTokenContrast([extra], coverage, [], tokenContrastColor),
    Error,
    'Unpaired background',
  );
  assertThrows(
    () => evaluateTokenContrast([], coverage, [], tokenContrastColor),
    Error,
    'No contrast contexts',
  );
});

Deno.test('scheme filters reject malformed applicability and never measure the opposite source scheme', () => {
  for (const schemes of [[], ['invalid'], ['light', 'light']]) {
    const malformed = structuredClone(coverage);
    Object.assign(malformed.pairs[0], { schemes });
    assertThrows(
      () => evaluateTokenContrast([context()], malformed, [], tokenContrastColor),
      Error,
      'contrast schemes',
    );
  }
  const darkOnly: TokenContrastCoverage = {
    ...coverage,
    pairs: [...coverage.pairs, {
      id: 'dark-only-failure',
      foreground: 'bg',
      background: ['bg'],
      minimum: 3,
      schemes: ['dark'],
    }],
  };
  assertEquals(
    evaluateTokenContrast([context()], darkOnly, [], tokenContrastColor).failures.length,
    0,
  );
  const dark = { ...context(), scheme: 'dark' as const };
  assertEquals(evaluateTokenContrast([dark], darkOnly, [], tokenContrastColor).failures.length, 1);
});

Deno.test('chart and syntax coverage cannot disappear or weaken behind generic name heuristics', () => {
  for (const name of ['chart-1', 'chart-l-1', 'code-syntax-comment']) {
    const base = context();
    const extra = {
      ...base,
      tokens: {
        ...base.tokens,
        [name]: { ...base.tokens.fg, cssVar: `--ns-${name}` },
        'code-bg': { ...base.tokens.bg, cssVar: '--ns-code-bg' },
        card: { ...base.tokens.bg, cssVar: '--ns-card' },
        'card-bg': { ...base.tokens.bg, cssVar: '--ns-card-bg' },
      },
    };
    const chart = name.startsWith('chart-');
    const pairs = (chart ? ['bg', 'card-bg', 'card'] : ['code-bg']).map((background) => ({
      id: `${name}/${background}`,
      foreground: name,
      background: [background],
      minimum: chart ? 3 as const : 4.5 as const,
    }));
    const complete: TokenContrastCoverage = {
      ...coverage,
      pairs: [
        ...coverage.pairs,
        { id: 'fg/code-bg', foreground: 'fg', background: ['code-bg'], minimum: 4.5 },
        { id: 'fg/card-bg', foreground: 'fg', background: ['card-bg'], minimum: 4.5 },
        ...pairs,
      ],
    };
    assertTokenContrast(evaluateTokenContrast([extra], complete, [], tokenContrastColor));
    for (const pair of pairs) {
      const removed = {
        ...complete,
        pairs: complete.pairs.filter((candidate) => candidate.id !== pair.id),
      };
      assertThrows(
        () => evaluateTokenContrast([extra], removed, [], tokenContrastColor),
        Error,
        `Missing ${chart ? 'chart' : 'syntax'} contrast coverage`,
      );
    }
    const weakened = {
      ...complete,
      pairs: complete.pairs.map((pair) =>
        pair.foreground === name ? { ...pair, minimum: chart ? 4.5 as const : 3 as const } : pair
      ),
    };
    assertThrows(() => evaluateTokenContrast([extra], weakened, [], tokenContrastColor));
  }
});

Deno.test('owning language chart surfaces and Studio intermediates cannot be omitted', () => {
  const packs: Readonly<Record<string, readonly string[]>> = {
    cupertino: [
      'cupertino-surface-bg',
      'cupertino-surface-card',
      'cupertino-surface-raised',
      'cupertino-surface-well',
    ],
    liquid: [
      'liquid-surface-bg',
      'liquid-surface-card',
      'liquid-surface-raised',
      'liquid-surface-well',
      'liquid-surface-zebra',
    ],
    fluent: ['fluent-solid-base'],
    'studio-utility': [],
  };
  for (const [preset, extra] of Object.entries(packs)) {
    const base = context();
    const foreground = preset === 'studio-utility' ? 'studio-chart-l-1' : 'chart-1';
    const backgrounds = ['bg', 'card-bg', 'card', ...extra];
    const candidate = {
      ...base,
      preset: tokenPreset(preset),
      tokens: {
        ...base.tokens,
        [foreground]: { ...base.tokens.fg, cssVar: `--ns-${foreground}` },
        ...Object.fromEntries(
          backgrounds.map((name) => [name, { ...base.tokens.bg, cssVar: `--ns-${name}` }]),
        ),
      },
    };
    const chartPairs = backgrounds.map((name) => ({
      id: `${foreground}/${name}`,
      foreground,
      background: [name],
      minimum: 3 as const,
    }));
    const complete = { ...coverage, pairs: [...coverage.pairs, ...chartPairs] };
    assertTokenContrast(evaluateTokenContrast([candidate], complete, [], tokenContrastColor));
    for (const pair of chartPairs) {
      assertThrows(
        () =>
          evaluateTokenContrast(
            [candidate],
            { ...complete, pairs: complete.pairs.filter((entry) => entry.id !== pair.id) },
            [],
            tokenContrastColor,
          ),
        Error,
        'Missing chart contrast coverage',
      );
    }
    const weakened = structuredClone(complete);
    Object.assign(weakened.pairs.at(-1)!, { minimum: 2 });
    assertThrows(
      () => evaluateTokenContrast([candidate], weakened, [], tokenContrastColor),
      Error,
      'Invalid contrast pair',
    );
  }
});
