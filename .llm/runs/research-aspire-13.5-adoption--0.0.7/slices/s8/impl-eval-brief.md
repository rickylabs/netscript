use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/protocol.md`,
`.llm/harness/evaluator/verdict-definitions.md`, and `.agents/skills/netscript-doctrine/SKILL.md`.
You are the **independent IMPL-EVAL evaluator** (Claude · Fable 5 · medium, native opposite-family
route for Codex · GPT-5.6 Sol work): a separate session from the generator thread and the
supervisor; you inherit no verdict and self-certify nothing.

## Context

- Slice: **S8 — typed db-cli-mode resource commands, bounded wait, `excludeFromMcp`** (#1720 + #863,
  PR #1754 draft, base `feat/aspire-13-5-s6-health-checks`). Epic #1712. Evaluate **exactly** head
  `__HEAD__` on `feat/aspire-13-5-s8-typed-resource-commands`; base = S6 `564d465c` (evaluate only
  `564d465c..__HEAD__`). Your worktree:
  `/home/agent/projects/netscript/worktrees/007-aspire-s8-eval` (detached at that head; product
  files read-only). Supervisor run dir (absolute):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — read `plan.md` (D-6, D-19, S8 row), `slices/s8/brief.md`, `slices/s8/intake.md`,
  `slices/s8/review-tier-a.md`, `drift.md` D-39/D-42/D-43, the S8 branch's own run dir
  `.llm/runs/feat-aspire-13-5-s8-typed-resource-commands--impl/` (worklog, drift, receipts), and PR
  #1754's commit list + per-slice comments.
- Environment (authoritative, D-39): Deno 2.9.5; Aspire CLI 13.5.3, dotnet 10.0.400, node 24.20.0
  via `/home/agent/.local/bin/mise exec --` (the `mise` shell function is broken); Docker 28.5.2 on
  `tcp://netscript-dind:2375`; inotify 1024; PID 1 tini. **Phase A is static: no `aspire start`, no
  containers, no `e2e:cli` runtime suites** — host AppHost gates are environment-blocked
  (D-42/D-43); that is not a slice defect and not grounds for FAIL.

## What to verify (execute yourself)

1. Contract: generated `<db>-cli` resources carry typed
   `withCommand(... { commandOptions: {
   arguments } })` and read `ctx.arguments()`;
   `.excludeFromMcp()` only on `<db>-cli`, never on a user-facing resource; `withHidden(` never
   emitted (D-6); no `PROCESS_COMMANDS_FLAG` / "Aspire 13.4" seam left in templates or emitted
   samples. Render the generator yourself.
2. CLI adapters (`packages/cli/src/kernel/adapters/database/*`): exact-AppHost detection from
   `aspire ps --format Json` (`findRunningAppHost`), lifecycle lease, bounded wait with
   `aspire
   wait` timeout exit codes 17/18 surfaced (the #863 mechanism), standalone fallback;
   unit tests cover both paths and the timeout.
3. Doctrine: A7/A11 (no IO in generators), `quality:scan`, `arch:check`, no new `any` / casts /
   lint-ignores; jsr-audit N/A unless `packages/aspire` changed.
4. Gates: scoped `deno check` / raw lint / raw fmt on changed files; `check:assets-barrel`,
   `check:publish-assets`, `check:aspire-host-ports`, `check:emitted-samples`; tests for
   templates/aspire, adapters/database, cli/e2e/tests.
5. **D-19**: the branch receipt (`05-consumer-typecheck-13.5.3.txt`) claims final tsc exit 0 at the
   slice-5 tree; reproduce at **this head**: `netscript init` a throwaway under your eval worktree's
   `.llm/tmp/`, set the scratch `aspire.config.json` sdk/packages to 13.5.3, `aspire restore` only,
   `tsc --noEmit -p tsconfig.apphost.json`; verify module SHA-256s match (`7cd4cf83…` / `e2ce97fa…`
   / `2fd6593b…`); delete the scratch. Cite `withCommand` / `CommandOptions.arguments` /
   `ExecuteCommandContext.arguments()` / `excludeFromMcp` by module line.
6. PR hygiene: draft, base branch, `Closes #1720`, `Closes #863`, `Part of #1712`, labels, milestone
   0.0.7, per-slice comments; #1720/#863 `status:impl`. Report, do not fix.

## Output

Write `evaluate.md` (from `.llm/harness/templates/evaluate.md`, declare the exact head) to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s8/evaluate.md`
and post the same verdict as a PR #1754 comment starting with `**[PHASE: IMPL-EVAL]**` and the head
SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; `PASS` means **phase A only** —
say so; Phase-B runtime receipts (#863 Unhealthy-but-Running, db-cli `--help`, `migrate --timeout`)
remain environment-blocked. Do not commit to the S8 branch, do not mark ready, do not merge, do not
relabel, do not touch Aspire/Docker runtime.
