You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run an adversarial IMPL-EVAL (merge-readiness gate) for this focused CLI fix on branch `fix/cli-no-aspire-postgres-guidance` (PR #61, target `main`), commit `dd03f9e`. You are the EVALUATOR in a separate session from the implementer — be skeptical, try to break it, do NOT edit or fix anything. Emit exactly one verdict: PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT.

## What this fix claims
Scaffolding with `--no-aspire` correctly disables Aspire (no `aspire/` dir, no root `appsettings.json`), but the generated workspace README and the CLI `init --json` `nextSteps` previously still told the user that Postgres is provisioned by Aspire and to look in `appsettings.json`. This PR makes the no-Aspire path instruct the user to self-provision Postgres via `POSTGRES_URI` / `DATABASE_URL`, while leaving the WITH-Aspire (and legacy-Aspire) messaging unchanged.

Touched (per the implementer): `packages/cli/src/kernel/templates/workspace/generate-readme.ts`, `packages/cli/src/kernel/application/output/renderers/init-json-renderer.ts` (the `initNextSteps` output), plus added/extended tests.

## Adversarial focus (try hard to fail these)
1. **Completeness.** Grep the `packages/cli` tree for EVERY `appsettings.json` reference and every "provisioned by Aspire" / Aspire-Postgres guidance string that is reachable when `noAspire` is true. Confirm NONE of them still misleads a `--no-aspire` user. A single remaining unconditional Aspire/appsettings reference on the no-Aspire path is a FAIL_FIX (cite file:line).
2. **No regression on the Aspire path.** Re-scaffold WITHOUT `--no-aspire` (postgres + a service) and confirm the README + `nextSteps` STILL correctly say Postgres is provisioned by Aspire via `appsettings.json` / `aspire run`. If the with-Aspire messaging was damaged, FAIL_FIX.
3. **Repro both ways yourself.** Run:
   `deno run -A packages/cli/bin/netscript-dev.ts init no-aspire-app --path .llm/tmp/eval-noaspire --db postgres --service --service-name users --service-port 3001 --no-aspire --ci --yes --no-git --force --json`
   Confirm: no `aspire/` dir, no root `appsettings.json`, README + JSON `nextSteps` tell the user to self-provision Postgres (`POSTGRES_URI` / `DATABASE_URL`) and do NOT reference Aspire/`appsettings.json` for Postgres. Then repeat without `--no-aspire` and confirm the Aspire path is intact. Clean up scratch dirs.
4. **Test adequacy.** Confirm the added/changed tests actually assert the no-Aspire messaging for BOTH the README generator and the `nextSteps` JSON (not just one), and that an Aspire-path assertion remains.
5. **Scope discipline.** Confirm ONLY `packages/cli` source + tests changed. NO dependency-catalog edits, NO version-pin changes (`scaffold-versions.ts` etc.), NO lock-file changes, and NO change to CLI flags / public surface. Any such edit is FAIL_RESCOPE.

## Gates (run yourself)
- `deno task check` (add `--unstable-kv` if a workspace check needs it) must be green.
- The CLI unit tests the implementer cited must pass: `deno test --allow-all packages/cli/src/kernel/templates/workspace/generators_test.ts packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts` (and any others touching these generators).
- The full `deno task e2e:cli` scaffold runtime is NOT required for this change: that suite exercises the WITH-Aspire path (it starts Aspire, wires DBs/plugins) and does not cover `--no-aspire` README/nextSteps text, so the targeted repro in (3) plus the unit tests are the correct merge gate here. Do not block on e2e:cli; note this rationale in your verdict.

## Output
Post ONE PR comment: verdict token, the gate results (check + tests exit, both repro outcomes), the completeness grep result, and for any FAIL the exact file:line + required fix. Do NOT post a running status comment — post only your single verdict.


Issue/PR title: fix(cli): correct --no-aspire Postgres provisioning guidance (README + nextSteps)

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
- Write /home/runner/work/_temp/openhands/27818454765-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27818454765-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-61/run-27818454765-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 61
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27818454765
