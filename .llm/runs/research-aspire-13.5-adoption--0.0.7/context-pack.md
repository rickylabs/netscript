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

## Live slice board (NAS supervisor, 2026-08-30 — reconciled against live GitHub)

Reconciliation rule: **git + live GitHub win over every recorded verdict.** Pre-migration
`/home/codex/...` worktrees, Codex threads, and `aspire-s*-impl-eval*` Remote Control sessions are
historical; all of those evaluator sessions are `offline` and none was resumed.

| Slice       | Issue / PR                                 | Live head                                 | Live CI / merge state       | Reconciled state and next step                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------- | ------------------------------------------ | ----------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1          | #1713 / PR #1727 (draft)                   | `ee379457e`                               | CLEAN, no failing checks    | Tier-A signed off; IMPL-EVAL cycle 1 `FAIL_FIX` evidence closed. Still parked on the **baseline Fresh fix #1734 / PR #1736** (`ed8a8e9ca`, draft, owned by the fixes lane). Resume = rebase on merged #1736 → rerun `e2e-cli` → delta IMPL-EVAL cycle 2 → ready. Not an Aspire defect.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S2          | #1714 / PR #1735 (**ready**)               | `fffbb0c47`                               | **CLEAN**, all checks green | IMPL-EVAL **PASS**, close-gate PASS, `status:ready-merge`, zero-leak proven. **Ready for HUMAN merge** — this session does not merge. Unchanged by the migration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| S3          | #1715 / PR #1741 (draft)                   | `fe4f496bd`                               | CLEAN, no failing checks    | Phase A IMPL-EVAL **PASS** (cycle 2). Phase B (telemetry envelopes) is **lease-blocked**. The pre-migration Codex child (`01a05045-…`) did not survive; a new thread must be launched via `agentic:launch-codex-slice` when the lease is granted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| S4          | #1716 / PR #1738 (**ready**)               | `732992415`                               | CLEAN, no failing checks    | Tier-A + IMPL-EVAL **PASS**, close-gate PASS, `status:ready-merge`. `e2e-cli` red only on the #1734 baseline. Resume = rebase after #1736 → rerun `e2e-cli` → coordinator merge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| S5          | #1717 / PR #1740                           | `aa822069`                                | **all jobs green, CLEAN**   | **TERMINAL from this lane.** Repair range `0bd8ba83..aa822069` fixed F-1..F-4 + Tier-A finding T-1. Tier-A **signed off** (`slices/s5/repair/review-tier-a.md`); **IMPL-EVAL cycle 3 `PASS`** (fresh Fable 5 session `e100ce32`, `slices/s5/evaluate-cycle-3.md`, PR comment `#issuecomment-5467470320`) — it reproduced RED at `0bd8ba83` itself and re-verified every Tier-A claim. Review threads `unanswered=0`. Evaluator mutated nothing. **F-A executed on the NAS (D-33):** 26/27, the single red is the baseline #1734 Fresh `hydration.ts` `TS2345` (fix PR #1736 still draft) — AppHost never reached, so `aa822069` is runtime-**BLOCKED on #1736** like S1/S4, not red on its own diff. Receipt `slices/s5/receipts/e2e-scaffold-runtime-aa822069-nas.*`. Lease released at proven zero; no retry. F-B..F-E are hygiene. |
| S6          | #1718 / PR #1743 (draft, base = S5 branch) | `564d465cc` (D-29 rebase onto `aa822069`) | CLEAN, no failing checks    | Phase A: slice 6 closed cycle-1 H-1/H-2/M-1; **Tier-A cycle 2 signed off** at `564d465c` (`slices/s6/review-tier-a.md`, PR comment `#issuecomment-5467721863`) on executed gates (462/0 tests, 0 diagnostics, quality/arch/barrel/publish-assets/host-ports exit 0) and a **NAS-executed D-19 consumer typecheck PASS** (`slices/s6/receipts/consumer-typecheck-13.5.3-564d465c.txt`; the 13.4.6 run proves the S1 dependency). **IMPL-EVAL cycle 2 dispatched** (session `988f2cdc…`, `slices/s6/eval-session-cycle-2.md`). Stays draft; Phase B lease-blocked.                                                                                                                                                                                                                                                                      |
| S7          | #1719 / PR #1744 (draft, base = S3 branch) | `eb6f188ce`                               | CLEAN, no failing checks    | **IMPL-EVAL cycle 2 = `PASS`** (relaunched Claude · Fable 5 · medium session `c94f14b8`; verdict `slices/s7/evaluate-cycle-2.md`, PR comment `#issuecomment-5467185007`). Both cycle-1 blockers fixed; evaluator re-executed all gates green (46/46 suite, scoped 0/0/0, configured lint 2043/0, quality+arch+assets exit 0, both REDs reproduced). Evaluator mutated nothing: branch head, draft state, and labels unchanged. **Phase A is done; PR stays draft for lease-backed Phase B** (+ D-24 provenance note).                                                                                                                                                                                                                                                                                                                 |
| S8–S11, S13 | #1720–#1724                                | —                                         | —                           | Queued. S8 dispatch waits for the settled S6 head; S9 expects the 14-tool MCP set (D-15); S13 needs the D-17 telemetry-resolver ratification.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| S12, S6b    | #1725, #1726 (0.0.8)                       | —                                         | —                           | After canary B.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Runtime lease — S5 F-A lease executed and released; Phase-B leases next (2026-08-30)

Both zero-state proofs were taken on the NAS host before any runtime work was contemplated:

- `aspire ps --format Json --nologo --non-interactive` → `[]` (exit 0). Aspire CLI
  `13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688`.
- `docker ps -a` against `DOCKER_HOST=tcp://netscript-dind:2375` → header only, **no containers**.

**Checkpoint 2 (Fable 5 medium restart):** the coordinator granted the first serialized host lease
for S5 F-A at `aa822069`. Preflight failed before any runtime started: `aspire doctor` →
`.NET SDK
not found`, Docker client 27.5.1 < 28.0, and the dind sandbox is a different host from
this container (ports not on `localhost`). Nothing was created; the host is still at proven zero.
The lease is returned unused; the F-A verdict needs a CI `e2e-cli.yml` dispatch on the S5 branch or
a re-grant after NAS provisioning — **D-31** has the evidence and the three options. `e2e:cli` is
not in the durable gate catalog (**D-32**).

**Checkpoint 3:** after coordinator provisioning (dotnet 10.0.400 + node 24.20.0 via mise) the S5
attempt ran: 26/27, red only on baseline #1734 (D-33); host back at zero, lease released. The
AppHost boot path and Docker 27.5.1 (< 28 minimum, warning) remain **unexercised** on this host —
the first Phase-B lease answers that question. Recommended next lease: S3 Phase B.

Three phase-B workstreams are queued behind a single serialized lease and must run one at a time,
each returning the host to proven zero before the next starts: **S6** (listener-unreachable fixture

- `healthReports` receipts), **S3** (telemetry envelopes), **S7** (#1429 live reproduction +
  foreign-AppHost re-test). Owned cleanup back to zero is verified with `agentic:leak-check` /
  `agentic:teardown` scoped to run-owned resources; foreign or unknown-owner entries are reported
  and never mutated.
