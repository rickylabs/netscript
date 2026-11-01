# Review repair environment and commands

Continue PR #2458 and `orch/divybot-6470442939`, never the dispatch branch. A narrow fetch
may not create remote-tracking refs; fetch explicit source:destination refs, then create the
local branch from the remote ref. Shallow clones need `git fetch --deepen` before merging main.
RTK is absent; direct tools preserve command exit codes. No memory or NetScript MCP connector
is exposed; use the existing local stdio CLI and keep privacy-safe notes in this run.

Actual docs tasks: `deno task docs:snippets:test`, `deno task docs:snippets`, and
`deno task docs:readme-fences`. README policies have their own tests under docs tools; workflow
plumbing tests live under `.llm/tools/gates/`. Do not run lock-mutating gates concurrently.

Deno test `--filter` uses a literal substring unless wrapped in slashes for a regex. A bare
alternation can select zero tests and exit zero; always inspect the structured test count.

Reproduced the unknown-export regression with one ordinary type-error fence followed by
`jsr:@std/assert@1/not-an-export`. Per-fence compilation reports both but the aggregate census
wrongly sets unattributed_failure=false. Batched Deno graph loading fails before type-checking.

Process regression tests now have a separate five-second watchdog with fixture-owned group
records. Disabling the production deadline yields an independent-watchdog failure; removing
group SIGKILL yields a surviving-descendant assertion failure. Restore mutations in finally.
