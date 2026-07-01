You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=500

use harness

**Re-dispatch:** the prior IMPL-EVAL run (run-28478150691-1) confirmed 5 gates green but **did NOT emit a verdict** — `evaluate.md` was never written and it ran out of iterations before running fresh-ui `deno task test`, the `packages/cli` check+test, and the CLI additive-CSS install test. A follow-up commit (`d8f1d94b`) since fixed the `fmt:check` finding, and all branch CI is now green. Please complete the evaluation and **emit a formal verdict this time** — prioritize the unrun gates first, then write `evaluate.md` and post the verdict. Do not end without one of `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`.

You are the **IMPL-EVAL** evaluator (separate session, final post-implementation pass) for the AI/workspace fresh-ui primitive library + 5 core NS One fixes + the ui:add CSS-registration fix + .ns-cmdk/.ns-search on branch `feat/fresh-ui-ai-additions` (PR #190). Do NOT implement or rewrite — independently verify the implementation against the gates and emit a verdict.

## SKILL
- `netscript-harness` — you are running IMPL-EVAL; read `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md` + the relevant `gates/*`, and honor the evaluator-separation contract (the generator does not self-certify; you are independent).
- `fresh-ui-horizontal` — domain checks for this PR.
- `deno-fresh` — domain checks for this PR.
- `jsr-audit` — domain checks for this PR.

## Scope to verify
11 L2 primitives (Avatar, CitationChip, CodeBlock, ModelSelector, ToolCallCard, ChartBlock, Donut, PromptInput, Message+renderInline+TypingIndicator, Dropzone) + the headless L1 Combobox + .ns-cmdk command palette + .ns-search + the app-shell layout objects; the 5 fixes to existing NS One (DataTable.Row `cols`, the missing `--ns-space-*` steps, the LIGHT-DEFAULT theme flip + `[data-theme='dark']`, `@kind` on ease tokens, the breadcrumb long-path guard); and the `ui:add` collection CSS-registration fix in packages/cli. Verify: the L0/token/motion contract; no raw hex / Tailwind color utils; `check-manifest-integrity` (barrel ↔ manifest ↔ files); `tokens:check` determinism; primitives render in light AND dark; and the CLI test proving collection installs register CSS imports additively. Gates: `deno task check` + `deno task test` (packages/fresh-ui) + `.llm/tools/fitness/check-ds-no-raw-hex` + `check-ds-color-utilities` + `check-manifest-integrity` + `check-token-drift`, plus packages/cli `check`/`test`.

Run the package gates yourself, diff the change against the issue + the archetype/L0 contract, confirm no regressions, then post the verdict as a PR comment.


Issue/PR title: feat(fresh-ui): AI/workspace surface primitives + token/layout/theme foundation

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
- Write /home/runner/work/_temp/openhands/28483123786-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28483123786-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-190/run-28483123786-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 190
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28483123786
