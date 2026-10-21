# Plan — orch-divybot-752--fresh-ui-design-guide

Plan & Design — READY FOR REVIEW

## Goal

Owner goal (harness#752): agents should be able to produce polished design on NetScript easily, with
built-in helpers, a documented guide, and good primitives. Upstream evidence: rickylabs/netscript#2406
(six benchmark agents; 0 of 6 got one consistent look across home, dashboard and a new page; agents
invented `data-ns-theme`, `assets/themes/*.css` and `html:has(...)` because nothing told them the real chain).

This run owns #2406 items 2 and 3 plus the primitives/guide goal. Items 1 and 4 (chrome on every page,
`ui:add page` nav, `netscript-build` skill) belong to sibling session harness#751. See `supervisor.md`.

## Research summary

- The theme is already app-wide by construction: `client.ts` imports `assets/styles.css` on every page;
  `styles.css` imports `tokens.css` (`:root` = light, `[data-theme='dark']` = dark) and `theme-bridge.css`
  (Tailwind v4 `@theme inline`, giving `bg-ns-*`, `text-ns-*`, `p-ns-*`, `rounded-ns-*` utilities);
  `routes/_app.tsx` seeds `data-theme` on `<html>`. Exactly one registry theme ships (`theme-seed`, NS One);
  `--theme <name>` only swaps which `kind: 'theme'` item satisfies theme dependencies.
- **Primitive defect found:** in `tokens.css` every intent tint and border is a hard-coded copper/slate/teal
  `rgba(...)` (`--ns-primary-subtle: rgba(200, 149, 108, 0.1)`), and `--ns-primary-hover`, `--ns-accent`,
  `--ns-ring` point at fixed copper ramp steps. Re-pointing `--ns-primary` therefore leaves copper tints,
  hover states, focus rings and accent surfaces behind: a rebrand needs ~20 coordinated edits per theme.
  Registry component CSS is clean (only semantic `--ns-*` tokens), so the fix is entirely in the token source.
- The generated `tokens.css` header still says Style Dictionary is the "planned direction"; it already is
  the generator. The copied file is the first thing an agent opens and it explains nothing.
- App guidance (`apps/<app>/AGENTS.md`, `WEB-LAYER.md`) has no styling or theming section at all.
- MCP: neither `customize-fresh-ui` nor any design page is in `MCP_EMBEDDED_DOC_PATHS`; `GUIDANCE_CONCEPTS`
  has no theming/design concept, so `find_guidance` cannot route "theme"/"restyle" intents.
- `tokens:build` fails under the frozen lock (lru-cache@6 resolved for path-scurry); the `--no-lock` run is
  byte-identical to the committed output. Not in CI. Recorded as a caveat, not fixed here (lock hygiene).

## Locked decisions

1. **Derive, don't duplicate.** Intent tints/borders become `color-mix(in oklab, var(--ns-<intent>) N%, transparent)`
   with today's alpha percentages per theme; hovers become `color-mix(in oklab, var(--ns-<intent>) 86%, black)`;
   `--ns-accent`, `--ns-accent-fg` and `--ns-ring` follow `--ns-primary` / `--ns-primary-fg`. No new token names,
   so the Tailwind bridge and every component stay unchanged. `color-mix()` is already used by registry CSS.
2. **One theming mechanism.** No preset attribute, no `themes/` folder, no new registry theme item. Brand
   presets are documented copy-paste `:root` / `[data-theme='dark']` blocks; with decision 1 a preset is ~4 lines.
3. **Agent-first guide.** New how-to `web-layer/how-to/design-with-fresh-ui` (page anatomy, block recipes,
   rebrand recipe + presets, do/don't, verification). `customize-fresh-ui` gets an accurate theme-chain section
   and points at it. Both go into the MCP embedded corpus; the budget constant rises with a rationale.
4. **Guidance reaches agents without docs-site access:** app `AGENTS.md` gains a "Design and theming" section
   (every backticked path is a declared, scaffold-resolvable reference); MCP gains a `theming-and-design`
   guidance concept routed to the new guide's headings.

## PLAN-EVAL

Not selected (risk-selected per leaf profile). Rationale: no public API or archetype change, no new
package surface, every change is additive or value-preserving and reversible; the one visual change (derived
tints/hover) is verified by a browser render of a real scaffold in both themes. IMPL-EVAL stays mandatory.

## Design checkpoint

Mirrored in `worklog.md`.

1. **Public surface** — (a) `@netscript/fresh-ui` theme-seed files `tokens.css` / `tokens.json`: same token
   names, new derived values; header documents the chain. (b) Generated `apps/<app>/AGENTS.md` and
   `WEB-LAYER.md`: new Design and theming section. (c) Docs: new page `/web-layer/how-to/design-with-fresh-ui/`,
   rewritten theme section in `/web-layer/how-to/customize-fresh-ui/`. (d) MCP: both pages in the embedded
   corpus; `find_guidance` routes theme/design intents to them.
2. **Domain vocabulary** — *brand knobs*: the few tokens a rebrand edits (`--ns-primary`, `--ns-primary-fg`,
   optional `--ns-accent`, fonts, radius scale). *Derived tokens*: tints, borders, hovers, accent, ring that
   follow a knob through `color-mix()`/`var()`. *Theme chain*: `tokens.css` → `theme-bridge.css` →
   `styles.css` → `client.ts` → `<html data-theme>`. *App chrome*: `routes/_layout.tsx` (harness#751's area).
3. **Ports** — none new. The MCP change plugs into the existing `GuidanceConcept` table consumed by the
   shared guidance index; the docs change plugs into `DocsCorpusPort` via the existing embedded carrier.
4. **Constants** — `MCP_EMBEDDED_DOC_PATHS` / `MCP_EMBEDDED_DOCS_MAX_BYTES` (with rationale comment);
   the derived-token alpha percentages live once, in the DTCG sources; the guidance concept name
   `theming-and-design`; agent-conventions reference ids (`app-tokens`, `app-shell`, `app-layout`, `design-tokens-route`).
5. **Commit slices** (gate per slice):
   - S0 run dir + plan (no gate; review surface).
   - S1 derived tokens: DTCG sources + `build-tokens.ts` header + regenerated `registry/theme/*` +
     `registry.generated.ts`/CLI carriers + `tests/registry/theme-tokens.test.ts`. Gate: fresh-ui test/check/lint,
     `--no-lock` tokens build reproducibility, `check:assets-barrel`, browser render of a scaffold (both themes).
   - S2 docs: new design guide, customize-fresh-ui theme chain, xref + how-to index + web-layer card.
     Gate: `docs/site` build (source-format + rendered-output), `docs:links`, `docs:accuracy`.
   - S3 MCP: embedded paths + budget, `theming-and-design` concept, regenerated carriers,
     `tests/theming-guidance_test.ts` (filesystem + embedded corpus). Gate: mcp tests, `check:publish-assets`,
     `check:agent-docs-prose`.
   - S4 app guidance: `agent-conventions.ts` Design and theming section + tests (declared references resolve
     in a scaffold). Gate: CLI conventions tests, `public-command-tree_test.ts` conventions case.
   - S5 close: IMPL-EVAL, caveats issue, context-pack, lesson.
6. **Deferred scope** — chrome/nav/`ui:add page` and the `netscript-build` skill (harness#751);
   `styles.css` tail preservation (harness#751); a second shipped theme item or runtime theme switcher
   (one mechanism is the point; presets are docs); a `Page` shell component (layout objects + PageHeader
   already compose a page; revisit after #751's generated page body lands); fixing the broken tokens lock
   (lock churn needs approval); `contrast-color()` auto foreground (not baseline yet). All recorded in the caveats issue.
7. **Contributor path** — `docs/site/web-layer/how-to/design-with-fresh-ui.md` for people and agents
   designing pages; `packages/fresh-ui/tokens/semantic.tokens.json` (+ `themes/light.tokens.json`) for anyone
   changing what a knob derives.
