You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

Run **IMPL-EVAL** for the `service-auth-adapters` prime-time slice on THIS PR branch (checked out for you). You are a SEPARATE evaluator session from the WSL Codex generator — do not trust the worklog; independently verify.

**Read first (in order):**
1. `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`.
2. `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-adapters/plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, `drift.md`, `commits.md`.
3. `.llm/harness/gates/archetype-gate-matrix.md` (these are ARCHETYPE-1 library packages with a SCOPE-service overlay).
4. The diff vs the PR base, and the two new packages `packages/auth-workos` + `packages/auth-better-auth` and `.llm/tools/auth/gen-better-auth-prisma.ts`.

**Production/enterprise bar to certify (NO stubs, NO no-ops):**
- WorkOS: `createWorkosAuthenticator` really calls `loadSealedSession().authenticate()` and maps a real `Principal`; rotated session emits cookies via `AuthnResult.setCookies`. `createWorkosAccessTokenAuthenticator` performs REAL `jose` JWKS signature verification with audience binding (not a decode-only shim).
- better-auth: `createNetscriptBetterAuth` WRAPS better-auth's own `prismaAdapter` over a consumer-owned Prisma client and does NOT import `@netscript/database` (PLAN-EVAL layering fix). `createBetterAuthAuthenticator` calls `auth.api.getSession` and captures Set-Cookie. `mountBetterAuthHandler` mounts the Fetch handler.
- ADDITIVE ONLY: the upstream #77 `AuthenticatorPort`/`AuthorizerPort`/`Principal`/`AuthnRequest`/`AuthnResult` contract from `@netscript/service/auth` is consumed, NOT redefined or modified.
- CATALOG LAW: `better-auth ^1.6.20` + `@workos-inc/node ^10.4.0` are referenced via `catalog:` ONLY inside the new packages; no de-catalog; `@prisma/client`/`jose` pins, `packages/aspire/src/public/mod.ts`, and `scaffold-versions.ts` untouched.

**Independently RE-RUN the selected gates (this is NOT an e2e-cli-gate slice — do NOT run `deno task e2e:cli`):**
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-workos --root packages/auth-better-auth --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-workos --root packages/auth-better-auth --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-workos --root packages/auth-better-auth --root .llm/tools/auth --ext ts,tsx --ignore-line-endings`
- `deno test --allow-net packages/auth-workos/tests/` and `deno test --allow-net --allow-env packages/auth-better-auth/tests/`
- `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/auth-workos --pretty` and same for `auth-better-auth`
- `deno task publish:dry-run` (confirm isolated declarations satisfied, no carve-out)
- Confirm the node-compat smokes for `@workos-inc/node@10.4.0` and `better-auth@1.6.20` genuinely import/run under Deno 2.8.

**Allowed deferrals (do not fail the slice for these — confirm they are recorded in drift.md):** WorkOS webhook->DB sync, CLI auth-provider scaffold prompts, and pre-existing repo-wide `arch:check` + `deps:audit` (`undici`/`vite`) findings outside the new packages.

**Emit a verdict** of exactly `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` with file:line evidence for any finding. Report the raw exit code of each gate. Preserve lock hygiene: do not commit `deno.lock` re-resolution or source churn unless an explicit reviewed fix requires it.

Issue/PR title: prime-time: service-auth-adapters (WorkOS + better-auth)

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
- Write /home/runner/work/_temp/openhands/27867455720-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27867455720-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-83/run-27867455720-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 83
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27867455720
