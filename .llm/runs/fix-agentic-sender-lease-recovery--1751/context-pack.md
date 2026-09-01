# Context Pack: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Current phase | `implement` — current-main integration and revalidation complete; one inherited generated-corpus gate is red |
| Archetype | Operational Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Current State

Final-freeze integration is now at `50431f9cd` after merging fetched `origin/main`
`8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d`; all six amended protected baselines and `deno.lock`
survived byte-identically. The coordinator authorized completing the protected live-child fixture
repair: the child now waits on a real stdin operation, and an additive case exercises
already-terminated teardown. The required post-fix proof is green for all 50 repetitions with every
iteration exit 0. Final smoke and repository gates are in progress.

All seven implementation slices are landed through `1cf52be67`. The branch was parked at
`de24161b6`; its previously reported single root-suite failure did not reproduce in either of two
supervisor reruns at that identical head (both 4,464 passed / 0 failed / 19 ignored, exit 0), so it
is recorded as an unidentified flake whose test identity is unrecoverable because the original run
had no saved report.

On resume, the six protected test blobs and `deno.lock` were captured before integration. The
then-current `origin/main` was fetched as `62ea359b13b292f5f4335ff77b8b9df1ecdf5ae7` and merged
exactly once in `2bf9ca1b2114d12547fd988aaaea8a53c9aa95b7`. All seven pre/post blobs are byte-identical.
The integrated root suite is green with a persisted report (4,498 passed / 0 failed / 19 ignored),
the agentic suite is 531/531, scoped check/lint/fmt and `arch:check` pass, three of four generated
freshness checks pass, and `deno.lock` remains unchanged. `check:mcp-export-corpus` alone exits 1
because the integrated MCP export-surface corpus is stale; it is outside this leaf's authorized
paths and was not regenerated.

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
- Integrated fetched `origin/main` `62ea359b13b292f5f4335ff77b8b9df1ecdf5ae7` exactly once.
- Reverified all six protected test ceilings and `deno.lock` before and after the merge.
- Persisted the integrated root-suite report under `.llm/tmp/`; all 4,517 results are accounted for.
- Completed the requested integrated-head gate set without E2E, Aspire, Docker, browser, live
  sender-registry, or thread-message activity.

## In Progress

- Controlled repair smoke, full final-head gates, PR update, explicit-refspec push, and handoff.

## Next Steps

1. Supervisor reviews the current-main integration evidence and the inherited
   `check:mcp-export-corpus` failure.
2. The corpus-owning lane regenerates/lands the stale artifact, or the coordinator records its
   disposition; #1751 must not mutate that generated surface.
3. Supervisor owns evidence freeze, Tier-A, readiness/labels, and IMPL-EVAL.

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
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/worklog.md` | modified | Current-main integration and exact gate evidence. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/context-pack.md` | modified | Current handoff state. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/drift.md` | modified | Unidentified flake and inherited corpus-staleness records. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Agentic check/lint/fmt: 174 files, exits 0; `arch:check` exit 0; diff/status/lock checks exit 0. |
| Runtime | PASS | Root 4,498/0/19 and agentic 531/531, both exit 0; root JSON report persisted. |
| Generated freshness | BLOCKED upstream | MCP export corpus exit 1; assets barrel, agent-docs prose, and publish assets exit 0. |
| Consumer | PASS | Resume output/exit compatibility and explicit repair behavior remain covered; protected tests unchanged. |

## Open Questions

- Whether the inherited stale MCP export-surface corpus must be repaired before this PR's evidence
  freeze is a supervisor/coordinator disposition. Repair is outside this leaf's authorized paths.

## Drift and Debt

- Drift: owner-provided Codex planning route, unavailable expected `rtk` binary, root lint config's
  `.llm/` exclusion, the unidentified parked-head root flake, and current-main MCP corpus staleness;
  all are recorded in `drift.md`.
- Debt: none created or closed.

## Commits

- Slice 6 GREEN is `00877bcbd`; Slice 7 is `1cf52be67`; parked integration is `de24161b6`; current
  main integration is `2bf9ca1b2`. V3 has no `commits.md`.
