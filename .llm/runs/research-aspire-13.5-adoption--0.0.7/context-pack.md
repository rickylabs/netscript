# Context pack

## State (2026-08-29)

- Run `research-aspire-13.5-adoption--0.0.7` on branch `research/aspire-13.5-0.0.7` (worktree
  `/home/codex/repos/netscript-007-aspire-13-5-research`), baseline `cf648f1ff`. Orchestrator Fable
  5 medium, session `session_011Ng6hnMLyY8vzM8EJo2XKg`.
- **All research deliverables are complete and pushed**: `research.md`, `plan.md`, `epic-draft.md`,
  `sub-issues/01…13` (13 slices, 0.0.7) + S12 (0.0.8), `existing-issue-map.md`,
  `stale-surface-inventory.md`, **`aspire-surface-manifest.tsv`** (809 rows, generator
  `tools/aspire-surface-manifest.ts`), `receipts/aspire-13.4.6-mcp-baseline.json`, `sources/`,
  `drift.md` D-1…D-11, `worklog.md`, `plan-eval.md` (cycle 1 = FAIL_PLAN, repaired).
- Nothing was created on GitHub; no product code, generated file, or static resource was touched.
- Local Aspire CLI is still 13.4.6 (not upgraded); no AppHost was started.

## Headline findings

- Target 13.5.3 (2026-08-25). Version mixing 13.4.6↔13.5 fails at runtime; 13.5.1 fixed 13.5-SDK-
  under-13.4-CLI codegen. Bump must be atomic (S1).
- No source-level breaking-change exposure (12/12 mapped). Behavioural risks: proxyless port
  allocation timing, TS startup timing, orphan-AppHost auto-cleanup, telemetry discovery (#1025).
- TS GA gives `addHealthCheck`/`withHealthCheck` (unblocks #1280) and typed resource-command
  arguments (S6, S8). `CommunityToolkit.Aspire.Hosting.Deno` is projected into the TS API (S12
  spike); first-party Deno hosting is upstream milestone 13.6 → `_aspire-compat.mts` stays.
- Aspire MCP is `aspire agent mcp` only; NetScript wiring already correct; skill tool table needs
  `get_integration_docs`/`refresh_tools`; upstream `aspire` skill name collides with NetScript's
  (OF-1).
- Pins live in 14 places; `e2e-cli-prod` already on a 13.5 preview; new parity gate proposed (D-2).

## Implementation phase (from 2026-08-29)

- Ratified on `0ba8c2fcf`; GitHub is now the source of truth: epic #1712; S1 #1713, S2 #1714, S3
  #1715, S4 #1716, S5 #1717, S6 #1718, S7 #1719, S8 #1720, S9 #1721, S10 #1722, S11 #1723, S13 #1724
  (0.0.7); S12 #1725, S6b #1726 (0.0.8). `FILING-LOG.md` has labels/milestones/actions.
- Supervisor: this Fable 5 medium session (serial Sol implementation agents, one child at a time,
  Tier-A review before sign-off, independent IMPL-EVAL). Coordinator keeps milestone authority,
  runtime/expensive leases, merges, canary admission, ledger.
- Slice worktrees: S1 → `/home/codex/repos/netscript-aspire-13-5-s1` on
  `chore/aspire-13-5-s1-pin-bump` off `origin/main` `3b32d1628`, no upstream. Slice state under
  `slices/s1/`.

## Repair state (PLAN-EVAL cycles 1 and 2)

Cycle 2 (`plan-eval-cycle-2.md`, head `1bfe60b05`) = FAIL_PLAN on six consistency findings; all six
corrected in the cycle-2 repair commit (matrix in `worklog.md`): one 13-slice/three-canary program
in every authoritative surface (D-10, slice table, rollback, risks, ratification);
`excludeFromMcp()` = MCP exposure only (D-6, `withHidden()` not adopted); parity phases with the
entire run dir + debt registry archival and compat fixtures special-cased (D-13, D-16); manifest
rules extended (810 rows, idempotent); `SAGAS_API_DEFAULT_PORT` retained as `@deprecated` compat
export (D-14); C16/C17/C20–C22 + inventory rows reconstructed and deployment owned by S4 (D-15);
D-17 default locked for coordinator ratification before S13. **No third ordinary PLAN-EVAL exists;
next step is coordinator ratification, then this session receives the implementation-supervisor
mandate.**

## Repair state (PLAN-EVAL cycle 1)

F1–F7 corrected (mapping in `worklog.md`): listener-readiness health contract (D-5), three mandatory
canaries + stable admission (D-10), S8 owns `excludeFromMcp()` and S9 proves it with a
locked-lifecycle receipt (D-6), parity phases 1/2 over the manifest (D-13), S13 everywhere,
jsr-audit recorded (D-14, research §15), tables/summaries repaired. A second PLAN-EVAL cycle needs
owner authorization.

## Next for the coordinator

1. Answer OF-1…OF-5 (defaults in `plan.md`).
2. Final coordinator ratification of D-1…D-17 (no further ordinary PLAN-EVAL).
3. On PASS: add `epic:aspire-13-5` to `.github/labels.yml`, file epic + S1–S11 (0.0.7) + S12 (0.0.8)
   from the drafts, comment/relabel per `existing-issue-map.md`.
4. Start S1 (mechanical) and S2 (runtime lease) immediately; cut canary A after S1–S3, canary B
   after S4–S8, canary C after S9–S11 + S13; stable per D-10.

## Live slice board (supervisor, 2026-08-30 — GitHub wins on conflict)

| Slice           | Issue / PR                   | Head                                                                                                                      | State                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1              | #1713 / PR #1727 (draft)     | `ee379457e` on `chore/aspire-13-5-s1-pin-bump`                                                                            | Tier-A signed off; IMPL-EVAL cycle 1 `FAIL_FIX` (evidence closed); blocked only on baseline Fresh fix #1734 / PR #1736; resume: rebase → rerun `e2e-cli` → delta IMPL-EVAL cycle 2 → ready.                                                             |
| S2              | #1714 / PR #1735 (**ready**) | `fffbb0c47` on `test/aspire-13-5-s2-runtime-verification`                                                                 | IMPL-EVAL **PASS** (Fable job `9d011c21`); lease released; zero-leak proven; `impl-eval:skip` + `ci:skip-e2e`; close-gate PASS, mergeState CLEAN, `status:ready-merge` — coordinator merges. Receipts copied to `receipts/aspire-13.5-verification.md`. |
| S4              | #1716                        | PR #1738 **ready**, head `732992415` (product head `c2cceba00` + supervisor sign-off `412e4b524` drift entry + fmt fix), base `13878a80a` | Tier-A PASS + IMPL-EVAL **PASS** (`170c1f19`); `impl-eval:skip` + `status:ready-merge`; #1716 acceptance-evidence block in body. Awaiting CI `scaffold.runtime` + close-gate; merge is the coordinator's. |
| S5              | #1717                        | worktree `/home/codex/repos/netscript-aspire-13-5-s5` @ `13878a80a`, branch `fix/aspire-13-5-s5-literal-ports` | **active child**: thread `01a04ff1-28a6-7e70-9a25-b2307bc78800` (Sol high, route matched), runner pid 1179887, log `.llm/tmp/aspire-s5/runner.log`; brief `slices/s5/brief.md` (D-14 + D-16 infra host ports). |
| S3, S5–S11, S13 | #1715, #1717–#1724           | —                                                                                                                         | queued; S3 can consume S2's V5 receipts; S5 must include infrastructure host ports (D-16); S9 expects the 14-tool MCP set (D-15).                                                                                                                       |
| S12, S6b        | #1725, #1726 (0.0.8)         | —                                                                                                                         | after canary B.                                                                                                                                                                                                                                         |

Host state: Aspire CLI 13.5.3 (lease-authorized, kept). Evaluator worktrees:
`netscript-aspire-13-5-s1-eval` (@ `69b2ebaf6`), `netscript-aspire-13-5-s2-eval` (@ `fffbb0c47`).
