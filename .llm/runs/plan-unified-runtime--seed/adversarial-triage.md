# Stage-F triage — supervisor dispositions (2026-07-18)

Reviewer: Sol·max, unoriented, detached checkout @ 62a064e5 (session 019f724f-64e4…). 17
findings: 9 BLOCKER / 6 MAJOR / 2 MINOR. Verdict: **plan returns to Stage E** (first of two
allowed fail cycles). Every finding ACCEPTED; dispositions:

| F# | Disposition |
| --- | --- |
| 1 | ACCEPT. C2 (`deno_deploy`) is NOT a validated v1 cell — Deno Deploy Classic/deployctl sunset 2026-07-20. C2 leaves the v1 cell set; replaced by a research card (new-platform Nitro probe incl. queue/database bindings). New owner fork: 3-cell v1 vs re-proven C2. |
| 2 | ACCEPT. #451 KEEP as its own SDK slice; UR-4 = host-side bridge only, no `Closes #451`. O-1 (SDK↔service dependency direction) restored to the fork sweep. |
| 3 | ACCEPT. #453/#454 KEEP as desktop-realization issues; UR-7/UR-10 are foundations, no closing keywords. |
| 4 | ACCEPT. #455 KEEP; UR-8 = profile/prerequisite contract only, no `Closes #455`. |
| 5 | ACCEPT. New prerequisite card UR-0: hostable-service lifecycle contract (exported build/start/stop preserving onStartup/onShutdown, reusing ServiceShutdownCoordinator policy) BEFORE UR-2. |
| 6 | ACCEPT. Stage-E redo produces a single materialized decision brief (no placeholders), fork list renumbered once, identical to plan.md. |
| 7 | ACCEPT. Verbatim five stop-lines materialized character-for-character in every pack brief. |
| 8 | ACCEPT. One canonical title/body/acceptance artifact per UR slot + explicit draft→slot map + merge transforms; mechanically validated before Stage H. |
| 9 | ACCEPT. Label-parity PR becomes a gated PREREQUISITE (merged before filing). Filing becomes a resumable transaction: stable slot marker in each body, search-before-create, immediate per-slot log writes, compare-before-edit on legacy bodies. |
| 10 | ACCEPT. Canonical per-slot label sets incl. exactly one `status:`; preflight fails on mismatch. |
| 11 | ACCEPT. One milestone train (Stage-E decision), deferred cells split into separately milestoned successors. |
| 12 | ACCEPT. Fork-parameterized bodies: explicit A/B deltas per fork, or bodies materialized post-selection with a re-check pass. |
| 13 | ACCEPT. #327 added to the reconciliation map with a non-closing addendum superseding D1's saga exclusion; #349 successor note aligned. |
| 14 | ACCEPT. Prerequisite architecture contracts (package/exports/archetype/compiler schema/build seam) named before Stage-I handoff; split into prerequisite cards where needed. |
| 15 | ACCEPT. The five dated evidence extracts get actually fetched + committed under the run (not gitignored tmp); C2 re-research included. |
| 16 | ACCEPT. #349 status-label correction included in reconciliation. |
| 17 | ACCEPT. Handle namespace normalized (UR-0…UR-12 incl. UR-H renamed) once, everywhere. |

Rework lanes: evidence re-fetch + C2 re-research → resumed Stage-B author thread (its own
corpus gap); pack/plan restructure → Tier-B Opus rework agent under these dispositions;
Stage-E re-lock → supervisor. Then focused Stage-F re-verification (same reviewer session
pattern, detached checkout) before Stage-G.
