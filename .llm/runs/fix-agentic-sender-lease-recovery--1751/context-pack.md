# Context Pack: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Current phase | `implement` — Slice 1 committed RED boundary, pending Tier-A substantive review |
| Archetype | Operational Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Current State

PLAN-EVAL cycle 2 passed at `c13da3e23`, and the supervisor's required R1/R2 record corrections are
landed at `6e6564fba`. Slice 1 establishes the finite staleness contract and a committed RED test
boundary only. The classifier deliberately returns fail-closed `indeterminate`; launch, repair,
adapter, sender-record, eviction, and resume behavior are unchanged. No sender record was inspected
or mutated. Work is stopped before Slice 2 for the supervisor's Tier-A substantive review.

## Completed

- Loaded all required harness/tooling/routing instructions and the Archetype-6 gate profile.
- Verified branch/base/no-upstream with authoritative raw Git.
- Re-baselined the supplied reproductions against current ownership, launch, rollout, app-server,
  resume, runner, and repair code.
- Locked the finite three-signal truth table, explicit repair command, audit-before-CAS sequencing,
  direct known-negative exit test, seven RED/GREEN slices, and intended file manifest.
- Completed two separate PLAN-EVAL cycles; cycle 2 is `PASS` in `plan-eval-cycle-2.md`.
- Landed the supervisor's cycle-2 R1/R2 record corrections before implementation.
- Added finite PID, rollout, thread, provenance, staleness, and eviction-reason contracts.
- Added table-driven RED expectations for the full stale conjunction and fail-closed live,
  foreign, unknown, mismatch, and insufficient-evidence cases.
- Captured targeted RED evidence: exit 1, 16 passed, 11 failed, 0 ignored; all failures are the new
  7 `preserve` and 4 `stale` expectations.
- Captured covered structured check/lint/fmt passes for the two owned TS files.

## In Progress

- Tier-A substantive review of the landed Slice 1 RED boundary. The implementation lane does not
  self-certify and has not started Slice 2.

## Next Steps

1. Supervisor performs the Tier-A substantive Slice 1 review and records its disposition.
2. Do not dispatch Slice 2 unless the supervisor accepts the committed RED boundary.
3. After acceptance, Slice 2 implements the truth table and preserve-only launch behavior, then
   reruns this exact targeted test command to green.

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
| `.llm/tools/agentic/runtime/sender-ownership.ts` | modified | Finite three-signal/provenance/result contracts and fail-closed RED seam. |
| `.llm/tools/agentic/runtime/sender-ownership_test.ts` | modified | Table-driven committed RED classification expectations. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/worklog.md` | modified | Slice 1 scope and exact gate evidence. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/context-pack.md` | modified | Current resumable handoff and Tier-A stop. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/drift.md` | modified | Root lint-exclusion evidence caveat. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS for Slice 1 owned files | Structured check/lint/fmt: 2 files processed, zero findings/diagnostics. |
| Fitness | Plan-Gate PASS; Tier-A Slice 1 review PENDING | `plan-eval-cycle-2.md`; supervisor review is the current stop. |
| Runtime | EXPECTED RED | Targeted ownership test: exit 1; 16 passed, 11 failed, all failures newly added. |
| Consumer | N/A / NOT_RUN | No published consumer change; compatibility test planned. |

## Open Questions

- No implementation decision is open for Slice 1. Supervisor acceptance of the RED boundary is
  required before Slice 2.

## Drift and Debt

- Drift: owner-provided Codex planning route, unavailable expected `rtk` binary, and the root lint
  config's `.llm/` exclusion; all minor and recorded in `drift.md`.
- Debt: none created or closed.

## Commits

- Slice 1 is the current committed RED boundary; its exact hash and push evidence are recorded in
  the structured PR #1802 comment. V3 has no `commits.md`.
