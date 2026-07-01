You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=600 use harness — run **PLAN-EVAL** (separate evaluator session) for the **Auth-Layer Quality-Hardening track** (slices S1–S6). This is a hard gate: no implementation begins until this returns PASS.

You are on branch **`feat/prime-time/auth`** (this umbrella PR's head). The full auth layer (AS1–AS5) has landed here: `packages/plugin-auth-core`, `packages/auth-{workos,better-auth,kv-oauth}`, `plugins/auth`, and the `packages/service/src/auth` seam. The slices are functionally green but sit below the NetScript package bar. An audit (6 surfaces) found 12 high-severity findings concentrated on ONE root cause. Your job is to ratify (or reject) the remediation PLAN below — do NOT implement.

## Root cause (verify this claim against the code on this branch)
The oRPC contract→handler typing seam is **erased** at the contract package: `packages/plugin-auth-core/src/contract/auth.contract.ts` builds the contract with the `oc` builder then casts it `as unknown as AuthContractDefinition` onto a hand-rolled structural shim (≈ line 306). That erasure forces the downstream service (`plugins/auth/services/src/...`) to fall back to `os.router(authV1 as any)` / `router: any` and to wrap every handler in manual `try/catch → throwContractError` instead of using oRPC's central error plugin. The same declare-then-widen-with-a-cast pattern repeats on the Zod schema shims (`domain/mod.ts`, `config/mod.ts`) and the stream schema (`streams/mod.ts`). Confirm or refute.

## The bar (gold-standard recipe — verify each exemplar path resolves on this branch)
1. **Contract-first `implement()` — ONE centralized cast in the contract package.** Build with `oc`+Zod, then `export const xContractV1: XContractV1 = implement(xDef) as unknown as XContractV1;` exporting a typed `$context` wrapper. The ONLY permitted `as unknown as`, living once. Exemplar: `plugins/sagas/contracts/v1/sagas.contract.ts:650-659`.
2. **Handlers bind context then `.handler()`.** `const router = xContractV1.$context<Ctx>();` → `router.signin.handler(async ({input,context,errors}) => ...)`. Exemplar: `plugins/sagas/services/src/routers/v1-handlers.ts:26-45`.
3. **Router assembly: version namespaces + `.prefix()`.** Top-level router vars deliberately `any` + `deno-lint-ignore` is the ACCEPTED exemplar pattern (deep-generic-instantiation cost) — safety preserved at the handler boundary. Exemplar: `plugins/sagas/services/src/router.ts:40-77`.
4. **Builder mounts everything; cross-cutting = middleware/plugins, never per-handler try/catch.** Exemplar: `plugins/sagas/services/src/main.ts:65-109`.
5. **Error taxonomy owned by ErrorHandlingPlugin (order=900).** Exemplar: `packages/telemetry/src/orpc/error-plugin.ts`.
6. **Pure backend adapters host NO oRPC seam; return `: AuthBackendPort` with zero casts; capability supersets are NAMED interfaces.** Exemplar: `packages/auth-workos/src/workos-backend.ts`; port shape `packages/plugin-auth-core/src/ports/mod.ts:88-101`.

## The remediation plan to ratify (dependency-ordered)

- **S1 (P0) — Contract seam, `packages/plugin-auth-core`.** Export the auth contract with its real inferred oRPC type + a typed `$context` wrapper (mirror sagasContractV1, recipe item 1); delete the 4 hand-rolled `*Schema`/`*SchemaLike` shim interfaces (domain/mod.ts, config/mod.ts) and the stream-schema cast (streams/mod.ts); let `oc.errors` infer; collapse the duplicated AuthSession schema; add a compile-time contract test so seam regression fails `deno check`. **Unblocks S2. Must land first.**
- **S2 (P0, depends on S1) — Service handlers, `plugins/auth`.** Replace the fake `AuthImplementedContract` + double `as unknown as` with S1's typed `$context`; delete the five per-handler `try/catch → throwContractError` blocks so failures flow through the central ErrorHandlingPlugin; keep top-level router `any` only to the accepted exemplar extent (recipe item 3).
- **S3 (P1, independent) — kv-oauth boundary, `packages/auth-kv-oauth`.** `createKvOAuthBackend` declares `Promise<AuthBackendPort>` but returns a wider object reconciled with `as AuthBackendPort & ReturnType<...>`. Name an exported `KvOAuthBackend` interface (or drop the extra flow methods) so TS verifies structurally with no cast; prune dead error codes; tighten optional-field non-null assertions.
- **S4 (P1, independent) — wrap-don't-reinvent + crypto, `auth-workos`+`auth-better-auth`+`plugin-auth-core`.** Lift the byte-identical HMAC `signSessionToken`/`verifySessionToken` block into ONE timing-safe helper in core; move `AuthBackendOperationUnsupportedError` into core; replace verify's non-constant-time `!==` with constant-time compare; narrow better-auth's `& Record<string,unknown>` to `Omit<BetterAuthOptions,'database'>` to dissolve its two casts + the hand-rolled `BetterAuthInstance` reinvention.
- **S5 (P1, independent) — service/auth seam, `packages/service/src/auth`.** One `declare module 'hono' { interface ContextVariableMap { principal: Principal; logger: Logger } }` augmentation type-checks `c.set/get` and removes the two middleware casts AND the builder's two `as never` install casts end to end; reconcile public export map + README.
- **S6 (P2, depends on S2) — composition seams, `plugins/auth`.** Replace per-handler `resolveBackend() as InteractiveAuthBackend` with a typed capability discriminant on the port/registry seam; replace init.ts's speculative `ctx as PluginServiceContext & {...}` probing with a declared config-topic seam; move per-request derivation out of the Hono context factory into a typed execution context.

(Lower-severity legacy/doctrine items — version single-source, `startAuthStreamMirror` no-op removal, `fill(7)`/`app.example.test` test-only confinement, READMEs, manifest URLs — are folded into the AS6 feature leaf, NOT this track. Do not evaluate them here.)

## Cross-cutting constraints (verify the plan honors these)
- Touch ONLY each slice's boundary files. **`@netscript/cli` (`packages/cli`) stays untouched.**
- Do NOT modify `deno.lock` unless a dependency genuinely changes (and then justify + verify clean re-resolution).
- No secrets in code; test-only keys/hosts confined to test factories.
- Per-slice gates only (scoped `deno check`/lint/fmt + targeted tests); the expensive `scaffold.runtime` E2E is NOT required for any S1–S6 slice.
- Implementation lane = WSL Codex, daemon-attached, per-slice IMPL-EVAL gated; each slice branches off the current umbrella tip and merges before its dependents.

## Plan-Gate (evaluate and report each)
1. Is the root-cause diagnosis correct (does the cited cast at auth.contract.ts actually erase the contract type, and does it force the downstream `any`)?
2. Does the S1 recipe correctly mirror `sagasContractV1`? Is exporting a new real inferred type from `plugin-auth-core` a **safe public-surface change** for current consumers (`plugins/auth`, re-exports), or does it risk a breaking type change that needs a migration note?
3. Is the dependency DAG right (S2⇒S1, S6⇒S2; S3/S4/S5 independent)? Any missed dependency or file-ownership collision between slices?
4. Is each slice's archetype/gate set correct (Archetype-2 pure backends for S3/S4 backends; service archetype for S2/S6; contract package for S1)?
5. Are any slices mis-scoped — too large (should split), too small (should merge), or reaching into `@netscript/cli`/`deno.lock`/other surfaces?
6. Debt: anything the plan defers that should be explicit debt? Anything it proposes to delete (dead error codes, shim interfaces) that is actually load-bearing?

## Output
Emit **PASS** or **FAIL_PLAN** with per-slice notes. On PASS, list any slice-time corrections to fold in. On FAIL_PLAN, give the specific blocking defect per slice. Two FAIL_PLAN cycles → escalate. Do not write code; this is a plan gate. If you cannot commit artifacts, deliver the full verdict in this PR comment thread.


Issue/PR title: Auth-as-plugin umbrella: pure backends + @netscript/plugin-auth-core + plugins/auth

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
- Write /home/runner/work/_temp/openhands/27880569184-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27880569184-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-86/run-27880569184-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 86
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27880569184
