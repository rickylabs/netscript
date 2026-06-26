You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=1200

use harness

You are the IMPL-EVAL evaluator (separate session from the generator) for PR #135,
branch `fix/cli-jsr-asset-embedding`. This is the SYSTEMIC fix that makes the
JSR-published `@netscript/cli` usable: bundled scaffold assets must travel as
**importable content** (generated barrels / import attributes), never via
`Deno.readTextFile` / `fromFileUrl` / `import.meta.resolve` on `import.meta.url`-relative
paths (those throw `Must be a file URL` when the module is served over `https://` from JSR).

IMPORTANT: a prior IMPL-EVAL run was INTERRUPTED during orientation and wrote NO verdict.
Do not repeat the slow full-repo exploration — go straight to the artifacts and the 5 checks,
budget your time, and ALWAYS finish by writing the verdict + posting the PR comment even if you
have to abbreviate evidence. A verdict line is mandatory.

## SKILL

Activate and follow these repo skills before evaluating:
- `netscript-harness` — IMPL-EVAL protocol, verdict definitions, gate matrix. Read
  `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`.
- `netscript-cli` — CLI scaffold / plugin / asset-loader surface and command conventions.
- `netscript-tools` — scoped check/lint/fmt wrappers, validation-evidence rules, lock hygiene.
- `jsr-audit` — JSR publish surface, asset-shipping vs asset-reading, prod-install reality.
- `netscript-deno-toolchain` — `deno doc`, publish dry-run, dependency inspection.

## What to evaluate

Generator artifacts are committed on the branch under
`.llm/tmp/run/fix-cli-jsr-asset-embedding--asset-embed/` — read `plan.md`, `worklog.md`,
`commits.md`, `drift.md`, `context-pack.md` (the 3 commits are 30bd263a, a1a40c71, b1760701).

Hard checks (the verdict depends on these):
1. **No reintroduced filesystem asset reads on the import path.** Grep the CLI/plugin/fresh-ui
   scaffold loaders for `Deno.readTextFile`, `fromFileUrl`, `import.meta.resolve(` on bundled
   assets. Any such read of a bundled asset at import/scaffold time is a FAIL_FIX — it is the
   exact prod defect this PR exists to remove. The `--registry-root` explicit filesystem
   override is allowed; the *default* path must use embedded content.
2. **Generated barrels are in sync.** `deno task check:assets-barrel` must be diff-clean for
   cli + plugin + fresh-ui.
3. **Publish surface installs.** `cd packages/cli && deno task publish:dry-run` (and plugin +
   fresh-ui) must pass; pre-existing dynamic-import warnings are acceptable, new errors are not.
4. **Merge-readiness gate (authoritative):** run, from the repo root, one pass:
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
   Report the raw exit code and any failing suite/test names. Note: a transient Aspire
   control-plane port `18891` collision from a parallel run is environmental, not a code defect —
   if you hit it, stop the stale AppHost and rerun once before judging.
5. **Scope discipline / lock hygiene:** confirm no unintended `deno.lock` churn or stray files in
   the commit set. The known-acceptable non-blocker is the 87 PRE-EXISTING fresh-ui full
   export-map `deno doc --lint` findings (mod.ts/interactive.ts/primitives.tsx) — there must be
   **no `registry` findings**; do not fail the PR for the pre-existing runtime surface.

## Output

Write the verdict to `.llm/tmp/run/fix-cli-jsr-asset-embedding--asset-embed/evaluate.md` and post
a PR comment with a clear final line: `Verdict: PASS` or `Verdict: FAIL_FIX` /
`FAIL_RESCOPE` / `FAIL_DEBT`, followed by the gate evidence (commands + raw results) and any
required fixes. Preserve lock hygiene: do not commit `deno.lock` re-resolution or source churn
unless an explicit reviewed fix requires it.


Issue/PR title: fix(cli): JSR-safe bundled-asset embedding — prod CLI scaffold usable from JSR (alpha.5)

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
- Write /home/runner/work/_temp/openhands/28230978305-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28230978305-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-135/run-28230978305-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 135
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28230978305
