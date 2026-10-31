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
