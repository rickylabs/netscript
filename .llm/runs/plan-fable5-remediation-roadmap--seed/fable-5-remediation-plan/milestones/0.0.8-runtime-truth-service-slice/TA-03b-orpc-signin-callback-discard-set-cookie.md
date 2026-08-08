# fix(auth): oRPC `signin`/`callback` discard the backend `Set-Cookie`, so the interactive browser flow can never establish a session — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** TA-03b · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice", SYNTHESIS §5.3) · **Labels:** `type:fix` `area:auth` `area:contracts` `area:plugins` `priority:p0` `status:triage` · **Depends on:** none (TA-03c is required for the browser end of the same flow to work)

## Summary

`kv-oauth` returns real 302 responses whose `Set-Cookie` headers carry first the OAuth transaction id
and then the session id. Both auth handlers throw those responses away and keep only the `Location`
value. The contract makes this unfixable at the handler level: none of the five auth routes declares
`outputStructure: 'detailed'`, so no procedure in `authContractV1` can emit a response header at all.
The result is that the only interactive backend NetScript ships cannot complete a browser sign-in
through its own published API — the transaction cookie never reaches the browser, so the callback
fails with `oauth_cookie_missing`, and the session cookie never reaches the browser, so `GET /session`
and `GET /me` cannot see it afterwards.

## Evidence

- Corpus: `research/repo-audit/auth.md` §4.1, gap **G5**.
- `plugins/auth/services/src/routers/v1-handlers.ts:95-107` — `signin` calls `interactive.signIn(...)`
  and keeps only `responseLocation(response)`; the `Response` object is discarded.
- `plugins/auth/services/src/routers/v1-handlers.ts:162-169` — `callback` builds
  `{ completed, sessionId, redirectTo, subject }` from `result` and discards `result.response`.
- `plugins/auth/services/src/routers/v1-helpers.ts:82-84` — `responseLocation(response)` returns
  `response.headers.get('location')`; there is no `Set-Cookie` reader anywhere in the helpers.
- `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:437-461` — all five routes are
  `baseContract.route({ method, path }).input(...).output(...)`; **no** `outputStructure: 'detailed'`
  on any of them.
- `packages/auth-kv-oauth/src/flow.ts:143` (transaction cookie on the signin redirect) and `:220-224`
  (session cookie on the callback redirect) — the backend does emit both.
- `packages/auth-kv-oauth/src/flow.ts:155-159` — `handleCallback` throws `oauth_cookie_missing`
  unless the txn cookie or an explicit `txn` parameter is present; `v1-handlers.ts:157-160` forwards
  only `providerId`, `code` and `state`, never `txn`.
- The inbound half already works: `v1-helpers.ts:40-60` (`toRequest`) forwards inbound headers into
  the backend `Request`, and `toAuthnRequest` (`:64-78`) reads the session cookie. The defect is
  strictly the response half.
- The server-side write-back path exists and is unused by this surface:
  `AuthnResult.setCookies` / `responseHeaders` applied by `applyAuthnResponse`
  (`packages/service/src/auth/auth-middleware.ts:166-177`).

## Current surface

`signin` returns `{ started, providerId, redirectUrl, state }`; the caller is expected to follow
`redirectUrl` in a browser that never received the transaction cookie. `callback` returns
`{ completed, sessionId, redirectTo, subject }` — the session id is handed to the caller in the JSON
body, which is the only way it can be observed, and which is itself a credential leak into logs and
client state. Docs assert the opposite behaviour
(`docs/site/identity-access/how-to/add-authentication.md:243,273`).

## Target contract

1. `signin`, `callback` and `signout` declare `outputStructure: 'detailed'` in
   `auth.contract.ts` so their handlers can return headers alongside the body.
2. The handlers propagate the backend response's `Set-Cookie` headers verbatim — including the
   `__Host-` prefix, `Path=/`, `Secure`, `HttpOnly` and `SameSite` attributes the backend already
   asserts (`packages/auth-kv-oauth/src/cookies.ts:105-121`) — without re-encoding or re-signing them.
3. `callback` forwards the `txn` parameter when present so the documented explicit-transaction path
   works for non-cookie callers.
4. The session id stops being returned in the `callback` response body once the cookie path works,
   or is retained only behind an explicit non-browser flag; either way the change is recorded as
   contract-breaking.
5. `signout` returns the session-clearing `Set-Cookie` the docs already promise.

## Acceptance

- [ ] `signin`, `callback` and `signout` declare `outputStructure: 'detailed'`.
- [ ] The transaction `Set-Cookie` from `signIn` reaches the HTTP response unmodified.
- [ ] The session `Set-Cookie` from `handleCallback` reaches the HTTP response unmodified.
- [ ] `signout` emits a session-clearing `Set-Cookie`.
- [ ] `callback` forwards an explicit `txn` parameter to the backend when supplied.
- [ ] Cookie attributes (`__Host-`, `Path=/`, `Secure`, `HttpOnly`, `SameSite`) survive the round trip.
- [ ] Negative test: a `signin` → provider → `callback` round trip without the txn cookie still fails, and fails with `oauth_cookie_missing` rather than silently succeeding.
- [ ] Negative test: `GET /session` after a completed callback resolves the session **from the cookie only**, with no session id in the request body or query.
- [ ] Negative test: a cookie rewritten to drop `Secure` or `HttpOnly` is rejected by the backend's cookie-policy assertion.
- [ ] Tests cover both the REST (`/api/v1/auth/*`) and RPC (`/api/rpc/v1/auth/*`) projections of each route.
- [ ] Any contract change is released as breaking with a migration note.
- [ ] `docs/site/identity-access/how-to/add-authentication.md:243,273` are true against the shipped code.

## Boundaries

- **Do not** fix signout authentication/ownership — **TA-03a** owns it.
- **Do not** change the CORS default or decide the browser topology — **TA-03c** owns both; this
  issue makes the server emit correct cookies, TA-03c makes a browser able to keep them.
- **Do not** add the SDK client-side credential seam — **T1-05** owns it.
- **Do not** build signin/callback UI — **#942** owns the auth v1 frontend.
- **Do not** re-open multi-backend routing — the single-active-backend boundary is recorded as
  accepted debt (`.llm/harness/debt/arch-debt.md:1313`, `auth-single-active-backend-boundary`) and
  **#874** owns the routing gap.
- **Do not** widen the contract for organization/tenant selectors — **#884** owns them.

## Docs/consumer proof

`docs/site/identity-access/how-to/add-authentication.md:243` ("Revoke the current session and clear
the session cookie") and `:273` ("After completing the browser sign-in, the session cookie is set")
are currently unverifiable claims. Adoption is proven when the documented `curl -c cookies.txt` /
`curl -b cookies.txt` sequence in that file executes end to end against a generated project, and when
the tutorial `docs/site/tutorials/workspace/02-auth.md` no longer needs to pass a session id by hand.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` gap G5; all cited line numbers re-verified against worktree
`fac9e339042c` on 2026-08-08. Split from the TA-03 cluster so each session-lifecycle defect carries
its own acceptance and negative tests.
