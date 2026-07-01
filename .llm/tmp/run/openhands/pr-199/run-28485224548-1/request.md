You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

IMPL-EVAL this docs-only PR (#199). It reconciles the doc site to three just-merged PRs. Give a **per-domain verdict** (PASS / FAIL_FIX per domain), grounded against the actual merged code on `main` — not against the prose alone.

Domains to verify:

1. **Triggers oRPC truth (#193)** — the docs must say triggers serve a **typed v1 oRPC contract** (introspection/management/SSE), and that ONLY the webhook **ingress** endpoint (`POST /api/v1/webhooks/:triggerId`, plus the legacy `GET /api/v1/events`) stays a **raw HMAC-verifying route by design** (HMAC-over-raw-bytes is incompatible with oRPC Zod parsing). Ground against `plugins/triggers/services/src/**` (the v1 router + `createPluginService(router, { serveRpc: true })` and the `rawRoutes` webhook ingress). Confirm no remaining "raw Hono, not oRPC" claim survives in: `capabilities/triggers.md`, `capabilities/index.md`, `explanation/contracts.md`, `explanation/architecture.md`, `glossary.md`, `how-to/deploy.md`, `tutorials/storefront/05-shipping-webhook.md`. The webhook ingress must NEVER be described as oRPC.

2. **Two-tier plugin shape (#183/#172)** — `netscript plugin new <name>` emits a **core engine package** (`packages/plugin-<name>-core/`) + a **thin connector** (`plugins/<name>/`, contracts re-exported); flags `--kind feature|proxy` (default **proxy**), `--overwrite`. Ground against the CLI `plugin new` command source and the existing converged plugins. Files: `cli-reference.md`, `how-to/author-a-plugin.md`, `explanation/plugin-system.md`.

3. **fresh-ui AI catalog (#190)** — the AI/workspace primitive catalog (the L2 primitives + command-palette/search `.ns-cmdk`/`.ns-search`) and the headless **Combobox** interactive namespace (from `@netscript/fresh-ui/interactive`). Ground against `packages/fresh-ui/**` public surface (`deno doc`). Confirm `reference/fresh-ui/index.md` (generated) was NOT hand-edited. Files: `how-to/customize-fresh-ui.md`, `capabilities/fresh-ui.md`.

Also run the docs gates from `docs/site/`:

deno task build
deno task check:links

Both must be green (expected: 306 files built; ~18456 internal links resolve). Note: `check:caveats` is not required here — it fails only under linked-worktree layout; on your normal checkout it should locate `.llm/harness/debt/arch-debt.md` and pass, but a caveat-ref failure unrelated to these 12 pages is not a blocker.

Constraints: docs-only PR — flag ANY change outside `docs/site/`. Do not commit lock churn or source changes. Report per-domain PASS/FAIL_FIX plus the raw build/link exit codes.


Issue/PR title: docs(site): reconcile to merged #193/#183/#190 surface + fmt-guard config

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
- Write /home/runner/work/_temp/openhands/28485224548-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28485224548-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-199/run-28485224548-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 199
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28485224548
