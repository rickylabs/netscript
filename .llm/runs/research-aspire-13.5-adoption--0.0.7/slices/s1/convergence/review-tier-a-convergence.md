# S1 convergence — Tier-A (supervisor, detached worktree `007-aspire-s1-conv` @ `38c3e9e181bf`)

- Base: exact main `52a881c58842` (ships #1736/#1734). Rebase `3b32d1628..ee379457e` →
  `origin/main..38c3e9e181bf`; `git range-diff` `=` for all 4 commits; `.github/workflows` content
  identical to the old head; pushed `--force-with-lease` pinned to `ee379457`. PR #1727 head =
  `38c3e9e18`, draft, base `main`.
- Gates at the frozen head: `run-deno-check.ts --root packages/cli` 884 files / 0 failed batches;
  S1-scope tests (11 passed / 0 failed); `deno task arch:check` exit 0 (pre-existing F-5/F-6
  `export default` warnings only); `deno task quality:scan` ok (37 members, 0 findings).
- Pins: `.github/toolchain.env` `NETSCRIPT_ASPIRE_CLI_VERSION=13.5.3`,
  `NETSCRIPT_ASPIRE_SDK_VERSION=13.5.3`; scaffold `aspire.config.json` `sdk.version 13.5.3`.
- **`aspire restore` timing (#1713 acceptance, cold + warm), host `ai-agents`, CLI
  `13.5.3+b5f14331`, SDK 13.5.3, 2026-08-30T18:43:51Z:** cold **4385 ms**, warm **2477 ms**
  (`aspire/node_modules` + `.modules` removed before the cold run; both exit 0).
- Hosted runtime tiers: `e2e-cli.yml` **run 33328727942** at `38c3e9e181bf` (workflow_dispatch,
  18:40:11Z) — verdict pending; required for the delta IMPL-EVAL and the `scaffold.runtime green
  on both CI tiers` acceptance.
- Verdict: **PASS (Tier-A, static)** — proceed to the delta IMPL-EVAL once the hosted run reports.
