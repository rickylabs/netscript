# DRAFT ONLY — Enterprise auth discovery inventory

> Planning artifact for run `beta11-cli--orchestrator`, slice `auth-gaps`. This is
> research for adversarial review, not a filed epic, implementation promise, or
> release authorization. Repository citations refer to the inspected baseline
> `fbb32119e4b8877ce32a07ccb1de3f252020f436`.

## Executive finding

NetScript has a useful normalized authentication kernel and three materially
different backends, but it does not yet offer a coherent enterprise-auth system.
The strongest path is not to reproduce vendor features. It is to make WorkOS the
enterprise federation/provisioning/control-plane lane, make Better Auth the
first-party application-auth capability lane, keep KV OAuth as the direct
standards-based OAuth/OIDC lane, and add the NetScript composition, policy,
secrets, audit, and testing contracts that let those lanes coexist honestly.

The highest-risk immediate defect is capability truthfulness: the plugin service
advertises interactive sign-in, callback, refresh, sign-out, and multi-backend
capabilities even where the selected backend cannot perform them. Most other
findings belong in Backlog / Triage. This truth/contract defect should be treated
as a beta release gate because clients can select an advertised path and receive
an unsupported-operation failure.

Microsoft enterprise coverage is currently partial. Direct Entra ID OAuth/OIDC
can use the KV OAuth backend and its PKCE flow, while WorkOS is the better carrier
for SAML/OIDC connection brokerage, SCIM lifecycle, administrator onboarding,
and organization-aware access. Conditional Access claims challenges,
tenant/cloud policy, app-role/group normalization, MSAL-style token acquisition,
and AD FS migration realities are not represented as product contracts.
Multi-tenant admin consent, per-tenant issuer/`tid` validation, B2B guest
normalization, and machine/agent/CLI identities are also missing. This matters
to the shipped `@netscript/mcp` server: it exposes an agent-facing server today,
but the enterprise-auth plan did not originally own how agents, CLIs, or services
authenticate to protected NetScript resources (`packages/mcp/deno.json:2-4`;
`packages/mcp/README.md:36-60`).

## Method and evidence boundary

The shipped inventory began with `deno doc` over the package/plugin entrypoints,
then used focused source reads to resolve behavior that public signatures could
not prove. Live vendor documentation was read on 2026-07-18. Product claims below
distinguish:

- **Shipped** — reachable through a documented/exported NetScript surface.
- **Partial** — useful primitives exist, but the named enterprise outcome is not
  complete or consistently exposed.
- **Missing** — no product-level NetScript contract or integration was found.
- **Upstream-ready** — the vendor offers the capability, but NetScript does not
  expose it.

No live identity-provider login was performed. Issue #709's shipped CLI surface
was verified against its closed issue contract and current CLI source; its
acceptance used parser/runtime smoke rather than a live third-party round trip.

## 1. What ships today

### Public core contract and normalized session model

`@netscript/plugin-auth-core` exports a provider registry; session store methods
for get/create/refresh/revoke; crypto, principal-mapper, and backend ports; and an
optional interactive-flow port (`packages/plugin-auth-core/src/ports/mod.ts:36`,
`:79`, `:134`, `:211`, `:317`). Its normalized `AuthSession` records backend,
provider, subject, scopes, roles, opaque claims, creation/expiry/refresh times,
and an `active | expired | revoked` state
(`packages/plugin-auth-core/src/domain/mod.ts:24-95`). Configuration selects one
`activeBackend` and one provider (`packages/plugin-auth-core/src/config/mod.ts:9-46`).

This is a sound interop kernel, but it is an authentication/session abstraction,
not yet an enterprise identity lifecycle or authorization policy model.

### Backend and flow inventory

| Backend / surface | Exactly what ships | Session and guard behavior | Confirmed boundary |
|---|---|---|---|
| `auth-kv-oauth` | OAuth 2.0/OIDC authorization-code flow with PKCE S256, state, OIDC nonce, discovery, callback checks, token exchange, refresh-token rotation/reuse detection, KV persistence, and presets including `azureAd` (`packages/auth-kv-oauth/src/flow.ts:100-203`, `:321-370`; `packages/auth-kv-oauth/src/providers.ts:99-108`, `:360-367`). | Creates and refreshes normalized sessions; rejects unsafe return URLs and non-HTTPS authorization/token endpoints outside permitted development cases. | Only backend implementing `InteractiveFlowPort`. No SAML, SCIM, Conditional Access claims-challenge continuation, OBO/Graph acquisition, or MSAL token-cache contract. Default principal mapping does not provide enterprise group/app-role policy. |
| `auth-workos` | Verifies WorkOS AuthKit sealed session cookies or bearer access tokens; may refresh a request-bound sealed session; maps organization, roles, permissions, entitlements, feature flags, and impersonator metadata (`packages/auth-workos/src/workos-authenticator.ts:54-129`, `:147-180`, `:205-340`). | Authenticates an incoming WorkOS session and returns a normalized principal/session. | No interactive port. Backend create/refresh/revoke-by-session-id operations throw `AuthBackendOperationUnsupportedError` (`packages/auth-workos/src/workos-backend.ts:62-126`, `:140-219`). No Directory Sync, Admin Portal, Audit Logs, FGA, or Vault adapter. |
| `auth-better-auth` | `createNetscriptBetterAuth` configures Better Auth with a Prisma adapter and now accepts both `plugins` and `betterAuthOptions`; an adapter authenticates through `auth.api.getSession` and maps organization/role/permission-like claims (`packages/auth-better-auth/src/better-auth.ts:22-101`, `:125-172`, `:257-301`; `packages/auth-better-auth/src/better-auth-backend.ts:61-121`). | Reads Better Auth cookie/header sessions through the upstream instance. | Plugin service does not mount `BetterAuthInstance.handler`; no interactive port; port create/refresh/revoke mutations are unsupported (`packages/auth-better-auth/src/better-auth-backend.ts:153-198`). Convenience factory forces Prisma. Base scaffold schema has only the baseline Better Auth tables (`plugins/auth/database/auth.prisma:1-64`), not plugin-contributed schema. |
| `@netscript/service/auth` | `AuthenticatorPort`, `AuthorizerPort`, trusted-header/static-credential adapters, path-based authentication middleware, and `createScopeAuthorizer` with ordered route matching and required scopes/roles (`packages/service/src/auth/auth-middleware.ts:75-127`, `:198-280`; `packages/service/src/auth/scope-authorizer.ts:21-76`). | Middleware is fail-closed by default and can attach authenticated identity to service context. | Route guard, not resource/action/relationship policy; no organization boundary, decision explanation, policy store, or WorkOS FGA adapter. |
| `plugins/auth` service | Selects and constructs a backend from environment/appsettings and exposes auth routes/session operations (`plugins/auth/services/src/backend-registry.ts:105-189`). | Registry implementation puts the selected backend into a one-entry map. | Exactly one active backend. No request routing across backends, account linking, session history, or global logout. |

### One-active-backend boundary

Although the core registry port can represent a map, runtime configuration and
the plugin service select exactly one backend. The checked-in architecture debt
calls this out as `auth-single-active-backend-boundary`: there is no multi-active
routing, account linking, cross-backend global logout, or history replay
(`.llm/harness/debt/arch-debt.md:1310-1344`; construction at
`plugins/auth/services/src/backend-registry.ts:105-189`). This is a genuine
composition gap, not just an undocumented feature.

### Capability advertisement is not backend-aware

`plugins/auth/services/src/routers/v1-handlers.ts:55-65` currently advertises
`interactive-signin`, `oidc-callback`, and `multi-backend` unconditionally.
Provider descriptors also advertise sign-in/callback/refresh/sign-out/session
behavior for WorkOS and Better Auth even though those backends have no interactive
port and reject several mutation calls. The service must derive capabilities from
the selected/available backend and should test every advertised operation. This is
the one discovery item proposed as beta-critical.

### CLI surface shipped by #709

Closed issue #709 (implemented by PR #720) established these auth verbs, which
remain in `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts:25-110`:

- `netscript plugin auth backend set|show`
- `netscript plugin auth provider set`
- `netscript plugin auth secret generate`
- `netscript plugin auth session list|revoke`

Provider inputs cover GitHub, Google, Azure AD, WorkOS, and Better Auth. The CLI
writes provider/backend settings into `.env` and duplicated appsettings
environment sections (`packages/cli/src/public/features/plugins/auth/auth-config.ts:55-139`,
`:159-211`). Azure AD requires an explicit issuer in the CLI configuration path,
even though the KV package has an Entra preset. Session list reads the active
projection and revoke calls the plugin API
(`packages/cli/src/public/features/plugins/auth/auth-session-client.ts:3-36`).
This is configuration and active-session administration, not enterprise tenant
onboarding, provisioning, audit search, or secrets rotation.

### Audit and telemetry: partial, not absent

The earlier shorthand “no audit surface” is too broad. Core instrumentation emits
spans/audit events for sign-in, callback, sign-out, session, and `me`, with subject
redaction/hashing when configured
(`packages/plugin-auth-core/src/telemetry/instrumentation.ts:62-126`, `:150-211`).
The durable stream defines five events: sign-in started/failed, token refreshed,
session revoked, and OIDC completed
(`packages/plugin-auth-core/src/streams/mod.ts:20-50`, `:71-87`).

What is missing is an enterprise audit product surface: consistent actor/target/
organization/context schemas, administrative events, retention/query/export,
tamper expectations, SIEM/log-stream delivery, and a WorkOS Audit Logs bridge.
The CLI only lists active sessions; it does not expose authentication history.

### Secrets and testing seams

The CLI generates a secret and prints it, then configuration writes secrets into
`.env` and duplicates them into appsettings-owned environment maps
(`packages/cli/src/public/features/plugins/auth/auth-config.ts:159-211`). There is
no secret-reference port, vault/KMS provider, rotation workflow, permission check,
or access audit. WorkOS Vault is therefore a potential provider, not a shipped
integration.

Core testing exports only `buildAuthUser` and `buildAuthSession`
(`packages/plugin-auth-core/src/testing/mod.ts:12-49`). No shared backend
conformance kit, fake IdP, signed-token fixture factory, SCIM webhook replay,
Conditional Access claims-challenge fixture, multi-backend/account-linking model,
or scaffold auth smoke was found.

### `seamless-auth-roadmap` debt entry: verified and stale in one important way

The architecture-debt entry says:

> “all 9 better-auth plugins … only via undocumented escape hatch”

and lists R0 as typed `plugins`/`betterAuthOptions` passthrough, followed by R1–R5
for schema generation, interactive integration, organizations, a builder, and
plugin-aware mappings/CLI (`.llm/harness/debt/arch-debt.md:1237-1293`). R0 has
since shipped in `packages/auth-better-auth/src/better-auth.ts:53-68` and
`:142-172`, so that sentence no longer describes current code. R1–R5 remain
material. The roadmap's nine-plugin framing is also behind Better Auth's live
[50+ plugin catalog](https://better-auth.com/docs/plugins). The debt record should
be reconciled during implementation planning, not silently used as current truth.

## 2. Microsoft enterprise layer

Microsoft recommends standards libraries/MSAL for identity-platform protocols;
its platform exposes OAuth 2.0 and OpenID Connect for modern applications
([Microsoft identity-platform protocols](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols)).
That does not make a generic OAuth exchange equivalent to MSAL's application
models and token acquisition semantics. MSAL distinguishes public and
confidential clients and supports token-cache-centered acquisition patterns
([MSAL client applications](https://learn.microsoft.com/en-us/entra/identity-platform/msal-client-applications)).

| Enterprise need | What buyers need / source | NetScript status | Best carrier and resulting gap |
|---|---|---|---|
| Direct Entra ID OIDC/OAuth2 | Tenant-aware authority, authorization code + PKCE, issuer/audience validation, sovereign-cloud choices, logout, and reliable token renewal. Microsoft documents OAuth/OIDC as the modern protocol plane ([protocols](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols)). | **Partial.** KV OAuth has PKCE, nonce, discovery, refresh rotation, and an `azureAd` preset using `common` or a tenant id. CLI does not expose that preset coherently and runtime has no tenant/cloud policy. | **KV OAuth** for direct standards integration. Add first-class Entra configuration, authority/tenant/cloud policy, claim mapping, and truthful capability tests. |
| Multi-tenant onboarding, admin consent, and B2B guests | `/common` and `/organizations` applications need tenant-bound issuer validation: the token's `iss` tenant must agree with its `tid`, and an allow-list may further restrict tenants. Admin-consent URLs (including `prompt=consent` where deliberately used) create a service principal in the customer tenant; app-only permissions always require administrator consent ([admin consent](https://learn.microsoft.com/en-us/entra/identity-platform/v2-admin-consent), [multitenant issuer guidance](https://learn.microsoft.com/en-us/entra/identity-platform/howto-convert-app-to-be-multi-tenant), [B2B collaboration](https://learn.microsoft.com/en-us/entra/external-id/what-is-b2b)). Guest UPNs commonly contain `#EXT#`, so a display/login name is not a durable principal key. | **Missing.** The preset can point at `common`, but NetScript has no consent-URL/runbook, tenant installation record, issuer-template/`tid` validation contract, service-principal lifecycle, or B2B guest normalization. | **KV OAuth + shared connection setup.** Record tenant id, consent status, service principal/application identifiers, permissions, and issuer policy; normalize guests with tenant-qualified immutable identifiers (`tid` + `oid`), not UPN text. |
| MSAL patterns / downstream APIs | Confidential-client credential handling, cache-first acquisition, incremental consent, on-behalf-of flow, and Graph/downstream API token acquisition; tokens and claims remain the authorization artifacts ([security tokens](https://learn.microsoft.com/en-us/entra/identity-platform/security-tokens)). | **Missing.** A generic refresh-token session is not an MSAL cache/OBO/Graph contract. | New Microsoft token-acquisition adapter or explicit interop seam above KV OAuth. Avoid claiming MSAL parity until these behaviors are contracted and tested. |
| Machine/service principals | Client-credentials applications need tenant-qualified service identities, app permissions/scopes, credential rotation, and auditable organization binding. A service principal that is merely placed in a group holding an app role does not receive that `roles` claim (`adversarial-findings.md`, F1). | **Missing.** No machine-principal or client-credentials session/token contract was found. | **Microsoft machine-token adapter + shared machine identity contract.** Validate `tid`, `oid`/client identity, audience, application permissions, and direct role assignment; never infer a machine role transitively from group membership. |
| Enterprise SSO federation | SAML or OIDC connections per enterprise, metadata/certificate lifecycle, domain discovery, IdP-initiated and SP-initiated realities. | **Missing as a NetScript integration.** Direct OIDC covers one standards path; there is no SAML implementation. | **WorkOS SSO** brokers SAML and OIDC ([WorkOS SSO](https://workos.com/docs/sso)). Leverage it rather than building a SAML stack. |
| SCIM provisioning and deprovisioning | Authoritative create/update/disable lifecycle, groups, assignments, reconciliation, and webhook/event handling. Entra's provisioning service automates identity lifecycle and commonly uses SCIM ([provisioning overview](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/how-provisioning-works), [user provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/user-provisioning)). | **Missing.** No user/directory lifecycle contract or SCIM adapter. | **WorkOS Directory Sync**, which normalizes users/groups and SCIM providers ([Directory Sync](https://workos.com/docs/directory-sync)). NetScript needs organization/user/group projections, idempotent webhooks, reconciliation, and deprovision session revocation. |
| Conditional Access | Identity policy is configured in Entra; applications must survive step-up/claims challenges, reacquire tokens, and avoid loops. Baseline Conditional Access requires Entra ID P1; risk-based policies require P2/Identity Protection, so P1 must not be marketed as risk enforcement ([Conditional Access developer guide](https://learn.microsoft.com/en-us/entra/identity-platform/v2-conditional-access-dev-guide), [license requirements](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview#license-requirements)). | **Missing.** No `claims` parameter/challenge continuation or structured reauthentication outcome. | **KV OAuth/Microsoft token seam** for direct Entra; WorkOS for brokered SSO where supported. Model “reauthentication required” distinctly from generic failure. Basic CA compatibility is table stakes; claims-challenge/continuous-access handling for long-lived tokens is a later P2/differentiator slice, not a phase-1 prerequisite. |
| Groups, app roles, and authorization claims | Stable app roles are generally preferable for application authorization; group claims can overflow token limits and require follow-up lookup. The verified caps are 150 groups in SAML tokens and 200 in JWTs, including nested memberships ([app roles](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps), [groups/app-role guidance](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles); `adversarial-findings.md`, F11). | **Partial.** Opaque claims survive; WorkOS maps roles/permissions; KV OAuth's default mapping does not create a typed Entra role/group policy and no overflow strategy exists. | Core typed principal/organization mapping plus **WorkOS RBAC/FGA** or a direct Entra mapper. Include group overage and Graph fallback policy; do not authorize solely from an unchecked arbitrary claim. |
| On-prem AD FS and hybrid estates | Buyers need a supported bridge/migration path, legacy claim-rule translation, certificate/metadata rollover, and clarity about password-hash sync/pass-through/AD FS choices. Microsoft recommends migration assessment and documents hybrid tradeoffs ([AD FS app migration](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/migrate-ad-fs-application-howto), [hybrid authentication choice](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/choose-ad-authn)). | **Missing as a named compatibility story.** | **WorkOS SAML** for standards federation plus documented Entra migration/claim mapping. Do not build LDAP, Kerberos, or an AD FS clone into NetScript, and do not claim AD FS tenants surface transparently through `domain_hint` unless that mechanism is independently verified. |

## 3. WorkOS capability sweep

The existing adapter uses one slice of AuthKit session verification. The leverage
opportunity is large because WorkOS already supplies the enterprise connection,
directory, organization, audit, and authorization control planes.

| WorkOS capability | Upstream capability | Exposed in NetScript | Gap / recommended use |
|---|---|---|---|
| AuthKit authentication | Hosted authentication and session/user primitives ([AuthKit overview](https://workos.com/docs/authkit/overview)). | **Partial:** sealed-cookie and bearer verification, request-bound refresh, rich claim mapping. | Add interactive authorization URL/callback/logout wiring and lifecycle operations; make advertised capabilities reflect the active adapter. |
| SSO: SAML + OIDC | Enterprise SSO connections across SAML and OIDC ([SSO](https://workos.com/docs/sso)). | **Missing.** | Expose through the WorkOS interactive backend; map connection/domain/org context; cover IdP/SP-initiation behavior. This should be the primary Microsoft federation leverage path. |
| Directory Sync / SCIM | Normalized directories, users, groups, and events across SCIM/directory providers ([Directory Sync](https://workos.com/docs/directory-sync)). | **Missing.** | Add automatic—not “real-time”—sync through one shared event-sync/webhook consumer used by provisioning, role sync, and audit emission; include verification, idempotent projections/reconciliation, deprovision handling, and organization ownership. |
| Admin Portal | Hosted enterprise administrator setup flows ([Admin Portal](https://workos.com/docs/admin-portal)). | **Missing.** | Config-first organization onboarding/session-link surface before considering a custom administration UI. |
| Audit Logs / Log Streams | Structured audit events and downstream streaming ([Audit Logs](https://workos.com/docs/audit-logs), [Log Streams](https://workos.com/docs/audit-logs/log-streams)). | **Missing; core auth telemetry is only a partial precursor.** | Define an enterprise audit event envelope, map core/admin/provisioning events, and expose export/stream configuration without leaking tokens/secrets. |
| MFA | The AuthKit MFA reference covers enrollment/listing and TOTP authentication, while challenge creation/verification and SMS belong to WorkOS's separate standalone MFA API; that standalone API is not intended for WorkOS SSO ([AuthKit TOTP authentication](https://workos.com/docs/reference/authkit/authentication), [standalone MFA API](https://workos.com/docs/mfa)). | **Missing as a NetScript contract.** | **EA-03 owns AuthKit TOTP state for non-SSO AuthKit users.** The enterprise IdP owns MFA for SSO users. Any SMS or generic challenge integration is a separate standalone-MFA adapter, never assumed to be part of AuthKit. |
| API keys, M2M, CLI/device, and Agent Auth | WorkOS supplies organization/user API Keys, client-credentials M2M applications, OAuth device authorization for limited-input CLIs, and Agent Registration/Agent Auth with discovery, claim ceremonies, and credential exchange ([API Keys](https://workos.com/docs/reference/authkit/api-keys), [M2M](https://workos.com/docs/authkit/connect/m2m), [CLI device authorization](https://workos.com/docs/reference/workos-connect/cli-auth/authorize-device), [Agent Auth](https://workos.com/docs/authkit/agent-auth)). | **Missing.** | Add one machine/agent/CLI auth child that normalizes machine versus delegated agent identities, organization/scope/actor claims, credential lifecycle, revocation, and MCP protected-resource discovery. |
| Organizations | Users and organization membership primitives ([Users and Organizations](https://workos.com/docs/authkit/users-organizations)). | **Partial:** organization id can be mapped from an authenticated session. | Add organization lifecycle, membership, domain/connection routing, tenant isolation, and admin onboarding. |
| RBAC | Organization-aware roles and permissions ([RBAC](https://workos.com/docs/rbac)). | **Partial:** roles and permissions are mapped into claims/principal data. | Add a typed policy/decision contract, authoritative synchronization, organization scope, and route/resource integration. |
| FGA | Relationship-based authorization API and models ([FGA reference](https://workos.com/docs/reference/fga), [modeling introduction](https://workos.com/docs/fga/modeling/user-groups/example/1-apply-the-schema)). | **Missing.** | Implement as an `AuthorizerPort`/policy provider after the core decision contract supports resource/action/relationship inputs and explanations. |
| Vault | Hosted secret-management product ([Vault](https://workos.com/vault)). | **Missing.** | Candidate secret provider behind a vendor-neutral secret-reference/rotation port. Treat availability/contract details as a procurement/configuration concern, not an unconditional package promise. |

## 4. Better Auth capability sweep

NetScript now has an important upstream escape hatch: callers can pass typed
Better Auth plugins and options. That is configuration reachability, not a
complete framework integration. Better Auth describes a catalog of more than 50
plugins ([plugin catalog](https://better-auth.com/docs/plugins)) and a server/client
plugin architecture with plugin-specific endpoints and schema
([plugin concepts](https://better-auth.com/docs/concepts/plugins)).

| Better Auth capability | Upstream capability | Exposed in NetScript | Gap / recommended use |
|---|---|---|---|
| Plugin ecosystem generally | 50+ plugins; server/client extensions can add endpoints, schema, hooks, and methods ([plugins](https://better-auth.com/docs/plugins), [concepts](https://better-auth.com/docs/concepts/plugins)). | **Partial:** `plugins` and `betterAuthOptions` passthrough ships. | Generate/merge plugin schema, mount the handler, scaffold required client plugins, map plugin claims, validate compatibility, and document supported capability packs. |
| Two-factor authentication | TOTP/OTP/backup-code flows ([2FA](https://better-auth.com/docs/plugins/2fa)). | **Upstream-ready only.** | Curated configuration, schema generation, routes/client, assurance-level mapping, recovery tests. |
| Passkeys | WebAuthn/passkey registration and authentication ([Passkey](https://better-auth.com/docs/plugins/passkey)). | **Upstream-ready only.** | Rely on upstream plugin, but provide schema, origin/RP configuration, handler mounting, client scaffolding, and test fixtures. |
| Magic link | Passwordless email-link flow ([Magic Link](https://better-auth.com/docs/plugins/magic-link)). | **Upstream-ready only.** | Mail-delivery/config seams, callback route, anti-enumeration behavior, and scaffold/tests. |
| Organizations | Organization, member, team, invitation, role/permission behaviors ([Organization](https://better-auth.com/docs/plugins/organization)). | **Partial at claim-read level; no lifecycle integration.** | Adopt as the local-app organization lane, map into a NetScript org contract, and define coexistence/synchronization with WorkOS organizations. |
| Admin | User administration, roles, bans, impersonation, session management ([Admin](https://better-auth.com/docs/plugins/admin)). | **Upstream-ready only.** | Curated enablement, admin authorization boundary, audit events, schema, handler/client, and safe impersonation mapping. |
| SSO/SCIM and other enterprise plugins | Available in the upstream catalog. Better Auth's self-service SSO registration dashboard is a Better Auth Infrastructure hosted offering, not functionality supplied by the OSS SSO plugin itself ([SSO](https://better-auth.com/docs/plugins/sso), [Infrastructure dashboard plugin](https://better-auth.com/docs/infrastructure/plugins/dash)). | **Pass-through configurable but not operationally integrated.** | Prefer WorkOS for normalized enterprise brokerage initially; an OSS Better Auth lane needs its own per-tenant registration UX, explicit ownership, and no dual-writer lifecycle. |
| Machine, CLI, agent, and MCP auth | Upstream plugins include API Key, JWT/Bearer, Device Authorization Grant, Agent Auth, MCP, and an OAuth 2.1 Provider with client credentials ([plugin catalog](https://better-auth.com/docs/plugins), [Device Authorization](https://better-auth.com/docs/plugins/device-authorization), [OAuth 2.1 Provider](https://better-auth.com/docs/plugins/oauth-provider)). The older MCP plugin is moving toward the OAuth Provider plugin ([MCP](https://better-auth.com/docs/plugins/mcp)). | **Upstream-ready only.** | Curate these behind a shared NetScript machine/agent principal and protected-resource contract; generate schema/routes/clients, distinguish autonomous machines from user-delegated agents, and integrate rather than duplicate the shipped `@netscript/mcp` server. |
| Database adapters and schema | Built-in/community adapters plus schema generation/migration guidance ([Database](https://better-auth.com/docs/concepts/database)). | **Partial:** convenience factory forces Prisma; plugin scaffold has base tables only. | Make adapter ownership explicit, generate plugin-contributed schema/migrations, detect drift, and test supported databases. |
| Session management | Cookie cache, session lifecycle, list/revoke, fresh-session and secondary-storage options ([Session Management](https://better-auth.com/docs/concepts/session-management)). | **Partial:** `getSession` is adapted; NetScript port mutations throw unsupported. | Decide which lifecycle is upstream-owned, implement supported operations without forging semantics, map freshness/assurance/device sessions, and test revocation. |
| Rate limiting | Built-in rate-limit configuration/storage behavior ([Rate Limit](https://better-auth.com/docs/concepts/rate-limit)). | **Upstream-ready through options, not surfaced as an auth capability.** | Provide safe production defaults/config docs, shared-store guidance, telemetry, and conformance tests; do not add a duplicate limiter. |
| Broad Better Auth options | Trusted origins, hooks, advanced cookie/database/security options and other server controls ([Options](https://better-auth.com/docs/reference/options)). | **Partial:** options passthrough. | Validate conflict/ownership with NetScript config, redact secrets, surface diagnostics, and define which options the scaffold owns. |

## 5. Cross-cutting gaps

| Gap | Current state | Required product contract |
|---|---|---|
| Multi-backend coexistence | Core map shape exists, runtime builds one entry; capability response falsely says multi-backend. | Backend routing by tenant/domain/provider, deterministic conflict rules, account linking, session provenance, cross-backend logout/revocation, migration, and degraded-provider behavior. |
| RBAC and authorization | Route-level scope/role guard; claims are backend-specific opaque data. | Typed subject/organization/resource/action/context decision; role/group normalization; policy provider SPI; decision reason/audit; WorkOS RBAC/FGA adapter; fail-closed tenant boundaries. |
| Session/token audit | Core traces and five events; active session CLI only. | Stable actor/target/org/context envelope, assurance/factor/source fields, redaction, retention/query/export, WorkOS Audit Logs/Log Streams bridge, administrative and provisioning events. |
| Secrets lifecycle | Plain environment/appsettings values and printed generated secret. | Secret references, provider-neutral read/rotate metadata, vault/KMS adapters, least-privilege diagnostics, overlap rotation, access audit, output redaction. |
| Multi-tenant organizations | WorkOS/Better Auth organization ids may be read from claims; no shared lifecycle or isolation contract. | Canonical org/membership/domain/connection model, per-org backend routing, invitation/admin ownership, lifecycle synchronization, tenant-safe cache/storage keys, deletion/deprovision semantics. |
| Testing and scaffolds | Two object builders; #709 parser/runtime smoke; no live provider conformance. | Fake IdP/JWKS and signed-token tools, backend contract suite, WorkOS/Better Auth webhook/session fixtures, SCIM and CA challenge replay, multi-backend scenarios, generated-project auth smoke, negative security cases. |
| Capability discovery | Static claims exceed implementation. | Machine-derived backend capabilities, operation-level probes/tests, stable versioning, and CLI/service diagnostics that never promise unsupported operations. |
| Machine/agent/CLI authentication | `@netscript/mcp` and `netscript agent` tooling ship, but auth has no client-credentials, device-flow, API-key, machine principal, delegated-agent actor, or protected-resource discovery contract. | Normalize machine, service, CLI, and delegated-agent identities; support Entra client credentials, WorkOS M2M/API Keys/device/Agent Auth, and Better Auth API-key/device/OAuth/MCP plugins with rotation, revocation, scopes, org binding, audit, and default-deny MCP/CLI policy. |
| Shared event synchronization | Directory, role, and audit paths each imply webhook/event handling, but no common consumer seam exists. | One verified, idempotent, replay-safe event-sync consumer with provider adapters, cursor/reconciliation semantics, ordering/deduplication, projection hooks, audit emission, and test fixtures shared by EA-05 and EA-06. |
| NetScript as outbound IdP | WorkOS Connect and Better Auth OAuth 2.1 Provider can make the application an authorization server, but NetScript has no product contract and this is not required for inbound enterprise SSO. | Deliberate backlog child for issuer/client/consent/token/revocation/discovery/resource-server contracts; keep separate from the inbound SSO implementation. |

## Architecture recommendation

Keep the normalized core vendor-neutral and assign ownership explicitly:

1. **KV OAuth owns direct OAuth/OIDC**, including a first-class Entra profile.
2. **WorkOS owns enterprise connection brokerage and directory control plane**:
   SAML/OIDC SSO, Admin Portal, Organizations, Directory Sync/SCIM, audit export,
   and optionally RBAC/FGA/Vault through discrete adapters.
3. **Better Auth owns application-facing auth modalities**: credentials/social,
   passkeys, magic link, 2FA, application organizations/admin/session features,
   using upstream plugins rather than NetScript reimplementations.
4. **NetScript owns composition and truth**: backend routing, normalized identity/
   organization/session/assurance contracts, policy SPI, audit envelope, secret
   references, scaffold configuration, diagnostics, and conformance tests.
5. **Machine and agent auth is a first-class identity lane**, not an API-key
   footnote: vendor adapters supply credentials and protocol flows, while
   NetScript normalizes machine/delegated-agent actors and connects them to the
   shipped MCP/CLI policy surface.

NetScript-as-IdP is explicitly deferred. WorkOS Connect and Better Auth's OAuth
2.1 Provider are promising carriers, but outbound issuance must not be smuggled
into the inbound enterprise SSO work without its own issuer/client/consent/token
security contract.

Multi-backend work must define a source of truth for every lifecycle. In
particular, enabling WorkOS Directory Sync and a Better Auth organization/SCIM
plugin against the same tenant without an ownership rule would create a dangerous
dual-writer system. The implementation plan should prefer config-first vendor
leverage, then add adapters only where the normalized port cannot yet reach the
vendor capability.

## Sources reviewed

Repository evidence is cited inline. Live official sources were limited to
Microsoft, WorkOS, and Better Auth documentation and are linked in the relevant
tables. Issue #709 and PR #720 were inspected as shipped-history evidence; no
GitHub objects were changed.
