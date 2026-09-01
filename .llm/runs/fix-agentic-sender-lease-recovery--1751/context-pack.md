# Context Pack: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Current phase | `gate` — implementation and final-freeze validation complete; PR handoff pending |
| Archetype | Operational Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Current State

The true final-freeze integration is `fe51d4a3a`, merging fetched `origin/main`
`969e7dfeb04695ab0ffba474d5cd0ee9a2e83002`. All six protected baselines and `deno.lock` were
captured independently before and after the merge and remain byte-identical. The two authorized
test-ceiling baselines are `978cd23d073035e1d578193a299806a0fe9b77fb` for ownership vocabulary
and `e12c023b90b8debc66d2f6ad720f3a9b9cdd9f14` for deterministic child cleanup.

The branch-owned root flake is identified and repaired. `stopAndReap` narrowly accepts only the
already-terminated error, retains pre-kill status capture, and awaits status on every path. A real
stdin operation keeps the live writer alive through every preservation assertion; an additive case
exercises already-terminated teardown. Fifty full-file repetitions all exited 0. Four persisted
root-suite confirmations are green overall, including the final-head report at 4,661 passed / 0
failed / 19 ignored. Agentic is 537/537; scoped check/lint/fmt, `arch:check`, disposable dry-run and
apply smokes, lock hygiene, and three generated freshness checks pass.

`check:mcp-export-corpus` alone exits 1. Its generated file is byte-identical to current
`origin/main`, and #1751 changes no package export surface, so the corpus was not regenerated across
the declared agentic/run boundary.

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
- Landed Slice 6 GREEN at `00877bcbd`; the supervisor verified D8, all six protected blobs, Slice 5
  at 2/2, and the full agentic suite at 528/528.
- Landed Slice 7 documentation and the declared formatting correction at `1cf52be67`.
- Preserved the earlier integration checkpoints and ultimately took the true final freeze from
  fetched `origin/main` `969e7dfeb04695ab0ffba474d5cd0ee9a2e83002`.
- Reverified all six amended protected-test baselines and `deno.lock` before and after the final
  merge.
- Persisted every root and agentic report under `.llm/tmp/`; the final root report accounts for all
  4,680 results.
- Completed the requested integrated-head gate set without E2E, Aspire, Docker, browser, live
  sender-registry, or thread-message activity.
- Persisted exact launch `profileHome` provenance, resolved repair probes from it, kept legacy
  records loadable but fail-closed, and covered both default-like and isolated profiles.
- Replaced the operator-facing `stale` kind with machine-readable blocked/repair-required outcomes
  that distinguish live ownership, provenance refusal, foreign conflict, and inactive ownership.
- Repaired the protected live-child fixture and passed 50/50 repetitions without weakening any
  existing assertion.
- Ran controlled dry-run/apply smoke against disposable roots only; dry-run retained the record and
  wrote no evidence, while apply removed the exact record and finalized a dual-pass receipt.
- Merged final `origin/main` `969e7dfe` at `fe51d4a3a` and revalidated the final head.

## In Progress

- Final run-artifact commit, explicit-refspec push, PR body/phase comment, and supervisor handoff.

## Next Steps

1. Push by explicit refspec and update PR #1802 with the exact final-head evidence.
2. Supervisor reviews the inherited `check:mcp-export-corpus` failure and owns its disposition.
3. Supervisor owns evidence freeze, Tier-A, readiness/labels, and IMPL-EVAL; this session does none
   of those transitions.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stale = debounced dead PID + inactive/absent exact rollout + non-active thread; no unknowns | `plan.md` D1-D3 | All other combinations preserve/indeterminate. |
| Proven absence is provenance-bound | `plan.md` D2 | Unestablishable/mismatched record session home remains `indeterminate`. |
| Launch never evicts | `plan.md` D4 | Explicit repair owns mutation and audit. |
| Repair command under existing `agentic:runtime` | `plan.md` D5 | No `deno.json` edit. |
| Receipt durable before lease-token CAS removal | `plan.md` D6-D7 | Re-observe immediately before mutation. |
| Known active-writer rejection forces exit 1 | `plan.md` D8-D9 | Direct subprocess status, no pipeline. |
| Profile provenance is exact and fail-closed | Coordinator amendment | Recorded `profileHome` selects the session tree; missing/changed provenance never falls back. |
| Operator outcomes are structured | Coordinator amendment | `blocked` reasons distinguish live, foreign, and unknown provenance; `repair-required/owner_inactive` directs explicit repair. |
| PLAN-EVAL required | `plan.md` D10 | Separate opposite-family evaluator. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/worklog.md` | modified | Current-main integration and exact gate evidence. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/context-pack.md` | modified | Current handoff state. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/drift.md` | modified | Identified/resolved flake, provenance amendment, final integration, and inherited corpus drift. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Agentic check/lint/fmt: 175 files, exits 0; `arch:check`, diff/status/lock checks exit 0. |
| Runtime | PASS | 50/50 cleanup repetitions; final root 4,661/0/19 and agentic 537/537, exits 0; reports persisted. |
| Generated freshness | BLOCKED upstream | MCP export corpus exit 1; assets barrel, agent-docs prose, and publish assets exit 0. |
| Consumer | PASS | Resume rejection, profile provenance, explicit repair, preserve-only launch, and disposable dry-run/apply smoke covered. |

## Open Questions

- Whether the inherited stale MCP export-surface corpus must be repaired before this PR's evidence
  freeze is a supervisor/coordinator disposition. Repair is outside this leaf's authorized paths.

## Drift and Debt

- Drift: owner-provided Codex planning route, unavailable expected `rtk` binary, root lint config's
  `.llm/` exclusion, the identified and repaired parked-head root flake, and current-main MCP corpus staleness;
  all are recorded in `drift.md`.
- Debt: none created or closed.

## Commits

- Slice 6 GREEN is `00877bcbd`; Slice 7 is `1cf52be67`; profile/outcome amendment is `419aeb471`;
  deterministic cleanup is `414469033`; final main integration is `fe51d4a3a`. V3 has no
  `commits.md`.
