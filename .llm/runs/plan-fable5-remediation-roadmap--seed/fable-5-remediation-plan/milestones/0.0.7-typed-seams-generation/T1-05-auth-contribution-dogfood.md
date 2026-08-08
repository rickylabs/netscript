# feat(sdk/auth): the typed service client cannot send any credential — prove the contribution chain with a first-party auth contribution — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T1-05 · **Proposed milestone:** `0.0.7` (post-rename-shift "Typed seams +
generation", SYNTHESIS §5.3) · **Labels:** `type:feat` `area:sdk` `area:auth` `area:plugins`
`priority:p1` `status:triage` · **Depends on:** T1-01 (RFC-A ratification, incl. answers to Q1
cookie topology and Q2 contribution-group shape), T1-02 (the chain), T1-04 (transport policy)

## Summary

`@netscript/service/auth` reads `Authorization: Bearer …` and `x-api-key`, and
`createServiceClient` cannot send either — the SDK has no concept of a credential at any layer.
NetScript's own CLI proves the consequence: it calls the auth service with raw `fetch` and
hand-rolled JSON shape-sniffing rather than the typed client it already depends on. This issue makes
auth the first dogfood consumer of the RFC-A contribution chain: a first-party `authClient(…)` /
`authContribution(…)` that attaches credentials, reads procedure policy metadata, surfaces a defined
credential error, and is declared from the auth plugin's manifest — so the seam is validated by the
sharpest real consumer rather than by a toy.

## Evidence

- Corpus: `research/repo-audit/auth.md` §0 (three independent proofs), §2 (the capability table),
  §4.2 (cross-origin + `__Host-` cookie topology), §5 (no procedure policy metadata), gaps
  G1/G2/G8/G9/G10; `research/repo-audit/services-sdk.md` §2.4 (S5);
  `research/external/orpc.md` §1.5, §4 (G1, G3).
- Source at baseline `fac9e339042c` (re-verified for this draft):
  - `packages/service/src/auth/static-credential-authenticator.ts:108-117` — server reads
    `Authorization: Bearer …` and `x-api-key`.
  - `packages/sdk/src/client/http-client-link.ts:82-101` — the client's entire header authorship is
    `Content-Type` plus optional `traceparent`/`tracestate`. `grep -rn 'Authorization' packages/sdk/src`
    → no match.
  - `packages/sdk/src/ports/service-client.ts:129-155,203-222` — no credential field on the options
    record or on per-call context.
  - `packages/cli/src/public/features/plugins/auth/auth-session-client.ts:7-23,27-37` — the
    first-party CLI calls the auth service with raw `fetch` and no credential; hardcoded URLs at
    `auth-plugin-command.ts:87,98-100` (the first is already broken — #1243).
  - `grep -rn 'authClient' packages plugins` → **no such symbol exists**; this issue creates it.
  - `packages/plugin/src/config/domain/plugin-contributions.ts:12-39` — no client contribution group;
    `:16` is the closed-literal precedent to avoid.
  - `grep -rnE '\$meta<|\.meta\(' packages plugins` → no oRPC procedure metadata anywhere, so
    `policy.public` has no current consumer to conflict with.
  - `packages/plugin-streams-core/src/application/stream-url-resolver.ts:136-150` — `getStreamsAuth()`
    is the repo's only working credential header, built outside the typed client; existence proof
    that a header seam fits this architecture.
- Board: #872 (`[enterprise-auth S1]` capability discovery, `0.0.8`), #884 (org-aware policy
  contracts, `0.0.12`), #885 (auth conformance kit, `0.0.12`), #1243 (broken CLI default URL,
  `0.0.6`), #942 (auth v1 frontend, `0.0.11`).

## Current surface

Server-side auth is real and correctly ordered — `withAuthn`/`withAuthz` install before RPC routes
mount, authz fails closed, and the principal reaches the oRPC handler context
(`research/repo-audit/auth.md` §1.1). Client-side there is nothing: no credential option, no
per-call override, no cookie forwarding, no emitter for the trusted-header authenticator that
`packages/service/src/auth/trusted-header-authenticator.ts:32-54` is waiting for. The docs cannot
show an authenticated typed call because none can be written — the authz tutorial can only show
`curl -H 'authorization: Bearer read'` (`docs/site/tutorials/workspace/05-route-authz.md:248-258`).

## Target contract

A first-party contribution shipped from the auth plugin, consumed through the RFC-A chain:

```ts
import { authContribution } from '@netscript/plugin-auth/sdk';

const users = createServiceClient({
  contract: UsersContractV1,
  serviceName: 'users',
  with: [authContribution({ scheme: 'bearer' })],
});
await users.list({ limit: 20 }, { context: { auth: { token } } });
```

1. **`authContribution(options)`** declares `{ auth: { token: string } }` as per-call context, so
   oRPC's `ClientRest` makes it required at the call site — omitting it is a compile error, not a
   401. A server-only variant (`@netscript/plugin-auth/sdk/server`) may close over a resolver that
   reads a secret; the isomorphic descriptor never does.
2. **`authClient(...)`** is the convenience wrapper the CLI and generated apps use: a
   `createServiceClient` pre-composed with the auth contribution against `authContractV1`, replacing
   the raw-`fetch` client at
   `packages/cli/src/public/features/plugins/auth/auth-session-client.ts`.
3. **Policy-aware behaviour.** The contribution reads `NetScriptProcedureMeta.policy` (RFC-A §3.6):
   it does not attach a credential to a `policy.public` procedure, and it raises a defined
   `CREDENTIAL_UNAVAILABLE` rather than sending an unauthenticated request to a non-public one.
4. **Declared from the manifest.** The auth plugin declares the contribution through the
   `PluginContributions` client group added by RFC-A — with a nameable, non-closed shape (contrast
   `plugin-contributions.ts:16`).
5. **Scheme scope is bounded by RFC-A Q1.** Bearer and `x-api-key` land here. Cookie/session
   transport does **not** — `research/repo-audit/auth.md` §4.2 proves it cannot work across the
   current cross-origin discovery + `__Host-` prefix + `origin:'*'` CORS combination, and the
   topology decision is the auth pack's.

## Acceptance

- [ ] `authContribution()` ships from the auth plugin and composes through `createServiceClient`'s
      contribution chain.
- [ ] A call to a guarded service with the contribution present carries the expected credential
      header, proven against a service configured with `createStaticCredentialAuthenticator`.
- [ ] `authClient(...)` replaces the raw-`fetch` client in the CLI's auth session commands.
- [ ] The contribution declares its per-call context so omitting the credential is a compile error.
- [ ] The contribution skips credential attachment for procedures marked `policy.public`.
- [ ] A defined `CREDENTIAL_UNAVAILABLE` error is raised instead of an unauthenticated request to a
      non-public procedure.
- [ ] NEGATIVE: a test asserts the same client without the contribution sends no credential header.
- [ ] NEGATIVE: a test asserts an unauthenticated call to a guarded service is rejected with 401,
      and an authenticated one succeeds — on `/api/rpc/*`, not only on `/api/openapi.json`.
- [ ] NEGATIVE: a type fixture asserts the credential context cannot be supplied to a client built
      without the contribution.
- [ ] NEGATIVE: a test asserts the server-only contribution variant throws when constructed in a
      browser-like environment.
- [ ] Docs show one authenticated typed-client call end to end, replacing the `curl`-only example.
- [ ] `gate:` `deno task check`, `deno task test`, and `deno task publish:dry-run` pass.

## Boundaries

- **Not here: the scaffold protecting `/api` by default.** The generated service template ships with
  no `auth` option and a framework test codifies it
  (`packages/service/tests/auth/define-service-auth_test.ts:11-22`) — that defect, the `plugin add
  auth` starter surface, and the CORS `origin:'*'` default all belong to the **auth pack**, not to
  this issue.
- **Not here: making plugin services guardable.** `createPluginService` has no `auth` option and
  never calls `withAuthn`/`withAuthz`
  (`packages/plugin/src/service/presentation/create-plugin-service.ts`) — auth pack.
- **Not here: the discarded `Set-Cookie` / `outputStructure: 'detailed'` defect** or the
  unauthenticated `POST /api/v1/auth/signout` — auth pack.
- Do **not** duplicate **#884** (organization-aware identity and authorization policy contracts) —
  no `tenantId` is added to `Principal`, `AuthSession`, or any contract here; the contribution
  context is merely extensible enough that #884 can add one later.
- Do **not** duplicate **#885** (auth conformance/mocking/scaffold test kit) — the two negative
  gates above are this issue's own proof, not the kit.
- Do **not** duplicate **#872** (auth capability discovery) or **#942** (auth v1 frontend).
- Do **not** duplicate **#1243** (`session list --stream-url` pins a dead localhost port) — replacing
  the CLI's transport here will touch that file; fix the URL under #1243 and reference it.
- Do **not** implement the server-side authorizer that consumes `policy.scopes` — auth pack.
- Do **not** add cookie/`credentials: 'include'` support until RFC-A Q1 is answered.

## Docs/consumer proof

`docs/site/identity-access/how-to/add-authentication.md` and `docs/site/services-sdk/sdk.md` gain the
first authenticated typed-client example in the repo's history, and
`docs/site/tutorials/workspace/05-route-authz.md:248-258` swaps its `curl` for that example. Consumer
proof is that NetScript's own CLI stops hand-rolling `fetch` against the auth service — the deleted
`auth-session-client.ts` request/parse code is the adoption evidence, and the two negative gates
prove the credential is actually load-bearing rather than decorative.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` (G1, and §9's ordering that names auth as the first dogfood) and
`research/repo-audit/services-sdk.md` (S5); the absence of an `authClient` symbol and of any oRPC
`.meta()` usage was re-verified by grep against worktree baseline `fac9e339042c`. No GitHub mutation
was performed.
