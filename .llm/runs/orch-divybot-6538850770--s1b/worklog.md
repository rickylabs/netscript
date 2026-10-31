# Worklog

## Design checkpoint
1. Public surface: tokens builder/preset catalog, registered WEB names, generated theme CSS and contrast reports; additive presets and Theme set metadata, no command additions.
2. Domain vocabulary: Theme set selects A (Theme) or B (Theme B); scheme selects Light/Dark; Studio flavor and source density keep their own active collection modes; faithful presets use exact exported values.
3. Ports: existing TokenSources, FigmaCollection and TokenContrastPort; existing Style Dictionary/Color.js adapters; filesystem only in scripts.
4. Constants: preset routing in TOKEN_PRESETS/figmaModes; collection routing names centralized as needed; contrast thresholds use TEXT_CONTRAST_MINIMUM/CONTROL_CONTRAST_MINIMUM. Registry and pair JSON own role names.
5. Commit slices: ordered bootstrap/source/plan, token implementation, carriers/integration; see plan.md for touched surfaces and gates.
6. Deferred scope: Figma value corrections/contrast burn-down, free density schema expansion, merging/publication.
7. Contributor path: packages/fresh-ui/tokens/README.md.

## Research
- #2493 is open and only exports values; no existing PR implements this assigned token resolver change. No orchid-triage comment exists on #2450.
- Read the fresh source README and PR notes. Exact export has 9 collections / 2186 variables / 4859 aliases; current code embeds seven collections.
- Consulted S1/S2 memories first: use package frozen lock, gzip TS assets, preserve exact NS One, canonical release preflight, all four carriers, runtime UNPROVEN if prerequisites unavailable.
- Owner override (verbatim): `PLAN-EVAL and IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high, read-only.` Separate Anthropic evaluation from OpenAI implementation.
- Owner process overrides contradictory generic boilerplate: draft, Refs #2450 only, no labels/session ids, exact-head green before READY.

## PLAN-EVAL round 1

FAIL_PLAN: old overlays, chart surfaces and new preset axes were underspecified. Plan now removes core overlays, names exact per-language chart surfaces/foregrounds, locks six new presets and documents four id value changes. Also specifies new style/opacity types, duplicate-name rejection, provenance, exact exclusions, and complete gates. Re-steering the same read-only evaluator; no implementation begun.

## Plan gate PASS and pre-code conditions

Round 2 PASS (plan-eval-round2.md). C1 schema-valid encoding locked in updated plan: Italic uses fontWeight regular carrier with exact css and figmaStyle extensions; BuiltToken carries sourceStyle for lossless Figma style output. No unsupported string type. C2 all affected value changes recorded in drift. C3 Theme set field is optional/additive (`themeSet?: 'A' | 'B'`, default A for callers); every built-in preset sets it explicitly. themeMode documents the selected Theme or Theme B collection. Contrast schemes and metadata route fields are optional/additive. Report paths: failing-pairs.json and failing-pairs.md in this run directory. No implementation code was written before this PASS.

## Token implementation and independent slice review

Implemented nine-collection import, A/B routing constants and optional preset contract; 24 distinct presets including macos-27, apple-classic and fluent-2-web. All three faithful modes resolve completely, including fonts and generated assets. Non-NS-One exported values compare exactly to source primitives. Four rule-width migrations retained. Every unexpected duplicate, router miswire and orphan migration fails closed.

Independent read-only slice review: slice-review.md. Addressed chip-fill classification (tooltip/kbd), avoidable NS One code background override, router identity/orphan guard, inactive collection test in both directions, pack/Studio chart negative controls, app-versus-catalog comparison, and verified snapshot provenance. Mixed emphasis style/weight source name recorded as bounded A1/A2 debt, with consumer cost documented. No third-party resource mutations.

Final current report: 9,132 contrast uses / 531 still-failing exact pairs, including 6 Liquid dark chart rows (3 source colors measured under both Scheme and matching dark intermediate names). All seven syntax roles pass against their designed code surfaces. JSON and short per-context worst-pair table: failing-pairs.json / failing-pairs.md. Contrast burn-down OPEN.

| Gate | Current evidence |
| --- | --- |
| Core structured tests | core-final-tests.json: 20 pass / 0 fail |
| Package structured check | package-final-check.json: 264 files, 0 findings |
| Scoped lint / format | token-final-lint.json / token-final-fmt.json: 37 files, 0 findings |
| Full token/build/report/publish regressions | token-final-tests.json: running against regenerated source and carriers |
| Source schemas/names/resolver | 96 inputs, 1,144 importer roles + 36 component roles; 1,180 registered outputs |
| release:preflight | PASS all four scans |
| docs:accuracy | PASS; public command census unchanged (111 direct / 176 recursive paths) |
| quality:gate | PASS with inherited warnings, baseline matched |
| scaffold.runtime | raw exit 1 at Aspire doctor/cleanup; UNPROVEN because Docker daemon unavailable; runtime.log |
| Resource hygiene | read-only leak check: 25 unknown-owner apphosts/processes, 0 owned survivors; left untouched; Docker inspection unavailable |

Initial full regression pass found real CSS-budget and NS One provenance gaps plus generated-fixture timing; repaired source and regenerated before final run. Initial 8,350-byte web gzip exceeded unchanged 6,000-byte budget; current policy excludes unused Theme set inputs from NS One only, preserves alias dependency closure, and uses the S0 compatibility palette for new NS One surface names. Final web gzip measurement follows in output tests. No non-NS-One source values altered.

## Reconcile — token slice

PR #2495 remains draft, Refs #2450, no labels. #2493 still supplies source-only work; branch includes its exact approved snapshot plus hash-bound provenance. Plan review PASS precedes implementation. Run context updated with this slice. Generated outputs necessarily span many files but remain one deterministic build set.

Token slice sign-off: independent slice-review-followup.md says TOKEN SLICE APPROVED conditional on full regressions. Condition met: token-final-tests.json exit 0, 41 passed / 0 failed, including frozen output and native 5-MB publish budget. Source-only annotations clarified and a semantic name fixture from immutable baseline ad252e8c8 added to assert the default CSS preserves all prior declared names. The token output regression is rerun for that added compatibility assertion during integration. Native payload before registry documentation additions: 142 files, 4,289,738 bytes / 5,000,000.

Registry integration checks independently found five failures: missing six authored theme items/docs, preview order, and frozen legacy equality including intended additions. These are integration work for the next slice; frozen legacy-v1.json remains unchanged. Add source-backed documents and synchronize theme/previews from the engine, while retaining a strict assertion for all original items and an explicit check for the complete extension set.

## Registry/carrier integration

Added scripts/sync-theme-registry.ts to tokens:build/check so all 24 generated preset items and the ordered preview file inventory stay synchronized with registry.json. Added exact-source token usage documents for Ledger, Signal, Glass, macOS 27, Apple Classic and Fluent 2 Web, consumed through copied registry theme skills. Preserved the immutable legacy registry baseline; tests compare original items exactly and validate the full new theme/preview extension separately. Replaced fixed total counts with complete name-set checks for design-sync and full authored-payload preservation for schema validation.

Integration evidence: registry-integration-tests-final.json 11/0; integration-package-check-final.json 265 files / 0 findings; integration-lint.json 10 files / 0 findings; registry-template-lint.json 1 file / 0 findings; css-compatibility-tests.json PASS including immutable baseline declaration superset and 6,000-byte web gzip cap. quality-receipt.json is canonical run-gate PASS at f836d0256 (uncommitted integration changes were present; receipt certifies the command, not immutable source completeness). Full registry/component rerun and root check underway.

Carriers regenerated: prose, MCP export corpus (explicit --allow-dirty preview pending clean-source regeneration), assets barrel and publish assets. Source hash/field changes are reflected; no exported command added. All eight non-carrier root check:* tasks pass; review-threads passes with 0 threads. Four carrier checks are running against staged generated output, preserving git-diff freshness semantics. No root or docs-site lock changes.

Existing full JSR auditor flags contracts.json lacking @module (unchanged export and unchanged checker); native dry run succeeds. Doc lint remains exactly 124 baseline diagnostics (96 private-type-ref, 28 missing-jsdoc, 0 other), tokens.ts remains clean. Updated existing directory-cardinality debt metrics for 48 preset files and 34 Figma files. These inherited audit limitations are not described as green.

## Final review repair and integration checkpoint

IMPL-EVAL round 1: FAIL_FIX (evaluate.md). Sole blocker: six token notes were mistakenly placed in the full theme-spec catalogue, causing Lume's mandatory front matter/sections/preview validation to fail. Moved them to docs/design-system/token-presets/, selected those source notes only when no full language spec exists, and made the embedding generator follow declared copied-skill targets. No fake images or invented visual specification added. Relocated theme-doc/registry regressions pass 10/0. The complete registry/component run before this location fix passed 283/0; post-doc full token run is underway.

All four repaired carrier gates now have canonical run-gate receipts: fixed-assets, fixed-corpus, fixed-prose, fixed-publish — each PASS, exit 0. Root structured check completed: 3,996 files, 34 batches, 0 findings. CLI token regressions pass 10/0. Current native publish budget regression passes. Immutable baseline CSS declaration superset + web gzip budget pass.

This next commit is the source-clean integration checkpoint needed by the corpus generator; final independent sign-off follows clean-source carrier regeneration and renewed immutable-head quality evidence. Final READY remains gated on exact-head remote checks. No root/docs-site lock churn.

## Clean-source final gate evidence (f12d6388d)

Product source and carriers are committed and unchanged in the worktree. `gen:mcp-export-corpus` ran WITHOUT --allow-dirty, followed by assets and publish generation; it produced no source/carrier diff. Clean corpus SHA256 a0a9f291457b483976f0ff37c7f690e93d5da3dafe64c3dfc0709734d384b06a.

| Gate | Result / evidence |
| --- | --- |
| Quality + architecture/dependencies | clean-quality-receipt.json PASS, exit 0, f12d6388d |
| check:assets-barrel | clean-assets-receipt.json PASS, exit 0, f12d6388d |
| check:agent-docs-prose | clean-prose-receipt.json PASS, exit 0, f12d6388d; real Lume build/rendered-output |
| check:mcp-export-corpus | clean-corpus-receipt.json PASS, exit 0, f12d6388d |
| check:publish-assets | clean-publish-receipt.json PASS, exit 0, f12d6388d |
| docs:accuracy | docs-accuracy-receipt.json PASS, exit 0, f12d6388d |
| release:preflight | final-release-preflight.log PASS, exit 0, all four scans |
| Full token/build/report/publish regressions after docs fix | post-doc-token-tests.json exit 0, 41 passed / 0 failed |
| Relocated copied-theme-doc tests | relocated-theme-doc-tests.json exit 0, 10 passed / 0 failed |
| Full registry/component suite | registry-complete-tests.json exit 0, 283 passed / 0 failed |
| CLI token regressions | cli-token-tests.json exit 0, 10 passed / 0 failed |
| Package check after documentation-root fix | fixed-integration-check.json 265 files, 0 findings |
| Integration lint after documentation-root fix | fixed-integration-lint.json 13 files, 0 findings |
| Root check | root-check.json: 3996 files / 34 batches / 0 findings, exit 0 |
| Token freshness / authored inventory | token-freshness-receipt.json PASS, exit 0; 88 outputs / 96 inputs / 24 authored themes |
| Other root check:* tasks | all 8 static tasks + review-threads exit 0; per-task logs retained |
| Runtime | UNPROVEN, exact one-pass attempt exit 1 at Aspire/Docker prerequisites |
| Whole-package doclint / JSR audit | inherited baseline diagnostics recorded, not claimed green |

No root or docs-site lock churn. No labels. Mixed emphasis debt and directory-cardinality debt remain explicitly recorded. Source docs location repair complete; requesting same-session IMPL-EVAL round 2. Remote required checks are still draft SKIPPED and do not establish READY.

## Final independent sign-off

Same-session read-only IMPL-EVAL round 2 PASS in evaluate.md, certifying implementation/local gates at product source f12d6388d. Prior FAIL_FIX preserved in evaluate-round1.md. No product changes after that checkpoint; this commit contains run evidence only. Native final payload: 142 files / 4,294,002 bytes / 5,000,000 budget. Complete post-doc token run41/0; registry283/0; CLI10/0; root3996files0; all 13 check:* tasks pass with raw-exit receipts for the carriers.

PR #2495 carries the originating issue's 0.0.9 milestone, no labels, Refs #2450 only. Figma burn-down OPEN. READY is deliberately not posted yet: draft quality/check-test/deps-report statuses are skipped. After this evidence commit, mark ready for review to schedule real CI, verify required contexts at the exact PR head, and publish final proof externally without another evidence push. Cockpit merges.

## Reconcile — integration

Code, documentation sources and all four carriers match committed product source; root/docs-site locks unchanged. Every prior baseline NS One declaration remains. All three faithful presets resolve. Accepted emphasis and directory-layout debt are explicit. Runtime remains UNPROVEN due Docker; no foreign resources mutated. Final CI head/status and READY live in PR phase comments and the excluded final-report handoff, so those reports cannot invalidate their own source head.
