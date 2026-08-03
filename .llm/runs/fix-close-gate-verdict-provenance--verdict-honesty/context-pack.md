# Context Pack: close-gate verdict honesty

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-close-gate-verdict-provenance--verdict-honesty` |
| Branch | `fix/close-gate-verdict-provenance` |
| Current phase | `plan-eval` |
| Archetype | `N/A` — repository tooling |
| Scope overlays | `none` |

## Current State

Research, plan, and Design checkpoint are complete against current `origin/main`. The chosen #1105
convention is ENFORCE for unchecked PR Definition-of-Done/Acceptance boxes. No implementation work
has begun; the next legal action is separate-session PLAN-EVAL.

## Completed

- Read issues #1171 and #1105 in full.
- Read named skills and applicable harness/route/handoff authorities.
- Re-baselined checker, tests, PR template, PR skill, and CI call site.
- Ran existing targeted tests: 3 passed, 0 failed.
- Locked commit slices, gates, risks, and deferred scope.

## In Progress

- Commit/push S0, open draft PR, and run canonical local Qwen PLAN-EVAL.

## Next Steps

1. Commit and push S0 harness artifacts.
2. Open the draft PR with `type:fix`, `area:tooling`, exactly one plan-phase status, milestone 0.0.5.
3. Launch separate local Qwen PLAN-EVAL; accept only committed `plan-eval.md` as verdict source.
4. On PASS, launch the routed Codex implementation slice; otherwise repair the plan or report the
   hard blocker.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| ENFORCE PR DoD/Acceptance boxes | user + #1105 + plan D1 | unrelated checklists remain non-authoritative |
| Add issue snapshot provenance | #1171 + plan D3-D5 | staleness compares timestamp OR body hash |
| Preserve old issue semantics | #1171 + plan D6 | additive PR findings and report fields |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-close-gate-verdict-provenance--verdict-honesty/**` | new | S0 harness artifacts only |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan-Gate | pending | separate evaluator not yet run |
| Static | baseline pass | existing targeted test 3/3 |
| Fitness | N/A | repo-tooling scope |
| Runtime | N/A | no service/scaffold/CLI runtime change |
| Consumer | planned | parser tests + live PR |

## Open Questions

- Can the canonical local Qwen evaluator credential/identity be resolved on this host? If not, the
  run remains blocked; cloud fallback is not implicitly authorized for a local run.

## Drift and Debt

- Drift: local agentic runtime reports `MISSING_IDENTITY`; recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
