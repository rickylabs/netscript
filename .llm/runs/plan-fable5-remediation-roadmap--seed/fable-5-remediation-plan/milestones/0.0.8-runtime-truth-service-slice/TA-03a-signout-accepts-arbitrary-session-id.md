# fix(auth): `POST /api/v1/auth/signout` revokes any session id an unauthenticated caller supplies — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** TA-03a · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice", SYNTHESIS §5.3) · **Labels:** `type:fix` `area:auth` `area:plugins` `priority:p0` `status:triage` · **Depends on:** TA-02 (the auth service must be guardable before signout can require a principal)

## Summary

The auth plugin's `signout` handler takes `sessionId` from the **request body**, resolves the
backend, and calls `revokeSession(sessionId)` with no authentication and no ownership check. Any
caller who learns or guesses a session id can terminate that session; the auth service accepts the
request because `createPluginService` cannot guard it at all (TA-02). NetScript's own CLI exercises
this path with a raw `fetch` carrying no credential, which is how the hole stayed invisible.

## Evidence

- Corpus: `research/repo-audit/auth.md` §3.1, gap **G6**.
- `plugins/auth/services/src/routers/v1-handlers.ts:189-234` — `export async function signout(input:
  SignoutInput, context: AuthServiceContext)`; `const sessionId = input.sessionId ?? await
  backend.interactive?.getSessionId(...)`, then `await backend.sessions.revokeSession(sessionId)`.
  There is no principal check anywhere in the function.
- `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:56-61` — `SignoutInput = Readonly<{
  sessionId?: string; everywhere?: boolean; redirectTo?: string }>`; the contract itself invites a
  caller-supplied session id.
- `plugins/auth/services/src/main.ts:70-84` — the service is built by `createPluginService` with no
  auth configuration, so no middleware ever populates a principal (TA-02 evidence).
- `packages/cli/src/public/features/plugins/auth/auth-session-client.ts:7-23` — first-party caller
  using raw `fetch` with no credential (`auth.md` §0).
- The `everywhere` flag in the same input widens the blast radius: a global logout is reachable on
  the same unauthenticated route.

## Current surface

`signout` has two modes. With `input.sessionId` present it revokes that id directly. With it absent
it falls back to `backend.interactive?.getSessionId(request)`, i.e. the cookie — the only
identity-bearing path, and it is the *optional* one. The handler emits a `session.revoked` audit
event and telemetry for the revocation it just performed, so the audit trail records a successful
revocation with no authenticated actor.

## Target contract

1. `signout` requires an authenticated principal. With TA-02's seam applied to
   `plugins/auth/services/src/main.ts`, `/api/v1/auth/signout` and `/api/rpc/v1/auth/signout` are
   inside `DEFAULT_PROTECTED_PREFIXES`.
2. Session ownership is enforced in the handler, not only at the middleware: the resolved session's
   subject must equal the principal's subject, otherwise the call fails with the contract's
   `UNAUTHORIZED` error and **no** revocation and **no** success audit record.
3. `everywhere: true` revokes only sessions belonging to the authenticated subject.
4. Caller-supplied `sessionId` is either removed from `SignoutInput` (preferred — the session comes
   from the credential) or retained solely as a same-subject selector for multi-session sign-out.
   Whichever is chosen, a foreign id can never be revoked. Removing the field is a contract-breaking
   change and must be released as such.
5. The failure path is indistinguishable to the caller between "session does not exist" and "session
   belongs to someone else" (no enumeration oracle).

## Acceptance

- [ ] `signout` rejects requests that carry no authenticated principal.
- [ ] `signout` rejects a `sessionId` whose subject differs from the principal's subject.
- [ ] `everywhere: true` revokes only sessions owned by the authenticated subject.
- [ ] A rejected signout emits no `session.revoked` audit event and no success telemetry.
- [ ] Negative test: unauthenticated `POST /api/v1/auth/signout` with a valid foreign `sessionId` returns 401 and the session stays active.
- [ ] Negative test: authenticated `POST /api/v1/auth/signout` with a foreign `sessionId` returns 401/403 and the session stays active.
- [ ] Negative test: `POST /api/rpc/v1/auth/signout` is guarded identically to the REST route.
- [ ] Negative test: unknown and foreign session ids produce the same response shape and status.
- [ ] The CLI's session commands send a credential and no longer rely on the unauthenticated path.
- [ ] Any `SignoutInput` contract change is recorded as breaking with a migration note.

## Boundaries

- **Do not** add the `PluginServiceConfig.auth` seam here — **TA-02** owns it; this issue consumes it
  and is blocked until it lands.
- **Do not** fix the `Set-Cookie` discard on signin/callback — **TA-03b** owns it.
- **Do not** change the CORS default — **TA-03c** owns it.
- **Do not** rework the CLI's hardcoded `localhost:4437` session-stream URL — **#1243** owns it;
  this issue only changes whether the CLI sends a credential.
- **Do not** build the auth conformance/mocking test kit — **#885** owns it.
- **Do not** add org-scoped revocation semantics — **#884** owns organization-aware policy.

## Docs/consumer proof

`docs/site/identity-access/how-to/add-authentication.md:243` advertises `POST /api/v1/auth/signout`
as "Revoke the current session and clear the session cookie" — "the current session" is exactly the
guarantee the code does not provide. Adoption is proven when that row is accurate, when the docs show
the authenticated call shape, and when `docs/site/identity-access/auth.md` documents the ownership
rule and the deliberate non-enumeration of foreign session ids.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` gap G6; all cited line numbers re-verified against worktree
`fac9e339042c` on 2026-08-08. Split from the TA-03 cluster so each session-lifecycle defect carries
its own acceptance and negative tests.
