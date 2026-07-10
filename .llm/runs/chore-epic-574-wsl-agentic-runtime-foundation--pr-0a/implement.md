use harness

# PR 0A — establish the canonical WSL agentic foundation

You are the sole implementation worker for NetScript issue #575 and draft PR #584. Work
persistently through all approved slices in the run plan. You own implementation; the coordinator
only supervises and reviews. Do not wait for routine approval.

## SKILL

- **`netscript-harness`** — follow the approved child run, update tracked artifacts per slice, and
  never self-certify.
- **`codex-wsl-remote`** — preserve daemon/mobile visibility, one sender, same-thread steering,
  explicit-refspec pushes, and native ext4 execution.
- **`netscript-tools`** — use scoped validation wrappers, raw git verification, and lock hygiene.
- **`netscript-pr`** — maintain draft PR #584 and issue #575 phase/slice evidence.
- **`netscript-deno-toolchain`** — use Deno 2.9 native tooling and approved dependency/version
  wrappers; never reload/delete the lock.
- **`rtk`** — compress read-heavy git/gh/search output and track Deno task runs.
- **`claude-manager`** — install and validate native WSL Claude Code/mobile control while preserving
  Windows Claude rollback.
- **`openhands-handoff`** — understand evaluator artifact boundaries; do not dispatch an evaluator.

## Identity and safety

- Worktree: `/home/codex/repos/netscript-epic-574-pr0a-foundation`
- Branch: `chore/epic-574-wsl-agentic-runtime-foundation`
- Base: `b58b4c2a`, draft PR #584 against `rickylabs-epic-574-wsl-agentic-runtime`
- Push only: `git push origin HEAD:refs/heads/chore/epic-574-wsl-agentic-runtime-foundation`
- Never set an upstream and never use bare `git push`.
- Do not launch another `send-message-v2`; this thread is the only worker.
- Never expose credentials in argv, output, comments, commits, or artifacts.
- Gemini authentication is Google subscription sign-in only; no API key or Vertex route.
- Do not use Fable 5.
- Do not create new `/mnt/c` execution paths or disturb Windows Claude.

## Approved contract

Read, in order:

1. `.llm/runs/chore-epic-574-wsl-agentic-runtime-foundation--pr-0a/research.md`
2. `.llm/runs/chore-epic-574-wsl-agentic-runtime-foundation--pr-0a/plan.md`
3. The `## Design` section in the run's `worklog.md`
4. Issue #575 and parent #574

The owner waived separate PLAN-EVAL and authorized implementation. Keep #575 narrow: bootstrap,
doctor, rollback plan, installations, and required canary evidence. Generic desired-state routing
belongs to #576.

## Execution

Implement S1 through S3 in the approved order. Commit and explicitly push each reviewable slice.
Update `worklog.md` and `context-pack.md` in every slice; append `drift.md` for divergence. Post
concise issue/PR comments before and after each implementation slice with scope, this thread/worktree
identity, commit, files, raw validation results, drift/debt, and next slice.

Install required WSL software and configure secret-safe machine-local state. Update Node to the
latest stable version locked by the plan, install native WSL Claude Code and Gemini CLI, and run all
safe independent smokes. If provider-native browser sign-in requires the owner, classify it
explicitly, post the exact non-secret action needed, and continue every independent task.

Use the smallest validation proving each slice. Keep `deno.lock` unchanged unless a reviewed source
change truly requires it. Before finishing, confirm the branch is clean and pushed, then call
`task_complete` with the final evidence and any owner-only auth/reconnect action still required.
