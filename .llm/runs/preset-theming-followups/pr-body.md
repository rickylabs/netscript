## Summary

Registry URL errors now distinguish query strings, fragments and credentials in both direct references and `components.json`. CI explicitly lints/formats CLI source with a strict hash baseline for existing debt. Figma imports use indexed lookups, shared schemas and catalog Zod. Generated app guidance uses copyable doc slugs and complete override steps; the theming guide's upgrade section lives on a linked page, restoring 1,224 bytes of get_doc headroom.

## Scope

Archetype 6 CLI/tooling and existing token adapters. Refs #2516 and Refs #2556. Owner-directed draft PR with no labels; Cockpit owns merging.

## Slices

- [x] Plan & Design — READY FOR REVIEW
- [x] Scoped source/docs/CI fixes and independent repaired slice review — `008685f6`
- [x] Generated docs/publish carriers and Aspire inventory — `f3c84f73`
- [x] Terminal independent evaluation and handoff evidence
- [x] CI test-1 compatibility repair: preserve catalog in isolated release-recovery fixture
- [x] Normal latest-main merge and post-merge validation

## Validation

Deno 2.9.7. **Whole CLI suite: 2,947 passed, 0 failed, 0 ignored**, run from clean committed merged source head `2807316b` with source/carriers held fixed and native prerequisites supplied. Earlier exploratory failures are retained as superseded evidence. Focused repairs: 5 passed (native conventions/carrier/real browser and negative controls), native fixtures: 47 passed, CI contracts: 12 passed. Red/green regressions recorded.

All 15 current root `check:*` tasks and four site checks pass. Release preflight, docs links/accuracy/snippets, docs build, repository-wide type check, root lint/fmt, CLI quality ratchet, fresh Figma CI, quality:gate, CLI JSR audit and package publish dry-run pass. Independent repaired slice and integration-test reviews PASS; **terminal same-session post-main IMPL-EVAL: PASS** at source head `2807316b`. A subsequent test-only CI fixture repair also received independent PASS: the release recovery fixture now copies the root catalog with imports; its full module passes 8/8 locally and independently, with the original permission/content-verdict assertions unchanged. Product/CLI/carrier/lock bytes are identical to the canonical local proofs.

Full `scaffold.runtime --cleanup` attempted once: UNPROVEN, exit 1 at Aspire doctor/Docker cleanup because Docker is unavailable. Read-only leak reporter: 25 unproven survivors, none mutated.

## Harness

Run dir: `.llm/runs/preset-theming-followups/`. PLAN-EVAL: N/A for bounded owner-defined corrections. Independent read-only Claude Opus 5.5/high final IMPL-EVAL: PASS; see `evaluate.md`. Required hosted checks are verified on the final PR head before the READY handoff. Cockpit owns merging.

## Drift / Debt

The CLI baseline preserves 29 existing lint and 163 formatting debt files only while their bytes match; new/edited files must pass. No package-wide reformat. Root and Fresh UI lock changes only register the already-resolved catalog Zod dependency in workspace metadata; package versions and integrity hashes are unchanged. Existing better-auth peer-ID flattening was verified and retained.

## Definition of Done

- [x] Whole CLI suite and required local validation completed
- [x] Required docs, release preflight, carrier checks and docs build pass
- [x] CLI lint/fmt coverage runs in CI with recorded strict baseline
- [x] Independent final implementation evaluation passes
- [x] No unrelated source or lock churn

Refs #2516
Refs #2556

Merged `origin/main` (`0af8fd9e`) normally in `2807316b`; both CLI quality and design-skill task chains preserved. Hosted full matrix at that source: 9,113 passed, zero failed; quality/check-test succeed and deps-report skips by policy. Synthetic checkout tree matches local source. Final evidence-only head is verified again before READY.
