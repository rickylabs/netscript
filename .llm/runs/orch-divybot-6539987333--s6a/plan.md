# Plan & Design — READY FOR REVIEW

## Locked decisions

Deliver Utility only on baseline shipped components/blocks. Use existing data-scope/data-part/variant attributes; CSS uses existing Figma semantic roles, not literal design values. Preserve NS One styling with a Utility preset scope. Do not edit tokens or their contrast allowances. New scaffolds select Studio Utility explicitly; old app configuration wins. Fix generated islands with accessible presentational rendering and registry Button, contain health content, and make the Design link conditional on development because its routes intentionally do not ship.

## Initial coarse outline (superseded by locked S1–S6 inventory below)

1. Defaults and generated pages: CLI application/init and page/island templates, focused regression tests, default docs. Prove selection/legacy behavior, valid generated imports and layout.
2. Utility restyle: existing registry component CSS plus layout/island styles and minimal component state corrections. Cover every baseline registry visual item; reuse existing parts and keep keyboard/runtime contracts. Prove actual rendered light/dark component states, sizes, RTL/reduced motion and legacy preset isolation.
3. Evidence and carriers: compact per-component Figma comparison, generated registry/CLI/docs/publish carriers, tests and final independent review. No screenshot dump in Git.

## Gate set

Structured scoped check, test, lint and fmt; quality:gate (quality:scan + arch:check); JSR package audit; release:preflight; docs:accuracy; all root check:* tasks that apply (report unavailable-input tasks explicitly); token contrast validation without exclusions; registry embedding, agent-docs prose, export corpus, assets barrel and publish assets freshness. Run the exact scaffold.runtime cleanup command once; Docker unavailable means UNPROVEN. Browser evidence uses real component markup, light/dark, rest/hover/focus/active/disabled/invalid/loading as applicable, sizes and RTL/reduced-motion.

## Risks and mitigations

- Shared CSS conflicts with #2488: only baseline items, fetch/merge main before final head, never force push.
- CSS specificity may override native states: assert computed states and legacy isolation in Chromium.
- Figma ledgers differ from spec: ledger wins; record missing roles/gaps without inventing token values.
- Environment/runtime or inherited gates may fail: report exact evidence, retain draft; never READY without required green checks at current head.
- Asset regeneration may change unrelated outputs: inspect diff and restore only run-generated unrelated churn, especially docs/site/deno.lock.

## Open decisions and deferred scope

No unresolved architectural decision. Exact component bindings are implementation detail grounded in ledger/render inspection. Other styles, new gap components, token source corrections and 0.0.8 migration redesign are deferred by owner scope. No new architecture debt planned. The existing token source contrast debt is not reclassified as fixed.

## Review and release

Both evaluations use the explicit Claude Opus 5.5 high override in separate read-only sessions. No self-certification. Do not merge until selected plan review and mandatory implementation review pass. Refs #2419 only; no labels or public session ids. Cockpit merges.

## Locked implementation inventory and per-slice gates

Each slice also updates this run's worklog.md and context-pack.md. Carrier refreshes are a separate final slice; each family changes fewer than 30 source files. Registry inventory is frozen at c6bce8f; no #2488 additions.

S1 (defaults/pages):
- packages/cli/src/kernel/domain/ui/ui-config.ts (new-app preset constant)
- packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts (explicit theme-studio-utility install)
- packages/cli/src/public/features/ui/init/init-ui-command.ts (new unconfigured app selection; existing theme/config retained)
- packages/cli/src/kernel/application/ui/page/web-scaffold.ts and web-scaffold_test.ts
- packages/cli/src/kernel/application/ui/page/query-result-template.ts (app-owned semantic data view emitter)
- packages/cli/src/kernel/assets/resource-slice/(_islands)/ResourceIsland.tsx.template
- packages/cli/src/kernel/assets/app/navigation.ts.template and routes/_layout.tsx.template
- packages/cli/src/kernel/assets/app/routes/(_components)/health-view.tsx.template
- packages/cli/src/public/features/ui/apply/apply-ui-command_test.ts (default and explicit legacy acceptance)
- packages/fresh-ui/README.md and docs/site/web-layer/how-to/customize-fresh-ui.md (actual documentation path verified before edit).
Gate: structured web-scaffold and UI init/apply tests, source check/lint/fmt, generated-page browser route checks at 390/1280 with representative array/object/scalar/empty/loading/error payloads; production Design link absent, development present; health bounding box below header without horizontal overflow.

Preset boundary LOCKED: netscript init passes theme-studio-utility to the existing copy installer. ui:init without preset/theme uses Utility only on an unconfigured app with no generated preset/token configuration; configured and explicit presets are preserved. tokens init retains the existing engine default ns-one for compatibility; tokens build retains generated/configured preset. This PR changes app initialization, not the low-level token default.

S2 (actions/forms) owns registry/components/ui/{button,textarea,form-control-styles,choice-styles,checkbox,switch,label,form-field,search,dropzone,filter-form}.css.
S3 (surfaces/feedback) owns registry/components/ui/{surface-styles,card,panel,badge,avatar,alert-styles,alert,inline-notice,toast,spinner,progress,skeleton,empty-state,separator,section-divider}.css plus badge.tsx if info tone missing and its contract/test entries.
S4 (blocks/navigation/overlays) owns registry/styles/layouts.css and registry/components/ui/{stats-grid,page-header,detail-layout,data-table,responsive-table,pagination,sheet,floating,command-palette,chart-block,donut}.css and registry/islands/theme-toggle.css.
S5 (AI/code/desktop) owns registry/components/ui/{code-block,markdown,message,citation-chip,model-selector,tool-call-card,prompt-input,desktop-tray-menu,desktop-dialog,desktop-notification,desktop-window-chrome,desktop-update-prompt}.css, registry/islands/mcp-ui-widget.css and code-block.tsx only if existing highlighting reuse is needed.
All S2–S5 paths are relative to packages/fresh-ui/. Gate per family: real-component renderer with computed rest/hover/focus/active and applicable state/size checks, light/dark, RTL/reduced motion; legacy NS One CSS isolation, structured Fresh UI tests plus quality:gate. Each family gets a substantive read-only evaluator slice review before sign-off.

S6 (evidence/carriers) owns generated carriers produced by gen:assets-barrel, gen:agent-docs-prose, gen:mcp-export-corpus and gen:publish-assets, plus run-owned renderer/capture/summary and final review. Gate: full declared gate set, exact scaffold.runtime command, fresh carriers, required GitHub checks at exact final head. Split regenerated output into consecutive <=29-file commits if needed, each with run evidence.

## Visual comparison method and acceptance

The explicit operator instruction supersedes the original issue's older threshold wording: 'The reference PNGs are Figma renders, so a threshold diff is not expected to be exact. Explain any visible gap.' Therefore no numerical pixel threshold is invented. Reference = matching Utility PNG under the handoff review/category plus as-built ledger; ledger wins anatomy/state disagreements. Actual shipped components are SSR-rendered from repository sources and captured by Playwright with real CSS and Utility tokens, alongside reference PNGs in a local HTML comparison report. Capture light/dark and mobile/desktop; drive native hover/focus/active, and record disabled/invalid/loading and every shipped size. RTL and reduced motion have computed assertions.

Pass criteria: no unexplained visual gap; every baseline registry component/block has an explicit compared row; typography roles, corners, hairlines, shadow absence, ink interaction colors and status/syntax roles match the handoff. Figma-only unshipped variants/anatomy are recorded as deferred gaps, not added from #2488. Font/platform rasterization differences are documented, not used to excuse wrong roles or geometry. Visible material mismatch blocks the family sign-off. Final evaluator inspects representative images and full per-component gap table.

## Owner authority update during S4

The coordinator relayed the owner's instruction that locked/studio--neutral-ink--{light,dark}.png and locked/studio--states--neutral-ink--{light,dark}.png win over library renders and archetypes. PR #2508 at a43b872 supplies these references; merge main when available. S4 includes square navigation/tab markers and locked table density. Insert S4R after S4 sign-off: reconcile previously reviewed badge/form/surface styles to locked anatomy (outlined status badges with dots, initials-first examples, mono uppercase eyebrows, labels above controls, thick focus and solid ink primary). S4R gets independent review and all family gates before S5. No new theme values; use existing roles/spacing scale.
