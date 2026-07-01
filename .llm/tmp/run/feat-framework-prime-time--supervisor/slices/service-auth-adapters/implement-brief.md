# Implement brief — service-auth-adapters

Generator: WSL Codex, daemon-attached. Slice branch `feat/prime-time/service-auth-adapters` off the
umbrella `feat/framework-prime-time`. PR → umbrella. PLAN-EVAL **PASSED** (cycle 1, run 27860702043);
do NOT re-plan — implement the locked plan.

## Read order (do this first)

1. `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/service-auth-adapters/plan.md` — the
   authoritative design (§1 scope, §3 contract, §4 design, §5 the 6 commit slices, §6 gates).
2. `…/slices/service-auth-adapters/research.md`, `plan-meta.json`, `plan-eval.md` — locked decisions,
   external precedents (F1/F2/F3), and the evaluator's self-applied fixes + follow-ups (fold them in).
3. Ground truth before writing — the MERGED #77 seam you CONSUME (do not redefine):
   `packages/service/src/auth/types.ts` @ umbrella (`AuthenticatorPort`, `AuthnRequest` with
   `header()/headers()/cookie()/method/path`, `AuthnResult` `{ ok, principal, responseHeaders?,
   setCookies? } | { ok:false, reason }`, `Principal` `subject/scopes/roles/scheme/claims`).
   Precedents: `packages/prisma-adapter-mysql/` (Archetype-2 package shape) and `packages/queue`
   (port + factory + lazy `await import('../adapters/<tech>.adapter.ts')`).

## Scope (additive only)

Two standalone provider-integration packages, both CONSUMING the upstream ports (no change to
`@netscript/service` public surface):

- **`@netscript/auth-workos`** (build FIRST — simpler). `createWorkosAuthenticator({ workos,
  cookiePassword }): AuthenticatorPort` — per request `workos.userManagement.loadSealedSession({
  sessionData: req.cookie('wos-session'), cookiePassword }).authenticate()` → `Principal`; rotated
  session → `AuthnResult.setCookies`; `{ authenticated:false }` → `{ ok:false, reason }`. Optional
  `createWorkosAccessTokenAuthenticator({ clientId, jwksUrl? })` JWKS bearer path behind a separate
  factory.
- **`@netscript/auth-better-auth`** (verify + storage). `createNetscriptBetterAuth({ prisma, provider,
  ...betterAuthOptions })` WRAPS better-auth's OWN first-party `prismaAdapter` (`better-auth/adapters/
  prisma`) over the consumer's Prisma client — do NOT hand-roll a CRUD store.
  `createBetterAuthAuthenticator({ auth }): AuthenticatorPort` via `auth.api.getSession({ headers:
  req.headers() })` → `Principal`; refresh-on-read rotated cookies → `setCookies`.
  `mountBetterAuthHandler(app, auth, { basePath='/api/auth' })` mounts `auth.handler` on the Hono app
  with documented `allowAnonymous` exemption. Schema: `.llm/tools/auth/gen-better-auth-prisma.ts`
  wraps `@better-auth/cli generate` (dev tooling, NOT a runtime catalog entry); consumer owns
  migration.

Principal mapping is the locked table in plan.md §3 (`scheme:'custom'`, camelCase claim keys
`organizationId`/`sessionId` + raw provider claims).

## PRODUCTION/ENTERPRISE BAR

Real provider SDK integration, real verification + refresh-cookie emission, real error handling, full
unit + integration tests (mapped principal / reject / refresh-cookie paths; better-auth storage
round-trip over a SQLite/pglite or txn-rollback Prisma fixture). NO stubs, NO no-ops. All selected
gates green.

## Fold in the PLAN-EVAL findings

- **Self-applied fix (consumer-import validation):** treat consumer import of `@netscript/service` as
  a NAMED verify item in `worklog.md`, not a silent assumption — prove both new packages type-check as
  external implementors of the imported ports.
- **Self-applied fix (`@netscript/database` dep):** prefer the consumer-passes-`PrismaClient`
  precedent; if `@netscript/auth-better-auth` ends up not importing `@netscript/database` directly,
  DROP that dep from its `deno.json` rather than carry it unused.
- **Follow-up (Deno node-compat) — REQUIRED gate:** smoke that `@workos-inc/node@10` (Node>=22.11)
  `loadSealedSession`/`.authenticate()` AND `better-auth@1.6` resolve/run under Deno 2.8 node-compat
  (inlined `jose`/`iron-webcrypto`/`uint8array-extras`). On incompatibility: record in `drift.md` and
  rescope WorkOS to the JWKS-only path / surface the better-auth limitation honestly — do not fake it.
- **Follow-up (isolated declarations):** both new packages must satisfy `isolatedDeclarations` for JSR
  OR carry a documented carve-out in the slice-6 docs/JSR gate (do not silently add
  `--allow-slow-types`).

## Mechanics

- **Catalog law:** add `better-auth ^1.6.20` + `@workos-inc/node ^10.4.0` to the catalog, referenced
  ONLY in the two new packages via `catalog:` — never in core `@netscript/service`. After the entries
  exist, confirm "latest" via `deno task deps:latest` (NOT `deno outdated --latest`); run
  `deno task deps:audit` on the two new trees. Do NOT de-catalog `@prisma/client` (already at
  `deno.json:106`). Do NOT touch version pins, `packages/aspire/src/public/mod.ts`, or
  `scaffold-versions.ts`.
- **NOT an `e2e-cli-gate` slice** — no `@netscript/cli`/scaffold change. Do NOT attach the
  `e2e-cli-gate` label and do NOT run `deno task e2e:cli`.
- Commit by slice (6 slices, plan.md §5), gate each. Push EACH slice with the EXPLICIT refspec
  (repo `push.default` mis-targets a bare push):
  `git push origin HEAD:refs/heads/feat/prime-time/service-auth-adapters --force-with-lease`
- Append `commits.md` and write `worklog.md`/`drift.md`/`context-pack.md` under the run dir. Do NOT
  modify `deno.lock` unless legitimately required by the new catalog deps; if it changes, keep it to
  the minimal real re-resolution.
- Gates (plan.md §6): `deno task check` (`--unstable-kv`), scoped `run-deno-check.ts`/`-lint.ts`/
  `-fmt.ts` over both package dirs (`--ext ts,tsx`), per-package `deno test`, `deno task
  publish:dry-run`, JSR doc-lint over the FULL export map of each (not `mod.ts` alone), `deno task
  arch:check`, `deps:latest`/`deps:audit`. Name the SCOPE-service wiring invariant and the
  Archetype-5 schema-contribution gate explicitly in `worklog.md`.

When all slices are implemented, pushed, and the selected gates are green, write the worklog READY
signal and STOP. The supervisor dispatches IMPL-EVAL (OpenHands qwen3.7-max) as a separate session —
do NOT self-certify.
