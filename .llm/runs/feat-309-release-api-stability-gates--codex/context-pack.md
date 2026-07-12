# Context Pack: #309 release engineering and API-stability gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-309-release-api-stability-gates--codex` |
| Branch | `feat/309-release-api-stability-gates` |
| Current phase | `close` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

All three implementation slices are implemented and gated. Version bumps share a full-workspace coordinator; the
surface classifier, normalized live baseline, declarations, beta CI workflow, and doctrine policy
are present; release completion wording and generated mirror are synchronized. Separate IMPL-EVAL
returned PASS.

## Completed

- Required skills/harness/doctrine references read.
- Base/branch/clean-tree preflight passed.
- Actual bump, workspace, lock, Deno-doc, workflow, doctrine, and mirror surfaces audited.
- Slice 1 focused tests passed 7/7 and `deno.lock` is unchanged.
- Slice 2 classifier tests passed 3/3; baseline covers 34 packages, 258 exports, and 6,654 symbols.
- Live surface task is patch; synthetic CLI proof exits 1 undeclared and 0 declared.
- Mirror sync/check, Claude validation, and docs link validation pass.
- Claude Opus 4.8 IMPL-EVAL session `63940c83-7803-48ff-9820-3fdc96ea3c04` returned PASS with no
  blocking findings.

## In Progress

- Final evaluator/run-artifact commit and explicit refspec push.

## Next Steps

1. Stable-line owner flips `.github/workflows/surface-diff.yml` to blocking in future #309 scope.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| CI-only tool/baselines under `.llm/tools/release` | tools skill | Not public product tooling. |
| Separate major declarations from baseline | plan D4 | Prevent silent approval during refresh. |
| Dedicated non-blocking package-path PR workflow | plan D6 | Stable flip deferred on #309. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-309-release-api-stability-gates--codex/*` | new | Harness activation artifacts. |
| `.llm/tools/deps/bump-version.ts` | changed | Exact/full-workspace coordinator plus native increment compatibility. |
| `.llm/tools/deps/bump-version_test.ts` | changed | Direct wrapper exact-version regression. |
| `.llm/tools/release/cut.ts` | changed | Reuses canonical coordinator. |
| `.llm/tools/release/cut_test.ts` | changed | Full workspace/scaffold/lock fixture. |
| `deno.json` | changed | Wrapper write permission and combined version test task. |
| `.llm/tools/release/surface-diff.ts` | new | Snapshot, classification, declarations, warnings, CLI. |
| `.llm/tools/release/baselines/public-surfaces.json` | new | Normalized live Deno-doc baseline. |
| `.llm/tools/release/surface-diff_test.ts` + fixtures | new | Synthetic semantic and CLI verdict coverage. |
| `.github/workflows/surface-diff.yml` | new | Package-path PR gate, beta non-blocking rollout. |
| `docs/architecture/doctrine/02-public-surface.md` | changed | Machine-readable deprecation/removal convention. |
| `.agents/skills/netscript-release/SKILL.md` | changed | Hard two-workflow completion and fix-forward policy. |
| `.claude/skills/netscript-release/SKILL.md` | generated | Synced mirror of canonical release skill. |
| `.llm/runs/feat-309-release-api-stability-gates--codex/evaluate.md` | new | Separate IMPL-EVAL PASS. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | scoped check/lint/fmt wrappers, zero findings |
| Fitness | PASS | version 7/7; surface 3/3; live patch |
| Runtime | N/A | no cut/publish |
| Consumer | PASS | live task patch + snapshot CLI exit-path proof |

## Open Questions

- None that force rework; stable blocking rollout is explicitly deferred.

## Drift and Debt

- Drift: PLAN-EVAL waived; no versioning file 10; runtime thread identity unobservable; Deno-doc
  JSON drops attached deprecation payload and the tool supplements it from local declaration source.
- Debt: no new doctrine debt planned.

## Commits

- `132ae6e6` — zero-residue workspace bumps.
- `14c6c172` — public API stability classifier/baseline/CI/doctrine.
- `dc4c6bf3` — hard release completion wording, mirror, exact declarations.
- All three pushed to `origin/feat/309-release-api-stability-gates`; owner forbids PR creation.
