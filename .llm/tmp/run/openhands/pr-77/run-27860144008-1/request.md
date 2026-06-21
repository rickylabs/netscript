You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400 use harness — run IMPL-EVAL for the `service-auth-seam` slice.

This branch was just **rebased onto the live umbrella** `feat/framework-prime-time` (merge-base `9b3bde45`, which now includes #78 service-graceful-shutdown — both #77 and #78 edit `packages/service/src/builder/service-builder-impl.ts`). The **prior PASS was rendered on the STALE base `fe89b6b4`** (before #78), so the auth + graceful-shutdown composition was never certified together. New tip `2e90fa56`. Supervisor pre-check: type-check clean, 58/58 `packages/service` tests pass with both features present.

Re-run the full IMPL-EVAL on the rebased branch. Read the slice artifacts under `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-seam/`, evaluate against the service archetype + SCOPE-service gates, and specifically verify the auth wiring (static-credential / trusted-header authenticators, scope authorizer, auth middleware ordering) composes correctly with #78's `onShutdown`/shutdown-coordinator in the same builder pipeline. Run check + `deno test --allow-all --unstable-kv packages/service/tests/`. Write `evaluate.md` with PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT. Preserve lock hygiene (no `deno.lock`/source churn unless a reviewed fix requires it). Ignore the pre-existing unrelated `.llm/tmp/run/openhands/.../request.md` line-ending diffs.

Issue/PR title: [prime-time] Service auth seam

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
- Write /home/runner/work/_temp/openhands/27860144008-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27860144008-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-77/run-27860144008-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 77
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27860144008
