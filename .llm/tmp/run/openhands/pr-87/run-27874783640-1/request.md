You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=40

IMPL-EVAL this PR (AS2a: auth-workos + auth-better-auth refactored to pure AuthBackendPort backends).

EXECUTION-FIRST, VERDICT-MANDATORY. Do the work in this order and do not stop until you emit a verdict:

1. RUN ALL GATES from the repo root and capture VERBATIM exit codes in a gate->exit table:
   - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-workos --ext ts,tsx
   - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-better-auth --ext ts,tsx
   - deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/auth-workos --ext ts,tsx
   - deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/auth-better-auth --ext ts,tsx
   - deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/auth-workos --ext ts,tsx
   - deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/auth-better-auth --ext ts,tsx
   - deno test --unstable-kv --allow-all packages/auth-workos packages/auth-better-auth
   - deno check --unstable-kv packages/auth-workos/mod.ts
   - deno check --unstable-kv packages/auth-better-auth/mod.ts
2. BOUNDARY + LOCK HYGIENE: git diff --stat origin/feat/prime-time/auth...HEAD . Confirm changes are
   limited to packages/auth-workos, packages/auth-better-auth, and the deleted
   .llm/tools/auth/gen-better-auth-prisma.ts. Confirm deno.lock delta is only the hono-removal.
   Confirm NO change to packages/plugin-auth-core, root deno.json/catalog, packages/aspire,
   scaffold-versions.ts. Flag any CRLF<->LF churn or junk file.
3. CONFORMANCE: both packages export a pure AuthBackendPort factory (createWorkosBackend /
   createBetterAuthBackend) implementing name + providers + sessions + crypto + principalMapper +
   authenticate. WorkOS sealed-session/JWKS preserved; better-auth prismaAdapter wrapping preserved.
   Verify the dropped symbols (mountBetterAuthHandler, BetterAuthMountOptions, mount_test.ts, hono
   import, gen-better-auth-prisma.ts) are GONE and the removal rationale is in the commit message.
   Scrutinize the AuthBackendOperationUnsupportedError pattern: each unsupported sub-port op must
   throw a typed, named error (not return undefined / not a silent no-op), asserted by a test.
4. Post a PR comment with the gate->exit-code table, the boundary findings, and EXACTLY ONE verdict
   token: PASS, FAIL_FIX, FAIL_RESCOPE, or FAIL_DEBT. Report the raw exit codes; do not fix code.
   Preserve lock hygiene: do not commit deno.lock or source churn unless an explicitly reviewed fix
   is required.

Issue/PR title: AS2a: auth-workos + auth-better-auth -> pure AuthBackendPort backends

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
- Write /home/runner/work/_temp/openhands/27874783640-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27874783640-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-87/run-27874783640-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 87
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27874783640
