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
- Teardown JSON exposes `actionsRequired` when persistent cleanup cannot meet its running-AppHost
  precondition.
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

| # | Slice                                                                                              | Gate                                     | Files                                             |
| - | -------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| 1 | Prove the #1429 visibility defect RED with an S2-shaped PPID-1 snapshot.                           | durable failing test receipt             | fixture, fixture README, leak-check test, run dir |
| 2 | Discover and classify re-parented descendants without weakening ownership/MCP/foreign guards.      | teardown unit suite                      | probes/ownership + tests, run dir                 |
| 3 | Gate persistent force-stop behind apply, explicit flag, and proven ownership.                      | allowed/refused argv tests               | teardown/leak-check + tests, run dir              |
| 4 | Wait for DCP helpers after scoped stop; timeout escalates without killing.                         | synthetic exit/timeout snapshots         | teardown/probes + tests, run dir                  |
| 5 | Document 13.5 behavior, regenerate corpus, run complete Phase-A gates, and draft Phase-B evidence. | configured/scoped/quality/assets gates   | playbook, generated barrel, run dir               |
| 6 | Correct the evaluator-found force lifecycle ordering and environment false positive.               | running/gone/positive-confirmation tests | teardown/probes + tests, playbook, run dir        |

### Deferred Scope

- Phase-B live #1429 reproduction and foreign-AppHost receipt — runtime lease required.
- S10 E2E cleanup integration — separate issue and PR.

### Contributor Path

Start with `ownership.ts` for the authorization boundary, `probes.ts` for edge normalization, and
the versioned/synthetic fixtures beside their focused tests. Add relevance evidence without adding a
new ownership shortcut.

## Progress Log

| Time                 | Slice     | Step            | Notes                                                                                                                                               |
| -------------------- | --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30T03:05:31Z | bootstrap | research/design | Read issues, S2 receipts, S3 fixture, skills, harness workflow, doctrine, and current teardown code.                                                |
| 2026-08-30T03:05:31Z | plan      | PLAN-EVAL       | N/A: the owner-ratified issue and dispatch lock all decisions, five slices, boundaries, and gates; no material planning decision remains open.      |
| 2026-08-30T03:07:56Z | 1         | RED receipt     | Durable test receipt: 7 passed, 1 failed; orphan process expectation received `[]`.                                                                 |
| 2026-08-30T03:09:21Z | 1         | push            | Pushed `593a33c` with the explicit head refspec; opened draft PR #1744 and posted commit evidence.                                                  |
| 2026-08-30T03:15:52Z | 2         | gate            | Descendant tracking passed 33/33 with all evidence modes, both ps fixtures, foreign/MCP guards, and false-positive coverage.                        |
| 2026-08-30T03:15:52Z | 2         | reconcile       | #1719/#1429 remain open; PR #1744 stays draft at `status:impl`, stacked on S3; Phase B remains lease-backed. No new comments changed the plan.      |
| 2026-08-30T03:17:08Z | 2         | push            | Pushed `555d204` with the explicit head refspec and posted the slice-2 PR evidence comment.                                                         |
| 2026-08-30T03:18:45Z | 3         | gate            | Force-persistent passed 36/36: exact dry-run argv, apply/flag/ownership arms, scoped-stop confirmation, and no force by default.                    |
| 2026-08-30T03:18:45Z | 3         | reconcile       | PR #1744 remains draft/stacked; closing issues and Phase-B dependency are unchanged. No reviewer comment changed the plan.                          |
| 2026-08-30T03:20:02Z | 3         | push            | Pushed `28f8807` with the explicit head refspec and posted the slice-3 PR evidence comment.                                                         |
| 2026-08-30T03:23:50Z | 4         | gate            | Post-stop/orphan process suite passed 40/40: exits-in-time, bounded timeout/no-kill, stable targeted TERM, age, and census fail-closed arms.        |
| 2026-08-30T03:23:50Z | 4         | reconcile       | PR remains draft/stacked; no runtime start occurred and no new comment changed the locked Phase-A/Phase-B split.                                    |
| 2026-08-30T03:25:07Z | 4         | push            | Pushed `a0cbaf6` with the explicit head refspec and posted the slice-4 PR evidence comment.                                                         |
| 2026-08-30T03:28:24Z | 5         | gates           | Scoped check/lint/fmt, 40/40 teardown tests, configured lint, assets check, quality scan, and arch check all passed.                                |
| 2026-08-30T03:28:24Z | 5         | docs/evidence   | Added the 13.5 playbook section and lease-backed Phase-B receipt/closing-evidence procedure; canonical regeneration produced no generated delta.    |
| 2026-08-30T03:28:24Z | 5         | reconcile       | Phase B and IMPL-EVAL remain deferred to separate leased/evaluator sessions; PR stays draft and stacked on S3.                                      |
| 2026-08-30T03:28:24Z | 5         | push            | Pushed `473286671` with the explicit refspec. The slice-5 PR comment was omitted; IMPL-EVAL cycle 1 caught the missing trail entry.                 |
| 2026-08-30T03:47:13Z | eval-1    | FAIL_FIX        | Fable 5 found inert two-step force ordering (high), missing slice-5 comment (medium), and an environment-key false positive (low).                  |
| 2026-08-30T03:47:13Z | 6         | RED             | `06-red-evaluator-fixes.json` failed type-check against the absent action-required contract before implementation.                                  |
| 2026-08-30T03:47:13Z | 6         | implementation  | Force is now the single stop command for a proven-running owned AppHost; already-gone is action-required; PID/helper/container checks are positive. |
| 2026-08-30T03:47:13Z | 6         | gates           | Teardown suite 46/46; scoped check/lint/fmt, direct configured lint, assets, quality scan, and arch check all pass.                                 |
| 2026-08-30T03:47:13Z | 6         | reconcile       | Phase B remains lease-backed; PR stays draft/stacked. The missing slice-5 comment is repaired; slice-6 evidence posts after the explicit push.      |

## Decisions

| Decision                                          | Reason                                                              | Source                         |
| ------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| Treat process relevance separately from ownership | DCP/PPID evidence is not authorization.                             | #1429; AGENTS resource hygiene |
| Use the issue's exact five-slice order            | Maintains RED-first and stacked-PR reviewability.                   | owner dispatch                 |
| Use force as the one running-AppHost stop variant | V6 no-running exit 0 is inert; V7 running force cleans persistence. | S2 V6/V7; IMPL-EVAL cycle 1    |
| Treat exit codes as diagnostics, not confirmation | Only observed PID/helper/container disappearance proves cleanup.    | A13; IMPL-EVAL cycle 1         |

## Drift

| Drift                                                                                           | Severity    | Logged in drift.md |
| ----------------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Two-step force ordering encoded the V7 argv in the wrong lifecycle state; corrected in slice 6. | significant | yes                |

## Gate Results

### Static Gates

| Gate            | Command or check                              | Result | Notes                                                               |
| --------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------- |
| scoped check    | structured wrapper                            | PASS   | 12 files; `--unstable-kv`; 0 findings.                              |
| scoped lint     | structured wrapper with explicit empty config | PASS   | 12/12 files; 0 findings; root config excludes `.llm/`.              |
| scoped fmt      | structured wrapper                            | PASS   | 12 files; 0 findings.                                               |
| configured lint | direct structured wrapper                     | PASS   | 2,043/2,043 files; 0 findings; corrected `05-configured-lint.json`. |

### Fitness Gates

| Gate                      | Result | Evidence                        | Notes                                                                         |
| ------------------------- | ------ | ------------------------------- | ----------------------------------------------------------------------------- |
| no-cast/no-ignore review  | PASS   | added-line diff scan            | No `any`, type casts, lint ignores, or TS ignores were added.                 |
| Slice 2 focused review    | PASS   | diff scan                       | No new `any`, cast, or lint-ignore; classification remains pure behind ports. |
| quality scan              | PASS   | `receipts/05-quality-scan.json` | No findings; existing allowance count remains 7.                              |
| architecture check        | PASS   | `receipts/05-arch-check.json`   | Exit 0; repository baseline warnings only.                                    |
| Slice 6 no-cast/no-ignore | PASS   | added-line diff scan            | No `any`, type casts, lint ignores, or TS ignores added.                      |
| Slice 6 quality scan      | PASS   | `receipts/06-quality-scan.json` | No findings; existing allowance count remains 7.                              |
| Slice 6 architecture      | PASS   | `receipts/06-arch-check.json`   | Exit 0; repository baseline warnings only.                                    |

### Runtime Gates

| Gate                        | Result          | Evidence                                  | Notes                                                              |
| --------------------------- | --------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Phase A unit fixtures       | PASS            | `receipts/05-teardown-tests.json`         | 40 passed, 0 failed; no AppHost start.                             |
| Slice 1 RED                 | FAIL (expected) | `receipts/01-red-orphan-process.json`     | Exact #1429 visibility regression; exit 1 at baseline `fe4f496bd`. |
| Slice 2 descendant tracking | PASS            | `receipts/02-descendant-tracking.json`    | 33 passed, 0 failed; receipt head `593a33c`.                       |
| Slice 3 force-persistent    | PASS            | `receipts/03-force-persistent.json`       | 36 passed, 0 failed; receipt head `555d204`.                       |
| Slice 4 post-stop confirm   | PASS            | `receipts/04-post-stop-confirmation.json` | 40 passed, 0 failed; receipt head `28f8807`.                       |
| Slice 6 evaluator fixes     | PASS            | `receipts/06-teardown-tests.json`         | 46 passed, 0 failed; running/gone/env/container arms.              |
| Phase B live reproduction   | N/A             | `phase-b-handoff.md`                      | Requires supervisor-provided runtime lease.                        |

### Consumer Gates

| Consumer                    | Result | Evidence                         | Notes                                                      |
| --------------------------- | ------ | -------------------------------- | ---------------------------------------------------------- |
| agent-tools embedded corpus | PASS   | `receipts/05-assets-barrel.json` | Canonical regeneration/check clean; no generated delta.    |
| slice-6 embedded corpus     | PASS   | `receipts/06-assets-barrel.json` | Regenerated after playbook correction; no generated delta. |

## Handoff Notes

- The Fable supervisor should inspect ownership separation and the MCP/foreign invariants first.
- This implementation session does not perform slice review sign-off or IMPL-EVAL.
- Slice 6 requires the separate Fable IMPL-EVAL cycle 2; this implementation lane does not certify
  it.
