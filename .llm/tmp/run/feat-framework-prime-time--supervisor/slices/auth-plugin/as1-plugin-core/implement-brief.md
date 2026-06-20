# AS1 Generator Brief — `@netscript/plugin-auth-core` (Track-5 foundation slice)

**Status:** PLAN-EVAL PASSED (run 27872109274, minimax-m3) — do NOT re-plan or re-research. Implement
to the production/enterprise bar. This is the foundation slice; AS2a/AS2b/AS3/AS4/AS5/AS6 all base on
it, so the public contract must be right.

## Identity & lane

- **Package:** `packages/plugin-auth-core` → `@netscript/plugin-auth-core` (NEW). Auto-joins the
  workspace via the `packages/*` glob — **do NOT edit root `deno.json` workspace or catalog**.
- **Branch:** `feat/prime-time/auth-plugin-core`, based on `feat/prime-time/auth` (the auth umbrella).
- **Archetype:** ARCHETYPE-2 / ARCHETYPE-5-core (a plugin-core package, sibling of
  `@netscript/plugin-sagas-core`). **Contracts + types + schema ONLY — no runtime behavior, no HTTP,
  no CLI, no DB.** Every export must compile under `isolatedDeclarations`.
- **Push:** the WSL Codex repo's `push.default` retargets the inherited umbrella upstream — push with
  an **explicit refspec**: `git push origin HEAD:refs/heads/feat/prime-time/auth-plugin-core` (SSH
  remote `git@github.com:rickylabs/netscript.git`). Never a bare `git push`.
- You are API-blind: commit + push; the supervisor opens/updates the PR and mirrors status.

## Mirror this precedent exactly

`packages/plugin-sagas-core/` (manifest, `mod.ts`, `src/<area>/mod.ts` per export, `publish.include`,
strict `compilerOptions`) and `packages/plugin-streams-core/` (for the stream schema base). Read both
before writing. Match their file layout, export-map style, and test placement.

## Deliverables (AS1 public surface)

`packages/plugin-auth-core/deno.json` — `name`, `version: "0.0.1-alpha.0"`, `license: "MIT"`, strict
compilerOptions, `publish.include` (README, deno.json, mod.ts, src/**/*.ts, docs), and an export map.
Proposed exports (refine to fit, but keep them all contracts/types):

- `.` → `./mod.ts` (re-exports the public surface)
- `./domain` → `src/domain/mod.ts` — `AuthSession`, `Account`, `AuthUser`, session/account state
  types; the mapping shape from a backend session → `@netscript/service/auth` `Principal`
  (`scheme:'custom'`). **Import `Principal`/`AuthnRequest`/`AuthnResult`/`AuthenticatorPort` from
  `@netscript/service/auth` — do NOT redefine the #77 seam ports.**
- `./ports` → `src/ports/mod.ts` — the **`AuthBackendPort`** interface (provider registry access,
  session store ops, crypto/session→Principal mapping — the pure backend contract every adapter
  implements; NO HTTP, NO mount). Plus the **backend-selection seam**: a
  `Map<string, AuthBackendPort>` registry with a single resolved **`default`** accessor
  (`resolveBackend(name?) -> AuthBackendPort`). Single-active per app now (user-locked); the Map
  shape must not foreclose a future multi-backend extension.
- `./contracts/v1` → `src/contracts/v1/mod.ts` — the **oRPC `auth.contract` v1** (use `@orpc/contract`
  from catalog + `zod` for input/output schemas): procedures `signin`, `callback`, `signout`,
  `session`, `me`. Typed contract only — no handler/router (that is AS3).
- `./streams` → `src/streams/mod.ts` — the **stream-event schema**, built on
  `@netscript/plugin-streams-core` `defineStreamSchema` (mirror `plugins/sagas/streams/schema.ts`
  structurally). Events: `auth.token.refreshed`, `auth.session.revoked`, `auth.oidc.completed` (+
  `signin.started` / `signin.failed` if the schema shape calls for them). Own the `AuthSession`
  entity typing; do NOT re-invent stream primitives.
- `./config` → `src/config/mod.ts` — the auth-plugin config schema (`zod`): backend selection
  (`NETSCRIPT_AUTH_BACKEND`), cookie/session policy knobs, provider config surface. Validated shapes
  only.
- `./presets` → `src/presets/mod.ts` — the provider/backend **presets surface** (types + registry
  shape only; concrete provider literals belong to AS2b kv-oauth, not here).
- `./testing` → `src/testing/mod.ts` — minimal contract-level testing primitives (fixtures/builders)
  if cohesive; otherwise defer to a later slice and note it.

`mod.ts`, `README.md` (purpose + export map + MIT), and `*_test.ts` unit tests per area (type-level +
schema-validation tests; no runtime behavior to integration-test yet).

`imports` block: `@netscript/plugin-streams-core` (`../plugin-streams-core/mod.ts`),
`@netscript/service` seam (match how other packages import `@netscript/service/auth`), `zod`
(`jsr:@zod/zod@4.4.3`), `@orpc/contract` (catalog), `@std/assert`. Confirm exact specifiers against a
sibling package; do not invent versions.

## Gates (must be green before final commit)

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-auth-core --ext ts,tsx`
- `deno check --unstable-kv ./mod.ts` AND a per-export `check` task (mirror sagas-core's task listing
  every `src/<area>/mod.ts`).
- touched-file lint + fmt via the scoped wrappers (`--root packages/plugin-auth-core --ext ts,tsx`).
- `deno test --unstable-kv --allow-all packages/plugin-auth-core`.
- `publish:dry-run` clean under `isolatedDeclarations` (no private-type-ref leaks across the full
  export map — per [[jsr-doc-lint-full-export-set]], lint the WHOLE export set, not just mod.ts).
- A consumer-import check: a throwaway downstream module importing the public `mod.ts` surface,
  type-checked under `isolatedDeclarations`, proving the export map resolves for consumers.

## Boundaries (do NOT cross)

- No edits outside `packages/plugin-auth-core/` (except, if unavoidable, additive — flag it; root
  `deno.json` workspace/catalog must stay untouched, `packages/aspire/src/public/mod.ts` /
  `scaffold-versions.ts` / version pins are off-limits — LD-8).
- No runtime/HTTP/CLI/DB. No `mountKvOAuthHandler`, no oRPC router, no Prisma — those are AS3/AS5.
- One cohesive commit (or a small dependency-ordered series). Conventional-commit message:
  `feat(plugin-auth-core): contracts, ports, stream schema, config for auth plugin (AS1)`.

When done: report files touched, gate outputs (verbatim exit codes), the commit SHA, and the push
result. The supervisor handles the PR.
