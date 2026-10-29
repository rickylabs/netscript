# Worklog

## Design

1. Public surface: accurate docs and generated agent prose; no framework API change.
2. Domain vocabulary: allocated endpoints, typed service client, contract operations, page pagination.
3. Ports: current scaffold templates, CLI command registrations, MCP public tool registry.
4. Constants: releaseSpecifier; canonical install command and verified public help groups. Runtime endpoints come from Aspire.
5. Commit slices: source corrections and prose carrier; remaining generated carriers; final gate/review evidence. Each updates this run and proves its stated gates.
6. Deferred scope: comparisons rewrite follows on its existing branch; unrelated package README/API defects get explicit follow-up records.
7. Contributor path: .llm/runs/docs-content-pass/integration-tracker.md and the referenced source files.

PLAN-EVAL: N/A — owner-defined corrections and fixed integration sequence, no unresolved architecture decision.

## Routing override

Owner grant, verbatim: "Claude is at its weekly limit." "Evaluate with Gemini 4 Argon, read-only: agy -p --mode plan --model gemini-4-argon-high, given the PR diff and these acceptance points, blockers only. Fix once and re-evaluate." Matrix feature row was queried during bootstrap; separate-session and different-family evaluation retained.

## Main integration

Renderer #2469 merged as 26a0bb78ad85bf08eacf893b1d550ed4759bb452 after independent MERGE at a4c8bc3 and fully green CI, including the docs browser. Merge main with --no-ff. Keep main's corrected alert renderer and fixtures; retain content wording around tree fences. Use main's generated prose/MCP carriers as the fixed input before the one final regeneration, preserving upstream non-site context.

## Source checkpoint

Corrected dashboard/OTLP allocation and anonymous local access; canonical install/help from live CLI (including tokens and ui:init); MCP discovery and typed calls; six auth operations and app BFF callback; worker authoring path; current generated repository/application catalog handlers; catalog data/page shape versus dashboard items/offset read-model; default dashboard app paths and pagination conversion; real redirect targets.

Focused structured test runner: PASS, 6 root results covering navigation, authored callout corpus, renderer bridge and executable quickstart command parity. Site verify: PASS, 254 pages, 23,540 links, 13 caveat markers across 11 pages.

The next generation commits are checkpoints, not implementation sign-off. Terminal sign-off remains gated on all requested checks and independent evaluation.

Prose generation: PASS. Carrier has 202 stored entries; all 2 upstream non-site entries retain identical decoded bytes.

## Remaining carrier generation

MCP export corpus: PASS, 35 packages, 301 subpaths, 8,926 symbols; corpus bytes unchanged. Asset barrel: PASS with no diff. Publish assets: PASS, refreshed MCP embedded docs for the content pass. No lock changes. Full requested checks are next.

## Full checks

All root check:* tasks ran. All passed except Aspire manifest freshness. Regenerated the existing manifest with aspire-surface-manifest.ts: one path added, zero unmatched paths, no ownership-rule or version change. Targeted parity recheck follows this commit. docs:links, docs:snippets, docs:accuracy, docs:exports-drift, docs:readme-fences and final site verify passed. See gates.md. Source follow-ups requested by the tracker are filed together in #2472; no duplicate open issue covered them.

## Independent review repair

Round 1: FIX at 0341506. Removed the invisible HTML placeholder; completed fixed-port removal across tables, callouts and checklists; aligned project authoring paths; rewrote duplicated endpoint sentences; replaced cart OpenAPILink URL with SDK discovery. Updated the surrounding cart and listener explanation so it matches the replacement code.

Additional local docs browser: PASS, 124 tests, four light/dark and 390/1280 combinations. Initial launch used the wrong dependency folder; pointing LD_LIBRARY_PATH at the existing project-owned Chromium libraries fixed it without system changes.

Full CLI runtime one-pass attempt: UNPROVEN (Docker daemon unavailable at preflight; cleanup could not inspect Docker). No runtime behavior changed in this docs PR. Read-only leak-check ran; foreign resources left untouched. This is not reported as a passing runtime smoke.
