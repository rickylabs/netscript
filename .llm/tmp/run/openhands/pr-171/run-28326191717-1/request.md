You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

use harness

You are validating authored documentation (the Claude doc-authoring lane requires an OpenHands
per-package verdict; you are a separate session from the author). Do NOT rewrite the READMEs. Verify
them against ground-truth source and report a per-package verdict.

## SKILL
- `.agents/skills/netscript-doctrine` — plugin public surface, the #167 `plugin add` install model.
- `.agents/skills/netscript-cli` — the `plugin add <kind>` command surface + kind registry.
- `.agents/skills/jsr-audit` — these READMEs ship in each plugin tarball (jsr.io front page).
- `.agents/skills/netscript-deno-toolchain` — `deno doc` to confirm exported symbols.

## Scope
PR #171 rewrites 5 READMEs: `plugins/{workers,sagas,triggers,streams,auth}/README.md`. For EACH
plugin verify against current `main` source:

1. **Install command correctness**: `netscript plugin add <kind>` with the kind shown
   (worker/saga/trigger/stream/auth) is the real positional invocation
   (`packages/cli/src/public/features/plugins/add/add-plugin-command.ts` → `.arguments('<kind:string>')`
   + kind registry). Flag any wrong kind token.
2. **Library example symbols exist**: every imported symbol in the "Use it as a library" block is a
   real export of `plugins/<p>/mod.ts` (e.g. `inspectWorkers`/`workersPlugin`,
   `inspectSagas`/`sagasPlugin`, `inspectTriggers`/`triggersPlugin`, `authPlugin`/`inspectAuth`;
   streams exports `streamsPlugin` and NOT `inspectStreams`). Flag any non-existent symbol or a call
   signature that would not type-check.
3. **Capability/provisioning claims** match `plugins/<p>/scaffold.plugin.json` (DB/KV requirements,
   provider.kind, capabilities flags, ports where stated — auth `8094`, workers `8091`).
4. **Manifest/`$schema` claim**: the README states `scaffold.plugin.json` carries a `$schema` for
   editor IntelliSense. That schema lands in PR #170 (#167-harden). Confirm this is a coherent
   forward statement, not a broken claim (it should read as describing the shipped manifest, not a
   missing file). Note if any README hard-codes a wrong `$schema` path.
5. **Voice doctrine**: no "honest/honesty/honestly" or candor-announcing framing.
6. **Markdown/format**: well-formed, `deno fmt`-clean, no broken relative links to non-existent docs
   anchors that you can cheaply detect.

## Output
A single PR comment with a **per-package verdict** table (workers/sagas/triggers/streams/auth: PASS or
needs-fix) plus a concrete numbered fix list for any needs-fix item (file + line + exact correction).
Overall: `PASS` or `FAIL_FIX`. Do not edit files. Do not commit. Preserve lock hygiene.


Issue/PR title: docs(plugins): 5 plugin READMEs → #167 plugin add surface (pre-alpha.13, ships in tarball)

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
- Write /home/runner/work/_temp/openhands/28326191717-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28326191717-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-171/run-28326191717-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 171
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28326191717
