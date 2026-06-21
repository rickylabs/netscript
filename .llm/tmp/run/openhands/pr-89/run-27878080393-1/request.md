You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

**IMPL-EVAL — AS3 unified `plugins/auth` oRPC service (Track-5 auth-plugin leaf, base `feat/prime-time/auth`).**

This is the harness IMPL-EVAL pass for PR #89 (commit `8eead0ca`). Run as a separate evaluator session; do not self-certify. Read `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`, the AS3 brief (`.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/as3-plugin-service/implement.md`), the program plan §AS3 (`.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/program-plan.md`), and the diff vs base.

Execution-first. Run and report the verbatim exit codes:

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root plugins/auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root plugins/auth --ext ts,tsx
deno test --unstable-kv --allow-all plugins/auth
deno check --unstable-kv plugins/auth/mod.ts
cd plugins/auth && deno task verify && deno task publish:dry-run
```

Then verify, from the code:

1. **Contract fidelity** — the `services/` oRPC router implements all 5 AS1 `authContract` v1 procedures (`signin`/`callback`/`signout`/`session`/`me`) as real handlers; the contract/ports/config are **imported** from `@netscript/plugin-auth-core`, not redefined.
2. **Backend composition** — `backend-registry.ts`/`init.ts` build the registry from the three backends and resolve a **single active** backend via `createAuthBackendRegistry`/`resolveBackend` selected by env `NETSCRIPT_AUTH_BACKEND`; unknown name → `AuthBackendNotFoundError`.
3. **kv-oauth wiring** — signin/callback are driven through `createKvOAuthFlow` (authorize URL + PKCE/state/nonce txn + `__Host-` cookie → callback → session); no stubs/no-ops.
4. **Typed errors** — unsupported sub-port ops on IdP-managed backends surface as a typed oRPC/contract error (not a silent no-op or opaque 500).
5. **Boundary** — changes are confined to `plugins/auth/` (+ a legitimate `deno.lock` new-plugin workspace entry only). No edits to `@netscript/cli`, aspire, scaffold-versions, root workspace/catalog, version pins, or the AS1/AS2 packages.

**Scope boundaries — do NOT penalize as missing** (deferred by plan to later leaves): streams producers (`auth.token.refreshed`/`session.revoked`/`oidc.completed`) = AS4; CLI + `database/auth.prisma` + scaffold/Aspire = AS5; e2e probes + docs + debt consolidation (`AS2-CONSOLIDATION`, `AS2B-KV-OAUTH-DEBT` incl. OIDC nonce/id_token e2e and RFC 9207 `iss`) = AS6.

Preserve lock hygiene: do not commit `deno.lock` re-resolution churn or source edits unless an explicitly justified fix. Emit a verdict token: **PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT** with the gate table and concise rationale.


Issue/PR title: AS3: unified plugins/auth oRPC service composing auth backends

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
- Write /home/runner/work/_temp/openhands/27878080393-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27878080393-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-89/run-27878080393-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 89
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27878080393
