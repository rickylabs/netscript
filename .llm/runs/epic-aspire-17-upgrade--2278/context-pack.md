# Context Pack — `epic-aspire-17-upgrade--2278`

- **Branch:** `epic/aspire-17-upgrade` (merged `origin/main` `6d7f10338`)
- **Draft PR:** https://github.com/rickylabs/netscript/pull/2693
- **Workload Tier:** `feature` (PLAN-EVAL 2/2 cycles exhausted; awaiting owner disposition to run Pass 3 confirmation or approve revised plan directly)
- **Current Phase:** `plan-eval` (Pass 2 closed B5 and returned 7 surgical corrections; all 7 applied in `plan.md`; zero product code edited)
- **Active Slice:** None (gated on owner disposition / PLAN-EVAL pass)
- **Slice Roster (all <26 files):**
  - S1 (21 files): Atomic `17.0.0` pins, dead-pin cleanup, scoped parity, `docs:accuracy` pins, `aspire:bump` (7-file allowlist), per-job CI caching
  - S2 (25 files, split S2a/S2b if needed): `aspire-sdk-17.0.0.json.gz`, native `aspire/deno.json` (3 modes), pre-mutation legacy guard at command entry points, D-7 retirement + F-1 split
  - S3 (22 files): `addDenoApp` (`'main.ts'` + `withDenoTask`), optional endpoint-conditional OTEL, `BrowserOrigins`, `.withRepl()`, atomic temp+`linkSync` MSSQL password, `#2174` all 7 contracts, `#2202` AppHost health path + CLI
  - S4 (18 files): Native agent wiring, `aspire-17.0.0-mcp-recorded.json` + 15-tool baseline (`aspire-mcp-smoke_test.ts`), `#2259` raw-snapshot scan, observed-state-polling exit-16 recovery
  - S5a-1 (16 files): E2E describe/follow/doctor `17.0.0` fixtures + all direct loaders
  - S5a-2 (20 files): MCP telemetry & teardown `17.0.0` fixtures + all direct loaders (`leak-check_test.ts`, `phase-b-live-snapshot_test.ts`) + `check-compat-fixtures_test.ts`
  - S5b (~22 files): Skills, docs (`upgrade-aspire-17.md`), `arch-debt.md`, canonical carrier regeneration chain
  - S6: Full A2/A6 local gates, non-skipped hosted dual-tier `e2e-cli` + `#2259` Studio/masking proof, independent IMPL-EVAL
