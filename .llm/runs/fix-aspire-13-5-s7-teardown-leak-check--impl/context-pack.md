# Context Pack: Aspire 13.5 teardown and leak-check

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-aspire-13-5-s7-teardown-leak-check--impl`  |
| Branch         | `fix/aspire-13-5-s7-teardown-leak-check`        |
| Current phase  | `implement`                                     |
| Archetype      | `6 - CLI / Tooling` (internal-tooling analogue) |
| Scope overlays | none                                            |

## Current State

The reporter fix and bootstrap correction remain static-green. D-189 used the coordinator-granted
serialized lease at exact head `be2c7a3b0` to capture the 13.5.3 launcher-SIGKILL lifecycle at a
1.093 s completed census and the foreign-AppHost control. The owned AppHost registration vanished,
while re-parented DCP/controller/service processes and both containers were still visible; by
64.262 s the process tree and non-persistent Redis had self-cleaned, while the PostgreSQL container
with `com.microsoft.developer.usvc-dev.persistent=true` remained. Scoped teardown removed only that
positively proven owned container and preserved the foreign control's exact PID/start and container
identities. The control was then stopped by its own exact AppHost path, and one detached, empty,
positively proven owned persistent network was removed by exact ID. Final Aspire, Docker container,
Docker volume, and custom-network inventories are zero. The receipt reports these facts without
adjudicating the acceptance wording or marking either issue.

## Completed

- Harness bootstrap, research, locked plan, and Design checkpoint.
- PLAN-EVAL recorded N/A because the ratified dispatch leaves no unresolved design choice.
- Synthetic S2-shaped PPID-1 fixture plus failing #1429 leak-check regression.
- Process discovery from bounded `ps`/`/proc` probes with DCP label, exact AppHost argv, and
  descriptor-to-Unix-socket evidence.
- Positive path ownership, foreign worktree reporting, and both Aspire MCP command guards.
- Dry-run `plannedCommands` plus force execution only after apply, explicit flag, positive AppHost
  ownership, stable running-PID proof, and positive post-stop confirmation.
- Six 500 ms confirmation probes (2.5 s total) derived from S2 V6's 385 ms observation; associated
  helpers time out to escalation without a kill.
- Aged standalone orphans require an OK AppHost census, positive path ownership, and stable PID
  identity before one targeted TERM; young/ambiguous rows escalate.
- 13.5 lifecycle/safety playbook update and named Phase-B receipt procedure.
- Scoped wrappers, 40/40 tests, configured lint, assets, quality, and architecture gates all green.
- Slice 6 adds positive PID/helper/container confirmation, the already-gone force refusal, and a
  non-Aspire `ASPIRE_*` environment false-positive regression. The suite is green at 46/46.
- Reporter fix adds the exact Phase-B live snapshot fixture, `content-root-argv` and `cwd-path`
  evidence, host-independent sibling-worktree classification, and four exact owned orphan TERM
  plan assertions. The suite is green at 47/47 and all `08-*` static receipts pass.
- Bootstrap correction preserves the full generated-project S7 fixture and requires offline
  PostgreSQL codegen before root install/type-check. RED/GREEN evidence is in receipts 21-22.
- The single converged-head attempt used that corrected order in both scratches, started each
  AppHost once, preserved the foreign control through leased teardown, and sealed receipts 31-40.
- D-189 captured the real 13.5.3 kill receipt, including `/proc/<pid>/cwd` and
  `/proc/<pid>/cmdline` identities before and after SIGKILL, Docker before/after, and the Persistent
  lifetime annotation.
- D-189 proved the foreign control stayed byte-for-byte identifiable through owned teardown and
  added the integrated age/inactive/path-owned/PPID-only synthetic apply regression. The teardown
  suite is green at 48/48.
- D-189 released the lease at exact four-part zero and sealed the independent final reporter output
  in `receipts/d189-11-independent-leak-check.json`.

## In Progress

- None. D-189 evidence capture and lease cleanup are complete; independent evaluation remains
  outside this implementation session.

## Next Steps

1. The coordinator/evaluator decides how the Persistent-lifetime survivor bears on the held wording.
2. Do not tick #1719/#1429, self-certify, or post evaluator acceptance from this session.

## Key Decisions

| Decision                          | Source         | Notes                                          |
| --------------------------------- | -------------- | ---------------------------------------------- |
| PPID is visibility, not ownership | #1429          | Only path/registry proof authorizes mutation.  |
| No runtime lease in Phase A       | owner dispatch | All behavior uses fixtures and injected ports. |

## Files Changed

| Path                                                                        | Status  | Notes                                                               |
| --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/`                   | new     | Harness state and evidence.                                         |
| `.llm/tools/agentic/teardown/{ports,probes,ownership,leak-check}.ts`        | changed | Process discovery, evidence, ownership, reporting.                  |
| `.llm/tools/agentic/teardown/*_test.ts`                                     | changed | Versioned/foreign/MCP/process safety regressions.                   |
| `.llm/tools/agentic/teardown/teardown.ts`                                   | changed | Force gate, bounded helper confirmation, targeted orphan cleanup.   |
| `.llm/tools/CLEANUP-PLAYBOOK.md`                                            | changed | Aspire 13.5 relevance, ownership, force, and confirmation contract. |
| `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/phase-b-handoff.md` | new     | Lease-only live receipt and closure procedure.                      |

## Gates

| Gate family | Current status | Evidence                                                       |
| ----------- | -------------- | -------------------------------------------------------------- |
| Static      | PASS           | scoped check/lint/fmt plus configured lint receipts            |
| Fitness     | PASS           | `05-quality-scan.json`; `05-arch-check.json`                   |
| Runtime     | EVIDENCE CAPTURED | `d189-live-runtime-receipt.json`; adjudication explicitly withheld |
| Consumer    | PASS           | `05-assets-barrel.json`; canonical generated corpus clean      |
| Eval fix    | PASS           | `06-*` receipts; 46/46 tests; direct configured lint JSON      |
| Reporter fix| PASS           | `07-red-*`; `08-*`; 47/47 tests; scoped static/fitness gates   |
| Bootstrap   | PASS           | `phase-b-21-bootstrap-red.txt`; `phase-b-22-bootstrap-green.txt` |

## Open Questions

- Whether the documented Persistent-lifetime PostgreSQL container counts as a "run-owned survivor"
  under the held acceptance wording is an open coordinator question.

## Drift and Debt

- Drift: significant live Phase-B ownership failure recorded in `drift.md`.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
