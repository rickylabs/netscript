# feat(service): handlers receive `principal` as an untyped bag entry and no procedure can declare a policy — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** TA-04 · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice", SYNTHESIS §5.3) · **Labels:** `type:feat` `area:service` `area:plugins` `area:contracts` `area:auth` `priority:p1` `status:triage` · **Depends on:** none (consumed by T1-05, TA-02, #934; prerequisite for #884)

## Summary

`buildRpcContext` writes the resolved `Principal` into a `Record<string, unknown>`, so every handler
that wants an identity must hand-declare an optional field and trust it. `@netscript/plugin` has no
principal concept at all — zero occurrences repo-wide — so plugin handlers cannot type one even
badly. Separately, authorization is path-prefix-only: `AuthzRequest` carries `{ principal, method,
path }`, rules match with `startsWith`, and oRPC's `.meta()` is used **nowhere** in the codebase, so
a procedure cannot declare the policy it requires. Policy therefore lives in a second place that can
drift from the contract, OpenAPI emits no `security` metadata, and no generated surface (SDK, MCP,
agent tooling) can tell a protected procedure from a public one.

## Evidence

- Corpus: `research/repo-audit/auth.md` §4.3 and §5, gaps **G9** and **G10**; `repo-audit/services-sdk.md`
  gap **S14**.
- `packages/service/src/types.ts:270-272` — `export type ContextFactory = (context: Context) =>
  Record<string, unknown>`.
- `packages/service/src/builder/service-builder-impl.ts:276-279` — `const principal =
  c.get('principal'); if (principal) { ctx.principal = principal; }` — merged into the untyped bag.
- `packages/service/src/auth/types.ts:29-46` — `Principal { subject, scopes, roles, scheme, claims }`;
  its own doc comment delegates organization and tenant identity to the untyped `claims` bag
  (`:38-45`).
- `grep -rn principal packages/plugin/src` → **zero matches**.
- `grep -rn '\.meta(' packages plugins --include=*.ts` → no oRPC `.meta()` call anywhere; the only
  matches are Zod schema metadata in `packages/aspire/config.ts`.
- `packages/service/src/auth/types.ts` `AuthzRequest = { principal, method, path }` and
  `packages/service/src/auth/scope-authorizer.ts:22-29` — rules match `request.path.startsWith(...)`.
- Consumer proof that the gap is real at the seam: `research/repo-audit/services-sdk.md` S14 records
  no compile-time link between injected context (`db`/`principal`/`traceHeaders`) and the router's
  `$context<T>()`, and no exported handler-context type.

## Current surface

A guarded service resolves a correct, hashed-logged `Principal` in middleware
(`packages/service/src/auth/auth-middleware.ts:166-177,231-237`) and then loses its type on the way
into the handler. Authorization rules are authored against derived RPC path strings — a rule *can*
match `/api/rpc/v1/auth/signout` because `RPCLink` appends procedure segments, but that string is a
consequence of the transport, not a declaration by the procedure. Renaming a router breaks a policy
silently.

## Target contract

1. **Typed principal.** `@netscript/service` exports a handler-context type carrying an optional
   `principal: Principal`, and `ContextFactory` is parameterized so `withContext` composes typed
   fields instead of widening to `Record<string, unknown>`. `@netscript/plugin` re-exports the
   principal type so plugin handlers type it without importing from `@netscript/service` internals.
2. **Procedure policy metadata.** A first-class `$meta`/`.meta()` policy annotation on contract
   procedures — minimally `{ public: true }` or `{ scopes: readonly string[]; roles?: readonly
   string[] }` — carried on the contract, not on a parallel rule table.
3. **An authorizer adapter that reads it.** `createContractAuthorizer(contract)` derives decisions
   from the declared metadata and composes with the existing `createScopeAuthorizer` (which stays
   the path-prefix adapter, not the ceiling). Fail-closed remains the default: a procedure with no
   declared policy and no matching rule is denied.
4. **Generated-surface propagation.** OpenAPI emits `security` for procedures declaring a policy;
   the generated SDK/MCP/agent surfaces expose the same fact so an agent can tell a protected
   procedure from a public one.
5. **Forward compatibility with #884.** The principal and policy shapes are designed so #884's
   organization/membership/assurance model extends them rather than replacing them; this issue does
   **not** add tenant fields.

## Acceptance

- [ ] A handler reads `context.principal` with the correct type and no cast.
- [ ] `@netscript/plugin` exposes the principal type to plugin handlers.
- [ ] `ContextFactory` composes typed fields instead of widening to `Record<string, unknown>`.
- [ ] Contract procedures can declare a policy (`public` or required scopes/roles).
- [ ] An authorizer derives decisions from declared procedure metadata.
- [ ] A procedure with no declared policy and no matching rule is denied.
- [ ] OpenAPI emits `security` metadata for procedures that declare a policy.
- [ ] Negative test: a handler that reads `context.principal` on an unguarded service fails to type-check or receives `undefined`, never a silently-trusted value.
- [ ] Negative test: renaming a router breaks a contract-declared policy at compile time rather than silently unguarding the route.
- [ ] Negative test: a procedure declaring scopes rejects a principal lacking them with 403.
- [ ] Tests cover both the REST and RPC projections of a policy-annotated procedure.
- [ ] `quality:scan` and `arch:check` green; no new `as unknown as` or `any` on the added surface.
- [ ] The principal/policy shapes are reviewed against #884's contract sketch and the review is recorded.

## Boundaries

- **Do not** define organization-aware identity or policy contracts — **#884** owns canonical
  organization, membership, connection, role/group, assurance and policy-decision types, and the
  authorization request over subject × organization × resource × action × context. This issue
  defines only the non-tenant principal and the procedure-level policy annotation, and must be
  designed so #884 extends it. Cite #884 in the implementation PR and record the compatibility review.
- **Do not** build the browser-facing deny-by-default gateway — **#934** owns it; it consumes this
  metadata.
- **Do not** implement the SDK client seam — **T1-05** owns it; it consumes the same metadata to
  decide whether a call needs a credential.
- **Do not** add `PluginServiceConfig.auth` — **TA-02** owns it.
- **Do not** widen the type-soundness program — **#1278** is the epic-of-record for unsound types
  (with **#1276** proposed for fold); this issue only avoids adding new unsound surface.
- **Do not** build the conformance/mocking test kit — **#885** owns it.

## Docs/consumer proof

`docs/site/tutorials/workspace/05-route-authz.md` teaches authorization entirely through path
prefixes. Adoption is proven when that tutorial declares a policy on the procedure and the route
guard follows from it, when `docs/site/reference/` documents the principal type a handler receives,
and when a generated MCP/agent tool listing distinguishes protected from public procedures without
the author writing a second policy table.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` gaps G9/G10 and `research/repo-audit/services-sdk.md` S14; all cited
line numbers re-verified against worktree `fac9e339042c` on 2026-08-08.
