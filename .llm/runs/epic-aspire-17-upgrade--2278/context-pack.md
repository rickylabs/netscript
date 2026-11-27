# Context Pack — `epic-aspire-17-upgrade--2278`

- **Branch:** `epic/aspire-17-upgrade` (synced with `origin/main` `7eecfe51f`, `behindBy: 0`; hosted-CI-verified product HEAD `d8fbcbbf7012eb8aa115fe784659764d7ac877a5`)
- **PR:** https://github.com/rickylabs/netscript/pull/2693 (non-draft, `status:implementing`, `e2e-cli-gate`, `type:feat`, `area:aspire`, `area:cli`)
- **Workload Tier:** `feature` (PLAN-EVAL 2/2 completed on `gpt-6.2-astra` `xhigh`; revised plan `36f896a64` approved by owner directly; independent IMPL-EVAL mandatory on `codex` / `gpt-6.2-astra` / `xhigh`)
- **Current Phase:** `impl-eval` (Slices S1–S6 and all hosted CI + dual-tier `e2e-cli` gates green at `d8fbcbbf7`; awaiting independent `IMPL-EVAL`)
- **Active Slice:** None (ready for independent `IMPL-EVAL`)
- **Landed Slice Summary (S1–S6):**
  - S1: Atomic `17.0.0` pins (`Aspire.Hosting.Browsers` `17.0.0-preview.1.26567.5`), dead-pin removal, scoped parity, `docs:accuracy` pins, `aspire:bump`, per-job CI caching
  - S2 (`8b4864b1b`, `0505d5bb9`, `645161003`): `aspire-sdk-17.0.0.json.gz`, native `aspire/deno.json` (3 modes), pre-mutation legacy guard at all 9 command entry points, D-7 retirement + F-1 splits (`<350` LOC)
  - S3 (`f0e762124`, `5faec7d81`): `addDenoApp` (`'main.ts'` + `withDenoTask`), optional endpoint-conditional OTEL, `BrowserOrigins`, `.withRepl()`, atomic temp+`linkSync` MSSQL password (`#2184` prereq), `#2174` all 7 contracts, `#2202` AppHost health path + CLI enrichment, `register-infrastructure-cache.ts` F-1 split
  - S4 (`b925ec676`, `2213533ee`): Native agent wiring, `aspire-17.0.0-mcp-recorded.json` (15 tools), `#2259` raw-snapshot scan, observed-state-polling exit-16 recovery
  - S5a-1 (`e7c387a10`), S5a-2 (`d95679d29`, `234671a29`): All E2E/MCP/teardown `17.0.0`-only fixtures + direct loaders + `check-compat-fixtures_test.ts`
  - S5b (`e91cc5e3b`..`c527abb3a`): Skills, docs (`upgrade-aspire-17.md`), `arch-debt.md`, canonical carrier regeneration chain
  - S6 (`743bedec3`, `ad1ffd0b6`, `d8fbcbbf7`): Full A2/A6 local gates + `onResourceStopped` tool monitor + Aspire 17 MCP/describe/`/proc` Postgres E2E alignment + green hosted `ci.yml` (`46021010611`) and dual-tier `e2e-cli.yml` (`46021010832`: `scaffold-static` 8/5/18, `scaffold-runtime-sqlite` 115/115 + `scaffold.showcase` 7/7 + Playwright, `scaffold-runtime` 124/124)
- **`#2259` Disposition:** Ready to close — hosted Postgres `scaffold-runtime` proved raw snapshot redaction, `users`/`prisma-studio` describe masking, live `prisma-studio` `/proc/<pid>/environ` DB connectivity & clean logs, Dashboard API masking, and full DB/service flows without leaking secrets.
- **Post-`IMPL-EVAL` Closeout Steps:** Commit `evaluate.md`, post `[PHASE: IMPL-EVAL] [VERDICT: PASS]` comment, update PR #2693 body with fenced `acceptance-evidence` blocks (`#2174`, `#2202`, `#2259`) + DoD checks, swap `status:implementing` -> `status:ready-merge` + assign milestone `0.0.10`, rerun `close-gate`, confirm `check:review-threads`, unwatch PR #2693, and hand back.
