use harness

## SKILL

Load `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`. Lane: `normal_implementation` (Codex · openai · gpt-5.6-sol · medium).

## PLAN-GATE CLEARED — implement `design-route-prod-gate`

PLAN-EVAL wrote **PASS_PLAN** for plan head `f8ed75b41` — recorded at `.llm/runs/design-route-prod-gate--plan/plan-eval.md` (commit `5566a89f6`, already on `origin/fix/design-route-prod-gate`). Pull it first (`git pull --ff-only`).

Implement the plan's RED/GREEN sequence exactly, in order, one commit per step:
1. RED — focused template/config expectations + `scaffold.design-production-exclusion` registration tests (must fail).
2. RED (hosted only) — do NOT run `e2e:cli` locally; the hosted probe under `ci:full` proves this step. Record it as hosted-pending in worklog.
3. GREEN — manifest/load/write plumbing, fail-safe middleware, Vite production ignore.
4. GREEN — `deno task gen:assets-barrel`; never hand-edit `embedded.generated.ts`.
5/6. Mutation RED / restored GREEN live inside the hosted gate implementation.

Validation plan rows 1–7 locally via the structured wrappers (`run-deno-check/test/lint/fmt.ts --ext ts,tsx`, `check:assets-barrel`, `quality:gate`, `arch:check`); rows 8–9 are hosted. Also run `check:publish-assets`, `check:mcp-export-corpus`, `check:agent-docs-prose` before every push (four-carrier chain).

Constraints: no `deno.lock` change; no runtime (Aspire/Docker) locally; stay inside the plan's file list; any drift → `drift.md` + worklog. Push after each green step to `origin fix/design-route-prod-gate` (draft PR #1945). When all local rows pass, append the worklog gate table with the final head and stop — the supervisor marks ready-for-review to trigger IMPL-EVAL.
