# Context Pack: `0.0.x` release scheme

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `version-scheme-0-0-x` |
| Branch | `chore/version-scheme-0-0-x` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Research and Design are complete against `origin/main@8dca67985`. The branch contains only the
launcher brief commits plus these run artifacts; no implementation change has started. The next
hard stop is a separate Qwen PLAN-EVAL.

## Completed

- Loaded all owner-named skills plus repo-required RTK, JSR audit, and Claude manager guidance.
- Reproduced the 325-reference baseline and classified release-owned/current/historical surfaces.
- Identified nested-lock, generic Markdown-pin, CLI guard, and runtime-version derivation gaps.
- Selected Archetype 6 with Docs overlay and locked four sequential commit slices.

## In Progress

- Commit/push the Plan & Design artifacts, open the draft PR, and dispatch PLAN-EVAL.

## Next Steps

1. Commit the run artifacts without unrelated product changes.
2. Push explicit refspec and verify `git ls-remote`.
3. Open and verify the draft PR with milestone `0.0.2` and lifecycle labels.
4. Run separate-session PLAN-EVAL; do not implement before `PASS`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Derive/make-derivable/literal-only-last | Owner brief | Applies per occurrence. |
| Preserve historical shipped refs | Owner non-scope | Beta.5/7/10 incidents and fixtures remain. |
| Include tracked nested locks | Research + D3 | Fixes invisible Fresh UI beta.11 residue. |
| Generic, blocking Markdown pins | Research + D5 | Protects `0.0.2` → `0.0.3` and docs/site. |
| Pre-1.0 maturity terminology | Owner scheme + D8 | Normal `0.0.x` is no longer a beta prerelease. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/version-scheme-0-0-x/{supervisor,research,plan,worklog,context-pack,drift}.md` | new | Harness bootstrap/plan artifacts |
| `.llm/runs/version-scheme-0-0-x/codex-thread-ids.md` | new (launcher-owned) | Route/session provenance |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Baseline PASS | Census and raw Git evidence in `worklog.md` |
| Fitness | Plan pending | JSR surface scan recorded; PLAN-EVAL not run |
| Runtime | Degraded | Runtime controller cannot prove mobile attachment |
| Consumer | NOT_RUN | Release dry-run reserved for S4 |

## Open Questions

- None blocking PLAN-EVAL.

## Drift and Debt

- Drift: five entries in `drift.md`, including significant brief/gate/runtime mismatches.
- Debt: none created; existing package debt is not deepened by the plan.

## Commits

- See the draft PR's commit list + per-slice PR comments after the plan commit is pushed.
