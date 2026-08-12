# Context Pack: coordinated bump test resilience

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1629-cut-version-derived-tests--w7` |
| Branch | `fix/1629-cut-version-derived-tests` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

The arbitrary 0.0.7 bumped-copy discriminator is captured. Version-bearing diagnostic assertions
derive from `NETSCRIPT_RELEASE_VERSION`. Cut-local workspace mapping derives all first-party export
aliases from manifests, carries root catalog/imports, and fails on missing targets. All 34 targeted
tests (55 steps) pass.

## Completed

- Harness/CLI/release/tools/PR/RTK/doctrine/JSR instructions loaded.
- Issue #1629 and requested baseline verified.
- Research, plan, and design recorded; PLAN-EVAL justified N/A.
- Pre-fix arbitrary-bump failures recorded and version assertions corrected.

## In Progress

- Full requested gates and disposable post-fix 0.0.7 proof.

## Next Steps

1. Open the draft PR with required taxonomy/milestone/evidence mappings.
2. Add and run discriminating tests against the baseline to capture red evidence.
3. Implement the two bounded fixes and run targeted/full gates.
4. Run the disposable 0.0.7 proof, finalize the draft, and stop.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Tree-derived expectations | plan D1 | No duplicate release constant. |
| Test-scoped local first-party resolution | plan D2 | Published behavior remains strict. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1629-cut-version-derived-tests--w7/` | new | Harness bootstrap artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | not run | implementation pending |
| Fitness | planned | `quality:gate` required |
| Runtime | N/A | no runtime command/service behavior change |
| Consumer | planned | plugin install probes + disposable release rehearsal |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none introduced or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
