You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=40

IMPL-EVAL this PR (AS2b: new packages/auth-kv-oauth pure non-HTTP OAuth2/OIDC AuthBackendPort backend).

EXECUTION-FIRST, VERDICT-MANDATORY. Do the work in this order and do not stop until you emit a verdict:

1. RUN ALL GATES from the repo root and capture VERBATIM exit codes in a gate->exit table:
   - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx
   - deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/auth-kv-oauth --ext ts,tsx
   - deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/auth-kv-oauth --ext ts,tsx
   - deno test --unstable-kv --allow-all packages/auth-kv-oauth
   - deno check --unstable-kv packages/auth-kv-oauth/mod.ts
   - deno publish --dry-run --allow-dirty   (isolated-declarations clean)
2. BOUNDARY + LOCK HYGIENE: git diff --stat origin/feat/prime-time/auth...HEAD . Confirm ALL changes
   are under packages/auth-kv-oauth EXCEPT deno.lock (which may gain ONLY the new-package workspace
   entry). Confirm NO change to root deno.json/catalog, packages/aspire, scaffold-versions.ts,
   packages/plugin-auth-core. Confirm the engine is a jsr: inline specifier, NOT a catalog:/package.json
   dep (catalog law). Flag any CRLF<->LF churn or junk file.
3. CONFORMANCE + RESCOPE: verify createKvOAuthBackend returns a full AuthBackendPort (name + providers +
   sessions + crypto + principalMapper + authenticate) and that EVERY sub-port op is really implemented
   (this backend owns its store; there must be NO AuthBackendOperationUnsupportedError / no-op here).
   Verify the NO-HTTP rescope: there must be NO Hono import, NO mountKvOAuthHandler, NO route handlers
   anywhere in the package; flow primitives (createKvOAuthFlow signIn/handleCallback/signOut) are plain
   functions. Run the package through any AuthBackendPort conformance harness in
   packages/plugin-auth-core/src/testing/mod.ts.
4. SECURITY SCRUTINY (real, not stubbed): PKCE S256 always; exact-state + single-use txn; RFC 9207 iss
   check; OIDC nonce + id_token validation present in the flow; AES-256-GCM at rest with no silent
   plaintext fallback when key absent; refresh rotation + refresh-token-reuse detection; __Host- cookies;
   HTTPS enforced (allowInsecureRequests only in dev/test). SPECIFICALLY ASSESS whether OIDC nonce /
   id_token validation is exercised by a test (the supervisor flagged this as a possible coverage gap) —
   if absent, decide FAIL_DEBT vs PASS-with-noted-debt, do not silently ignore.
5. Post a PR comment with the gate->exit-code table, boundary findings, the security assessment, and
   EXACTLY ONE verdict token: PASS, FAIL_FIX, FAIL_RESCOPE, or FAIL_DEBT. Report raw exit codes; do not
   fix code. Preserve lock hygiene: do not commit deno.lock or source churn unless an explicitly
   reviewed fix is required.

Issue/PR title: AS2b: auth-kv-oauth pure KV-backed OAuth2/OIDC AuthBackendPort backend

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
- Write /home/runner/work/_temp/openhands/27874924828-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27874924828-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-88/run-27874924828-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 88
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27874924828
