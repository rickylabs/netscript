# Program Plan — Auth Plugin (Track-5, prime-time sub-program)

Status: **DRAFT for user approval** → then PLAN-EVAL (OpenHands minimax-M3, separate session).
Supersedes the standalone Track-4 `auth-kv-oauth` adapter lane (its PLAN-EVAL-PASS'd backend logic is
**absorbed** here as one backend sub-PR, not discarded).
Run dir: `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/`.

## Why this exists (the pivot)

The landed Track-2 adapters (`@netscript/auth-workos`, `@netscript/auth-better-auth`, #83) already
leaked **project-contribution surface** that does not belong in a backend package:

- `.llm/tools/auth/gen-better-auth-prisma.ts` — a DB-schema generator living as a loose dev-tool.
- a better-auth Hono `mount` helper (`packages/auth-better-auth/.../mount_test.ts`) — per-adapter
  HTTP surface that should be a single unified service, not duplicated per backend.

In NetScript, **the plugin is the project-contribution + service layer; the backend is not.** Every
peer plugin (`plugins/sagas`) ships a unified oRPC service, real-time streams, CLI commands, a Prisma
schema contribution, scaffold + Aspire wiring, and e2e gates. Auth must be a true peer, not three
standalone adapters each re-inventing mount/schema/CLI. So we rescope auth into the standard
**core-package + plugin** shape and refactor the already-landed adapters down to pure backends.

## Target layering (final state)

```
@netscript/service/auth                         seam — per-request AuthenticatorPort (done, #77)
@netscript/auth-{workos,better-auth,kv-oauth}   PURE backends (ARCHETYPE-2 Integration): implement
                                                ONE AuthBackendPort. Provider registry / token store /
                                                crypto / session→Principal mapping ONLY.
                                                NO Hono mount, NO schema-gen, NO CLI.
@netscript/plugin-auth-core                     NEW pkg (mirrors @netscript/plugin-sagas-core):
                                                oRPC auth.contract v1, stream-event schema,
                                                session/account domain model, AuthBackendPort + a
                                                backend-selection seam, config schema, presets.
plugins/auth                                    NEW plugin (mirrors plugins/sagas): unified /auth/*
                                                oRPC service, real-time streams, CLI commands,
                                                database/auth.prisma, scaffold + Aspire wiring,
                                                e2e gates + doctor.
```

Precedent is exact: `@netscript/plugin-sagas-core` + `plugins/sagas` (audited 2026-06-20). The auth
plugin reuses the same contribution points: `scaffold.plugin.json` / `scaffold.runtime.json`,
`src/cli/` + registry generators, `database/*.prisma`, `services/src/router.ts` +
`contracts/v1/*.contract.ts`, `streams/`, `src/aspire/`, `src/scaffolding/`, `src/e2e/`.

## v1 scope correction (locked by user 2026-06-20)

**oRPC service + real-time streams are v1, not deferred.** A plugin without its unified oRPC endpoints
and stream events is not a peer of the others. In v1:

- oRPC `/auth/*` router: `signin`, `callback`, `signout`, `session`, `me` (typed contract + client).
- Streams: `auth.token.refreshed`, `auth.session.revoked`, `auth.oidc.completed` (+ `signin.started`
  /`signin.failed` as the schema dictates), dispatched to server subscribers and client SDK — for
  multi-tab session sync, forced-logout propagation, and "signed in on another device".

Still genuinely deferred (record as debt, NOT v1): PAR/DPoP opt-ins; active encryption-key rotation
(the `keyId` prefix seam ships, rotation does not); resource-server inbound bearer-JWT validation
(that remains the existing seam authenticators' job); tier-2 provider presets MAY split to fast-follow
if a slice trips on size.

## PR topology (house convention — netscript-pr skill)

Three-level stack. Sub-PRs target the **umbrella branch**, never `main`; label `type:sub-pr`; link
`Part of #<umbrella>`. The auth umbrella is itself a sub-PR of #73 **and** an umbrella for the leaves.

```
main
└── #73  feat/framework-prime-time                 [prime-time umbrella — EXISTING, unchanged top]
      └── feat/prime-time/auth   (NEW auth program umbrella PR → base feat/framework-prime-time)
            │   labels: type:umbrella, area:plugins · body carries the slice checklist + links
            ├── feat/prime-time/auth-plugin-core      → base feat/prime-time/auth   [AS1]
            ├── feat/prime-time/auth-kv-oauth         → base feat/prime-time/auth   [AS2b  ← PAUSED]
            ├── feat/prime-time/auth-backends-refactor→ base feat/prime-time/auth   [AS2a]
            ├── feat/prime-time/auth-plugin-service   → base feat/prime-time/auth   [AS3]
            ├── feat/prime-time/auth-streams          → base feat/prime-time/auth   [AS4]
            ├── feat/prime-time/auth-cli-db-scaffold  → base feat/prime-time/auth   [AS5]
            └── feat/prime-time/auth-gates-docs       → base feat/prime-time/auth   [AS6]
```

**Stack, not free fan-out.** Each leaf bases on the auth umbrella; as a prerequisite slice merges INTO
the umbrella, dependent leaves rebase/pull the umbrella to resume (exactly the user's "pull change
once per slice landed to resume"). Conflict surface is unusually low — new packages/plugin auto-join
the workspace (`packages/*`,`plugins/*`) with no `deno.json` edit; oRPC/WorkOS/better-auth are already
cataloged; kv-oauth's engine is jsr-inline. The only shared-file contention is `@netscript/cli` (AS5
only) and `plugins/auth` internals (AS3 service vs AS4 streams → sequence AS4 after AS3).

### The kv-oauth sub-PR (the "paused" one)

`feat/prime-time/auth-kv-oauth` (AS2b) is opened **as a draft and paused**, tied to ONLY the kv-oauth
backend concern. It depends solely on AS1 (the `AuthBackendPort` + provider/session contracts). It
**resumes** by pulling the umbrella once AS1 lands, then implements the backend. ~70% of the Track-4
PLAN-EVAL-PASS plan survives verbatim here (store / crypto / cookies / authenticator / provider
registry); what's dropped is its standalone Hono `mountKvOAuthHandler` and any flow HTTP surface —
those move UP into the plugin's oRPC service (AS3).

## Slice → sub-PR breakdown (dependency-ordered stack)

Each slice: one sub-branch, commit-by-slice, push explicit refspec, PR comment, append `commits.md`.
Production/enterprise bar throughout: no stubs/no-ops; real behavior, errors, tests, gates green.

- **AS1 — `@netscript/plugin-auth-core` (contracts only).** oRPC `auth.contract` v1 (signin/callback/
  signout/session/me shapes), stream-event schema (`auth.token.refreshed`/`session.revoked`/
  `oidc.completed`/…), session + account domain model, `AuthBackendPort` interface, backend-selection
  seam, config schema, presets surface. No runtime behavior. Mirrors `@netscript/plugin-sagas-core`.
  Gate: `deno check --unstable-kv ./mod.ts`, doc-lint full export map, `publish:dry-run`.
  *Foundation — everything bases on this.*

- **AS2a — backends → pure (`auth-workos`, `auth-better-auth` refactor).** Implement `AuthBackendPort`
  for both; **remove** the per-adapter Hono mount helper and relocate `gen-better-auth-prisma`
  responsibility out of the loose tool into the plugin's DB contribution (AS5). Keep the real WorkOS
  sealed-session + JWKS logic and the better-auth `prismaAdapter` wrapping — only the contribution
  surface moves. Back-compat: the old `mount*` exports become thin deprecated shims OR are dropped
  (decide at PLAN-EVAL — these landed only on the umbrella, never shipped to JSR, so dropping is
  low-risk). Depends on AS1. Gate: package check/test + node-compat tests stay green.

- **AS2b — `@netscript/auth-kv-oauth` backend (PAUSED sub-PR).** The pure kv-oauth backend: provider
  registry (`defineOAuthProvider` + presets), `KvOAuthStore` over `WatchableKv` (txn + session
  namespaces, CAS), AES-256-GCM token sealing, `__Host-` cookies, `createKvOAuthAuthenticator`
  implementing `AuthBackendPort` + refresh rotation. **No** `mountKvOAuthHandler` (moved to AS3).
  Absorbs the Track-4 PASS'd plan (with its M1–M4 corrections). Depends on AS1; independent of AS2a.
  Gate: package check/test, `deno check --unstable-kv`, doc-lint, `publish:dry-run`.

- **AS3 — `plugins/auth` unified oRPC service.** `plugins/auth` scaffold (mirror `plugins/sagas`):
  `services/src/router.ts` + `contracts/v1/auth.contract.ts` implementing `/auth/{signin,callback,
  signout,session,me}`, composing all three backends behind the AS1 selection seam (env/appsettings
  backend choice). This is the ONE HTTP surface (supersedes the removed per-adapter mounts). Depends
  on AS1 + at least one backend (AS2a or AS2b). Gate: plugin check/test, manifest test.

- **AS4 — real-time streams (v1).** `plugins/auth/streams/` producer + schema wired to the AS1
  stream-event contracts; emit `token.refreshed`/`session.revoked`/`oidc.completed` to server
  subscribers + client SDK. Mirror `plugins/sagas/streams/`. Depends on AS1 + AS3 (sequence after AS3;
  both touch `plugins/auth`). Gate: plugin check/test + a stream round-trip test.

- **AS5 — CLI + DB + scaffold + Aspire contribution.** `plugins/auth/src/cli/` (`netscript auth`:
  add-provider, gen-key, schema, registry) + registry generators; `plugins/auth/database/auth.prisma`
  (relocating `gen-better-auth-prisma`'s output here); `scaffold.plugin.json`/`scaffold.runtime.json`
  + `src/scaffolding/` + `src/aspire/`. Depends on AS1 + AS3. **Touches `@netscript/cli`** — the one
  conflict-prone slice; keep its CLI edits minimal + additive. Gate: plugin check/test, CLI test,
  plugin doctor.

- **AS6 — gates + docs + debt.** `plugins/auth/src/e2e/` probes + gates; **this lane carries the
  `e2e-cli-gate` label** and runs `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
  (it's the slice that changes scaffold/CLI/DB). Docs reconciliation (auth is now a first-class
  plugin). Record deferred debt (PAR/DPoP, key-rotation, RS bearer-JWT, any tier-2 split). Depends on
  all. Gate: full runtime smoke (evaluator/merge pass only).

Ordering: AS1 → {AS2a ∥ AS2b} → AS3 → AS4 → AS5 → AS6. AS2a and AS2b are parallel (different packages).

## Gates (per archetype)

- AS1/AS2a/AS2b (ARCHETYPE-2 packages): scoped `run-deno-check/-lint/-fmt --root <pkg> --ext ts,tsx`,
  `deno test --unstable-kv`, `deno check --unstable-kv ./mod.ts`, doc-lint full export map,
  `publish:dry-run`.
- AS3/AS4/AS5/AS6 (ARCHETYPE-5 plugin + `@netscript/cli` touch at AS5): plugin check/test, manifest
  test, plugin doctor, and at AS6 the `scaffold.runtime` E2E smoke + `arch:check`.
- Catalog law: oRPC/WorkOS/better-auth via `catalog:` (already present); kv-oauth engine `jsr:` inline.
  `deno.json` catalog block, `aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins —
  **untouched** (LD-8). Confirm any new catalog need via `deno task deps:latest`.

## Open questions for PLAN-EVAL to rule on

1. **AS2a back-compat:** drop the landed per-adapter `mount*`/schema-gen exports outright (never
   shipped to JSR) vs keep thin deprecated shims for one cycle? Plan leans **drop** (umbrella-only,
   low risk) but flags it.
2. **`plugins/auth` ↔ `@netscript/plugin-sagas-core` shared abstractions:** does the auth core
   duplicate any saga-core streaming/registry primitive that should instead be promoted to a shared
   base package, or is per-plugin duplication the accepted house style? (Sagas re-implements its own
   streams; precedent suggests per-plugin is fine — confirm.)
3. **Backend-selection granularity — RESOLVED (user-locked 2026-06-20):** **single active backend per
   app** (env `NETSCRIPT_AUTH_BACKEND=workos|better-auth|kv-oauth`). Concurrent multi-backend is
   **deferred** to a later slice (accepted scope boundary, not debt). The AS1 selection seam ships
   single-active but must not foreclose a future multi-backend extension. Not an open item.
4. **kv-oauth backend's flow HTTP surface:** confirm moving signIn/handleCallback HTTP handling up
   into the plugin oRPC service (AS3) — leaving the backend as pure non-HTTP logic — is the right cut,
   vs keeping a thin flow object in the backend that the service calls.

## Generator handoff

Implementation lane: WSL Codex daemon-attached subagents (mobile-visible) per slice, one
`send-message-v2` per worktree, sequential per the stack. Daemon repaired + managed (2026-06-20,
codex user, v0.141.0, connected/YogaBook9i). Each slice brief derives from this program plan + the
per-slice design + the audited `plugins/sagas` precedent. PLAN-EVAL PASS required before any slice.
Evaluator is a separate OpenHands session (minimax-M3 for PLAN-EVAL, qwen3.7-max for IMPL-EVAL).
