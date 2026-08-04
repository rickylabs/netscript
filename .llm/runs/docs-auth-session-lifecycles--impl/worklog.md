# Worklog: Docs Lane - Operational Auth Session Lifecycles

## Run Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `docs-auth-session-lifecycles--impl` |
| Branch         | `docs/auth-session-lifecycles` |
| Archetype      | `N/A`                          |
| Scope overlays | `docs`                         |

## Design

We are adding manual coverage of operational session lifecycles for the three auth backend adapters. This fills a gap where the existing manual shows type-level configuration but omits the necessary HTTP requests/responses and redirect/cookie lifecycles to create, verify, refresh, and clear sessions.

### Key Lifecycle Paths

1. **Better Auth (`@netscript/auth-better-auth`)**:
   - Web handler mounted at `/api/auth/**` delegating to `auth.handler(request)`.
   - Forwarding of refreshed `responseHeaders` and multiple `setCookies` inside `AuthnResult` returned from `backend.authenticate(authnReq)` on protected routes.
2. **KV OAuth (`@netscript/auth-kv-oauth`)**:
   - The interactive sign-in (`backend.signIn`), callback (`backend.handleCallback`), session lookup (`backend.authenticate`), and sign-out (`backend.signOut`) HTTP lifecycles.
   - Redirect URL normalization using `allowedReturnTo` and `defaultReturnTo`.
   - Normalizing identities via `normalizePrincipal`.
3. **WorkOS (`@netscript/auth-workos`)**:
   - Bearer access-token authentication via `createWorkosAccessTokenAuthenticator`.
   - Verification using remote JWKS, expected audience (`clientId`), and optional expected `issuer`.
   - Mapping claims to `Principal` (subject, scopes, roles, claims).
   - Handling named failure outcomes (`workos_bearer_token_missing`, `workos_bearer_token_invalid`).

### Commit Slices

| # | Slice                  | Gate             | Files     |
| - | ---------------------- | ---------------- | --------- |
| 1 | Add Session Lifecycles manual page and register xref | `deno task docs:links` | `docs/site/identity-access/session-lifecycles.md`, `docs/site/_data/xref.ts` |
| 2 | Reference lifecycles guide from existing auth manuals | `deno task docs:links` | `docs/site/identity-access/auth.md`, `docs/site/identity-access/better-auth-plugins.md` |

## Progress Log

| Time     | Slice       | Step     | Notes     |
| -------- | ----------- | -------- | --------- |
| 07:08:00 | N/A         | Compile  | Authored and verified examples compile and lint green |
| 07:09:00 | Slice 1     | Design   | Drafted `session-lifecycles.md` and registered `xref.ts` key |

## Decisions

| Decision     | Reason     | Source                 |
| ------------ | ---------- | ---------------------- |
| Place guide in `identity-access/session-lifecycles.md` | Core capability manual fit for Build lane under identity | `plan` |
| Clean examples check dir before PR creation | Ensure git diff contains documentation files only | `docs/doctrine` |

## Gate Results

### Static Gates

| Gate     | Command or check | Result                    | Notes     |
| -------- | ---------------- | ------------------------- | --------- |
| Compile  | `deno check examples/auth-lifecycles/*.ts` | PASS | Verified target codes compilation |
| Lint     | `deno lint examples/auth-lifecycles/` | PASS | All files lint green |
| Links    | `deno task docs:links` | PASS | Link sanity checks before and after edits |
| Accuracy | `deno task docs:accuracy` | PASS | Verified accuracy and discoverability gates pass |

## Handoff Notes

- Inspect the updated manual page: [session-lifecycles.md](file:///home/codex/repos/ns005-authdocs/docs/site/identity-access/session-lifecycles.md).
- Follow-up Verification Commands & Results:
  - Links Verification: `deno task docs:links`
    - Result: `PASS` (102 docs checked, 0 broken links, 0 broken anchors, 0 orphans)
  - Accuracy Verification: `deno task docs:accuracy`
    - Result: `PASS`
  - Diff Check: `git diff docs/`
    - Result: `PASS` (verified only documentation-related files modified)

