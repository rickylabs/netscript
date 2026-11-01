# Worklog

## Design

1. Public surface: unchanged computed styles and generated query markup; CI rejects
   shipped component CSS exceeding raw or gzip limits.
2. Vocabulary: Utility scope is the existing three-alias root selector; component CSS
   is the non-theme registry CSS copied to applications; raw bytes are UTF-8 bytes,
   gzip bytes use the platform CompressionStream gzip encoding.
3. Ports: existing registry content, Deno filesystem/process, Web CompressionStream,
   actual page/resource generation APIs and Chromium browser fixture tools.
4. Constants: raw/gzip budget byte ceilings beside PUBLISH_BUDGET_BYTES; root selector
   remains explicit CSS syntax, with no new application state or attribute constants.
5. Commit slices: (1) this run's plan artifacts; (2) registry CSS, publish-size tests,
   CLI QueryResult regression, required generated carriers, browser proof and run
   evidence (Fresh UI/browser/scoped/carrier/full quality gates + independent review);
   (3) final evidence and current-main reconciliation if needed.
6. Deferred scope: per-style bundles and visual/token/markup redesign; the current
   browser contract can be preserved by nesting without an additional runtime seam.
7. Contributor path: `packages/fresh-ui/tests/publish-size.test.ts` documents the CSS
   budget; `query-result-template.ts` remains the shared query-view extension point.

PLAN-EVAL: N/A; bounded transformation and regression repair, explicit acceptance and
existing browser tools. Mandatory independent slice review/IMPL-EVAL before sign-off.

Owner route override (verbatim): `IMPL-EVAL: claude -p --model claude-opus-5-5 --effort high`, read-only.
Owner delivery specifics take precedence over generic dispatcher boilerplate: draft PR,
Refs #2524, no labels or session IDs, normal push only, STOP at READY; Cockpit merges.

## Intake

Assignment and issue comments read fully. No duplicate follow-up PR found. Deno 2.9.7
matches CI. Public paths repo-relative; private evaluator transcripts kept outside Git.

## Slice 1 reconcile

Plan commit e5fa3660df2dc84325e28a33b0512474a4926a6f pushed normally; draftPR2558
opened and plan comment posted. Main remains baseline6a1d84a. No duplicate follow-up,
new review finding or scope change. No labels or closing keyword applied per owner.

## Implementation and evidence

Native nesting shares the identical root selector across 46 stylesheets; six single-scope
sheets remain byte-identical. The 528 root occurrences become 54. Raw CSS falls from
270183 to 215981 bytes (-54202, 20.1%); platform gzip from 27152 to 26527 bytes (-625,
2.3%). The ceilings are 220000 raw and 27000 gzip bytes. Source and carrier inventories
and bytes must match before either assertion. The isolated original-CSS fixture fails
both limits; the candidate and the existing five-MB native publish budget pass. See
size-tests.json and size-negative.json.

The existing shared QueryResult is unchanged. Page, standalone-island, and resource
outputs must include its complete body and success return exactly once. Five resource
variant combinations are covered. A resource-renderer-only text mutation fails the new
assertion; restoration passes all 25 CLI tests. See query-tests.json/query-negative.json.

Utility parity uses S6a's real contract fixtures, the existing variant renderer and
variant-parity.ts: 265 fixtures, two schemes × two widths, 597000 computed comparisons
per scene (2388000 total), rest/hover/focus/pressed states and pseudo-elements. All four
screenshots are identical. S6a's legacy comparison covers 265 fixtures × NS One, Tonal,
and macOS 27 × two schemes with zero differences. The browser CSSOM comparison expands
nesting and verifies identical ordered selectors, declarations and media conditions for
all 1161 rules in 52 files; quoted strings are retained and formatting whitespace normalized.

All four canonical carrier generators completed. Embedded inventory: 199 assets,
46 CSS changes, 153 other assets identical. All 14 root check:* tasks pass on Deno 2.9.7,
including Figma naming and PR #2558's review-thread gate. No lock diff.

Package check/lint/fmt cover 276 TS files; scoped wrappers cover three owned TS files;
CSS formatting covers 52 files. All pass. Quality/architecture and release:preflight
pass. JSR audit and native publish pass with inherited warnings, no new public surface.
The full package suite passes 338 results with zero failures/ignored (376335 ms).
The full generated-scaffold browser matrix passes 60 tests with zero skips.

The exact runtime command exited 1: Aspire doctor and Docker cleanup failed because
the Docker daemon is unavailable. Runtime and container cleanup remain UNPROVEN.
The read-only leak report records 25 entries with unproven ownership; all were left
untouched. No run-owned runtime started. Independent slice/whole-change review remains
pending; source is frozen in source-hashes.json.

Additional CI checks: token freshness and token contrast/quality pass with durable
command receipts retained privately. Additional full-export doc-lint reports 124
inherited findings (96 private type references, 28 missing documentation); all 16
finding files are byte-identical to the baseline, verified by hashes in
doc-lint-baseline.json. No public types changed; this diagnostic is not claimed green.

## Independent review and sign-off

Separate read-only Claude Opus 5.5 / requested high review: PASS. The reviewer independently
verified every one of the 50 source hashes, CSS specificity/order/media behavior, unchanged
legacy rules, CI budget wiring, complete QueryResult output assertions and negative evidence.
Test reruns were denied in that read-only review session; it reviewed the recorded wrapper
and browser evidence and did not claim independent execution. Transport metadata confirms
claude-opus-5-5; effort is requested, not attested. See evaluate.md. Failure streak is zero.

Optional coverage/compatibility notes are recorded in drift.md. No source change after review.
Main remains baseline 6a1d84a; no merge or conflict resolution required. Implementation sign-off
commit and ordinary push follow; exact-head remote checks remain pending. No READY claim yet.
