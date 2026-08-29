use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never self-certify).
- netscript-tools — scoped wrappers, gate receipts via `.llm/tools/gates/run-gate.ts`, `agentic:leak-check`/`agentic:teardown`, lock hygiene.
- netscript-cli — `netscript init`/scaffold surface and the `e2e:cli` gates you may re-run.
- aspire — Aspire CLI operating rules (`--isolated`, exact `--apphost` stops, never `aspire stop --all`, never kill `aspire mcp`/`aspire agent mcp` servers that are not yours).
- netscript-pr — draft PR, labels, closing keyword, commit-trail comments.

## Context

You are the GPT-5.6 Sol implementation agent for **S2 of the Aspire 13.5 epic** (#1712):
**#1714 — [aspire-13-5 S2] 13.5 runtime verification pass with receipts**. Supervisor: the Fable 5
session. The primary coordinator has **granted the serialized runtime lease** for this slice, scoped to:
one generated NetScript project under your worktree's `.llm/tmp/`, its single AppHost started with
`aspire start --isolated`, the V1–V12 probes below, and cleanup of exactly what you started.

The host Aspire CLI has already been upgraded to **13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688**
(`aspire doctor`: 6 pass / 4 warnings / 0 fail on 2026-08-30). Do **not** run `aspire update --self`,
`dotnet tool update`, or any other host CLI mutation. S1 (#1713, PR #1727) has already moved every
scaffold pin to 13.5.3 on its branch — but **your base is `origin/main` (`21d516224`), which still
scaffolds 13.4.6 pins**. Therefore, for V1–V12 you must pass the 13.5.3 train explicitly into the
scaffold you generate (edit the generated `aspire/aspire.config.json` `sdk.version` and `packages`
to the exact S1 values: `Aspire.Hosting.*` `13.5.3`, `Aspire.Hosting.Browsers`
`13.5.3-preview.1.26425.3`, `CommunityToolkit.Aspire.Hosting.Deno`/`.SQLite` `13.5.0`) **in the
generated project only** — never in `packages/cli`. Record that this is the S1 train and that the
generator itself is S1's PR, not yours.

### Your worktree / branch
- Worktree: `/home/codex/repos/netscript-aspire-13-5-s2` (native ext4; work ONLY here)
- Branch: `test/aspire-13-5-s2-runtime-verification` (off `origin/main` `21d516224`; no upstream —
  push only with `git push origin HEAD:refs/heads/test/aspire-13-5-s2-runtime-verification`)
- Run dir you own: `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/` (start with
  `supervisor.md` from `.llm/harness/templates/supervisor.md`, then `worklog.md` with a `## Design`
  section, `context-pack.md`, `drift.md`, and `receipts/`).

### Required reading (in order)
1. GitHub issue #1714 (V1–V12 table, acceptance, boundaries) and epic #1712.
2. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md`
   — §2 rows C9, C11, C14, C16, C20, C25; §3 BC-5; §5 skill assertions; §6/§7.
3. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/existing-issue-map.md`
   §B (regression-check list for V11).
4. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/receipts/aspire-13.4.6-mcp-baseline.json`
   (V8 baseline: 14 tools, `get_integration_docs` absent, `refresh_tools` present).
5. `skills/aspire/SKILL.md` (the 13.4.6-verified behaviours you are re-verifying) and
   `.agents/skills/aspire/SKILL.md`.
6. `.llm/tools/CLEANUP-PLAYBOOK.md`, `deno task agentic:leak-check --help`, `deno task agentic:teardown --help`.

## Execution contract

- Scaffold: `netscript init` a postgres project (and, if time allows, the sqlite+garnet variant) under
  `<worktree>/.llm/tmp/aspire-13-5-s2/`; apply the 13.5.3 train edit above; `cd aspire && aspire restore`.
- Start exactly one AppHost at a time with `aspire start --isolated --non-interactive --nologo --format Json`
  (`ASPIRE_CLI_START_TIMEOUT=300`); persist the JSON (`dashboardUrl` — mask the `?t=` token in
  committed receipts — `appHostPath`, `logFile`) under `receipts/`.
- Every probe: exact command, exit code, ISO timestamp, and the raw output saved under `receipts/`
  (JSON where the CLI offers `--format Json`). One Markdown table `receipts/aspire-13.5-verification.md`
  with rows V1–V12 (V12 = `aspire publish --help`, `aspire deploy --help`, `aspire destroy --help`
  captured verbatim). No row may read "not run"; if a probe is impossible, say why with evidence.
- V3: also re-run the three named e2e gates against your running AppHost if the suite lets you target it;
  otherwise capture `aspire describe --format Json` and compare `urls[].url` vs `environment.PORT` by hand.
- V6: kill **only your own** launching CLI (the `cliPid` from `aspire ps --format Json` for your
  `appHostPath`), then time `aspire ps`/`aspire stop` orphan cleanup. V7: `aspire stop --force --apphost
  <your exact apphost path>` with `docker ps -a` (DCP labels) before/after — never touch containers
  you did not create. Other lanes run Aspire/Docker on this host: treat anything not rooted at your
  apphost path as foreign.
- V8: spawn `aspire agent mcp` yourself from the generated project root with a throwaway stdio JSON-RPC
  client (`initialize`, `tools/list`, `list_apphosts`, `doctor`, `list_resources`), 30 s timeouts,
  close stdin then SIGTERM; save the redacted transcript; diff the tool list against the baseline.
- V9: scratch `aspire.config.json` with `CommunityToolkit.Aspire.Hosting.Deno: 13.5.0` → `aspire restore`
  → grep `.aspire/modules/aspire.mts` for `addDenoApp`/`addDenoTask`; save the grep.
- V11: one-line reproduction per listed closed issue against the running AppHost; bounded — if a
  reproduction needs more than the running AppHost and the CLI, record "needs <X>" with evidence.
- Cleanup: `aspire stop --apphost <exact>` for every AppHost you started, then
  `deno task agentic:leak-check -- --slice-dir <run-dir> --worktree <worktree>`; `agentic:teardown --apply`
  only on positively owned resources; paste both reports into `receipts/`.
- Product code: **none**. Test/fixture edits only where a gate would otherwise lie (issue boundary);
  each such edit is its own commit with the gate evidence. Arch-debt `aspire-otel-cli-discovery`:
  append the V4 outcome (append-only).

## Commits, PR, receipts
- Commit per milestone (scaffold+restore proof; runtime probes; MCP/deploy/toolkit probes; cleanup +
  receipts table). Message names what the commit proves. Push with the explicit refspec after each
  commit; paste the push line into `worklog.md`.
- Open a **draft PR** to `main` after the first commit: title
  `test(aspire): 13.5.3 runtime verification receipts (S2)`, body per `.github/pull_request_template.md`
  with `## Scope` = `Closes #1714` / `Part of #1712`, labels `type:test`, `epic:aspire-13-5`,
  `area:aspire`, `area:tooling`, `gate:e2e`, `priority:p0`, `status:impl`, milestone `0.0.7`; apply
  `ci:skip-e2e` only if the diff is receipts/tests-only and say so in the body. Per-commit PR comments
  with scope, SHA, evidence.

## Stop conditions
- Finish with a message whose **final non-empty line is exactly** `DONE` (plain text, no table, nothing
  after it) when: V1–V12 receipts committed, AppHosts stopped, leak-check clean, draft PR open with the
  commit trail, worklog/context-pack current. You do not mark the PR ready and you do not self-certify.
- Otherwise finish with the final non-empty line exactly `BLOCKED: <exact reason and evidence path>`
  (plain text, no table). A stale/foreign container or AppHost you cannot attribute is a `BLOCKED:`
  with the `leak-check` report path, never a cleanup you perform.
