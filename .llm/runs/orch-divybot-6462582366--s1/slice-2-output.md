# Slice 2 — output engine evidence

Status: PASS. The same independent supervisor signs off after the single fix round; both verdicts are retained in slice-2-review.md.

- Frozen package `tokens:build`: PASS, 50 outputs from all 72 requested inputs.
- Frozen package `tokens:check`: PASS for all 50 files; read-only.
- Importer `--check`: PASS; regenerated DTCG documents match approved snapshots and code mappings.
- Official schema/alias/reference validation: PASS for all 72 inputs.
- Structured source/output tests: 15 PASS. Includes every legacy declaration, all input/output counts, native/computed mixes, alpha, Fluent dark accent/black foreground, override propagation into dimensions/mixes/shadows, component-source edits, original Figma shape, all exported syntax binding types, all dimension/duration conversions and unregistered-context rejection.
- Complete fresh-ui package suite: PASS, 202 tests, zero failures after the Figma fixes. The initial run identified two catalog drift failures; regeneration repaired both, then the complete suite passed. The stale/missing-artifact test checks every output, proves check mode never repairs, and rebuilds under the frozen package lock.
- Structured scoped check: PASS, 27 TS files with `--unstable-kv`, frozen root lock, no type diagnostics. Scoped lint/fmt: PASS with full selection coverage. Generation helper lint/fmt: PASS, both files processed with inherited root rules and only include/exclude selection removed from the temporary config; no rule was suppressed. The initial root-config attempt refused all-excluded coverage and was not treated as a pass.
- `quality:gate`: PASS, including dependency and doctrine architecture checks. Receipt outcome PASS, exit 0. No gate/scan exclusions were added.
- Package publish dry-run through `run-publish-dry-run.ts --member packages/fresh-ui`: PASS, including the `./tokens` export and required JSON assets.
- Complete export doc-lint: new `./tokens` has zero findings; full package remains FAIL on 123 existing findings in unchanged `./interactive`. Other exports are clean. This is not reported as a full doc-lint PASS.
- Asset generation/freshness: includes registry theme files, the gallery catalog projected from the manifest, and embedded asset barrels. The drift test is retained.
- Root lock delta: two specifier additions (Color.js 0.5.2 and SD 5.7.1), one SD 5.7.1 integrity/dependency entry. All existing resolutions and integrity entries remain unchanged. Package frozen lock does not change in this slice.

Compatibility evidence: `compatibility.md`. Token values remain Figma-owned; four ambiguous Studio rule dimensions gain explicit `-width` names in the migration registry, while the original color names and raw snapshots remain unchanged.

No final contrast, CLI override, browser, E2E or implementation-evaluation result is claimed. Those remain required subsequent slices.

Fix-round gates: 202 package tests PASS; 27-file frozen root check and full scoped lint/fmt PASS; quality/architecture receipt PASS, exit 0; frozen output check PASS; package publish dry-run PASS. Corrected Figma unit and syntax exports are regenerated. New color functions are guarded by @supports; provider-specific mono weight requests are data. Original source scopes remain preserved; computed role-scope enrichment is advisory and deferred.

The supervisor-suggested legacy selector invariant is also enforced: every NS One role has a native color expression in both schemes or neither. Its targeted structured regression passes (one test), and its final lint/format checks pass. This adds no product behavior after sign-off.
