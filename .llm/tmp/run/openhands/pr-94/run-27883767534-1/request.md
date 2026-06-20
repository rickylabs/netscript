You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=40

use harness

# IMPL-EVAL — S5 packages/service Hono context typed seam (PR #94)

You are an **IMPL-EVAL evaluator** in a separate session from the generator (WSL Codex). Independently
RE-RUN the gates — do not trust the worklog. Emit a verdict as a PR comment only: `IMPL-EVAL: PASS`,
`FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Do NOT commit code fixes (a benign deno.lock re-resolution
+ your run trace are the only allowed commits).

## SKILL (activate before evaluating — read each SKILL.md)
- **`netscript-harness`** — IMPL-EVAL protocol, verdict definitions, evaluator separation. Read
  `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`.
- **`netscript-doctrine`** — `@netscript/service` is the service composition root (Archetype-4 +
  SCOPE-service). Verify public surface, folder/composition/fitness doctrine, no framework coupling leaks.
- **`jsr-audit`** — §5 JSR readiness for `packages/service`: doc-lint over the FULL export map
  (`./` mod + `./src/auth/mod.ts` and any other subpath exports), no slow-types, dry-run.
- **`netscript-deno-toolchain`** — `deno doc`/`deno publish`/version inspection.
- **`netscript-tools`** — scoped check/lint/fmt wrappers, raw git verification, lock hygiene.
- **`netscript-pr`** — posting the verdict comment / labels.
- **`rtk`** — compress git/grep/deno-task output.

## NON-NEGOTIABLE: zero-cast override
NetScript is an E2E fully typesafe framework. The ONLY two casts permitted anywhere are (1) the single
centralized contract `as unknown as <XContractV1>` in a contract package and (2) the top-level router
`any`+`deno-lint-ignore`. **Neither applies to `packages/service`.** Therefore `packages/service/src`
must contain **ZERO** type assertions. This is the primary acceptance criterion.

## Boundary under review
`packages/service` only (+ this slice's harness artifacts under
`.llm/tmp/run/feat-prime-time-auth-s5-hono-context--impl/`). Branch
`feat/prime-time/auth-s5-hono-context` → umbrella `feat/prime-time/auth`. Commits `72e01477`, `c323d8f8`.

## Hard checks (re-run, do not trust the worklog)
1. **Zero casts (package-wide)** — grep `packages/service/src` for `as never`, ` as any`,
   `as unknown`, and ` as [A-Z][A-Za-z]+`. Expect **zero matches** (grep exit 1). ANY match = `FAIL_FIX`
   unless a `drift.md` entry proves it is genuinely architectural — but for this slice no cast is
   acceptable; a "needed" cast is a `FAIL_RESCOPE`, not a debt waiver.
2. **Hono context seam** — `src/auth/hono-context.ts` declares `declare module 'hono'` augmenting
   `ContextVariableMap` with `principal`/`logger`, is imported exactly where the typed `c.get`/`c.set`
   are used, and the previous `c.get('principal') as Principal|undefined` / `as Logger|undefined` casts
   in `auth-middleware.ts` are gone.
3. **Builder casts removed** — `service-builder-impl.ts` no longer has `createAuthnMiddleware/
   createAuthzMiddleware(...) as never`, the CORS/middleware/handler shims, the high-risk
   `ServiceMiddleware` cast, the not-found/error handler casts, or `this.app as unknown as ServiceApp`.
4. **ServiceRouter narrowing is assertion-free** — the worklog claims `ServiceRouter` stays
   package-owned/structural and the oRPC adapter boundary (`src/primitives/orpc-router.ts`) narrows it
   WITHOUT a cast. Verify the narrowing is a real type guard / generic, not a hidden assertion, and that
   root `deno doc --lint` still passes and the empty-router compatibility test still passes.
5. **constantTimeCredentialEquals** — confirm it is private (not re-exported) and its behavior is still
   covered by authenticator tests.
6. **Gates (scoped)** — re-run and report exit codes:
   `run-deno-check.ts --root packages/service --ext ts,tsx` (+`--unstable-kv`),
   `run-deno-lint.ts`, `run-deno-fmt.ts` same root;
   `deno test --unstable-kv --allow-all packages/service` (expect ~57 pass).
7. **JSR §5** — `deno doc --lint packages/service/mod.ts` AND `.../src/auth/mod.ts` (+ any other subpath
   exports in `deno.json`); `cd packages/service && deno publish --dry-run --allow-dirty` → zero
   slow-types. A README with auth quick start + 401/403 response shape must be present.
8. **Lock hygiene** — `git diff --quiet -- deno.lock` (expect clean).
9. **Scope** — diff touches only `packages/service` + the slice harness dir; `@netscript/cli`,
   `plugins/auth`, and other packages untouched. No scaffold/runtime changes.

Report each check with the exact command + exit code. Verdict heading `## OpenHands Agent — Completed`
with `**Verdict: IMPL-EVAL: PASS**` (or the failure verdict).


Issue/PR title: S5 — packages/service Hono context typed seam (zero-cast override)

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
- Write /home/runner/work/_temp/openhands/27883767534-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27883767534-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-94/run-27883767534-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 94
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27883767534
