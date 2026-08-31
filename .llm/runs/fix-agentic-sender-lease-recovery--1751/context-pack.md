# Context Pack: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Current phase | `implement` — Slice 5 RED boundary, pending Tier-A substantive review |
| Archetype | Operational Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Current State

Slices 1-4 are accepted through `1cfae0f39`: classification and preserve-only launch behavior are
green, and explicit audited repair is green with its earlier RED blobs unchanged. Slice 5 adds only
the real-wrapper resume rejection test. Its intended RED result is `REAL_EXIT=1`, 1 passed and 1
failed: an accepted fake child remains exit 0, while the exact active-writer rejection is printed
but the wrapper incorrectly remains exit 0. The final fixture permits only its fake shell, so no
thread message or sender-registry operation occurs. Work is stopped before Slice 6 for the
supervisor's Tier-A substantive review.

## Completed

- Loaded all required harness/tooling/routing instructions and the Archetype-6 gate profile.
- Verified branch/base/no-upstream with authoritative raw Git.
- Re-baselined the supplied reproductions against current ownership, launch, rollout, app-server,
  resume, runner, and repair code.
- Locked the finite three-signal truth table, explicit repair command, audit-before-CAS sequencing,
  direct known-negative exit test, seven RED/GREEN slices, and intended file manifest.
- Completed two separate PLAN-EVAL cycles; cycle 2 is `PASS` in `plan-eval-cycle-2.md`.
- Landed the supervisor's cycle-2 R1/R2 record corrections before implementation.
- Landed the finite classifier and preserve-only launch behavior in Slice 2; its exact Slice 1
  boundary is green and unchanged.
- Landed explicit audited sender-lease repair in Slice 4 with D6/D7 sequencing and all four Slice 3
  test blobs unchanged; supervisor verification recorded 10/10 focused and 526/526 full green.
- Added the Slice 5 real-wrapper rejection and accepted-path subprocess cases behind a test-owned
  fake `bash`; no real message can be delivered.
- Captured intended Slice 5 RED evidence: exit 1, 1 passed, 1 failed, with the failing rejection
  path returning actual 0 versus expected 1.
- Captured scoped structured check/lint/fmt passes for the one Slice 5 test file.

## In Progress

- Tier-A substantive review of the landed Slice 5 RED boundary. The implementation lane does not
  self-certify and has not started Slice 6.

## Next Steps

1. Supervisor performs the Tier-A substantive Slice 5 review and records its disposition.
2. Do not dispatch Slice 6 unless the supervisor accepts the committed RED boundary.
3. After acceptance, Slice 6 adds the pure resume-disposition parser and wrapper propagation while
   keeping the Slice 5 test blob byte-identical, then reruns the exact targeted command to green.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stale = debounced dead PID + inactive/absent exact rollout + non-active thread; no unknowns | `plan.md` D1-D3 | All other combinations preserve/indeterminate. |
| Proven absence is provenance-bound | `plan.md` D2 | Unestablishable/mismatched record session home remains `indeterminate`. |
| Launch never evicts | `plan.md` D4 | Explicit repair owns mutation and audit. |
| Repair command under existing `agentic:runtime` | `plan.md` D5 | No `deno.json` edit. |
| Receipt durable before lease-token CAS removal | `plan.md` D6-D7 | Re-observe immediately before mutation. |
| Known active-writer rejection forces exit 1 | `plan.md` D8-D9 | Direct subprocess status, no pipeline. |
| PLAN-EVAL required | `plan.md` D10 | Separate opposite-family evaluator. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/agentic/codex/codex-resume_test.ts` | new | Real-wrapper negative and accepted-path subprocess controls behind test-owned fake `bash`. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/worklog.md` | modified | Slice 5 scope and exact RED/static evidence. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/context-pack.md` | modified | Current Slice 5 handoff and Tier-A stop. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS for Slice 5 test file | Structured check/lint/fmt: 1 file processed, zero findings/diagnostics. |
| Fitness | Plan-Gate PASS; Tier-A Slice 5 review PENDING | `plan-eval-cycle-2.md`; supervisor review is the current stop. |
| Runtime | EXPECTED RED | Targeted resume test: exit 1; 1 passed, 1 failed; rejected path actual 0 versus expected 1. |
| Consumer | Positive control PASS | Accepted fake-child path stays exit 0; Slice 6 compatibility gates remain pending. |

## Open Questions

- No implementation decision is open for Slice 5. Supervisor acceptance of the RED boundary is
  required before Slice 6.

## Drift and Debt

- Drift: owner-provided Codex planning route, unavailable expected `rtk` binary, and the root lint
  config's `.llm/` exclusion; all minor and recorded in `drift.md`.
- Debt: none created or closed.

## Commits

- Slice 4 GREEN is `1cfae0f39`. Slice 5 RED is the next commit; its exact hash and push evidence are
  recorded in the structured PR #1802 comment. V3 has no `commits.md`.
