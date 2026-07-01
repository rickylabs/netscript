You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=700

use harness

You are the **IMPL-EVAL** evaluator (separate session from the generator) for **PR #159 — alpha.11 Slice C: interactive init + CLI-managed cache (--cache / --cache-backend)**. You evaluate only: you do NOT edit code. Read the slice's run artifacts and the diff, verify every claim against the actual code and tests, run the smallest proving validation, and emit a verdict.

## SKILL
Activate and follow these repo skills before any work:
- `netscript-harness` — IMPL-EVAL protocol + verdict definitions; evaluator-separation rule; read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`.
- `netscript-cli` — `init` flag surface, interactive prompt port (`kernel/ports/prompt-port.ts` + cliffy adapter), scaffold-options/defaults, Aspire appsettings/config generation.
- `netscript-doctrine` — public-surface + 2-accepted-cast law (flag any NEW cast); new domain types under `kernel/domain/`.
- `aspire` — generated appsettings / register-infrastructure for cache resources (redis/garnet containers, deno-kv app-level).
- `netscript-tools` — scoped check/lint wrappers; gate-evidence rules; arch-debt entry hygiene.

## Read first (committed to this PR branch)
- `.llm/tmp/run/alpha11-fixtrain--c/plan.md`, `worklog.md`, `commits.md`, `drift.md`, `context-pack.md`.
- The `.llm/harness/debt/arch-debt.md` addition in this PR — confirm any deferral is a legitimate record-only debt, not a hidden gap in the slice's own scope.

## Claims to verify against code (do not trust the prose)
1. **CLI-managed cache surface** — `--cache` (default ON) and `--cache-backend <redis|garnet|deno-kv>` exist and flow through scaffold. Verify the new `packages/cli/src/kernel/domain/cache-backend.ts` enum, `scaffold-defaults.ts` (`CACHE_BACKEND: 'redis'`), `scaffold-options.ts`, and `init-command.ts`. Confirm disable is `--cache=false` (NOT an invented `--no-cache`). This must match the surface PR #162 docs describe.
2. **Cache provisioning** — redis/garnet generate an Aspire container resource; deno-kv is app-level (no container). Verify `kernel/templates/aspire/generate-appsettings.ts`, `generate-aspire-config.ts`, `helpers/register/generate-register-infrastructure.ts`, and `packages/aspire/config.ts`.
3. **Interactive init** — `init-interactive.ts` (new) wires the prompt port; default-highlighted choice is sensible (postgres for db / redis for cache); the prompt is GATED OFF under `--ci` / `--yes` / `--json` (non-interactive must not block). Verify in `init-command.ts` + `init-interactive.ts`.
4. **Tests** — the new/changed tests (`init-command_test.ts`, `generators_test.ts`, `generate-register-infrastructure_test.ts`, `aspire/tests/config_test.ts`, `orchestrate-init_test.ts`) actually assert the new behavior and would fail if it regressed.

## Gates (smallest that proves the change)
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` and `--root packages/aspire --ext ts`.
- Run the touched tests listed above.
- Confirm CI `scaffold-static` + `scaffold-runtime` are green (they scaffold with the new flags); cite conclusions.
- Confirm no new cast/`any` beyond the 2 accepted forms.

## Output
`output=pr-comment`. Emit a concise, evidence-first verdict: **PASS** / **FAIL_FIX** / **FAIL_DEBT**, citing `file:line` and the verifying symbol/test for each claim (cache surface, provisioning, interactive gating, test strength), plus the arch-debt entry assessment and CI conclusions. Do not edit any file.


Issue/PR title: alpha.11 Slice C: interactive init + CLI-managed cache (--cache/--cache-backend)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28302332719-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28302332719-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-159/run-28302332719-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 159
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28302332719
