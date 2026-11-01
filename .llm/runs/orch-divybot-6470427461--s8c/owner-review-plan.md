# Owner review revision — Plan & Design READY FOR REVIEW

Authority: issue #2455 comment 6472570294 and coordinator instruction. Main fetched and merged normally first (already up to date at ff6215ff7). Five requested fixes, plus investigation/repair of the current test-3 CI failure. No PR merge, rebase, force push or label changes.

## Design checkpoint

- Public surface: intact API symbols in scrollable tables, Utility-spec kind badges, mono package headings without chips, public Design system Docs kit galleries, consistently right-aligned language+Copy metadata.
- Vocabulary: kinds follow merged DESIGN.md exactly. interface/type → keyword; class → type; function/method/component → function; variable/constant/enum → number; module/namespace → fg. Visible labels remain independent of colour.
- Ports: Lume afterRender for Markdown symbols/kind tags, Vento apiTable component, generated semantic colour roles, native nav/Pagefind/AI twins, Playwright browser evidence.
- Constants: API_KINDS remains the canonical kind-to-role mapping. Badge has no fill (transparent background), a 1px solid outline in its generated role colour, generated 2px radius, a 6×6 square dot filled with that same role colour and no rounding, Fragment Mono 11. No new colour values.
- Slice 1: owner review fixes across tools/docs-site/api-kinds.ts, _config.ts, apiTable.vto, styles/components.css + docs.css, design-system-render.ts, gallery relocation under docs/site/design-system/docs-kit/ (with index/navigation), browser regressions and kind-contract test. Gate: docs build/links, tooling/unit/TS wrappers, full browser matrix and visual inspection in both schemes/widths. Independent read-only sign-off before commit.
- Slice 2: regenerate native carriers in order: gen:agent-docs-prose → gen:mcp-export-corpus → gen:assets-barrel → gen:publish-assets. Restore docs/site/deno.lock exactly to origin/main. Inspect every resulting carrier diff and preserve unrelated context. Gate: freshness/exports/snippets/repro/quality and post-commit assets-barrel; refresh CI screenshots after normal push. Full independent IMPL-EVAL uses the same Claude evaluator.
- Deferred: original #2450/#2453 dispositions retained. Additive desktop-native failure remains separately disclosed. Contributor entry remains tools/docs-site/README.md.

## Decisions and proof

1. Symbols stay on one line via white-space:nowrap/normal wrapping with min-content column width; tables get an overflow container. Browser Range geometry proves a single rendered line for every symbol at 390 and 1280 and table overflow stays local.
2. Kind tests assert the merged spec independently of the implementation map; every computed anatomy property is verified in the browser: transparent background, 1px solid border in the generated role, 6×6 role-filled unrounded square dot, generated 2px radius and Fragment Mono 11. Contrast is measured against the actual ancestor/table canvas, not the transparent tag background. fg uses the generated foreground role.
3. h1–h6 code retains heading size/weight, mono font, transparent background, zero padding/border/radius. Browser compares actual H1/code computed style and screenshot.
4. Choose public Design system → Docs kit pages, linked from sidebar and landing navigation. Remove the former internal URLs; update tests to prove correct breadcrumbs, nav links, search lane and Markdown twins instead of claiming privacy.
5. Set a single flexible spacer before language metadata and a fixed language–Copy gap in every header; verify bounding rectangles in filename and mixed-language tab headers after switching.

No unresolved decision blocks implementation. Current test-3 root cause will be read from live current-head logs before any repair; unrelated passing gates remain intact.
