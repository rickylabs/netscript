/**
 * ClosureBuilder port: produce the full CSS closure the canvas needs.
 *
 * eis-chat's hard-won rule was "ship the compiled Tailwind closure, never a
 * hand-flattened subset" — because its components referenced Tailwind
 * `*-ns-*` utilities that only exist after a build. Today's fresh-ui
 * registry has **zero Tailwind utility classes** (verified: semantic `ns-*`
 * classes with paired per-component CSS only), so the complete closure is a
 * deterministic concatenation:
 *
 *   fonts → tokens.css → base rules → layouts.css → per-unit component CSS
 *
 * The only Tailwind-entangled file is `theme/styles.css` (an `@import
 * 'tailwindcss'` entry with `@apply` rules); its `@layer base` intent is
 * re-expressed below as plain CSS against `--ns-*` vars. `theme-bridge.css`
 * (a Tailwind v4 `@theme inline` bridge for consumer apps) is deliberately
 * omitted — it defines utilities-facing aliases, not rendered styles.
 */
import type { RegistryUnit, SyncConfig } from './types.ts';
import { fwd } from './config.ts';

/**
 * `theme/styles.css` `@layer base`, hand-mapped from `@apply` to vars.
 * Kept intentionally small: html/body ground, heading rhythm, media reset.
 */
const BASE_RULES = `/* base rules (mapped from fresh-ui theme/styles.css @layer base) */
html {
  background: var(--ns-bg);
  color: var(--ns-fg);
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  margin: 0;
  background: var(--ns-bg);
  color: var(--ns-fg);
  font-family: var(--ns-font-sans);
  font-size: var(--ns-text-base, 1rem);
  line-height: var(--ns-leading-normal, 1.5);
  min-height: 100vh;
  transition: background-color 0.2s ease, color 0.2s ease;
}
a, button { touch-action: manipulation; }
h1, h2, h3, h4 {
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-wrap: balance;
}
code, pre, kbd, samp { font-family: var(--ns-font-mono); }
img, svg, video { max-width: 100%; height: auto; }
`;

/**
 * Host-environment equivalence layer (drift D5).
 *
 * A scaffolded Fresh app serves the registry with Tailwind active: preflight
 * gives every element `box-sizing: border-box` + zeroed solid borders, and the
 * JIT emits the utility classes the seven L3 blocks (DataTable, StatsGrid,
 * PageHeader, Pagination, DetailLayout, FilterForm, EmptyState) still carry in
 * their TSX. The canvas page has neither, so those blocks collapsed (no grid,
 * no dividers, no padding) and `width:100%` form controls bled past their
 * padding. This layer re-expresses exactly that host surface — the preflight
 * subset plus the closed set of utilities present in the runtime (enumerated
 * from the bundle; nothing speculative) — mapped onto `--ns-*` tokens.
 *
 * Remove once #509 converts the blocks to semantic `ns-*` classes.
 */
const HOST_ENV_RULES =
  `/* host-env layer: Tailwind preflight subset + the runtime's utility set (drift D5, issue 509) */
*, *::before, *::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: currentColor; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.flex-1 { flex: 1 1 0%; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.items-baseline { align-items: baseline; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.h-px { height: 1px; }
.h-9 { height: 2.25rem; }
.w-9 { width: 2.25rem; }
.min-w-0 { min-width: 0; }
.overflow-hidden { overflow: hidden; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.rounded-md { border-radius: 0.375rem; }
.border { border-width: 1px; }
.border-t { border-top-width: 1px; }
.border-dashed { border-style: dashed; }
.border-ns-border { border-color: var(--ns-border); }
.divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px; }
.divide-ns-border > :not([hidden]) ~ :not([hidden]) { border-color: var(--ns-border); }
.bg-transparent { background-color: transparent; }
.bg-ns-border { background-color: var(--ns-border); }
.text-ns-fg { color: var(--ns-fg); }
.text-ns-muted-fg { color: var(--ns-muted-fg); }
.text-ns-destructive { color: var(--ns-destructive); }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-\\[0\\.65rem\\] { font-size: 0.65rem; }
.text-\\[0\\.7rem\\] { font-size: 0.7rem; }
.font-mono { font-family: var(--ns-font-mono); }
.font-semibold { font-weight: 600; }
.leading-none { line-height: 1; }
.leading-relaxed { line-height: 1.625; }
.tracking-tight { letter-spacing: -0.025em; }
.tracking-\\[0\\.12em\\] { letter-spacing: 0.12em; }
.tracking-\\[0\\.18em\\] { letter-spacing: 0.18em; }
.tabular-nums { font-variant-numeric: tabular-nums; }
.uppercase { text-transform: uppercase; }
.transition-colors { transition-property: color, background-color, border-color; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-150 { transition-duration: 150ms; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
.hover\\:bg-ns-surface-raised:hover { background-color: var(--ns-surface-raised); }
.hover\\:border-ns-border-hover:hover { border-color: var(--ns-border-hover); }
.hover\\:text-ns-fg:hover { color: var(--ns-fg); }
@media (min-width: 640px) {
  .sm\\:flex-row { flex-direction: row; }
  .sm\\:items-end { align-items: flex-end; }
  .sm\\:justify-between { justify-content: space-between; }
}
@media (min-width: 768px) {
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1280px) {
  .xl\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .xl\\:items-start { align-items: flex-start; }
  .xl\\:justify-end { justify-content: flex-end; }
}
`;

export interface ClosureResult {
  /** the full `_ns_styles.css` content */
  css: string;
  /** ordered registry paths folded into the closure */
  parts: string[];
}

export interface ClosureBuilder {
  build(units: RegistryUnit[]): Promise<ClosureResult>;
}

export class RegistryConcatClosureBuilder implements ClosureBuilder {
  constructor(private readonly cfg: SyncConfig) {}

  async build(units: RegistryUnit[]): Promise<ClosureResult> {
    const root = `${this.cfg.repoRoot}/${fwd(this.cfg.registry.root)}`;
    const parts: string[] = [];
    const chunks: string[] = [
      '/* NS One canvas closure — generated by tools/design-sync (do not edit) */',
    ];

    const tokensPath = 'registry/theme/tokens.css';
    chunks.push(`/* == ${tokensPath} == */`, await Deno.readTextFile(`${root}/${tokensPath}`));
    parts.push(tokensPath);

    chunks.push('/* == base == */', BASE_RULES);
    chunks.push('/* == host-env == */', HOST_ENV_RULES);

    const layoutsPath = 'registry/styles/layouts.css';
    chunks.push(`/* == ${layoutsPath} == */`, await Deno.readTextFile(`${root}/${layoutsPath}`));
    parts.push(layoutsPath);

    const seen = new Set<string>([tokensPath, layoutsPath]);
    for (const unit of units) {
      if (unit.excluded) continue;
      for (const src of unit.sources) {
        if (!src.registryPath.endsWith('.css') || seen.has(src.registryPath)) continue;
        // theme entries handled above; the Tailwind entry + bridge are omitted by design
        if (
          src.registryPath === 'registry/theme/styles.css' ||
          src.registryPath === 'registry/theme/theme-bridge.css'
        ) {
          seen.add(src.registryPath);
          continue;
        }
        seen.add(src.registryPath);
        chunks.push(`/* == ${src.registryPath} (${unit.item.name}) == */`, src.content);
        parts.push(src.registryPath);
      }
    }

    return { css: `${chunks.join('\n\n')}\n`, parts };
  }
}
