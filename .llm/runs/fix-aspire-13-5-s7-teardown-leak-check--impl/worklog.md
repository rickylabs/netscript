# Worklog: Aspire 13.5 teardown and leak-check

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-aspire-13-5-s7-teardown-leak-check--impl`  |
| Branch         | `fix/aspire-13-5-s7-teardown-leak-check`        |
| Archetype      | `6 - CLI / Tooling` (internal-tooling analogue) |
| Scope overlays | none                                            |

## Design

### Public Surface

- Existing `agentic:leak-check` JSON/Markdown report gains process survivors.
- Existing `agentic:teardown` gains `--force-persistent`; mutation remains behind `--apply`.
- Pure process snapshot normalization/classification functions are exported only for focused tests.

### Domain Vocabulary

- `ProcessCandidate` — observed Aspire-related PID plus stable identity and evidence paths.
- `ProcessSnapshot` — edge-captured PID/PPID/argv/environment/cwd/socket facts.
- `ProcessEvidence` — DCP label, exact AppHost argv, or socket/cwd path relevance.
- `Ownership` — unchanged `owned | foreign | unproven` authorization result.

### Ports

- `CommandPort` — bounded `aspire`, `docker`, `ps`, and targeted signal commands.
- `FilePort` — `/proc` metadata and path resolution at the edge.
- Injected `sleep` — deterministic bounded confirmation tests.

### Constants

- Confirmation budget — derived from S2 V6's 385 ms cleanup observation.
- `MCP_COMMAND` — existing protected command family.
- Force argv — scoped `aspire stop --force --apphost <exact>`; no broad variant.

### Commit Slices

| # | Slice                                                                                              | Gate                                   | Files                                             |
| - | -------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| 1 | Prove the #1429 visibility defect RED with an S2-shaped PPID-1 snapshot.                           | durable failing test receipt           | fixture, fixture README, leak-check test, run dir |
| 2 | Discover and classify re-parented descendants without weakening ownership/MCP/foreign guards.      | teardown unit suite                    | probes/ownership + tests, run dir                 |
| 3 | Gate persistent force-stop behind apply, explicit flag, and proven ownership.                      | allowed/refused argv tests             | teardown/leak-check + tests, run dir              |
| 4 | Wait for DCP helpers after scoped stop; timeout escalates without killing.                         | synthetic exit/timeout snapshots       | teardown/probes + tests, run dir                  |
| 5 | Document 13.5 behavior, regenerate corpus, run complete Phase-A gates, and draft Phase-B evidence. | configured/scoped/quality/assets gates | playbook, generated barrel, run dir               |

### Deferred Scope

- Phase-B live #1429 reproduction and foreign-AppHost receipt — runtime lease required.
- S10 E2E cleanup integration — separate issue and PR.

### Contributor Path

Start with `ownership.ts` for the authorization boundary, `probes.ts` for edge normalization, and
the versioned/synthetic fixtures beside their focused tests. Add relevance evidence without adding a
new ownership shortcut.

## Progress Log

| Time                 | Slice     | Step            | Notes                                                                                                                                          |
| -------------------- | --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30T03:05:31Z | bootstrap | research/design | Read issues, S2 receipts, S3 fixture, skills, harness workflow, doctrine, and current teardown code.                                           |
| 2026-08-30T03:05:31Z | plan      | PLAN-EVAL       | N/A: the owner-ratified issue and dispatch lock all decisions, five slices, boundaries, and gates; no material planning decision remains open. |
| 2026-08-30T03:07:56Z | 1         | RED receipt     | Durable test receipt: 7 passed, 1 failed; orphan process expectation received `[]`.                                                            |
| 2026-08-30T03:09:21Z | 1         | push            | Pushed `593a33c` with the explicit head refspec; opened draft PR #1744 and posted commit evidence.                                             |
| 2026-08-30T03:15:52Z | 2         | gate            | Descendant tracking passed 33/33 with all evidence modes, both ps fixtures, foreign/MCP guards, and false-positive coverage.                   |
| 2026-08-30T03:15:52Z | 2         | reconcile       | #1719/#1429 remain open; PR #1744 stays draft at `status:impl`, stacked on S3; Phase B remains lease-backed. No new comments changed the plan. |
| 2026-08-30T03:17:08Z | 2         | push            | Pushed `555d204` with the explicit head refspec and posted the slice-2 PR evidence comment.                                                    |
| 2026-08-30T03:18:45Z | 3         | gate            | Force-persistent passed 36/36: exact dry-run argv, apply/flag/ownership arms, scoped-stop confirmation, and no force by default.               |
| 2026-08-30T03:18:45Z | 3         | reconcile       | PR #1744 remains draft/stacked; closing issues and Phase-B dependency are unchanged. No reviewer comment changed the plan.                     |
| 2026-08-30T03:20:02Z | 3         | push            | Pushed `28f8807` with the explicit head refspec and posted the slice-3 PR evidence comment.                                                    |
| 2026-08-30T03:23:50Z | 4         | gate            | Post-stop/orphan process suite passed 40/40: exits-in-time, bounded timeout/no-kill, stable targeted TERM, age, and census fail-closed arms.   |
| 2026-08-30T03:23:50Z | 4         | reconcile       | PR remains draft/stacked; no runtime start occurred and no new comment changed the locked Phase-A/Phase-B split.                               |

## Decisions

| Decision                                          | Reason                                            | Source                         |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| Treat process relevance separately from ownership | DCP/PPID evidence is not authorization.           | #1429; AGENTS resource hygiene |
| Use the issue's exact five-slice order            | Maintains RED-first and stacked-PR reviewability. | owner dispatch                 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| none  | minor    | no                 |

## Gate Results

### Static Gates

| Gate                  | Command or check | Result  | Notes                      |
| --------------------- | ---------------- | ------- | -------------------------- |
| scoped check/lint/fmt | planned          | NOT_RUN | Runs after implementation. |

### Fitness Gates

| Gate                     | Result  | Evidence            | Notes                                                                         |
| ------------------------ | ------- | ------------------- | ----------------------------------------------------------------------------- |
| no-cast/no-ignore review | NOT_RUN | pending diff review | Required by dispatch.                                                         |
| Slice 2 focused review   | PASS    | diff scan           | No new `any`, cast, or lint-ignore; classification remains pure behind ports. |

### Runtime Gates

| Gate                        | Result          | Evidence                                  | Notes                                                              |
| --------------------------- | --------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Phase A unit fixtures       | NOT_RUN         | pending                                   | No AppHost start permitted.                                        |
| Slice 1 RED                 | FAIL (expected) | `receipts/01-red-orphan-process.json`     | Exact #1429 visibility regression; exit 1 at baseline `fe4f496bd`. |
| Slice 2 descendant tracking | PASS            | `receipts/02-descendant-tracking.json`    | 33 passed, 0 failed; receipt head `593a33c`.                       |
| Slice 3 force-persistent    | PASS            | `receipts/03-force-persistent.json`       | 36 passed, 0 failed; receipt head `555d204`.                       |
| Slice 4 post-stop confirm   | PASS            | `receipts/04-post-stop-confirmation.json` | 40 passed, 0 failed; receipt head `28f8807`.                       |
| Phase B live reproduction   | N/A             | deferred procedure                        | Requires supervisor-provided runtime lease.                        |

### Consumer Gates

| Consumer                    | Result  | Evidence                    | Notes                 |
| --------------------------- | ------- | --------------------------- | --------------------- |
| agent-tools embedded corpus | NOT_RUN | pending barrel regeneration | Playbook is embedded. |

## Handoff Notes

- The Fable supervisor should inspect ownership separation and the MCP/foreign invariants first.
- This implementation session does not perform slice review sign-off or IMPL-EVAL.
