# S10 Tier-A slice review — #1722 / PR #1760 (stacked on S8 `9dd06647` → S6 → S5)

## Sign-off at exact head `14daa764` (phase A) — 2026-08-30

- Reviewer: Fable 5 medium supervisor (session `session_01Jusn3woxeK5xhCdj6ccooR`); generator: Codex
  · GPT-5.6 Sol · medium thread `01a052a5-21d9-7d80-b4b1-c267be7e112a`; worktree `007-aspire-s10`
  (clean, == origin); thread closed `DONE`.
- **Commit stack:** `b4d0a56f` RED gate contracts → `690d70b6` doctor + `describe --follow` evidence
  modules → `d6daf416` exact-AppHost cleanup ownership (S7 contract mirrored: `ASPIRE_MOUNTS` label,
  `ASPIRE_DCP_APPHOST_PATH`, `--apphost` argv) → `df8b3f18` `resource-command` gate class + receipt
  gates registered → `14daa764` Phase-A evidence. 38 files (+1613/−254), all under
  `packages/cli/e2e` + README + run dir, plus `.llm/tools/gates/catalog.ts` (+3 allowlist entries
  `cli-e2e-aspire-doctor|start|cleanup` — required so the receipts flow through `run-gate.ts`; also
  closes the D-32 gap for these gates; not product code).
- **Contracts (fork, read-only):** (a) `preflight.aspire` →
  `aspire doctor --format Json
  --non-interactive --nologo` via `run-gate.ts`, warnings retained,
  any `fail` rejects; (b) `runtime.aspire-start` → single `aspire start` +
  `describe --follow --format Json` NDJSON to `.netscript/e2e/aspire-describe.ndjson`, bounded by
  `resolveDbCliTimeoutSeconds()`, last-seen convergence, `healthReports` object-shaped (S6); (c)
  `CLEANUP_ASPIRE_STOP` = exact `aspire stop
  --apphost` then `--force` **only** with `--cleanup`,
  post-stop docker probe over the S7 contract asserting zero owned containers, never `--all`; (d)
  `runtime.resource-command` registered on both tiers immediately before cleanup with an explicit
  `skipped` receipt; (e) no new suites; (f) `1372-update-draft.md` present; (g) no `aspire run`, no
  start in static suites. `ASPIRE_START_SCRIPT` remains exported for the restart-fallback script
  only (verified: no second start path).
- **Gates at head:** scoped `deno check` **0 diagnostics** (186 files); raw lint/fmt on the 22
  changed TS files clean; `quality:scan` `[]`; `arch:check` exit 0; `check:assets-barrel`,
  `check:publish-assets`, `check:emitted-samples`, `check:aspire-host-ports` → exit 0; tests
  **186/0**; lint escapes 0/0/0.
- **Convergence note:** S9 (`agent.aspire-mcp-smoke`) and S10 (`runtime.resource-command`) are
  siblings on S8 and both insert runtime gates before cleanup — order to be reconciled when the
  stack converges (D-50): MCP smoke after wait/describe, resource-command after behaviour gates,
  cleanup last.
- **Not claimed:** Phase B — `scaffold.runtime --cleanup` green on both tiers with the new receipts
  and leak = 0 — lease-backed and environment-blocked (D-42/D-43).
- **Verdict: sign-off to independent IMPL-EVAL (phase A) at `14daa764`.** Not a merge recommendation
  (stacked S8 → S6 → S5; D-41).
