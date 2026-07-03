You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Please run a per-page documentation validation of this docs-only PR (branch `docs/pr-b-aspire-telemetry`). This is a GENERATOR-output review — verify, do not self-certify.

## Verify these gates from the PR branch
1. Docs-only: `git diff --name-only origin/main...HEAD` returns ONLY files under `docs/site/`.
2. Build + links: from `docs/site` run `deno task build` and `deno task check:links` — both must pass. (`check:caveats` exits 2 only because of a known Windows path-sep bug; on Linux CI it passes — confirm it passes for you.)

## Verify these claims against ACTUAL source on this branch (they must match shipped reality, not workarounds)
- `docs/site/explanation/aspire.md`: the reference-fields table says a Service can declare `pluginReferences` + `dependsOn`. Confirm these fields exist on the service schema (grep `packages/**/service-schema.ts` for `pluginReferences`/`dependsOn`). Confirm the lowering claim (`dependsOn`->`ServiceReferences`, `pluginReferences`->`PluginReferences`) is accurate.
- HTTP/2 opt-in: confirm `ServiceTlsOptions` + `ServeOptions.tls` + `NETSCRIPT_TLS_CERT_FILE`/`NETSCRIPT_TLS_KEY_FILE` exist (grep `packages/service`), and that the page does NOT claim HTTP/2 is the default (plaintext HTTP/1.1 must be stated as default).
- `--allow-ffi`: confirm it appears in `plugins/workers/src/aspire/workers-contribution.ts` (WORKERS_BACKGROUND_PERMISSIONS).
- browser-logs: confirm `withBrowserLogs()` is emitted by `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`.
- `docs/site/capabilities/telemetry.md`: the Footguns->good/bad conversion must preserve the `arch-debt:workers-scaffold-job-tools-noop` caveat marker.

## Report (pr-comment)
Per-page PASS/FAIL with the exact source evidence (file:line) for each claim above, the docs-only verdict, and the build/links result. Flag any code sample whose API shape does not match source. Preserve lock hygiene: do not commit `deno.lock` or any source churn.


Issue/PR title: docs(aspire): TypeScript AppHost DX — restart/regen model, pluginReferences, HTTP/2 opt-in, browser logs

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
- Write /home/runner/work/_temp/openhands/28624920092-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28624920092-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-296/run-28624920092-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 296
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28624920092
