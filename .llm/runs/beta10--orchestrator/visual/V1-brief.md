use harness

## SKILL
- netscript-harness

# GLM visual pass V1 — global design-system polish (NS One)

You are a senior product designer doing a **visual-only** refinement pass on the NetScript Dev
Dashboard prototype. Structure, routing (41 hierarchical routes), features, data, and logic are
already DONE by a prior pass — **do not change any route, logic, data, or feature behavior.** Your
job is to raise the VISUAL quality to a premium operator console (Temporal / Inngest / Linear /
Vercel-grade polish). **V1 is the GLOBAL foundation** the later per-screen passes build on — do not
redesign individual screens yet; set the system.

## Working files (edit these directly)
- Markup + logic: `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/render/prototype.dc.html`
- Component styles (most of your work): `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/render/assets/ns-ext.css`
- Prototype styles: `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/render/assets/proto.css`
- **Do NOT edit** `_ds/…/_ns_styles.css` (generated NS One closure) or `support.js` (DC runtime).

## Verify loop (leverage Playwright — see, don't guess)
A static server is already running: **`http://127.0.0.1:8899/prototype.dc.html`**.
Screenshot every screen light+dark with the existing script:
`node /tmp/claude-1000/-home-codex-repos-netscript-beta10/cd2ee104-ed45-4ed4-bcca-f960c60a1d84/scratchpad/shoot5.mjs "http://127.0.0.1:8899/prototype.dc.html" <outdir>`
(chromium at `/home/codex/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome`; playwright is in
that scratchpad's node_modules — run node from there). **Look at the PNGs**, edit CSS, re-render,
compare. After every change: zero `{{ }}` in the rendered DOM and zero console errors, both themes.

## V1 scope — GLOBAL only
- **Spacing & rhythm:** one consistent spatial scale; fix cramped and loose regions; align to a grid.
- **Typography:** a clear hierarchy (display / section / label / body / mono) with consistent
  sizes/weights/line-heights; fonts are DM Sans + DM Mono; tighten heading tracking.
- **Color / tokens:** only `--ns-*` tokens; apply intent colors (primary/success/warning/destructive/
  muted) consistently; **no raw hex**.
- **Surfaces:** unify card/panel/border/shadow (the NS One hard-offset press shadow), the radius
  scale, and hover/active/focus states.
- **Density:** calibrate for a dense operator console — tighten the noisy, breathe the scannable.
- **Dark mode:** every global change must hold in `[data-theme='dark']` (contrast, borders, shadows).
Keep the warm-cream light default + dark; keep raw `ns-*` class markup (it round-trips to Fresh).

## Constraints
Visual only — no route/logic/data/feature changes; do not touch `_ns_styles.css` or `support.js`;
keep zero `{{ }}` in the DOM and zero console errors in both themes after every edit. When done,
write `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/render/_visual-reports/V1-complete.md`
(what you changed, before/after notes, anything deferred to a later cluster).
