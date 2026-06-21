You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max provider=openrouter output=pr-comment iterations=800

use harness

# IMPL-EVAL — PR #99 `S2 auth service-handler seam` (separate-session evaluator)

You are the IMPL-EVAL evaluator for PR #99 on branch `feat/prime-time/auth-s2-service-handler` (base `feat/prime-time/auth`, the auth umbrella). You are a SEPARATE session from the generator and you do NOT implement — you independently verify and emit a verdict. The slice rebinds the `plugins/auth` oRPC service handlers through the contract context to mirror the merged sagas exemplar, removing a hand-rolled fake-implementer indirection and per-handler error double-casts.

## SKILL (activate each before evaluating — read the SKILL.md)
- **`netscript-harness`** — IMPL-EVAL protocol (`.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`); verdict is `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; generator never self-certifies; you are the separate session.
- **`netscript-doctrine`** — `plugins/auth` is an Archetype-5 plugin service; confirm the change respects the oRPC contract→service seam and package boundaries.
- **`netscript-tools`** — scoped validation wrappers (`run-deno-{check,lint,fmt}.ts`), raw git verification, lock-hygiene confirmation.
- **`netscript-deno-toolchain`** — native Deno 2.8 gate commands for check/test on `plugins/auth`.
- **`rtk`** — prefix read-heavy `git`/`grep` with `rtk`, wrap `deno task` runs in `rtk proxy`.

## The exemplar (this slice must MATCH it, not exceed it)
The conformant target is **sagas parity**:
- `plugins/sagas/services/src/routers/v1-handlers.ts:26,29` — `const router = sagasContractV1.$context<SagaServiceContext>();`, export map typed `Record<string, unknown>`, handlers bound `router.X.handler(...)`.
- `plugins/sagas/services/src/router.ts:39-44,71-75` — the sanctioned top-level router composition: `v1: any`, `os.prefix(...).router(map as any)`, `os.router({ v1 })`, each with `deno-lint-ignore no-explicit-any`.

## CRITICAL — cast policy for THIS slice (do not mis-FAIL)
The program's zero-cast rule has exactly these sanctioned boundaries, ALL of which already exist in the merged sagas/workers/triggers/streams plugins:
1. The top-level **router-composition file** `plugins/auth/services/src/router.ts` may contain `any` (the `v1` group, `router(authV1 as any)`, `os.router`), each `deno-lint-ignore`d — identical to `plugins/sagas/services/src/router.ts`. This is SANCTIONED.
2. Pre-existing **external-boundary `as unknown as` casts** in `plugins/auth/services/src/{backend-registry.ts,init.ts,main.ts}` (WorkOS SDK client, plugin-bootstrap context, service-builder return, KV/db client adapters) are the SAME class as sagas' own boundary casts (`plugins/sagas/services/src/main.ts:89,102`, `v1-helpers.ts:92`, `v1-handlers.ts:88-99`). They PRE-DATE this slice (not in the S2 diff) and are logged as cross-plugin drift in `.llm/harness/debt/arch-debt.md` (`plugin-service-router-composition-any`). They are OUT OF SCOPE for S2.

**Do NOT FAIL this slice for either sanctioned-class cast.** The ONLY cast that is a defect here is a NEW cast that S2 introduced **inside the handler/business-logic files it changed** (`routers/v1-handlers.ts`, `routers/v1-types.ts`, `routers/health.ts`) outside the router-composition file. Verify there are none (the generator removed one redundant `resolveBackend() as InteractiveAuthBackend` in commit `8d61f6be`).

## What to verify (independently)
1. **Seam correctness.** `v1-handlers.ts` binds via `authContractV1.$context<AuthServiceContext>()` + `router.X.handler(...)`, map typed `Record<string, unknown>`. The hand-rolled `AuthRouteHandler` / `AuthImplementedContract` / `AuthRouteOptions` indirection and per-handler `try/catch` + `throwContractError` double-casts are GONE.
2. **Error routing.** Handler errors flow through the central `ErrorHandlingPlugin` (order 900, `packages/telemetry/src/orpc/error-plugin.ts`), like sagas — not per-handler oRPC error mapping. Confirm the "auth handler errors keep observable central oRPC envelopes" test asserts this.
3. **Zero NEW casts.** `grep -nE '\bas\b' plugins/auth/services/src/routers/{v1-handlers,v1-types,health}.ts` returns nothing (the changed files are cast-free; sanctioned casts live only in `router.ts`).
4. **Tests are real.** Run `deno test --allow-all --unstable-kv plugins/auth/tests/services/` — confirm the signin→callback→session→me→signout round-trip, backend selection, unsupported-operation typed error, central-envelope observability, and contract input/context/errors inference all genuinely exercise the new binding (not trivially-true assertions).
5. **Type soundness end-to-end.** The `$context` binding must give handlers correctly-typed `input`/`context`/`errors` (the `auth-v1-context-types_test.ts` proves inference). No `@ts-ignore`/`@ts-expect-error` anywhere in the changed files.
6. **Lock hygiene.** `git show --stat` for the three commits must NOT include `deno.lock`; no dependency-graph change.
7. **Scope.** Changes confined to `plugins/auth/` (service routers + tests). Flag any out-of-scope edit.

## Gate commands (run from the slice worktree root)
- `deno run --allow-read --allow-run --allow-env .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx`  (the wrapper applies `--unstable-kv` internally; do NOT pass it yourself)
- `deno run --allow-read --allow-run --allow-env .llm/tools/run-deno-lint.ts --root plugins/auth --ext ts,tsx`
- `deno run --allow-read --allow-run --allow-env .llm/tools/run-deno-fmt.ts --root plugins/auth --ext ts,tsx`
- `deno test --allow-all --unstable-kv plugins/auth/tests/services/`

## Output
Post your verdict as a PR comment on #99. Begin the verdict line with a clear, NON-bold, NON-header token the supervisor's tooling parses: a literal line `Verdict: PASS` or `Verdict: FAIL_FIX` (plain text — NOT `## Verdict` and NOT `**Verdict**`). Then give evidence: each gate's raw result, the test summary, the new-cast scan result, the lock-hygiene check, and your reasoning that the handler seam matches sagas and routes errors centrally. Preserve lock hygiene: do NOT commit `deno.lock` re-resolution or source churn.


Issue/PR title: S2 — auth service-handler seam (contract-context binding, sagas-mirror)

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
- Write /home/runner/work/_temp/openhands/27888562043-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27888562043-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-99/run-27888562043-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 99
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27888562043
