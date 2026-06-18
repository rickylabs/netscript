You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=800 use harness

Run **IMPL-EVAL** (final post-implementation evaluator pass) for the `chore/deps-hygiene` run (run id `chore-deps-hygiene--deps`). You are a SEPARATE evaluator session from the implementer â€” do NOT implement or fix; evaluate and write the verdict.

Read first: `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`, then `.llm/tmp/run/chore-deps-hygiene--deps/plan.md`, `worklog.md` (incl. `## Design` + `## Gate Results` + Handoff Notes), `context-pack.md`, `drift.md`, `commits.md`, and the gate docs the plan references.

Evaluate slices D-1â€¦D-7 against the LOCKED plan. Verdict-critical checks:
1. **Catalog law intact** â€” no de-catalog, no version-pin edits, `scaffold-versions.ts` untouched, no release-time `deno.json` transform. Confirm via `git diff release/jsr-readiness...chore/deps-hygiene -- deno.json` and the catalog block.
2. **D-2 NIT honored** â€” `scan-npm-catalog-compliance` anchors on real `npm:` import statements + `deno.json` imports/scopes (NOT substring), and excludes `packages/cli/src/kernel/constants/windows.ts` + `packages/fresh-ui/registry.manifest.ts` as data.
3. **Enforcement wired (DH-3 + deliverables #1/#2)** â€” `deps:check` is in BOTH `ci:quality` and `arch:check`; `scan-jsr-centralization` and `audit-file-link` run `--fail-on-violation`; `scan-npm-catalog-compliance` is intentionally report-only census (justified by D-G2-1/D-G2-2 reframe + arch-debt note â€” failing it would force de-cataloging, which is forbidden). Run `deno task deps:check` and confirm exit 0 on the clean tree.
4. **No regressions** â€” `deno task publish:dry-run` still green (27 units, 0 slow types); bump-version wrapper parity test green. Note: `arch:check` is red on PRE-EXISTING repo-wide doctrine findings unrelated to dependencies â€” verify the new `deps:check` step itself is green and do not attribute the pre-existing doctrine red to this run.
5. Scanners (`.llm/tools/deps/`) match the sibling contract to `check-doctrine.ts`: `Finding[]` + `--json` + non-zero exit on FAIL.

Write the verdict to `.llm/tmp/run/chore-deps-hygiene--deps/evaluate.md` (`PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`). Write your summary to `OPENHANDS_SUMMARY_PATH`; do NOT post your own PR comment (the workflow owns the status comment). Do not de-catalog, edit pins, delete lock/cache files, or upgrade dependencies.


Issue/PR title: chore/deps-hygiene — dependency-shape tooling (Group 2 of release/jsr-readiness)

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
- Write /home/runner/work/_temp/openhands/27760239494-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27760239494-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-55/run-27760239494-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 55
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27760239494
