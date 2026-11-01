## Summary

Registry URL errors now distinguish query strings, fragments and credentials in both direct references and `components.json`. CI explicitly lints/formats CLI source with a strict hash baseline for existing debt. Figma imports use indexed lookups, shared schemas and catalog Zod. Generated app guidance uses copyable doc slugs and complete override steps; the theming guide's upgrade section lives on a linked page, restoring 1,224 bytes of get_doc headroom.

## Scope

Archetype 6 CLI/tooling and existing token adapters. Refs #2516 and Refs #2556. Owner-directed draft PR with no labels; Cockpit owns merging.

## Slices

- [x] Plan & Design — READY FOR REVIEW
- [x] Scoped source/docs/CI fixes and independent repaired slice review — `008685f6`
- [x] Generated docs/publish carriers and Aspire inventory — `f3c84f73`
- [ ] Final evaluation and required-check handoff

## Validation

Deno 2.9.7. Focused suite: 44 passed; subsequent diagnostic/ratchet repair: 8 passed; CI contracts: 12 passed. Red/green evidence captured. Independent repaired slice review PASS, including 8 independently rerun tests.

All 14 root `check:*` tasks and four site checks pass. Release preflight, docs links/accuracy/snippets, docs build, root lint/fmt, scoped check, CLI quality ratchet, Figma CI, quality:gate, CLI JSR audit and package publish dry-run pass. Repository-wide type check passes. The early exploratory CLI run had 2926 passing and 17 failing tests; native prerequisites and a quoted-doc-slug integration assertion are repaired (focused proofs: 5/5 and 47/47). A new clean-head whole-CLI run and final same-session IMPL-EVAL follow.

Full `scaffold.runtime --cleanup` attempted once: UNPROVEN, exit 1 at Aspire doctor/Docker cleanup because Docker is unavailable. Read-only leak reporter: 25 unproven survivors, none mutated.

## Harness

Run dir: `.llm/runs/preset-theming-followups/`. PLAN-EVAL: N/A for bounded owner-defined corrections. Independent read-only Claude Opus 5.5/high final IMPL-EVAL remains required. Do not merge until final evaluation and required checks pass.

## Drift / Debt

The CLI baseline preserves 29 existing lint and 163 formatting debt files only while their bytes match; new/edited files must pass. No package-wide reformat. Root and Fresh UI lock changes only register the already-resolved catalog Zod dependency in workspace metadata; package versions and integrity hashes are unchanged. Existing better-auth peer-ID flattening was verified and retained.

## Definition of Done

- [ ] Whole CLI suite and required local validation completed
- [x] Required docs, release preflight, carrier checks and docs build pass
- [x] CLI lint/fmt coverage runs in CI with recorded strict baseline
- [ ] Independent final implementation evaluation passes
- [x] No unrelated source or lock churn

Refs #2516
Refs #2556
