# S8 — seed-failure observability first (same thread, static; diagnostic deferred)

You are the S8 implementer (thread `01a051e6-90d4-7e50-a91e-ac4bd23b880c`, worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s8`, branch
`feat/aspire-13-5-s8-typed-resource-commands` @ `18923b54e`). **Static only — no runtime, no
AppHost, no containers, no CI dispatch, no evaluators.** Explicit-refspec push.

## Coordinator classification (proof run 33330455111, postgres tier, job 99308020561)

AppHost, health, `database.init`, `database.migrate`, `database.generate` all passed; then
`database.seed` FAILED exit 16 in 1.8 s (`aspire resource postgres-cli seed` →
`Failed to execute command 'seed' … Task db:seed:postgres deno task db:seed`). **The real cause is
masked:** the ANSI-decorated `Task db:seed:postgres …` banner bypasses the `startsWith`-based
stderr filtering in the typed-command output handling, and the actionable stderr is discarded;
hidden `.llm/tmp` artifacts were absent from CI. This is an S8 observability defect to fix
**before** any seed-cause repair.

## Required change (bounded, RED/GREEN)

1. Find the stderr/output filtering on the typed resource-command path (your CLI adapter /
   `run-tool` emission / e2e gate evidence — wherever `startsWith`-style filtering drops lines).
   RED: a test feeding the exact CI shape — ANSI-escaped `Task db:seed:postgres deno task
   db:seed` banner followed by a real error line — showing the actionable stderr is lost.
2. GREEN: strip ANSI before any prefix/banner matching; filter task banners as banners regardless
   of color codes; **persist and/or print the first actionable stderr line(s)** in the
   command result/receipt so an exit-16 seed failure names its cause. Keep existing output
   contracts (fields additive).
3. Scoped gates (check/lint/fmt/tests over the touched roots), commit citing run 33330455111 and
   job 99308020561, push `HEAD:refs/heads/feat/aspire-13-5-s8-typed-resource-commands`, PR #1754
   comment `## [PHASE: IMPL] S8 — seed observability`, final line = new head SHA.
4. Do **not** run any seed diagnostic yourself: after S7 returns the host to zero, the supervisor
   schedules ONE cheap typed-seed diagnostic under the lease to expose the real cause; only that
   cause gets repaired afterwards. No PLAN-EVAL, no unchanged retry.
