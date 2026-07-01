You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=40 run the **IMPL-EVAL** pass for this PR (`use harness`). The previous run (27873516222) did only a read-through and self-reported INCOMPLETE — it never ran the gates and emitted no verdict. **This run must EXECUTE the gates first, then emit a verdict.** Do NOT stop at code review.

**Order of operations (do these in order, do not skip to assessment):**

1. **RUN every gate command from the repo root and capture the verbatim exit code of each before writing anything:**
   - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-auth-core --ext ts,tsx`
   - `deno task --cwd packages/plugin-auth-core check`
   - `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin-auth-core --ext ts,tsx`
   - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin-auth-core --ext ts,tsx`
   - `deno test --unstable-kv --allow-all packages/plugin-auth-core`
   - `cd packages/plugin-auth-core && deno publish --dry-run` (must be clean under `isolatedDeclarations`; this is the ground truth for private-type-ref leaks across the WHOLE export map)
2. **Consumer-import check:** create a throwaway `packages/plugin-auth-core/scratch-consumer.ts` that imports the public surface from the package's `mod.ts` (and each subpath export), then `deno check --unstable-kv` it under `isolatedDeclarations`. Delete it after (do not commit it).
3. **Boundary + lock hygiene:** `git diff --stat origin/feat/prime-time/auth...HEAD` — confirm ONLY `packages/plugin-auth-core/` changed; root `deno.json` workspace/catalog, `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, and version pins all untouched (LD-8). Confirm no `deno.lock` re-resolution and no CRLF↔LF/source churn.
4. **THEN** the conformance code-review (the prior run already did this well — reconfirm briefly): `./domain` imports the #77 seam ports without redefining; `./ports` = pure `AuthBackendPort` + `Map<string,AuthBackendPort>`+`default` selection seam; `./contracts/v1` = typed oRPC contract only (no router); `./streams` on `defineStreamSchema`.

**Deliverable (mandatory):** post a PR comment whose body contains a table of each gate command → verbatim exit code, then **exactly one verdict token**: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with concrete evidence (failing gate/test names, file:line) for any non-PASS. A comment without executed exit codes and a verdict token is a failed run.

**Lock hygiene:** the pr-comment verdict is the ONLY deliverable — do NOT commit `deno.lock`, the scratch consumer file, CRLF↔LF churn, or any source change.

Issue/PR title: AS1: @netscript/plugin-auth-core — contracts, ports, streams, config (auth foundation)

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
- Write /home/runner/work/_temp/openhands/27873830169-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27873830169-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-85/run-27873830169-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 85
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27873830169
