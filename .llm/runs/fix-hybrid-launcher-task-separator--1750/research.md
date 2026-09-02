# Research — fix-hybrid-launcher-task-separator--1750

## Re-baseline

- Carried-in source: superseded #1750 brief naming only the Claude hybrid launcher.
- Re-derived against the owner-locked `main` baseline
  `58a4a10eb3b73a0e6c9452e4ed6c7def93f45c92` on 2026-08-31.
- The current brief widens the scope to every strict `.llm/tools/agentic/**` entry point exposed as
  a `deno task`. The local `main` ref advanced after allocation; the owner explicitly locked this
  slice to `58a4a10e`, so no rebase is performed.

## Findings

`deno.json` exposes 32 `agentic:*` tasks backed by 31 entry scripts. Source inspection found 26
finite/fail-closed parsers and six permissive or argument-free utilities.

| Task | Entry point | Finite parser | Baseline leading `--` behavior |
| --- | --- | --- | --- |
| `agentic:sync-claude` | `claude/sync-claude-skills.ts` | no | permissive `Set`; out of contract |
| `agentic:sync-claude:check` | `claude/sync-claude-skills.ts` | no | permissive `Set`; out of contract |
| `agentic:check-claude` | `claude/validate-claude-surface.ts` | no | unknown args ignored; out of contract |
| `agentic:wsl-foundation` | `wsl/wsl-foundation.ts` | yes | rejected |
| `agentic:runtime` | `runtime/cli/agentic-runtime.ts` | yes | rejected |
| `agentic:routing-state` | `runtime/cli/routing-state.ts` | yes | rejected |
| `agentic:leak-check` | `teardown/leak-check.ts` | yes | accepted in every position (too broad) |
| `agentic:teardown` | `teardown/teardown.ts` | yes | accepted in every position (too broad) |
| `agentic:dogfood-skills` | `dogfood-skills.ts` | no | no argument parser; out of contract |
| `agentic:antigravity-evidence` | `runtime/cli/antigravity-evidence-cli.ts` | yes | rejected |
| `agentic:provider-canary` | `runtime/cli/provider-canary.ts` | yes | rejected by parser |
| `agentic:rollout-canary` | `runtime/cli/rollout-canary-cli.ts` | yes | rejected |
| `agentic:smoke-claude-remote` | `claude/claude-remote-smoke.ts` | no | unknown args ignored; out of contract |
| `agentic:claude-openrouter-gateway` | `claude/remote-model-launcher.ts` | yes | accepted in every position (too broad) |
| `agentic:claude-hybrid` | `claude/hybrid-launcher.ts` | yes | rejected |
| `agentic:codex-resume` | `codex/codex-resume.ts` | yes | rejected; supervisor reproduction records exit 2 |
| `agentic:codex-status` | `codex/codex-status.ts` | yes | rejected |
| `agentic:codex-follow` | `codex/codex-follow.ts` | yes | rejected |
| `agentic:codex-watch` | `codex/codex-watch.ts` | yes | rejected |
| `agentic:launch-codex-slice` | `codex/launch-codex-slice.ts` | yes | rejected |
| `agentic:dispatch-openhands` | `openhands/dispatch-openhands.ts` | yes | rejected |
| `agentic:openhands-status` | `openhands/openhands-status.ts` | yes | rejected |
| `agentic:gh-pr` | `github/gh-pr.ts` | yes | rejected as a subcommand |
| `agentic:gh-watch` | `github/gh-watch.ts` | yes | rejected |
| `agentic:gh-token` | `github/gh-token.ts` | yes | rejected as a subcommand |
| `agentic:review-threads` | `github/review-threads.ts` | yes | accepted in every position (too broad) |
| `agentic:pr-checks` | `github/pr-checks.ts` | yes | accepted in every position (too broad) |
| `agentic:claude-hook-log` | `claude/claude-hook-log.ts` | no | only help detection; unknown args ignored |
| `agentic:claude-openrouter` | `claude/openrouter-run.ts` | yes | rejected |
| `agentic:opencode` | `opencode/opencode-run.ts` | yes | rejected |
| `agentic:opencode-eval` | `opencode/opencode-eval.ts` | yes | rejected |
| `agentic:opencode-web` | `opencode/opencode-web.ts` | yes | rejected |

Load-bearing details:

1. `.llm/tools/agentic/README.md:352` documents
   `deno task agentic:claude-hybrid -- --cwd ...`; the example remains the intended contract.
2. `parseRemoteModelLaunchOptions`, teardown parsers, and GitHub report parsers currently use an
   unconditional `continue`/empty case for `--`, weakening fail-closed parsing beyond the issue.
3. Hybrid lifecycle dependencies are injectable, and existing tests already prove PID/cwd/session/
   bridge evidence plus cleanup. A subprocess fixture can additionally prove direct-script and
   `deno task` argument delivery without launching a real supervisor.
4. No relevant open architecture debt entry exists. `packages/**`, `plugins/**`, runtime
   `sender-*`, `codex-thread-read`, and `deno.lock` are outside this slice.

## jsr-audit surface scan

- N/A: this is internal `.llm/tools/agentic` tooling and changes no package/plugin export or JSR
  surface.

## Open questions

- None. The owner selected the preferred contract and reserved live Remote Control launch and
  IMPL-EVAL to the supervisor.
