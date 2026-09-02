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

| Time                 | Slice     | Step              | Notes                                                                                                                                                                                          |
| -------------------- | --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30T03:05:31Z | bootstrap | research/design   | Read issues, S2 receipts, S3 fixture, skills, harness workflow, doctrine, and current teardown code.                                                                                           |
| 2026-08-30T03:05:31Z | plan      | PLAN-EVAL         | N/A: the owner-ratified issue and dispatch lock all decisions, five slices, boundaries, and gates; no material planning decision remains open.                                                 |
| 2026-08-30T03:07:56Z | 1         | RED receipt       | Durable test receipt: 7 passed, 1 failed; orphan process expectation received `[]`.                                                                                                            |
| 2026-08-30T03:09:21Z | 1         | push              | Pushed `593a33c` with the explicit head refspec; opened draft PR #1744 and posted commit evidence.                                                                                             |
| 2026-08-30T03:15:52Z | 2         | gate              | Descendant tracking passed 33/33 with all evidence modes, both ps fixtures, foreign/MCP guards, and false-positive coverage.                                                                   |
| 2026-08-30T03:15:52Z | 2         | reconcile         | #1719/#1429 remain open; PR #1744 stays draft at `status:impl`, stacked on S3; Phase B remains lease-backed. No new comments changed the plan.                                                 |
| 2026-08-30T03:17:08Z | 2         | push              | Pushed `555d204` with the explicit head refspec and posted the slice-2 PR evidence comment.                                                                                                    |
| 2026-08-30T03:18:45Z | 3         | gate              | Force-persistent passed 36/36: exact dry-run argv, apply/flag/ownership arms, scoped-stop confirmation, and no force by default.                                                               |
| 2026-08-30T03:18:45Z | 3         | reconcile         | PR #1744 remains draft/stacked; closing issues and Phase-B dependency are unchanged. No reviewer comment changed the plan.                                                                     |
| 2026-08-30T03:20:02Z | 3         | push              | Pushed `28f8807` with the explicit head refspec and posted the slice-3 PR evidence comment.                                                                                                    |
| 2026-08-30T03:23:50Z | 4         | gate              | Post-stop/orphan process suite passed 40/40: exits-in-time, bounded timeout/no-kill, stable targeted TERM, age, and census fail-closed arms.                                                   |
| 2026-08-30T03:23:50Z | 4         | reconcile         | PR remains draft/stacked; no runtime start occurred and no new comment changed the locked Phase-A/Phase-B split.                                                                               |
| 2026-08-30T03:25:07Z | 4         | push              | Pushed `a0cbaf6` with the explicit head refspec and posted the slice-4 PR evidence comment.                                                                                                    |
| 2026-08-30T03:28:24Z | 5         | gates             | Scoped check/lint/fmt, 40/40 teardown tests, configured lint, assets check, quality scan, and arch check all passed.                                                                           |
| 2026-08-30T03:28:24Z | 5         | docs/evidence     | Added the 13.5 playbook section and lease-backed Phase-B receipt/closing-evidence procedure; canonical regeneration produced no generated delta.                                               |
| 2026-08-30T03:28:24Z | 5         | reconcile         | Phase B and IMPL-EVAL remain deferred to separate leased/evaluator sessions; PR stays draft and stacked on S3.                                                                                 |
| 2026-08-30T03:28:24Z | 5         | push              | Pushed `473286671` with the explicit refspec. The slice-5 PR comment was omitted; IMPL-EVAL cycle 1 caught the missing trail entry.                                                            |
| 2026-08-30T03:47:13Z | eval-1    | FAIL_FIX          | Fable 5 found inert two-step force ordering (high), missing slice-5 comment (medium), and an environment-key false positive (low).                                                             |
| 2026-08-30T03:47:13Z | 6         | RED               | `06-red-evaluator-fixes.json` failed type-check against the absent action-required contract before implementation.                                                                             |
| 2026-08-30T03:47:13Z | 6         | implementation    | Force is now the single stop command for a proven-running owned AppHost; already-gone is action-required; PID/helper/container checks are positive.                                            |
| 2026-08-30T03:47:13Z | 6         | gates             | Teardown suite 46/46; scoped check/lint/fmt, direct configured lint, assets, quality scan, and arch check all pass.                                                                            |
| 2026-08-30T03:47:13Z | 6         | reconcile         | Phase B remains lease-backed; PR stays draft/stacked. The missing slice-5 comment is repaired; slice-6 evidence posts after the explicit push.                                                 |
| 2026-08-30T18:31:18Z | phase-b   | preflight         | Lease census: Aspire `[]`; dind 28.5.2; Docker containers/volumes empty; supervisor `loopback-relay.ts` observed and excluded from ownership.                                                  |
| 2026-08-30T18:32:51Z | phase-b   | control start     | Foreign-control AppHost started first at exact PID/start identities 3208145/29782274 and CLI 3208128/29782259 on SDK 13.5.3.                                                                   |
| 2026-08-30T18:33:12Z | phase-b   | run start         | Leased-run AppHost started under `.llm/tmp/s7-phase-b`; baseline identities and redacted Aspire/process receipts captured.                                                                     |
| 2026-08-30T18:34:48Z | phase-b   | signal correction | Initial SIGTERM gracefully stopped the run and could not retain descendants; corrected once with the required non-graceful signal on the same authorized AppHost.                              |
| 2026-08-30T18:36:32Z | phase-b   | #1429 reproduce   | Validated run CLI PID/start identity received SIGKILL only; `aspire-managed` server, AppHost TSX, and DCP descendants were immediately re-parented to PID 1.                                   |
| 2026-08-30T18:36:33Z | phase-b   | leak-check        | FAIL: reporter observed the re-parented run tree but classified its `aspire-managed`/DCP descendants `unproven` with empty evidence; run containers were owned and control remained non-owned. |
| 2026-08-30T18:37:19Z | phase-b   | teardown preview  | Dry-run planned only exact owned Postgres removal; no `--all`, control mutation, relay mutation, or process mutation. It also reported no-running-AppHost action required.                     |
| 2026-08-30T18:37:28Z | phase-b   | teardown apply    | Exit 4: removed only owned run Postgres; no foreign/control/relay mutation; no scoped stop or orphan TERM was authorized because the run AppHost was absent and descendants were unproven.     |
| 2026-08-30T18:38:35Z | phase-b   | post-apply proof  | Run-owned survivor set empty; foreign control retained the exact original PID/start identities and stayed running with no recorded mutation.                                                   |
| 2026-08-30T18:39:30Z | phase-b   | control cleanup   | Exact-path control stop completed; its in-window persistent Postgres was identity-checked and removed; anonymous volume inventory was empty.                                                   |
| 2026-08-30T18:39:45Z | phase-b   | final census      | `aspire ps` → `[]`; `docker ps -a` → only `relay-*`; `docker volume ls` → empty; process table → no owned `apphost.mts`/`aspire-managed`.                                                      |
| 2026-08-30T18:42:35Z | phase-b   | push/comment      | Failure evidence commit `6ccb4f42a` pushed with the explicit refspec; PR #1744 received `## [PHASE: IMPL] S7 phase B` without acceptance evidence.                                             |
| 2026-08-30T18:51:16Z | reporter-fix | RED             | `07-red-phase-b-live-snapshot.json` failed 1/1 at head `8633972fd`: the real Phase-B managed-server `--contentRoot` row and cwd-backed dashboard classified `unproven`; DCP-label/socket vectors remained owned. |
| 2026-08-30T18:55:16Z | reporter-fix | implementation  | Added resolved `--contentRoot`/helper-cwd evidence, host-independent sibling-worktree matching, and contained helper association. Real fixture passes and dry-run plans only exact owned PIDs. |
| 2026-08-30T18:55:16Z | reporter-fix | unit gate       | Teardown suite passed 47/47, including 13.4.6, 13.5.3 synthetic, and Phase-B live fixtures. The repository safety scan now excludes generated `.llm/tmp` before descent. |
| 2026-08-30T18:56:31Z | reporter-fix | gates           | At committed head `f48a151e9`: 47/47 tests; scoped check/lint/fmt processed 13/13 files; `quality:scan` and `arch:check` passed. Receipts: `08-*`. |
| 2026-08-30T18:56:31Z | reporter-fix | reconcile       | #1429/#1719 and acceptance evidence remain gated on the supervisor's lease-backed rerun. This static lane started no AppHost/container/evaluator and changed no product source. |
| 2026-08-30T19:13:44Z | phase-b-rerun | preparation    | Generated both authorized scratches and pinned the required 13.5.3 train. Both mandatory root `deno install` commands exited 1 on their generated contracts' missing `.generated/zod/crud.ts`; exact errors are in receipt 11. |
| 2026-08-30T19:13:44Z | phase-b-rerun | abort          | Applied the no-workaround/no-retry rule before restore or start. Neither control nor leased AppHost, container, volume, or Aspire child process was created; receipts 12-16 record the unexercised steps. |
| 2026-08-30T19:15:44Z | phase-b-rerun | final reporter | Read-only final leak-check exited 0 with no owned survivors. Its short-lived `aspire ps` probe was correctly unproven and left untouched; receipt 17 records it. |
| 2026-08-30T19:15:24Z | phase-b-rerun | final census   | `aspire ps` → `[]`; `docker ps -a` → empty; `docker volume ls` → empty; exact `/proc` census → no authorized-root `apphost.mts`/`aspire-managed` process. |
| 2026-08-30T19:15:24Z | phase-b-rerun | relay          | Supervisor relay PID 3368905 was classified foreign/supervisor-owned and left untouched; no `relay-*` containers were present at census time. |
| 2026-08-30T19:21:00Z | bootstrap-fix | RED            | Full generated-project fixture with the old root-install-first order exited 1 on the absent generated Zod `crud.ts`; no Aspire or Docker command ran. Evidence: `phase-b-21-bootstrap-red.txt`. |
| 2026-08-30T19:22:00Z | bootstrap-fix | GREEN          | Independent full fixture ran offline `database.codegen`, then root install and `check --skip-apphost`; codegen/install/check exited 0 and 121 files checked. Evidence: `phase-b-22-bootstrap-green.txt`. |
| 2026-08-30T19:22:00Z | bootstrap-fix | procedure      | Phase-B handoff now requires the canonical generated-project order: offline PostgreSQL codegen before root resolver/install/type-check, then exact AppHost restore/start under the next supervisor lease. |
| 2026-08-30T19:22:00Z | bootstrap-fix | surface/gates  | Run-dir artifacts only: no `packages/`, `plugins/`, or `.llm/tools/` change. Procedure format-check and diff whitespace check pass; proof tree trashed; root lock hash unchanged. |
| 2026-08-30T18:58:13Z | reporter-fix | push/comment    | Pushed RED `8e8f81bfe`, fix `f48a151e9`, and evidence `77dc6acfd` with the explicit refspec; posted the single `S7 phase B — reporter fix` PR #1744 comment without acceptance evidence. |
| 2026-08-30T19:27:41Z | phase-b-attempt | preflight/bootstrap | Exact head `f8201d4f72dff75882665153f4c0b941a1f8fc96`; host Aspire/Docker zero. Both full generated fixtures passed corrected offline DB codegen, root install, and exact restore on the 13.5.3 train. |
| 2026-08-30T19:29:12Z | phase-b-attempt | control start | Foreign control started first exactly once at CLI 3461184/30122391 and AppHost 3461203/30122409. |
| 2026-08-30T19:29:56Z | phase-b-attempt | run start | Leased run started exactly once at CLI 3469156/30126839 and AppHost 3469214/30126858; baseline process census selected 46 root-associated rows. |
| 2026-08-30T19:30:51Z | phase-b-attempt | SIGKILL | Validated leased CLI PID/start/cwd/apphost argv and sent one SIGKILL. The first post-signal census 11 seconds later found no leased-root descendant: the tree self-cleaned before classification. |
| 2026-08-30T19:31:20Z | phase-b-attempt | reporter | Leak-check exited 0 but found no leased process survivor; only the run's persistent Postgres was owned. Foreign control remained report-only. Criterion 1 did not reproduce; no retry. |
| 2026-08-30T19:32:56Z | phase-b-attempt | teardown | Preview planned only exact run Postgres removal. Apply removed that ID and returned 4 because foreign/control helpers remained escalated; no process TERM or foreign/relay mutation occurred. |
| 2026-08-30T19:33:10Z | phase-b-attempt | preservation | Post-apply leak-check found no owned survivors; control CLI/AppHost retained exact baseline PID/start identities and remained running until its own exact-path stop. |
| 2026-08-30T19:33:56Z | phase-b-attempt | phase cleanup | Exact-path control stop exited 0; its inspected in-window persistent Postgres was removed; volumes were empty; exact-root process census was empty; both scratches were trashed. |
| 2026-08-30T19:37:48Z | phase-b-attempt | relay/final census | Resumed authorization covered exact S7 relay cleanup. Watcher/containers disappeared concurrently before targeted TERM; no broad retry. Final Aspire, Docker containers, Docker volumes, S7 root processes, and S7 relay processes are all zero. |
| 2026-08-31T14:47:00Z | d189 | preflight/bootstrap | Verified exact branch/head `be2c7a3b0` and initial four-part zero; generated owned and sibling-worktree foreign fixtures from the local CLI, ran offline DB codegen before root install, and restored exact Aspire 13.5.3 AppHosts. |
| 2026-08-31T14:54:35Z | d189 | SIGKILL/census | Validated owned launcher PID 2455225 by start identity, `/proc` cwd, and exact AppHost argv; sent SIGKILL. The completed 1.093 s census found the AppHost registration gone but re-parented DCP/controller/service rows plus Redis and Persistent PostgreSQL still present. |
| 2026-08-31T14:55:39Z | d189 | reporter | At 64.262 s, owned processes and non-persistent Redis had self-cleaned. Leak-check reported the remaining path-proven Persistent PostgreSQL owned and the sibling-worktree AppHost/resources foreign. |
| 2026-08-31T14:56:00Z | d189 | teardown/control | Preview planned only the exact owned PostgreSQL removal. Apply removed only that ID and exited 4 on foreign/unproven escalations; the foreign CLI/AppHost PID/start identities and both container IDs were unchanged. |
| 2026-08-31T14:57:00Z | d189 | lease cleanup | Stopped the foreign control only by its exact AppHost path. Inspected and removed one detached empty network whose creator PID/start/path matched the owned DCP evidence. Final Aspire, container, volume, and custom-network inventories reached zero. |
| 2026-08-31T15:04:00Z | d189 | deterministic gates | Added integrated apply coverage for old inactive path-proven descendants versus foreign, PPID-only, young, and active-run controls. Full teardown suite passed 48/48; scoped check/lint/fmt all passed. |
| 2026-08-31T15:06:57Z | d189 | handoff | Sealed structured receipts `d189-01` through `d189-15` and the composite runtime receipt. No acceptance box, issue state, PR lifecycle, or evaluator action was changed. |

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
| Live PID-1 descendants lacked ownership evidence and classified `unproven`.                     | significant | yes                |

## Gate Results

### Static Gates

| Gate            | Command or check                              | Result | Notes                                                               |
| --------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------- |
| scoped check    | structured wrapper                            | PASS   | 12 files; `--unstable-kv`; 0 findings.                              |
| scoped lint     | structured wrapper with explicit empty config | PASS   | 12/12 files; 0 findings; root config excludes `.llm/`.              |
| scoped fmt      | structured wrapper                            | PASS   | 12 files; 0 findings.                                               |
| configured lint | direct structured wrapper                     | PASS   | 2,043/2,043 files; 0 findings; corrected `05-configured-lint.json`. |
| reporter scoped check | structured wrapper                      | PASS   | `08-scoped-check.json`; 13 files; 0 findings.                       |
| reporter scoped lint  | structured wrapper + explicit empty config | PASS | `08-scoped-lint.json`; 13/13 processed; 0 findings.                 |
| reporter scoped fmt   | structured wrapper                      | PASS   | `08-scoped-fmt.json`; 13 files; 0 findings.                         |

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
| Reporter quality scan     | PASS   | `receipts/08-quality-scan.json` | Exit 0; no findings; existing allowance count remains 7.                      |
| Reporter architecture     | PASS   | `receipts/08-arch-check.json`   | Exit 0; repository baseline warnings only.                                    |

### Runtime Gates

| Gate                        | Result          | Evidence                                  | Notes                                                                                                                                  |
| --------------------------- | --------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Phase A unit fixtures       | PASS            | `receipts/05-teardown-tests.json`         | 40 passed, 0 failed; no AppHost start.                                                                                                 |
| Slice 1 RED                 | FAIL (expected) | `receipts/01-red-orphan-process.json`     | Exact #1429 visibility regression; exit 1 at baseline `fe4f496bd`.                                                                     |
| Slice 2 descendant tracking | PASS            | `receipts/02-descendant-tracking.json`    | 33 passed, 0 failed; receipt head `593a33c`.                                                                                           |
| Slice 3 force-persistent    | PASS            | `receipts/03-force-persistent.json`       | 36 passed, 0 failed; receipt head `555d204`.                                                                                           |
| Slice 4 post-stop confirm   | PASS            | `receipts/04-post-stop-confirmation.json` | 40 passed, 0 failed; receipt head `28f8807`.                                                                                           |
| Slice 6 evaluator fixes     | PASS            | `receipts/06-teardown-tests.json`         | 46 passed, 0 failed; running/gone/env/container arms.                                                                                  |
| Phase B live reproduction   | FAIL            | `receipts/phase-b-01-*` … `phase-b-10-*`  | OS orphan reproduced, but live descendant ownership classified `unproven`; apply exited 4 after removing the owned Postgres container. |
| Phase B converged attempt   | FAIL (not reproduced) | `receipts/phase-b-31-*` … `phase-b-40-*` | The leased process tree self-cleaned before the first post-SIGKILL census; no orphan remained for classification/TERM. Apply removed exact owned Postgres and exited 4; foreign control was preserved. |
| Reporter-fix RED            | FAIL (expected) | `receipts/07-red-phase-b-live-snapshot.json` | Real receipt 02/03 rows reproduce missing `--contentRoot`/cwd ownership before implementation. |
| Reporter-fix teardown suite | PASS            | `receipts/08-teardown-tests.json`             | 47 passed, 0 failed; includes both version fixtures and the real Phase-B snapshot fixture.      |
| D-189 deterministic suite   | PASS            | `receipts/d189-12-synthetic-tests.json`       | 48 passed, 0 failed; includes age, inactive-run, path ownership, foreign, and PPID-only apply controls. |
| D-189 live lease            | EVIDENCE CAPTURED | `receipts/d189-live-runtime-receipt.json`    | Real SIGKILL and foreign-control facts captured; Persistent-lifetime wording is left to the coordinator/evaluator. |

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
- D-189 is evidence-complete and returned the host to exact four-part zero. The implementation lane
  does not adjudicate the Persistent-lifetime survivor, tick either held box, or self-certify.
