# Context pack

## State (2026-08-29)

- Run `research-aspire-13.5-adoption--0.0.7` on branch `research/aspire-13.5-0.0.7` (worktree
  `/home/codex/repos/netscript-007-aspire-13-5-research`), baseline `cf648f1ff`. Orchestrator Fable
  5 medium, session `session_011Ng6hnMLyY8vzM8EJo2XKg`.
- **All research deliverables are complete and pushed**: `research.md`, `plan.md`, `epic-draft.md`,
  `sub-issues/01…13`, `existing-issue-map.md`, `stale-surface-inventory.md` (whole-ecosystem
  surfaces + archival exemption list), `receipts/aspire-13.4.6-mcp-baseline.json`, `sources/`
  (verbatim upstream Markdown), `drift.md` D-1…D-10, `worklog.md`.
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

## Next for the coordinator

1. Answer OF-1…OF-5 (defaults in `plan.md`).
2. Dispatch PLAN-EVAL (Codex Sol high) on this branch.
3. On PASS: add `epic:aspire-13-5` to `.github/labels.yml`, file epic + S1–S11 (0.0.7) + S12 (0.0.8)
   from the drafts, comment/relabel per `existing-issue-map.md`.
4. Start S1 (mechanical) and S2 (runtime lease) immediately; cut canary A after S1–S4.
