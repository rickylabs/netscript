You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=800

use harness

You are running **IMPL-EVAL** (separate evaluator session) for PR #127 — CLI JSR production hardening. The plan PASSed Plan-Gate; the implementation is three commits — S1 `f3c58b78`, S2 `6d075f58`, S3 `4e56ecd1` — on `fix/cli-jsr-prod-hardening`. This is the post-implementation **hard gate**. Emit a verdict only; do NOT implement.

## SKILL

Activate and follow before evaluating (read each SKILL.md):

- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, commit-by-slice discipline, gate-evidence rules.
- `.agents/skills/netscript-doctrine` — `@netscript/cli` is the **A6 CLI application** archetype; gates **F-CLI-15 / F-CLI-16 forbid module-load-time FS side effects** (the core of this fix).
- `.agents/skills/netscript-deno-toolchain` — JSR `deno.json` `bin` field shape, `import … with { type: 'json' }`, `deno publish --dry-run`, `deno doc`.
- `.agents/skills/jsr-audit` — JSR publish-surface readiness.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers + gate-evidence rules.

## What to read

1. `.llm/harness/evaluator/protocol.md`, `.llm/harness/gates/archetype-gate-matrix.md` + the A6 gate set, and `.llm/harness/evaluator/verdict-definitions.md` (your checklist).
2. The locked plan + research: `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/{plan.md,research.md}`.
3. Generator evidence (same dir): `worklog.md`, `commits.md`, `drift.md`, `context-pack.md`.
4. The three commits' diffs.

## The defect being fixed (one sentence)

Published `@netscript/cli@0.0.1-alpha.2` is unusable from JSR: over `https://jsr.io/...`, `import.meta.url` is an https URL and `Deno.readTextFile*` rejects non-`file:` URLs (top-level read in `editor-config.ts` + the template loader).

## Verify (be adversarial — confirm the fix is real, not plausible)

1. **CLI-PROD-01 truly fixed.** No module-load-time `Deno.read*` remains anywhere under `packages/cli/src` (especially `editor-config.ts`, `template-asset.ts`); `editor-config.ts` uses `with { type: 'json' }`; `TemplateRegistry.hydrate()` is memoized (single in-flight promise) and awaited **lazily** at the entry of **every** public scaffold command path that renders templates (init, add-contract, add-db, add-plugin, scaffold-plugin, add-service, generate-service) — confirm no command renders before hydration; the portable loader (`fetch().text()`) resolves both `file:` and `https:`; contract templates route through existing manifest keys; the sync consumers stay sync and read the hydrated cache correctly.
2. **S1 test is real proof, not a tautology.** The static-scan would actually fail on a planted top-level `Deno.read*`, and the https proof exercises a genuine non-`file:` scheme through `hydrate()` (not a `file://` shortcut).
3. **CLI-PROD-02.** The `"bin"` map shape is JSR-correct (top-level field, **not** an `exports` entry); `bin/netscript.ts` is in `publish.include`; `deno publish --dry-run` is clean; `deno doc` public surface is unchanged.
4. **CLI-PROD-E2E.** `packageSource` is genuinely **read** (not merely defaulted) and `jsr` drives `importMode:'jsr'`; the existing `e2e-cli.yml` (PR / local validation) is **unchanged**; `e2e-cli-prod.yml` triggers on `release: published` + `workflow_dispatch` and runs the published-CLI runtime smoke.
5. **Hard constraints.** Zero new casts (only the two repo-accepted casts), `deno.lock` not churned, commit-by-slice discipline.
6. **Re-run the cheap gates yourself**: scoped `run-deno-check.ts --root packages/cli`, and the S1 `template-asset_test.ts`. Do **NOT** run the expensive full `scaffold.runtime` e2e here (it is the post-publish concern).

Emit **PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT** with file/line-level required changes. Post the verdict as a PR comment.


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
- Write /home/runner/work/_temp/openhands/28183970492-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28183970492-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-127/run-28183970492-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 127
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28183970492
