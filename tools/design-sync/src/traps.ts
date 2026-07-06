/**
 * The six recorded eis-chat parity traps, encoded as deterministic checks
 * against the built bundle (research.md F9). Each check states its
 * fresh-ui-adapted meaning:
 *
 * - `theme-default`: eis-chat had to patch a dark-default app so unthemed
 *   canvas roots fell to the brand light look. fresh-ui tokens are already
 *   light-default (`:root` = warm cream, `[data-theme='dark']` override), so
 *   here the check *verifies* both halves exist in the closure.
 * - `token-closure`: every `var(--ns-*)` referenced anywhere in the closure
 *   must be defined in it — missing spacing tokens silently zero gaps.
 * - `compiled-css`: the closure must be the full set (tokens + base +
 *   layout objects + every included unit's CSS), never a partial flatten.
 * - `weak-dts`: prop contracts must come from real TypeScript, not
 *   `{ [key: string]: unknown }` bags — cards ship the converted `.tsx` and
 *   a props section in `prompt.md`; units without one are listed.
 * - `render-blank`: floor cards with required props / no children are
 *   predicted blank; authoring effort is directed there (WARN, by design).
 * - `raw-hex`: raw hex in component CSS/TSX outside the token ramp files —
 *   inherited source findings WARN (they feed the sync-back spec), hex in
 *   generated output FAILs.
 */
import type { TrapCheck } from './types.ts';
import type { CardSet } from './previews.ts';
import type { ClosureResult } from './closure.ts';

export interface TrapInput {
  closure: ClosureResult;
  bundleFiles: Map<string, string>;
  /** synthetic package sources — inline-style token assignments count as definitions */
  pkgFiles: Map<string, string>;
  cards: CardSet;
  cardUnits: { unit: string; hasProps: boolean }[];
  expectedCssParts: string[];
}

export function runTraps(input: TrapInput): TrapCheck[] {
  const { closure, bundleFiles, cards } = input;
  const checks: TrapCheck[] = [];

  const hasRootTheme = /:root\s*\{[^}]*--ns-bg\s*:/s.test(closure.css);
  const hasDarkOverride = /\[data-theme='dark'\]/.test(closure.css);
  checks.push({
    id: 'theme-default',
    result: hasRootTheme && hasDarkOverride ? 'PASS' : 'FAIL',
    evidence: `:root token block ${
      hasRootTheme ? 'present' : 'MISSING'
    }; [data-theme='dark'] override ${hasDarkOverride ? 'present' : 'MISSING'}`,
    details: [],
  });

  const defined = new Set<string>();
  for (const m of closure.css.matchAll(/(--ns-[\w-]+)\s*:/g)) defined.add(m[1]);
  // Runtime primitives assign per-instance tokens through inline styles
  // (e.g. the popover anchor name) — those are definitions too.
  for (const [path, content] of input.pkgFiles) {
    if (!/\.(ts|tsx)$/.test(path)) continue;
    for (const m of content.matchAll(/'(--ns-[\w-]+)'\s*:/g)) defined.add(m[1]);
  }
  const missing = new Set<string>();
  // `var(--x, fallback)` is a per-instance override knob, not a gap — only a
  // fallback-less reference to an undefined token breaks rendering.
  for (const m of closure.css.matchAll(/var\(\s*(--ns-[\w-]+)\s*\)/g)) {
    if (!defined.has(m[1])) missing.add(m[1]);
  }
  checks.push({
    id: 'token-closure',
    result: missing.size ? 'FAIL' : 'PASS',
    evidence: `${defined.size} tokens defined; ${missing.size} referenced-but-undefined`,
    details: [...missing].sort(),
  });

  const absentParts = input.expectedCssParts.filter((p) => !closure.parts.includes(p));
  const hasLayouts = /\.ns-stack\b/.test(closure.css) && /\.ns-cluster\b/.test(closure.css);
  checks.push({
    id: 'compiled-css',
    result: absentParts.length === 0 && hasLayouts ? 'PASS' : 'FAIL',
    evidence: `${closure.parts.length} css parts folded; layout objects ${
      hasLayouts ? 'present' : 'MISSING'
    }; ${absentParts.length} expected parts absent (${
      Math.round(closure.css.length / 1024)
    } KiB total)`,
    details: absentParts,
  });

  const weak = input.cardUnits.filter((u) => !u.hasProps).map((u) => u.unit);
  checks.push({
    id: 'weak-dts',
    result: weak.length ? 'WARN' : 'PASS',
    evidence: `${
      input.cardUnits.length - weak.length
    }/${input.cardUnits.length} cards carry a real props contract`,
    details: weak,
  });

  checks.push({
    id: 'render-blank',
    result: cards.predictedBlank.length ? 'WARN' : 'PASS',
    evidence:
      `${cards.authored.length} authored stories; ${cards.predictedBlank.length} floor cards predicted blank`,
    details: cards.predictedBlank,
  });

  const inherited: string[] = [];
  const generated: string[] = [];
  const hexRe = /#[0-9a-fA-F]{3,8}\b/;
  for (const [path, content] of bundleFiles) {
    if (!/\.(css|tsx)$/.test(path)) continue;
    for (const [n, line] of content.split('\n').entries()) {
      if (!hexRe.test(line)) continue;
      // token ramps legitimately carry hex fallbacks next to their oklch values
      if (/--ns-[\w-]+\s*:/.test(line)) continue;
      const hit = `${path}:${n + 1}`;
      // card copies and the concatenated closure carry source-inherited CSS
      const fromSource = path.startsWith('components/') || path === '_ds_bundle.css';
      (fromSource ? inherited : generated).push(hit);
    }
  }
  checks.push({
    id: 'raw-hex',
    result: generated.length ? 'FAIL' : inherited.length ? 'WARN' : 'PASS',
    evidence:
      `${generated.length} hex literals in generated files; ${inherited.length} inherited from source (sync-back candidates)`,
    details: [...generated, ...inherited].slice(0, 40),
  });

  return checks;
}
