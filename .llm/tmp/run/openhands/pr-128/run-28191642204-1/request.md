You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=800

use harness

You are running **IMPL-EVAL** (separate evaluator session) for PR #128 — Deno 2.9 adoption (C0–C4). This is the post-implementation **hard gate**. Emit a verdict only; do NOT implement. You MUST run the validation below and end your run by posting a verdict comment — do not stop after only reading protocol files.

This is a **supervisor-lane** slice: **config / CI / docs only. No `packages/` or `plugins/` source is touched.** PLAN-EVAL PASSed (minimax-M3, 3 non-blocking corrections F-1/F-2/F-3, all addressed).

## SKILL

Activate and follow before evaluating (read each SKILL.md):

- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate-evidence rules.
- `.agents/skills/netscript-deno-toolchain` — Deno 2.9 task runner (dependency tasks + input-based caching), `publish --dry-run`, catalog rules, `deno doc`.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers + gate-evidence + lock-hygiene rules.

## What to read

1. `.llm/harness/evaluator/protocol.md`, `.llm/harness/evaluator/verdict-definitions.md`.
2. Plan + research + PLAN-EVAL: `.llm/tmp/run/chore-deno-2.9-adoption--adoption-plan/{plan.md,research.md,plan-eval.md}` (C0–C4 in scope; C5/C6 deferred; D1–D6 locked).
3. Generator evidence (same dir): `worklog.md`, `commits.md`, `drift.md`.
4. The five commits' diffs: C0 `eb4229cb`, C1+C2 `cd6fbc57`, C3 `3d18cd13`, C4 `0467d8c9`, artifacts `f4bded73` (HEAD).

## Verify (be adversarial — confirm each slice is correct and nothing in `packages/` changed)

1. **Scope discipline.** `git diff --name-only main...HEAD` touches only `.github/**`, root `deno.json`, `.agents/**`, `.claude/**`, `AGENTS.md`, `.llm/tools/README.md`, `docs/site/_plan/**`, `.llm/harness/debt/arch-debt.md`, and `.llm/tmp/run/**`. **Any `packages/` or `plugins/` source edit is an automatic FAIL_RESCOPE.**
2. **C0 — toolchain pin.** `.github/toolchain.env` = `v2.9.0`; `ci.yml` (3×), `e2e-cli.yml` (2×), `publish.yml` (1×) all `deno-version: "2.9.0"`; no stray `2.8.3` remains in workflows. Confirm the bundled deletion of `.llm/tools/run-parallel-tasks.ts` has no remaining importer (grep repo-wide).
3. **C1 — dependency task.** `ci:quality` is `{ "dependencies": ["check","lint","fmt:check","deps:check"] }`. Confirm it runs the four and **fails if any fails** (exit-code propagation). The hand-rolled `run-parallel-tasks.ts` invocation is gone.
4. **C2 — input cache.** `check`/`lint`/`fmt:check` are object form `{ "command": "...", "files": [...] }`; commands are **byte-identical** to pre-C2 (diff them); `files` globs cover the real source set; `check` includes `deno.lock` while `lint`/`fmt:check` do not (justified — they don't resolve deps). Confirm a previously failed run is NOT cached (Deno 2.9 only caches successful runs) so a stale/failing gate can't be masked.
5. **C3 — docs accuracy.** Every 2.8→2.9 edit is factually correct; the `.claude` SKILL mirror was **regenerated** (`deno task agentic:sync-claude`), not hand-edited (run the validator: `deno run --allow-read --allow-run .llm/tools/agentic/validate-claude-surface.ts`). F-2 fix present in `docs/site/_plan/00-README.md`.
6. **C4 — publish resilience doc.** The `publish.yml` comment block accurately describes deno#35134 / #35133 / #35331 and is attached to the real `Publish` step.
7. **F-3.** The arch-debt entry `scaffold-aspire-npm-island-no-lock` exists and is grounded (`render-ts-apphost.ts:51-77`).

## MANDATORY validation (run from repo root on Deno 2.9.x; paste raw exit codes)

1. `deno task ci` (the dependency task: check + lint + fmt:check + deps:check) — must be green.
2. `deno task check` and `deno task lint` re-run a second time to confirm the C2 cache **SKIP** path works and is not masking failures.
3. `deno task publish:dry-run` — must be clean. **Report whether `deno.lock` changed** (blob/`git status`). A lock reseed is **D6** — flag it for approval; do not treat a reseed as a silent pass.
4. Cite the **GitHub Actions** result for HEAD `f4bded73`: `ci` (run 28191138481) and `e2e-cli` (run 28191138448) — both **success**, which is the authoritative 2.9.0 runner verdict (the scaffold-runtime e2e ran because base = `main`).

A PASS requires green local `ci` + clean `publish:dry-run` (lock change flagged if any) + the cited green CI on 2.9.0. Emit **PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT** with file/line detail and **post the verdict as a PR comment**.


Issue/PR title: chore(deno-2.9): adoption track — toolchain bump + native task parallelism/input-cache + publish resilience (C0-C4)

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
- Write /home/runner/work/_temp/openhands/28191642204-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28191642204-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-128/run-28191642204-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 128
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28191642204
