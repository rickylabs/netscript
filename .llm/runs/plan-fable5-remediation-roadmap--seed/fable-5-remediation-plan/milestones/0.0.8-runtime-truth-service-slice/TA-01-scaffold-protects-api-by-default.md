# fix(scaffold): the generated service ships `/api` unprotected and a framework test codifies public API routes as correct — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** TA-01 · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice", SYNTHESIS §5.3) · **Labels:** `type:fix` `area:cli` `area:service` `area:auth` `priority:p0` `status:triage` · **Depends on:** TA-02 (a plugin-composable authenticator the generated service can use), T1-05 (SDK client-side credential seam)

## Summary

`netscript service add` emits a `defineService(...)` call with no `auth` key, so every scaffolded
service serves `/api/rpc/*` and `/api/*` to any unauthenticated caller. The framework does not
treat this as a defect: `packages/service/tests/auth/define-service-auth_test.ts` contains
`Deno.test('defineService without auth leaves api routes public')`, which asserts `200` on
`/api/openapi.json` and therefore locks the insecure default in place as a regression test. A
product-grade meta-framework must not generate an open API surface by default, and must not carry a
test that fails when the default is fixed.

## Evidence

- Corpus: `research/repo-audit/auth.md` §0 (in-repo reproduction of "left RPC unauthenticated"),
  §3.2, gap **G3**.
- `packages/cli/src/kernel/assets/service/main.ts.template:14-23` — `defineService(router, { name,
  version, port, db, openapi, debug })`; no `auth`, no commented stub, no TODO.
- `packages/service/tests/auth/define-service-auth_test.ts:11-23` — the test that codifies the
  public default; the adjacent test at `:25` proves `auth` works when supplied.
- `packages/service/src/presets/define-service.ts:268-273` — `if (options.auth) { builder.withAuthn(...) }`;
  auth is opt-in and silently absent otherwise.
- `packages/service/src/auth/auth-middleware.ts:19,22` — `DEFAULT_PROTECTED_PREFIXES = ['/api']`,
  `DEFAULT_ANONYMOUS_PREFIXES = ['/health']`; the guard already covers exactly the right surface
  when it is enabled.
- `grep -rl auth packages/cli/src/kernel/assets/` returns no asset under `assets/service/` or
  `assets/app/routes/` — no signin route, no `_middleware.ts`, no session helper is generated
  (`auth.md` §3.2).

## Current surface

A generated workspace produces: a service whose entire `/api` tree is anonymous; an app client
(`packages/cli/src/kernel/assets/app/lib/example-service.ts.template:16-20`) that cannot send a
credential even if the service were guarded (`auth.md` §2, gap G1); and a `packages/service` test
suite that asserts the anonymous behaviour is correct. The server-side guard
(`createAuthnMiddleware` / `createAuthzMiddleware` / `createScopeAuthorizer`, all fail-closed —
`auth.md` §1.1) is complete and unused on the generated path.

## Target contract

1. `defineService` treats a missing `auth` option as an **error at build time**, not as "public".
   Public exposure requires an explicit, greppable opt-out — `auth: 'public'` (or
   `auth: { public: true, reason: string }`) — recorded in the generated file so an auditor can find
   every unguarded service with one grep.
2. `netscript service add` emits the opt-in form by default: an authenticator wired from
   `@netscript/plugin-auth`'s remote session-verifying `AuthenticatorPort` (TA-02) plus a
   `createScopeAuthorizer` rule set covering the generated router's routes, with `/health` left
   anonymous by the existing defaults.
3. `packages/service/tests/auth/define-service-auth_test.ts:11-23` is **replaced**, not deleted: the
   new test asserts that an unconfigured `defineService` refuses to start (or starts with `/api`
   returning 401), and a separate test asserts that the explicit opt-out restores the anonymous
   surface.
4. The generated app's client attaches the credential through the T1-05 seam; the scaffolded call
   path is authenticated end to end without a hand-written `fetch`.
5. Migration: the change is breaking for existing generated projects. Ship a codemod note plus a
   startup error message that names the exact opt-out to add.

## Acceptance

- [ ] `defineService` without an `auth` key fails to start with an actionable error naming the opt-out.
- [ ] An explicit public opt-out is required, is present in generated source, and is greppable.
- [ ] `netscript service add` emits a guarded service that boots and answers `/health` anonymously.
- [ ] The generated app calls its own guarded service successfully with no hand-written `fetch`.
- [ ] Negative test: an unauthenticated `GET /api/openapi.json` on a generated service returns 401.
- [ ] Negative test: an unauthenticated `POST /api/rpc/*` procedure call on a generated service returns 401.
- [ ] Negative test: a request with a valid credential but an insufficient scope returns 403.
- [ ] `defineService without auth leaves api routes public` is replaced by a test asserting the new default.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` green with the guarded default.
- [ ] The breaking change is recorded in the release notes with the exact opt-out snippet.

## Boundaries

- **Do not** implement the SDK credential seam here — **T1-05** owns `CreateServiceClientOptions` /
  `ServiceClientContext` headers and per-call credential override (gap G1). This issue consumes it.
- **Do not** implement `PluginServiceConfig.auth` or the remote authenticator here — **TA-02** owns
  both.
- **Do not** design organization-aware policy contracts — **#884** owns them.
- **Do not** build the auth conformance/mocking test kit — **#885** owns it; this issue adds only
  the gates listed above.
- **Do not** add auth UI, signin pages, or a session widget — **#942** owns the auth v1 frontend.
- **Do not** change the plugin frontend procedure gateway — **#934** owns it.
- **Do not** re-file scaffold-conformance inventory work — **#1335** is the umbrella; **#1333** owns
  frontend scaffold modernization.

## Docs/consumer proof

`docs/site/tutorials/workspace/05-route-authz.md:248-258` currently demonstrates an authenticated
call only with `curl -H 'authorization: Bearer read'` because no typed-client example can be
written (`auth.md` §2). Adoption is proven when that tutorial shows the generated client making an
authenticated call, and when `docs/site/reference/sdk/index.md` — which today contains zero
credential guidance — documents the opt-out and the guarded default. A generated project checked out
fresh must show the `auth` option in `services/<name>/src/main.ts` without the user editing anything.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` gaps G3/G1; all cited line numbers re-verified against worktree
`fac9e339042c` on 2026-08-08.
