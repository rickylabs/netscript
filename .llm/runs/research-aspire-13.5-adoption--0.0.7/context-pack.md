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
