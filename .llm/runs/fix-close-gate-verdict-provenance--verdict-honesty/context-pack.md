# Context Pack: close-gate verdict honesty

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-close-gate-verdict-provenance--verdict-honesty` |
| Branch | `fix/close-gate-verdict-provenance` |
| Current phase | `implement` |
| Archetype | `N/A` — repository tooling |
| Scope overlays | `none` |

## Current State

Research, plan, and Design checkpoint are complete against current `origin/main`. The chosen #1105
convention is ENFORCE for unchecked PR Definition-of-Done/Acceptance boxes. No implementation work
has begun. The canonical local Qwen evaluator was unavailable, and milestone orchestrator decision
D6 subsequently approved the locked plan and replaced per-PR local formal evaluation with the
milestone-run composed evaluator/pre-merge surface.

## Completed

- Read issues #1171 and #1105 in full.
- Read named skills and applicable harness/route/handoff authorities.
- Re-baselined checker, tests, PR template, PR skill, and CI call site.
- Ran existing targeted tests: 3 passed, 0 failed.
- Locked commit slices, gates, risks, and deferred scope.

## In Progress

- S1 code and tests are green locally; supervisor diff review and sign-off commit are next.

## Next Steps

1. Implement and validate S1, then supervisor-review and push its sign-off commit.
2. Implement and validate S2, then supervisor-review and push its sign-off commit.
3. Reconcile the live PR, run the composed review/pre-merge surfaces, and hand merge authority back
   to the milestone orchestrator.

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
| `.llm/tools/validation/check-close-gate.ts` | changed | provenance, stale comparison, PR DoD enforcement, pretty log |
| `.llm/tools/validation/check-close-gate_test.ts` | changed | 7-test regression/negative suite |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan-Gate | pending | separate evaluator not yet run |
| Static | PASS | targeted tests 7/7; scoped check/lint/fmt green over 2 files |
| Fitness | N/A | repo-tooling scope |
| Runtime | N/A | no service/scaffold/CLI runtime change |
| Consumer | planned | parser tests + live PR |

## Open Questions

- None. Orchestrator decision D6 resolved the evaluator protocol for this slice.

## Drift and Debt

- Drift: local agentic runtime reports `MISSING_IDENTITY`, and the formal evaluator canary reports
  `auth_required` with no provider process launched; both are recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
