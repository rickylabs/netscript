You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=1200

use harness

You are running **IMPL-EVAL (cycle 2, RE-RUN)** — a separate evaluator session — for PR #127, CLI JSR production hardening. This is the post-implementation **hard gate**. Emit a verdict only; do NOT implement.

**⚠️ The previous cycle-2 run ABORTED with no verdict.** It read the protocol files, created a 14-item task tracker, then stopped before running a single validation command. That is a process failure, not a verdict. **This run must EXECUTE the mandatory validation suite below and END by posting a PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT comment. Reading-only and stopping is unacceptable. Budget your iterations so the validation actually runs — start the long-running `deno task test` early, do not exhaust the run on reading.**

**Why cycle 2 exists.** The cycle-1 IMPL-EVAL returned PASS, but that PASS was a **false positive**: the pre-merge CI gate then found CI **red with ~20 failures** because several scaffold command paths rendered templates **before** `TemplateRegistry.hydrate()` ran. Two follow-up fixes landed (`e5fafc38` hydrate before sync template reads in `runPublicCli`/`PluginScaffold…`; `4e252b80` hydrate at the local-contributor composition root). Confirm the fix is real **repo-wide** — do not repeat the touched-file-only check that let the regression through.

## SKILL

Activate and follow before evaluating (read each SKILL.md):

- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate-evidence rules.
- `.agents/skills/netscript-doctrine` — `@netscript/cli` is the **A6 CLI application** archetype; F-CLI-15 / F-CLI-16 forbid module-load-time FS side effects (the core of this fix).
- `.agents/skills/netscript-deno-toolchain` — JSR `deno.json` `bin` shape, `import … with { type: 'json' }`, `deno publish --dry-run`, `deno doc`.
- `.agents/skills/jsr-audit` — JSR publish-surface readiness.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers + gate-evidence rules.

## What to read (briefly — then RUN validation)

1. `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`.
2. Plan + evidence: `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/{plan.md,worklog.md,commits.md,drift.md}`.
3. Diffs for: S1 `f3c58b78`, S2 `6d075f58`, S3 `4e56ecd1`, regression fixes `4e252b80` + `e5fafc38` (HEAD `73efcee1`).

## MANDATORY validation (RUN these from repo root; paste raw exit codes — this is the cycle-1 gap)

1. **`deno task test`** — the **full repo-wide** suite (NOT just `packages/cli`, NOT just touched files). This is the gate that catches the render-before-hydrate regression. A PASS is **forbidden** unless this is green end-to-end (or every failure is proven pre-existing on `main` with evidence). **Run this first / early.**
2. **`deno task e2e:cli`** — `scaffold.runtime` merge-readiness (exercises real init/add-plugin/add-db/add-service/generate template rendering). If the sandbox cannot run Aspire/Docker/Postgres: (a) run `deno task e2e:cli gates scaffold.static` + any deno-only scaffold paths, AND (b) cite the GitHub Actions `e2e-cli` result for HEAD `73efcee1` (ci run 28189505326 + e2e-cli run 28189504820, both **success**), recording that local e2e was environment-blocked and CI is authority. Do NOT silently downgrade to touched-file tests.
3. Scoped `run-deno-check.ts --root packages/cli`, scoped lint, and `deno publish --dry-run` for `@netscript/cli`.

## Verify (adversarial)

1. **No render-before-hydrate path remains, repo-wide.** Enumerate every public template-rendering command (init, add-contract, add-db, add-plugin, scaffold-plugin, add-service, generate-service) AND every composition root (`runPublicCli`, the local-contributor/maintainer root from `4e252b80`, `PluginScaffold…`); confirm `hydrate()` is awaited before the first template read on each. The cycle-1 miss was an un-hydrated path — prove none remains.
2. **`hydrate()` correctness.** Memoized (single in-flight promise), portable loader resolves both `file:` and `https:` via `fetch().text()`, sync consumers read the hydrated cache.
3. **CLI-PROD-01.** No module-load-time `Deno.read*` under `packages/cli/src` (esp. `editor-config.ts`, `template-asset.ts`); `editor-config.ts` uses `with { type: 'json' }`.
4. **S1 test is real proof.** Static scan fails on a planted top-level `Deno.read*`; the https proof exercises a real non-`file:` scheme through `hydrate()`.
5. **CLI-PROD-02.** `"bin"` map is JSR-correct (top-level field, not an `exports` entry); `bin/netscript.ts` in `publish.include`; dry-run clean; `deno doc` surface unchanged.
6. **CLI-PROD-E2E wiring.** `packageSource` is genuinely read; `jsr` drives `importMode:'jsr'`; `e2e-cli.yml` unchanged; `e2e-cli-prod.yml` triggers on `release: published` + `workflow_dispatch`.
7. **Hard constraints.** Zero new casts (only the two repo-accepted), `deno.lock` not churned, commit-by-slice discipline.

Emit **PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT** with file/line-level required changes, write `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/evaluate.md`, and **post the verdict as a PR comment before ending the run.** A PASS requires repo-wide `deno task test` green (or failures proven pre-existing) AND scaffold-runtime e2e green (locally or via the cited CI for HEAD `73efcee1`).


Issue/PR title: fix(cli): JSR production hardening — portable asset reads, runnable bin, prod e2e

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
- Write /home/runner/work/_temp/openhands/28191642929-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28191642929-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-127/run-28191642929-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 127
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28191642929
