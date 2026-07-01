You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=700

use harness

You are the **IMPL-EVAL** evaluator (separate session from the generator) for **PR #156 — alpha.11 Slice A: CLI-core (F-3 version-from-package, F-4 write-free dry-run)**. You evaluate only: you do NOT edit code. Read the slice's run artifacts and the diff, verify every claim against the actual code and tests, run the smallest proving validation, and emit a verdict.

## SKILL
Activate and follow these repo skills before any work:
- `netscript-harness` — IMPL-EVAL protocol + verdict definitions (PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT); evaluator-separation rule; read `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`.
- `netscript-cli` — the `init` command surface, version derivation, dry-run scaffold semantics.
- `netscript-doctrine` — CLI package public-surface + the 2-accepted-cast law (centralized contract `as unknown as`, top-level router `any`); flag any NEW cast as a defect.
- `netscript-tools` — scoped check/lint/fmt wrappers (`.llm/tools/run-deno-check.ts`, `run-deno-lint.ts`) and gate-evidence rules; raw root noise is not a verdict.
- `netscript-deno-toolchain` — `deno doc`/`deno check --unstable-kv` for surface/type truth.

## Read first (committed to this PR branch)
- `.llm/tmp/run/alpha11-fixtrain--a/plan.md`, `worklog.md`, `commits.md`, `drift.md`, `context-pack.md`.
- The fix-train plan PLAN-EVAL PASS is recorded against PR #155 (`harness/alpha11-fixtrain-plan`) — this slice descends from that PASSed plan.

## Claims to verify against code (do not trust the prose)
1. **F-3 version-from-package**: the CLI derives its reported version from the package manifest (not a hard-coded/stale literal). Verify in `packages/cli/src/public/features/root/public-command-dependencies.ts` and `public-command-tree.ts`. Confirm `public-command-tree_test.ts` actually asserts the derived version and would fail if the version regressed to a literal.
2. **F-4 write-free dry-run**: `init --dry-run` performs NO filesystem writes. Verify in `packages/cli/src/public/features/init/init-command.ts` that the dry-run path is gated before any write/scaffold side effect. (Context: a prior eye-test blocker was `--dry-run` writing to disk — confirm that is now impossible by construction, not just by message.)

## Gates (smallest that proves the change)
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` (include `--unstable-kv` if a direct `deno check` is used).
- Run the touched tests: `public-command-tree_test.ts` and any init-command test.
- Lint the touched roots with the scoped wrapper. Do NOT treat raw root fmt/Markdown drift as a verdict.
- Confirm no new type cast was introduced beyond the 2 accepted forms.

## Output
`output=pr-comment`. Emit a concise, evidence-first verdict: **PASS** / **FAIL_FIX** / **FAIL_DEBT**, citing `file:line` and the verifying symbol/test for each of F-3 and F-4. State the exact gate commands you ran and their result (pass/fail counts). If a real-but-deferrable issue exists, mark `FAIL_DEBT` and name it. Do not edit any file.


Issue/PR title: alpha.11 Slice A: CLI-core (F-3 version-from-package, F-4 write-free dry-run)

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
- Write /home/runner/work/_temp/openhands/28302331259-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28302331259-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-156/run-28302331259-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 156
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28302331259
