# Research — design-route-prod-gate--plan

## Re-baseline

- Carried-in source: issue #1481, RFC 0005 §5, and the staged lane brief in `implement.md`.
- Re-derived against `origin/main` at `850cc7757d11d420b9061dbe6a61536357ab77fe` on 2026-09-02.
- Branch state: the harness brief commit `56c1707f957b32bea7be83c92ee58eac6e606ca0` is the only commit above the requested baseline before this plan.
- Baseline correction: RFC 0005 left production intent unverified; current repository prose is sufficient to classify `/design` as a scaffolded developer reference, but contains no affirmative production-user contract.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| F1 | The positioning brief says a scaffolded project “ships” a Fresh app with app-owned UI and `/design` token/component reference routes. “Ships” describes scaffold contents in a list of generated workspace capabilities; it does not state deployed production reachability. | `docs/site/_plan/01-positioning-brief.md:26-32` |
| F2 | The canonical web-layer page calls `(design)` a live token/component/composition “gallery” for inspecting app-owned copies while editing them. | `docs/site/web-layer/fresh-ui.md:193-206` |
| F3 | The customization how-to places `/design` immediately after `aspire start` and `deno task ... dev`, and says to open it “before changing anything” as the fastest way to inspect the current theme. | `docs/site/web-layer/how-to/customize-fresh-ui.md:50-67` |
| F4 | Generated app templates call `/design` a “Design reference,” “Living index,” and “Browse design”; those links explain the current reachability defect but do not describe a product-facing route. | `packages/cli/src/kernel/assets/app/routes/index.tsx.template:32-36`; `packages/cli/src/kernel/assets/app/routes/(_components)/home-view.tsx.template:31-43`; `packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template:93-96` |
| F5 | The generated root README documents the Fresh app only through its Vite development task and does not mention `/design` or promise it as deployed functionality. | `packages/cli/src/kernel/templates/workspace/generate-readme.ts:50-76,127-163` |
| F6 | RFC 0005 H-4 requires independent structural and fail-safe runtime exclusions; H-8 classifies the ungated `(design)` group as the same defect class. | `rfcs/0005-devtools-contribution.md:752-789,859-870` |
| F7 | Fresh Vite 1.1.2 exposes `FreshViteConfig.ignore?: RegExp[]`, so the generated Vite config can exclude the route group from the production crawl without changing `packages/fresh`. | `deno doc --filter FreshViteConfig jsr:@fresh/plugin-vite@1.1.2`; `packages/cli/src/kernel/assets/app/vite.config.ts.template:11-42` |
| F8 | The scaffold writer always creates and emits every `(design)` directory/file today, and the manifest/embedded barrel carry each template. | `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:92-101,135-145,214-220,257-269`; `packages/cli/src/kernel/assets/manifest.ts:4-35` |
| F9 | `deno task check:assets-barrel` regenerates generated assets before diffing; `.llm/tools/generate-cli-assets-barrel.ts --check` compares without writing. This is the #1657 E-1 freshness proof required after template edits. | `deno.json:117`; `.llm/tools/generate-cli-assets-barrel.ts:118-145,422-465` |
| F10 | `generated.quality-negative` is the closest existing non-vacuity pattern: it plants deliberate failures, proves the generated gate detects them, restores the fixture, and finishes green. | `packages/cli/e2e/src/application/gates/scaffold/generated-quality-gate.ts:6-26`; `packages/cli/e2e/src/application/gates/scaffold/generated-quality-probes.ts:69-160` |
| F11 | The scaffold gate directory is already over the doctrine cardinality cap; its debt stop condition forbids another sibling gate directory/file without first splitting the old runtime registry. | `.llm/harness/debt/arch-debt.md:2243-2273` |

## JSR-audit surface scan

- Planned public surface: no change to `packages/cli/deno.json`, root/subpath exports, `mod.ts`, binaries, command names, public types, or JSDoc.
- Publish-shape relevance: template content remains publishable only through the checked-in string-constant barrel; therefore regenerating `embedded.generated.ts` and passing its freshness check are required.
- Slow-type/API risk: none introduced by the planned surface because no exported signature changes. Full publish dry-run/doc-score work is not a slice-specific planning gate; the later package gates still include the configured quality/doctrine checks.

## Open questions resolved

- **Is `/design` intended for production users?** No affirmative production intent exists. The evidence consistently defines it as an app-owned developer reference/gallery used in the local Vite/Aspire customization loop. Ruling: development-only by default; production exclusion is the contract for this slice.
- **Can this slice deliver both RFC mechanisms?** Yes. Fresh’s Vite `mode` controls structural crawl exclusion; the route middleware uses a separate runtime environment signal with `!== 'development'` polarity.
- **Should a production opt-in be added now?** No. Nothing in the current product contract requires one. It is safe to defer; if requested later, it must require independent structural and runtime acknowledgements rather than one shared bypass.
