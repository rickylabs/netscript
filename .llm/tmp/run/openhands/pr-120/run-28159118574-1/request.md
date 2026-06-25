You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment use harness run IMPL-EVAL for PR #120.

## SKILL

Activate and follow these repo skills before evaluating:

- `netscript-harness` — IMPL-EVAL protocol, evaluator separation, run artifacts under `.llm/tmp/run/cli-dx-runnable/`.
- `netscript-doctrine` — Archetype 6 CLI/tooling public-surface and debt checks.
- `netscript-deno-toolchain` — Deno 2.8 / JSR export / `deno x` publish-surface semantics.
- `jsr-audit` — `@netscript/cli` publishability and export-module audit.
- `netscript-cli` — CLI entrypoint and command conventions.
- `netscript-tools` — validation evidence, scoped gates, lock hygiene.
- `netscript-pr` — PR comment/verdict format.

## Task

Run the harness IMPL-EVAL pass for `.llm/tmp/run/cli-dx-runnable/` on branch `feat/cli-dx-runnable`.

Evaluate the implementation against the approved plan and PLAN-EVAL:

- S1: `@netscript/cli` default export is runnable via the verified Deno package executor form, while library imports remain side-effect-free.
- S2: user-facing references to `jsr:@netscript/cli/bin/netscript.ts` are swept to the verified command form.
- Important drift: official docs and local Deno 2.8.3 show `deno x` as the actual command; `dx` is a standalone alias installed with `deno x --install-alias`, not a `deno dx` subcommand. The implementation uses `deno x jsr:@netscript/cli ...` and records this in `drift.md`/`worklog.md`.

## Required Inputs

Read at minimum:

- `.llm/harness/evaluator/protocol.md`
- `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
- `.llm/harness/archetypes/SCOPE-docs.md`
- `.llm/tmp/run/cli-dx-runnable/research.md`
- `.llm/tmp/run/cli-dx-runnable/plan.md`
- `.llm/tmp/run/cli-dx-runnable/plan-eval.md`
- `.llm/tmp/run/cli-dx-runnable/worklog.md`
- `.llm/tmp/run/cli-dx-runnable/context-pack.md`
- `.llm/tmp/run/cli-dx-runnable/drift.md`
- `.llm/tmp/run/cli-dx-runnable/commits.md`
- `packages/cli/mod.ts`
- `packages/cli/bin/netscript.ts`
- `packages/cli/module_import_side_effect_test.ts`

## Suggested Verification

Use the smallest independent checks that prove the slice:

```bash
deno run --allow-all packages/cli/mod.ts --help
deno test --allow-all packages/cli/module_import_side_effect_test.ts
deno check --unstable-kv packages/cli/mod.ts packages/cli/bin/netscript.ts packages/cli/scaffolding.ts packages/cli/testing.ts packages/cli/module_import_side_effect_test.ts
deno lint --no-config packages/cli/mod.ts packages/cli/bin/netscript.ts packages/cli/module_import_side_effect_test.ts packages/cli/scaffolding.ts packages/cli/testing.ts
deno fmt --no-config --check --line-width 100 --indent-width 2 --single-quote true packages/cli/mod.ts packages/cli/bin/netscript.ts packages/cli/module_import_side_effect_test.ts packages/cli/scaffolding.ts packages/cli/testing.ts
(cd packages/cli && deno publish --dry-run --allow-dirty --no-check=remote)
rg --hidden -n "jsr:@netscript/cli/bin/netscript\\.ts" README.md docs packages plugins --glob '!.git/**'
```

Do not run the full scaffold runtime E2E unless you find a reason; the approved plan says it is not required because scaffold/runtime output did not change.

## Output

Write `.llm/tmp/run/cli-dx-runnable/evaluate.md` with the IMPL-EVAL verdict (`PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`) and post a PR comment summarizing findings, gates, and residual risk. Preserve lock hygiene: do not commit `deno.lock` or source churn unless a reviewed fix requires it.

Issue/PR title: feat(cli): dx-runnable @netscript/cli + repo-wide command sweep

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
- Write /home/runner/work/_temp/openhands/28159118574-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28159118574-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-120/run-28159118574-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 120
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28159118574
