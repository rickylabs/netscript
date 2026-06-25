You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=800

use harness

You are running **IMPL-EVAL (cycle 2)** — a separate evaluator session — for PR #127, CLI JSR production hardening. This is the post-implementation **hard gate**. Emit a verdict only; do NOT implement.

**Why cycle 2 exists (read this first).** The cycle-1 IMPL-EVAL returned PASS, but that PASS was a **false positive**: the pre-merge CI gate then found CI **red with ~20 failures**. Root cause: the hardening introduced a `TemplateRegistry.hydrate()` step, but several scaffold command paths rendered templates **before** hydration ran, so the registry was empty at render time. Two follow-up fixes landed (`e5fafc38` hydrate before sync template reads in `runPublicCli`/`PluginScaffold…`; `4e252b80` hydrate at the local-contributor composition root). **Your job is to confirm the fix is real repo-wide — not to repeat the touched-file-only check that let the regression through.**

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
3. Generator evidence (same dir): `worklog.md`, `commits.md`, `drift.md`, `context-pack.md` — including the two hydration-fix entries.
4. The full commit set on `fix/cli-jsr-prod-hardening`: original S1 `f3c58b78`, S2 `6d075f58`, S3 `4e56ecd1`, **plus the regression fixes `4e252b80` and `e5fafc38`** (HEAD `73efcee1`). Read every diff.

## The defect being fixed (one sentence)

Published `@netscript/cli@0.0.1-alpha.2` is unusable from JSR: over `https://jsr.io/...`, `import.meta.url` is an https URL and `Deno.readTextFile*` rejects non-`file:` URLs (top-level read in `editor-config.ts` + the template loader); the fix moves template loading behind a lazy, portable, memoized `hydrate()`.

## MANDATORY repo-wide validation (this is the cycle-1 gap — do not skip)

The cycle-1 eval validated only the touched-file test + a static scan and **missed** that whole command paths rendered before hydration. You MUST run, from the repo root, and paste raw exit codes:

1. **`deno task test`** — the **full repo-wide** test suite, not just `packages/cli` and not just the touched files. This is the gate that would have caught the ~20 failures. A PASS verdict is **forbidden** unless this is green end-to-end (or every failure is proven pre-existing on `main` with evidence).
2. **`deno task e2e:cli`** — the `scaffold.runtime` merge-readiness suite (it exercises real init/add-plugin/add-db/add-service/generate template rendering — the exact paths that were red). If the sandbox cannot run Aspire/Docker/Postgres, you MUST instead: (a) run `deno task e2e:cli gates scaffold.static` and the deno-only scaffold paths you can run, AND (b) explicitly rely on and **cite the GitHub Actions `e2e-cli` result for HEAD `73efcee1`** (check-test + quality + scaffold-static + scaffold-runtime), recording in your verdict that local e2e was environment-blocked and CI is the authority. Do NOT silently downgrade to touched-file tests.
3. Scoped `run-deno-check.ts --root packages/cli`, scoped lint, and `deno publish --dry-run` for `@netscript/cli`.

## Verify (be adversarial — confirm the fix is real, not plausible)

1. **No render-before-hydrate path remains, repo-wide.** Enumerate **every** public command path that renders templates (init, add-contract, add-db, add-plugin, scaffold-plugin, add-service, generate-service) **and** every composition root that constructs the CLI (`runPublicCli`, the local-contributor/maintainer root touched by `4e252b80`, `PluginScaffold…`). Confirm `hydrate()` is awaited before the first template read on each. The cycle-1 miss was a path that was not hydrated — prove there is no longer such a path.
2. **`hydrate()` correctness.** Memoized (single in-flight promise, no double-hydrate), portable loader resolves both `file:` and `https:` via `fetch().text()`, sync consumers read the hydrated cache and never re-read the FS at module load.
3. **CLI-PROD-01.** No module-load-time `Deno.read*` anywhere under `packages/cli/src` (esp. `editor-config.ts`, `template-asset.ts`); `editor-config.ts` uses `with { type: 'json' }`.
4. **S1 test is real proof, not a tautology.** The static scan actually fails on a planted top-level `Deno.read*`; the https proof exercises a genuine non-`file:` scheme through `hydrate()`.
5. **CLI-PROD-02.** `"bin"` map shape is JSR-correct (top-level field, not an `exports` entry); `bin/netscript.ts` in `publish.include`; `deno publish --dry-run` clean; `deno doc` public surface unchanged.
6. **CLI-PROD-E2E wiring.** `packageSource` is genuinely **read** (not merely defaulted) and `jsr` drives `importMode:'jsr'`; existing `e2e-cli.yml` unchanged; `e2e-cli-prod.yml` triggers on `release: published` + `workflow_dispatch`.
7. **Hard constraints.** Zero new casts (only the two repo-accepted casts), `deno.lock` not churned by the fix, commit-by-slice discipline.

Emit **PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT** with file/line-level required changes. A PASS requires the repo-wide `deno task test` to be green (or every failure proven pre-existing) AND the scaffold-runtime e2e green (locally or via the cited CI run for HEAD `73efcee1`). Post the verdict as a PR comment.


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
- Write /home/runner/work/_temp/openhands/28191316117-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28191316117-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-127/run-28191316117-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 127
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28191316117
