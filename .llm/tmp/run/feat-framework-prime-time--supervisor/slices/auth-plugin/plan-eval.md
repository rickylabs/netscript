# PLAN-EVAL — `auth-plugin` program (Track-5, cycle 1, 2026-06-20)

> **Provenance note (supervisor):** Reconstructed from the OpenHands run-`27872109274` summary
> (minimax-m3, separate evaluator session). As with Track-4, the runner reported `Job status:
> failure` and died at the artifact-commit step, so the evaluator's own `plan-eval.md` and the
> `run-27872109274-1` trace dir never landed on the branch (verified: remote `feat/framework-prime-time`
> HEAD unchanged at `511498b3`; only `program-plan.md` present under `slices/auth-plugin/`). The
> dispatch used `output=pr-comment`, so the summary is the contracted deliverable; this file mirrors
> it for the run record. Verdict unaffected. Full verdict body archived at job
> `tmp/planeval-verdict.md`.

## Verdict: **PASS** (cycle 1, no FAIL_PLAN cycle). Implementation may begin on AS1.

Read-only PLAN-EVAL for the Track-5 `auth-plugin` program plan on PR #73. Walked the Plan-Gate
checklist box-by-box; spot-checked every load-bearing claim against the codebase. All eight boxes
satisfied (the `jsr-audit` surface scan reported `PENDING_SCRIPT` — the skill script is not yet
implemented; slice-time responsibility, low risk per established precedent).

## Decisions ruled on

1. **AS2a back-compat — DROP.** Remove the landed `mountBetterAuthHandler` export and the
   `.llm/tools/auth/gen-better-auth-prisma.ts` loose tool. The umbrella never published to JSR (every
   adapter is `0.0.1-alpha.0`; root `deno.json` declares `publish: false`), so external consumers
   cannot exist — drop cost < deprecate-shim cost. Slice-time: AS2a commit message must state the
   removal rationale.
2. **Shared abstractions — per-plugin duplication is the accepted house style.** The shared base
   **already exists**: `@netscript/plugin-streams-core` (`defineStreamSchema` / `createDurableStream`
   / `buildStreamUrl`). Each plugin owns its own entity-typed schemas (sagas `SagaInstance`, auth
   `AuthSession`, workers `WorkerJob`); promoting further would collapse unrelated domains. AS4's
   `plugins/auth/streams/schema.ts` must **build on `plugin-streams-core`** and mirror
   `plugins/sagas/streams/schema.ts` structurally.
3. **kv-oauth flow HTTP surface — CONFIRMED move up to the plugin oRPC service (AS3).** Single HTTP
   surface = single CORS/cookie/security policy; backend stays pure non-HTTP (testable without Hono).
   Mirrors the saga cut (sagas-core owns store/port; `plugins/sagas/services` owns HTTP). Consequence:
   Track-4 `S5 mountKvOAuthHandler` is deleted; `auth-kv-oauth/api-design.md` §"Dual surface" item 5
   + `auth-kv-oauth/plan.md` S5 are rewritten at AS2b slice-time.
4. **Single-active backend (user-locked) — CONFIRMED in scope for AS1** without foreclosing a future
   multi-backend extension. Forward-compat shape: `Map<string, AuthBackendPort>` with a single
   resolved `default` accessor. Multi-backend is a future concern, not validated by any current gate.

## Spot-checks (all verified against the branch)

| Claim | Verified location |
| --- | --- |
| #77 seam ports unchanged | `packages/service/src/auth/types.ts` (verbatim) |
| Refresh-on-read cookies honored | `applyAuthnResponse(c, responseHeaders, setCookies)` |
| `WatchableKv` injectable, no raw `Deno.openKv` | `packages/kv/src/{mod,kv-store,watchable-kv}.ts` |
| Plugin precedent ships every claimed contribution point | `plugins/sagas/` (`services/`,`contracts/v1/`,`streams/`,`src/cli/`,`database/sagas.prisma`,`scaffold.{plugin,runtime}.json`,`src/aspire/`,`src/e2e/`); `deno.json` exports `./contracts ./streams ./services ./aspire ./cli ./scaffolding ./e2e ./runtime ./plugin` |
| Workspace auto-join (no `deno.json` edit) | `deno.json:3-10` = `["packages/*","packages/cli/e2e","plugins/*","examples/*","apps/*"]` |
| Catalog law | `@orpc/*@^1.14.6`, `@workos-inc/node@^10.4.0`, `better-auth@^1.6.20`, `jose@^6.2.3` cataloged ~108-122; `panva/oauth4webapi` correctly NOT cataloged (JSR inline) |
| Mount surface reality | `mountBetterAuthHandler` at `packages/auth-better-auth/src/better-auth.ts:177`, re-export `mod.ts:28`, `tests/mount_test.ts`. **NO `mount` export in `packages/auth-workos/`** (only `workos-authenticator.ts`) |
| `gen-better-auth-prisma.ts` reach-back is well-scoped | `.llm/tools/auth/` — **zero in-tree importers** |
| Slice ordering dependency-correct | AS1 (contracts only) → AS2a∥AS2b (both depend only on AS1) → AS3 (AS1+≥1 backend) → AS4 (after AS3, same dir) → AS5 (after AS4, sole `@netscript/cli` writer) → AS6 (full smoke) |

All 8 Plan-Gate boxes pass.

## Required follow-ups (slice-time, non-rework)

- **AS2a scope correction:** only `auth-better-auth` carries a mount to drop (+ `mount_test.ts`).
  `auth-workos` has no mount — it gets the `AuthBackendPort` refactor only. AS2a commit must state
  the better-auth mount + `gen-better-auth-prisma` removal rationale.
- **AS4:** build on `@netscript/plugin-streams-core`; do not re-invent stream primitives.
- **AS1:** ship the `Map<string,AuthBackendPort>` + `default` accessor selection seam (single-active
  now, multi-backend-capable shape).
- **AS2b:** delete Track-4 `S5 mountKvOAuthHandler`; rewrite `api-design.md` §"Dual surface" item 5 +
  `auth-kv-oauth/plan.md` S5 (absorbed logic preserved verbatim; only HTTP-surface location changes).
- **AS5:** keep `@netscript/cli` edits strictly additive — no existing command-schema changes.
- **jsr-audit:** script `PENDING_SCRIPT`; each AS implementer runs the publishability rubric before
  `publish:dry-run`.

Run: https://github.com/rickylabs/netscript/actions/runs/27872109274
