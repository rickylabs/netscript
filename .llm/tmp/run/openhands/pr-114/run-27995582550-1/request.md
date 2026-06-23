You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

use harness — you are the **IMPL-EVAL** evaluator for PR-C (#114), running in a **separate session**
from the WSL Codex generator. Do NOT implement; evaluate and emit a verdict. Read
`.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md` + the relevant
gate docs before judging.

## Scope under evaluation
PR-C = project-wide alpha-1 legacy/deprecated purge + folded hygiene. Branch
`chore/alpha1-legacy-purge` @ `7d91fbb6`, off merged main `abb6e9a4`. Commits:
- `7492a1d9` S1 — tier-1 removals (updatePluginRegistry stub, safeExtend alias, startWorkersStreamMirror)
- `35f9278b` S2 — remove aspire legacy `DependsOn` alias (the only behavior-affecting slice)
- `6971fa8e` S3 — untrack 109 generated init-json-smoke artifacts + scratch files + `.gitignore`
- `a0573ce3` S4 — fresh canonical-docstring wording + arch-debt folding
- `7d91fbb6` — implementation evidence

## Run artifacts (read first)
`.llm/tmp/run/chore-alpha1-legacy-purge--purge/{research.md,plan.md,plan-eval.md,worklog.md,context-pack.md,commits.md}`.
`plan-eval.md` is a minimax-M3 **PASS** with 3 corrections already folded into the implementation.

## What to verify
1. **Scope fidelity** — only the planned removals landed. The 2 EXCLUSIONS must be UNTOUCHED:
   `packagesAsWorkspaceMembers` (live load-bearing scaffold seam) and workers
   `packages/plugin-workers-core/src/streams/schema.ts schedule?` (deferred to CRON-SUBSYSTEM-DUP).
   Canonical `ServiceConfig.dependsOn` (config schema) must REMAIN; only the aspire legacy `DependsOn`
   alias is removed.
2. **Behavior preservation** — S2 is the only behavior-affecting slice. Confirm canonical `dependsOn`
   fully covers every removed legacy `DependsOn` merge case. Note the new
   `packages/cli/.../windows/compile/compile_test.ts` regression test asserting
   `ServiceReferences → dependsOn` (`orders.dependsOn === ['users']`).
3. **Gates** — scoped `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts` (src ts/tsx; roots
   aspire, cli, fresh, plugins/workers); `deno doc --lint` per affected package; per-package
   `deno task test`; `deno task arch:check`; `deno task publish:dry-run`.
4. **scaffold.runtime E2E (merge-readiness, single pass):**
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
   (aspire + workers + scaffold paths changed). Report the raw exit code and any failing suite/test
   names. Do not split into individual gate commands.
5. **Lock hygiene** — root `deno.lock` must be untouched (supervisor verified clean; re-confirm).
   Zero new casts (only the 2 accepted casts may exist; this PR is removal-only).
6. **Version-timing ruling — NOT a defect:** the repo holds lockstep `0.0.1-alpha.0`; the repo-wide
   breaking bump lands ONCE at JSR-publish prep (DEBT-1, recorded in `arch-debt.md`). A per-package
   bump would break the single-version scheme. The breaking-change note belongs in the PR/merge body,
   not a version bump. **Do NOT fail the PR for the unbumped version.**
7. **arch-debt folding** — confirm the 6 entries are appended to `.llm/harness/debt/arch-debt.md`:
   RUN-ARTIFACT-ARCHIVAL-POLICY, PAGEBUILDER-LEGACY-COMPAT-TREE, FORMPAGEPROPS-PLAYGROUND-MIGRATION,
   REDIS-LEGACY-VALUE-FALLBACK, DEBT-1 (version timing), DEBT-2 (db-init flake).

## Output
Write `.llm/tmp/run/chore-alpha1-legacy-purge--purge/evaluate.md` and post a PR comment with a clear
verdict: **PASS**, **FAIL_FIX**, **FAIL_RESCOPE**, or **FAIL_DEBT**. Preserve lock hygiene — do not
commit `deno.lock` or source churn unless an explicitly-reviewed fix requires it. Eval loop limit is
two failures before escalation.

## SKILL
- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate set
- `.agents/skills/netscript-doctrine` — ARCHETYPE-2/3/5 public-surface gates for the removed exports
- `.agents/skills/netscript-deno-toolchain` — `deno doc --lint` publish bar, `deno why`, `publish:dry-run`
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, e2e:cli runner, lock hygiene
- `.agents/skills/jsr-audit` — publishability of the trimmed multi-package public surface
- `.agents/skills/netscript-pr` — PR verdict-comment conventions


Issue/PR title: PR-C: alpha-1 legacy/deprecated purge + hygiene (breaking)

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
- Write /home/runner/work/_temp/openhands/27995582550-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27995582550-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-114/run-27995582550-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 114
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27995582550
