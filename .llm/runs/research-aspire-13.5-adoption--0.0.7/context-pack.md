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

| Slice | Issue / PR | Live head | Live CI / merge state | Reconciled state and next step |
| ----- | ---------- | --------- | --------------------- | ------------------------------ |
| S1 | #1713 / PR #1727 (draft) | `ee379457e` | CLEAN, no failing checks | Tier-A signed off; IMPL-EVAL cycle 1 `FAIL_FIX` evidence closed. Still parked on the **baseline Fresh fix #1734 / PR #1736** (`ed8a8e9ca`, draft, owned by the fixes lane). Resume = rebase on merged #1736 → rerun `e2e-cli` → delta IMPL-EVAL cycle 2 → ready. Not an Aspire defect. |
| S2 | #1714 / PR #1735 (**ready**) | `fffbb0c47` | **CLEAN**, all checks green | IMPL-EVAL **PASS**, close-gate PASS, `status:ready-merge`, zero-leak proven. **Ready for HUMAN merge** — this session does not merge. Unchanged by the migration. |
| S3 | #1715 / PR #1741 (draft) | `fe4f496bd` | CLEAN, no failing checks | Phase A IMPL-EVAL **PASS** (cycle 2). Phase B (telemetry envelopes) is **lease-blocked**. The pre-migration Codex child (`01a05045-…`) did not survive; a new thread must be launched via `agentic:launch-codex-slice` when the lease is granted. |
| S4 | #1716 / PR #1738 (**ready**) | `732992415` | CLEAN, no failing checks | Tier-A + IMPL-EVAL **PASS**, close-gate PASS, `status:ready-merge`. `e2e-cli` red only on the #1734 baseline. Resume = rebase after #1736 → rerun `e2e-cli` → coordinator merge. |
| S5 | #1717 / PR #1740 (ready-labelled) | `f3b3e75e`+ (repair in flight) | **RED** — `quality` / "Generated asset freshness" FAIL (run `33297719237`); `check-test` now **green** | **Recorded PASS is void — see D-20.** Four verified defects (F-1 stale `plugins/ai` manifest assertion; F-2 stream factories throw instead of using Aspire discovery; F-3 CLI announces a template port; F-4 line-scoped fitness-gate regex). Repair thread `01a0515b-8f4a-7412-a151-42d5fb4258d7` landed F-1..F-4 (`d2b25725`, `46264f7c`, `79255394`, `f3b3e75e`) and `check-test` is green. One branch-owned blocker remains: stale `agent-tools.generated.ts` barrel — **D-23**. Same thread steered to regenerate, re-cut exact-head evidence, and drive CI green. Needs fresh Tier-A + fresh independent IMPL-EVAL afterwards. **Coordinator decision:** `status:ready-merge` + `impl-eval:skip` are live on a red PR; this session does not relabel. |
| S6 | #1718 / PR #1743 (draft, base = S5 branch) | `1fa5aeec1` | CLEAN, no failing checks | Phase A landed (slice 6 = the D-19 13.5.3 typing correction). **Stays draft** until Phase-B runtime receipts, supervisor Tier-A review, and an independent IMPL-EVAL. Tier-A is deliberately sequenced **after** the S5 repair lands and S6 rebases, so the review is performed once on the final head. Phase B is lease-blocked. |
| S7 | #1719 / PR #1744 (draft, base = S3 branch) | `eb6f188ce` | CLEAN, no failing checks | **IMPL-EVAL cycle 2 = `PASS`** (relaunched Claude · Fable 5 · medium session `c94f14b8`; verdict `slices/s7/evaluate-cycle-2.md`, PR comment `#issuecomment-5467185007`). Both cycle-1 blockers fixed; evaluator re-executed all gates green (46/46 suite, scoped 0/0/0, configured lint 2043/0, quality+arch+assets exit 0, both REDs reproduced). Evaluator mutated nothing: branch head, draft state, and labels unchanged. **Phase A is done; PR stays draft for lease-backed Phase B** (+ D-24 provenance note). |
| S8–S11, S13 | #1720–#1724 | — | — | Queued. S8 dispatch waits for the settled S6 head; S9 expects the 14-tool MCP set (D-15); S13 needs the D-17 telemetry-resolver ratification. |
| S12, S6b | #1725, #1726 (0.0.8) | — | — | After canary B. |

## Runtime lease — preconditions proven, lease not yet requested/granted (2026-08-30)

Both zero-state proofs were taken on the NAS host before any runtime work was contemplated:

- `aspire ps --format Json --nologo --non-interactive` → `[]` (exit 0). Aspire CLI
  `13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688`.
- `docker ps -a` against `DOCKER_HOST=tcp://netscript-dind:2375` → header only, **no containers**.

Three phase-B workstreams are queued behind a single serialized lease and must run one at a time,
each returning the host to proven zero before the next starts: **S6** (listener-unreachable fixture
+ `healthReports` receipts), **S3** (telemetry envelopes), **S7** (#1429 live reproduction +
foreign-AppHost re-test). Owned cleanup back to zero is verified with
`agentic:leak-check` / `agentic:teardown` scoped to run-owned resources; foreign or unknown-owner
entries are reported and never mutated.

