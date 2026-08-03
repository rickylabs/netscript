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

- PR #1181 is ready-for-review at `status:impl-eval`; milestone-composed augment/OpenHands/check
  surfaces and orchestrator pre-merge gate are pending.

## Next Steps

1. Milestone orchestrator watches the composed review/check surfaces and performs the per-PR
   pre-merge gate.
2. Address any substantive code review finding with a new tracked slice; do not tick around it.
3. Once green, tick the final review and closing-keyword DoD boxes, replace both non-closing refs
   with `Closes`, move to `status:ready-merge` before the final push/rerun, and run live close-gate.

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
| `.github/pull_request_template.md` | changed | authoritative Definition-of-Done heading and guidance |
| `.agents/skills/netscript-pr/SKILL.md` | changed | convention aligned to enforcement |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan-Gate | pending | separate evaluator not yet run |
| Static | PASS | combined tests 57/57; scoped TS check/lint/fmt green; focused prose diff clean |
| Fitness | N/A | repo-tooling scope |
| Runtime | N/A | no service/scaffold/CLI runtime change |
| Consumer | pending remote | local parser/classifier tests green; PR #1181 composed review triggered |

Remote snapshot: PR #1181 is open, non-draft, mergeable, and `status:impl-eval`; GitHub combined
status was `pending` with zero contexts immediately after the ready transition.

## Open Questions

- None. Orchestrator decision D6 resolved the evaluator protocol for this slice.

## Drift and Debt

- Drift: local agentic runtime reports `MISSING_IDENTITY`, and the formal evaluator canary reports
  `auth_required` with no provider process launched; both are recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
