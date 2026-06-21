# AS2a Generator Brief — `auth-workos` + `auth-better-auth` → pure `AuthBackendPort` backends

You are a WSL Codex implementation subagent in a NetScript harness run. You implement; a separate
OpenHands session evaluates. **Production/enterprise bar: no stubs, no silent no-ops, real behavior,
real errors, real tests, gates green.** Work only in this worktree.

## Worktree / branch (already set up)

- CWD worktree: `/home/codex/repos/netscript-pt-auth-backends-refactor`
- Branch: `feat/prime-time/auth-backends-refactor` (HEAD at umbrella `7c063240`, off
  `feat/prime-time/auth`). Upstream is intentionally UNSET.
- This branch already contains `packages/plugin-auth-core/` (the AS1 foundation you build against).

## Read first (cheapest path to correctness)

1. `AGENTS.md` (operating rules; doctrine-first, contract-first, wrap-don't-reinvent).
2. The AS1 contract you must satisfy — read these in full:
   - `packages/plugin-auth-core/src/ports/mod.ts` — `AuthBackendPort` and its sub-ports
     (`AuthProviderRegistryPort`, `AuthSessionStorePort`, `AuthSessionCryptoPort`,
     `AuthPrincipalMapperPort`), `AuthSessionLookup`, `AuthSessionCreateInput`,
     `AuthProviderDescriptor`, `createAuthBackendRegistry`.
   - `packages/plugin-auth-core/src/domain/mod.ts` — `AuthSession`, `AuthUser`, `Account`,
     `AuthSessionPrincipalMapping`, and how `Principal`/`AuthnRequest`/`AuthnResult`/
     `AuthenticatorPort` are imported from `@netscript/service/auth`.
   - `packages/plugin-auth-core/src/testing/mod.ts` — if it exposes an `AuthBackendPort` conformance
     harness/fixtures, USE it in your tests.
3. The two packages you refactor (current state):
   - `packages/auth-workos/` (`mod.ts`, `src/workos-authenticator.ts`, `tests/*`). NO mount/Hono.
     Factories: `createWorkosAuthenticator` (returns `AuthenticatorPort`),
     `createWorkosAccessTokenAuthenticator`. Real WorkOS sealed-session + JWKS (`jose`
     `createRemoteJWKSet`) logic — KEEP it.
   - `packages/auth-better-auth/` (`mod.ts`, `src/better-auth.ts`, `tests/*`). Imports `hono`.
     `createNetscriptBetterAuth` wraps `prismaAdapter` from `better-auth/adapters/prisma`
     (better-auth.ts ~113–118) — KEEP that wrapping. `createBetterAuthAuthenticator` returns
     `AuthenticatorPort`.
4. The program plan slice spec: `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/program-plan.md`
   → "AS2a" bullet + "Open questions" #1 (DROP, not shim).

## Scope — exactly this, nothing else

Refactor BOTH packages so each exposes a pure `AuthBackendPort` factory, and DROP the leaked
project-contribution surface from `auth-better-auth`. Touch only `packages/auth-workos/`,
`packages/auth-better-auth/`, and the one tool file in the drop list. Do NOT touch
`packages/plugin-auth-core/`, root `deno.json`, the catalog block, `packages/aspire/`,
`scaffold-versions.ts`, or any LD-8 frozen file.

### A) DROP from `auth-better-auth` (removal, not shim — rationale below)

- `mountBetterAuthHandler` (`src/better-auth.ts` ~177–186) and `BetterAuthMountOptions`
  (`src/better-auth.ts` ~87–90).
- Their re-exports from `mod.ts`.
- `tests/mount_test.ts` (delete).
- The `hono` import from `packages/auth-better-auth/deno.json` (no longer needed once the mount is
  gone — verify nothing else imports hono in this package; if something does, that is leaked surface
  too and must go).
- `.llm/tools/auth/gen-better-auth-prisma.ts` (loose DB-schema-gen dev tool, zero in-tree code
  importers — confirm with a grep; doc/README mentions don't count). Its DB-schema responsibility
  relocates to the auth plugin's DB contribution in a later slice (AS5) — do NOT reimplement it here.
- Update `packages/auth-better-auth/README.md` to remove mount + gen-tool usage sections.

**Removal rationale (MUST appear in the AS2a commit message):** the auth umbrella never publishes to
JSR (`publish: false`; adapters are `0.0.1-alpha.0`), so no external consumer can depend on these
symbols; per-backend HTTP mount + loose schema-gen are project-contribution/plugin surface, not
backend surface. They move UP into the unified `plugins/auth` oRPC service (AS3) and DB contribution
(AS5). Drop cost < shim cost.

`auth-workos` has NO mount — it gets the `AuthBackendPort` refactor ONLY, no drops.

### B) Implement `AuthBackendPort` for each backend

Add a backend factory to each package — `createWorkosBackend(...)` and `createBetterAuthBackend(...)`
(name them per house style; export from `mod.ts`) — each returning an `AuthBackendPort`:

- `name`: `'workos'` / `'better-auth'` (stable; used as the backend-selection registry key).
- `authenticate(request)`: the real per-request authentication. REUSE the existing authenticator
  logic (WorkOS sealed-session + JWKS; better-auth `api.getSession`). The existing
  `createWorkos*Authenticator` / `createBetterAuthAuthenticator` may be kept as internal building
  blocks or folded in — your call — but the real verification logic must be preserved, not weakened.
- `providers: AuthProviderRegistryPort`: real `listProviders()` / `getProvider()` over the backend's
  configured providers/connections (WorkOS connections; better-auth social providers). Advertise
  honest `capabilities`.
- `sessions: AuthSessionStorePort`, `crypto: AuthSessionCryptoPort`,
  `principalMapper: AuthPrincipalMapperPort`: implement the operations that map to a REAL upstream
  capability (e.g. `getSession` via loadSealedSession / `api.getSession`; `crypto` open/seal of the
  sealed-session cookie; `principalMapper.mapSessionToPrincipal` from verified claims → `Principal`).

  **For operations with no real upstream equivalent** (e.g. these IdP-managed backends do not expose
  "create a session for an arbitrary userId" the way a self-hosted KV store does): do NOT fake a
  value and do NOT no-op. Throw a typed, exported `AuthBackendOperationUnsupportedError`
  (backend name + operation + one-line reason) and document the capability boundary. This is an
  HONEST capability surface, not a stub. Record each such boundary in your worklog as accepted v1
  debt. Prefer implementing real behavior wherever the SDK genuinely supports it; only fall back to
  the typed throw where the operation is genuinely not an upstream concept for that backend.

- Keep WorkOS sealed-session + JWKS intact; keep the better-auth `prismaAdapter` wrapping intact.
- Provide `createWorkosBackend`/`createBetterAuthBackend` as the `AuthBackendPort` entry; these are
  what the future `plugins/auth` service composes behind the AS1 `createAuthBackendRegistry` seam.

## Tests

- Update/extend tests so each backend's `AuthBackendPort` surface is covered: authenticate
  success+failure, provider listing, principal mapping, crypto open/seal round-trip, and the typed
  `AuthBackendOperationUnsupportedError` for each unsupported op (assert it throws with the right
  name/op, not a silent return).
- Keep the existing node-compat tests (`*-node-compat_test.ts`) GREEN — do not weaken them.
- If `plugin-auth-core/src/testing/mod.ts` exposes a conformance harness, run each backend through it.

## Gates (run all; capture verbatim exit codes; all must be 0)

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-workos --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-better-auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/auth-workos --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/auth-better-auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/auth-workos --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/auth-better-auth --ext ts,tsx
deno test --unstable-kv --allow-all packages/auth-workos packages/auth-better-auth
deno check --unstable-kv packages/auth-workos/mod.ts
deno check --unstable-kv packages/auth-better-auth/mod.ts
```

Also confirm a clean `git status` (only the intended files changed) and that `deno.lock` shows only
the legitimate delta from dropping `hono` (a REMOVAL of the hono entry is expected and correct; do
NOT hand-edit the lock — let deno re-resolve, then sanity-check the diff is hono-removal + nothing
spurious). Do NOT run `deno cache --reload`. Do NOT delete the lock.

## Commit / push / done

- ONE cohesive commit (the slice). Conventional-commit subject, e.g.
  `refactor(auth-backends): make auth-workos + auth-better-auth pure AuthBackendPort backends`.
  The body MUST state the removal rationale (mount + gen-tool dropped, no external consumers,
  moved up to plugin AS3/AS5).
- Before committing run: `export MSYS_NO_PATHCONV=1`.
- Push with an EXPLICIT refspec (never a bare `git push` — this branch has no upstream and a bare
  push could retarget the umbrella):
  `git push origin HEAD:refs/heads/feat/prime-time/auth-backends-refactor`
- You push via SSH and are GitHub-API-blind: do NOT try to open a PR or comment — the supervisor
  mirrors the PR, dispatches IMPL-EVAL, and merges. Do NOT embed any token anywhere.
- When done, print: the commit SHA, `git status` (clean), the gate exit-code table, the push result,
  and a short note listing any `AuthBackendOperationUnsupportedError` capability boundaries you
  recorded (per backend).

## Definition of done

Both packages expose a pure `AuthBackendPort` factory; all dropped symbols/files are gone with the
rationale committed; WorkOS sealed-session/JWKS and better-auth prismaAdapter logic preserved; all
gates exit 0; node-compat tests green; single commit pushed by explicit refspec.
