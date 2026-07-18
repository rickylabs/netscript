# DRAFT ONLY — `epic: enterprise auth` board proposal

> Planning artifact for adversarial review. Nothing in this file has been filed,
> labeled, scheduled, or approved. The #824 seed run remains drafts-only until
> owner ratification; board filing requires the owner in-turn. Replace
> `#<epic-placeholder>` only if the owner authorizes filing.

## Proposed epic

### Title

Epic: Enterprise auth

### Body

NetScript should cover enterprise authentication end to end—especially the
Microsoft identity layers—by fully leveraging WorkOS and Better Auth instead of
rebuilding their products or exposing only a fraction of their capabilities.

The target architecture keeps a vendor-neutral NetScript identity/session/policy
kernel while assigning clear responsibilities:

- KV OAuth provides direct OAuth/OIDC, including first-class Entra ID behavior.
- WorkOS provides enterprise SAML/OIDC SSO, administrator onboarding,
  organizations, Directory Sync/SCIM, audit delivery, and optional RBAC/FGA/Vault
  adapters.
- Better Auth provides application-facing authentication modalities and session/
  organization/admin capabilities through its upstream plugin ecosystem.
- NetScript provides truthful capability discovery, multi-backend routing,
  normalization, authorization policy ports, secret references, CLI/scaffold
  configuration, and conformance testing.

This epic deliberately separates config-first leverage from new adapter work.
Every capability must have one lifecycle owner per tenant, especially where
WorkOS and Better Auth overlap in organizations, SSO, or SCIM.

#### Epic acceptance

- [ ] gate: each advertised backend capability has a reachable conformance test
- [ ] gate: direct Entra ID OIDC and brokered Microsoft SAML/OIDC have documented ownership and security boundaries
- [ ] gate: organization, membership, directory, session, and authorization contracts are tenant-safe and fail closed
- [ ] gate: WorkOS and Better Auth capabilities are exposed through configuration/adapters without copying upstream implementations
- [ ] gate: secrets, audit events, and administrative operations meet redaction and lifecycle requirements
- [ ] gate: generated projects can select, configure, mock, and smoke-test supported auth profiles
- [ ] gate: all implementation PRs satisfy CI and the required opposite-family evaluation before merge

#### Proposed child checklist

- [ ] #<S1-placeholder> — truthful backend capability discovery
- [ ] #<S2-placeholder> — direct Microsoft Entra OAuth/OIDC profile
- [ ] #<S3-placeholder> — tenant-aware multi-backend composition
- [ ] #<S4-placeholder> — WorkOS AuthKit/SSO interactive adapter
- [ ] #<S5-placeholder> — WorkOS Organizations/Admin Portal onboarding
- [ ] #<S6-placeholder> — WorkOS Directory Sync/SCIM lifecycle
- [ ] #<S7-placeholder> — enterprise auth audit and WorkOS bridge
- [ ] #<S8-placeholder> — WorkOS RBAC/FGA authorization providers
- [ ] #<S9-placeholder> — secret-reference and rotation lifecycle
- [ ] #<S10-placeholder> — Better Auth plugin schema/migrations
- [ ] #<S11-placeholder> — Better Auth handler/client integration
- [ ] #<S12-placeholder> — curated Better Auth capability profiles
- [ ] #<S13-placeholder> — organization-aware identity/policy contracts
- [ ] #<S14-placeholder> — auth conformance/mocking/scaffold kit

### Draft metadata

- Labels: `type:umbrella`, `area:auth`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Filing note: `epic:enterprise-auth` is not present in the inspected
  `.github/labels.yml`; create/apply it only as part of an owner-ratified filing
  pass. Do not substitute a non-namespaced label.

## Proposed sub-issues

### EA-00

#### Title

[enterprise-auth S1] Make auth capability discovery backend-truthful

#### Body

Part of #<epic-placeholder>

The auth service currently advertises interactive sign-in, OIDC callback, and
multi-backend support without deriving those claims from the active backend.
WorkOS and Better Auth also advertise operations that their adapters reject.
Make the capability contract machine-derived and prove every advertised path.

This is proposed as the only beta-critical issue because false security/runtime
capabilities create a client-visible unsupported-operation path in shipped code.

#### Acceptance

- [ ] gate: capability output is derived from backend ports/operation support rather than a static list
- [ ] gate: KV OAuth advertises only the interactive and lifecycle operations it implements
- [ ] gate: WorkOS and Better Auth do not advertise unsupported interactive or session-mutation operations
- [ ] gate: `multi-backend` is absent until composition is implemented and tested
- [ ] gate: service and CLI tests fail if an advertised operation returns unsupported-operation for a valid request
- [ ] gate: compatibility/versioning behavior for capability consumers is documented

#### Draft metadata

- Labels: `type:fix`, `area:auth`, `area:service`, `priority:p0`,
  `wave:v1`, `epic:enterprise-auth`, `status:triage`
- Milestone: `0.0.1-beta.1`
- Dependencies: none; blocks relying on capability negotiation in all later issues.
- Delivery shape: core/service contract correction, not vendor adapter work.

### EA-01

#### Title

[enterprise-auth S2] Add a first-class Microsoft Entra ID OAuth/OIDC profile

#### Body

Part of #<epic-placeholder>

Turn the existing KV OAuth `azureAd` preset and authorization-code/PKCE flow into
an explicit enterprise Entra profile. Cover tenant authority, supported cloud/
issuer choices, claims and app-role/group mapping, logout, refresh, and
Conditional Access claims-challenge continuation. Document that direct OAuth is
not MSAL parity; add an explicit seam for confidential-client/OBO/downstream API
token acquisition rather than hiding those needs in generic sessions.

#### Acceptance

- [ ] gate: CLI and scaffold select a typed Entra profile without hand-copying a generic issuer configuration
- [ ] gate: tenant, `common`/organization policy, issuer, audience, and supported cloud behavior are validated and documented
- [ ] gate: authorization code uses PKCE/state/nonce and negative callback cases remain covered
- [ ] gate: app roles, groups, group-overage, and stable principal mapping have explicit fail-closed behavior
- [ ] gate: Conditional Access claims challenges produce a structured continuation/reauthentication result without loops
- [ ] gate: confidential-client, OBO, Graph/downstream-token, and cache ownership are either implemented behind a dedicated port or explicitly reported unsupported
- [ ] gate: no documentation describes generic KV OAuth as full MSAL equivalence

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:cli`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-00; policy mapping also feeds EA-12.
- Delivery shape: configuration-first Entra preset, followed by Microsoft-specific
  challenge/token adapter work where required.

### EA-02

#### Title

[enterprise-auth S3] Compose multiple auth backends with tenant-aware routing

#### Body

Part of #<epic-placeholder>

Replace the one-entry runtime backend registry with a composition contract that
can route by organization, domain, connection, provider, or explicit sign-in
choice. Define account linking, session provenance, migration, global logout, and
degraded-provider behavior without allowing ambiguous identities or tenant
crossing.

#### Acceptance

- [ ] gate: multiple configured backends can coexist and routing is deterministic for every request
- [ ] gate: ambiguous domain/provider/account matches fail closed with an actionable diagnostic
- [ ] gate: normalized sessions retain backend, provider, organization, connection, and linked-account provenance
- [ ] gate: account linking requires verified ownership and defends against confused-deputy/account-takeover cases
- [ ] gate: logout and revocation specify local, backend, linked-account, and global scope with partial-failure reporting
- [ ] gate: migration and provider outage scenarios have model-based and integration tests
- [ ] gate: each tenant has one declared lifecycle owner for overlapping WorkOS/Better Auth features

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:service`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-00; establishes composition used by EA-03, EA-05, EA-10, and EA-13.
- Delivery shape: new core/runtime adapter code.

### EA-03

#### Title

[enterprise-auth S4] Complete the WorkOS AuthKit and enterprise SSO interactive adapter

#### Body

Part of #<epic-placeholder>

Extend the WorkOS backend beyond request-session verification. Provide
authorization URL, callback, sealed-session issuance/refresh, logout/revocation,
and connection/organization mapping so WorkOS SAML and OIDC SSO are reachable
through the normalized auth service. Do not reproduce SAML parsing in NetScript.

#### Acceptance

- [ ] gate: WorkOS sign-in, callback, refresh, sign-out, and session inspection are reachable through supported ports
- [ ] gate: SAML and OIDC enterprise connections are represented through WorkOS connection and organization identifiers
- [ ] gate: state, return URL, cookie, CSRF, issuer/audience, and replay controls have negative tests
- [ ] gate: IdP- and service-provider-initiated behavior is documented where supported
- [ ] gate: unsupported WorkOS lifecycle operations are not advertised
- [ ] gate: direct Entra KV OAuth versus WorkOS-brokered Microsoft SSO selection is documented

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `priority:p1`, `epic:enterprise-auth`,
  `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-00; EA-02 for multi-backend/domain routing.
- Delivery shape: new WorkOS interactive adapter code using upstream AuthKit/SSO APIs.

### EA-04

#### Title

[enterprise-auth S5] Expose WorkOS Organizations and Admin Portal onboarding

#### Body

Part of #<epic-placeholder>

Use WorkOS Organizations and Admin Portal for enterprise customer onboarding,
domain/connection setup, and administrator-managed configuration. Normalize the
result into NetScript organization and connection records rather than building a
parallel setup UI first.

#### Acceptance

- [ ] gate: an authorized tenant administrator can launch a scoped Admin Portal session
- [ ] gate: organization, domain, connection, and onboarding state are normalized and queryable
- [ ] gate: portal session creation is tenant-bound, short-lived, authorized, and audited
- [ ] gate: connection/domain changes invalidate or refresh routing data safely
- [ ] gate: CLI/scaffold configuration uses references and environment inputs without exposing WorkOS secrets
- [ ] gate: ownership boundaries with Better Auth organizations are explicit

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:cli`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-12 organization contract; EA-02 for routing integration.
- Delivery shape: config-first WorkOS API integration plus a small organization adapter.

### EA-05

#### Title

[enterprise-auth S6] Integrate WorkOS Directory Sync and SCIM lifecycle

#### Body

Part of #<epic-placeholder>

Use WorkOS Directory Sync as the primary normalized SCIM/directory integration
for enterprise tenants. Project users, groups, memberships, and deprovisioning
events into NetScript with verified, idempotent webhook handling and a
reconciliation path.

#### Acceptance

- [ ] gate: webhook authenticity, timestamp/replay protection, idempotency, ordering, and retry behavior are tested
- [ ] gate: directory users, groups, memberships, and organization ownership have stable normalized identifiers
- [ ] gate: deprovisioning disables access and revokes or marks affected sessions according to explicit policy
- [ ] gate: reconciliation detects missed/out-of-order events without creating duplicate identities
- [ ] gate: group-to-role/policy mapping is tenant-scoped and fails closed on unknown or over-limit data
- [ ] gate: Better Auth organization/SCIM overlap has a single-writer rule and conflict diagnostics
- [ ] gate: lifecycle events are emitted through the enterprise audit envelope

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:database`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-02, EA-12, EA-13; emits through EA-06.
- Delivery shape: new WorkOS Directory Sync adapter, projection storage, and webhook service.

### EA-06

#### Title

[enterprise-auth S7] Define enterprise auth audit events and bridge WorkOS Audit Logs

#### Body

Part of #<epic-placeholder>

Build on the existing auth spans and five durable events to create a stable
enterprise audit envelope. Cover authentication, administration, impersonation,
provisioning, policy decisions, secret rotation, and session lifecycle, then
provide an optional WorkOS Audit Logs/Log Streams bridge.

#### Acceptance

- [ ] gate: event schema defines actor, targets, organization, action, result, source, assurance, request context, and timestamps
- [ ] gate: tokens, credentials, raw secrets, sensitive claims, and unsafe personal data are redacted or irreversibly represented
- [ ] gate: authentication, admin, impersonation, provisioning, policy, secret, and revocation events have versioned contracts
- [ ] gate: retention, query, export, delivery retry, duplicate, and failure semantics are documented
- [ ] gate: WorkOS Audit Logs mapping and Log Streams configuration have integration tests
- [ ] gate: core operation success does not silently depend on audit-provider availability, while audit delivery failures remain observable

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:telemetry`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-12 decision envelope; consumed by EA-04, EA-05, EA-07, and EA-08.
- Delivery shape: core schema plus optional WorkOS adapter; reuses existing telemetry/streams.

### EA-07

#### Title

[enterprise-auth S8] Add WorkOS RBAC/FGA authorization providers

#### Body

Part of #<epic-placeholder>

Turn the WorkOS roles and permissions already present in authenticated claims into
a tenant-safe authorization integration, and add WorkOS FGA as a relationship-
based provider after the NetScript policy port can express subject, resource,
action, organization, and context.

#### Acceptance

- [ ] gate: RBAC decisions distinguish authoritative role/permission data from untrusted arbitrary claims
- [ ] gate: FGA checks map the normalized subject, resource, relation/action, organization, and context without tenant ambiguity
- [ ] gate: cache, consistency, timeout, outage, and fail-closed behavior are explicit and tested
- [ ] gate: policy decisions expose a safe reason/provider/version for audit and diagnostics
- [ ] gate: route guards can delegate to policy without weakening existing fail-closed defaults
- [ ] gate: Entra app roles/groups and WorkOS roles have documented precedence and normalization

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:service`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-12; emits decisions through EA-06.
- Delivery shape: new vendor adapters over the shared policy port.

### EA-08

#### Title

[enterprise-auth S9] Introduce an enterprise auth secret-reference and rotation lifecycle

#### Body

Part of #<epic-placeholder>

Replace auth's assumption that secret values are copied into environment and
appsettings fields with a vendor-neutral secret reference/provider contract.
Support safe bootstrap, lookup, overlap rotation, diagnostics, and audit. Add
WorkOS Vault only as one provider if its product/API availability fits the
supported deployment contract.

#### Acceptance

- [ ] gate: auth configuration can reference a secret without serializing its value into appsettings or CLI output
- [ ] gate: provider API covers read metadata, resolve, rotate/replace, version, and availability without exposing values to diagnostics
- [ ] gate: rotation supports an overlap window and rollback for signing/encryption/client secrets
- [ ] gate: logs, errors, config diffs, generated files, and telemetry redact secret values
- [ ] gate: least-privilege access and secret-access/rotation audit events are documented and tested
- [ ] gate: environment-based local development remains available with explicit production diagnostics
- [ ] gate: any WorkOS Vault adapter is optional behind the vendor-neutral port and capability detection

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:cli`,
  `priority:p1`, `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-06 for audit; can otherwise proceed independently.
- Delivery shape: new core provider contract, CLI/config changes, then optional Vault adapter.

### EA-09

#### Title

[enterprise-auth S10] Generate Better Auth plugin schema and migrations

#### Body

Part of #<epic-placeholder>

Complete R1 of `seamless-auth-roadmap`: inspect the selected Better Auth plugins,
generate or merge their schema requirements, and give users a repeatable migration
path. Remove the assumption that the baseline Prisma schema is sufficient for
2FA, passkeys, organizations, admin, and other plugins.

#### Acceptance

- [ ] gate: selected server plugins contribute their required schema deterministically
- [ ] gate: generated schema/migrations are repeatable, diffable, and detect destructive/conflicting changes before application
- [ ] gate: Prisma ownership is explicit and non-Prisma adapter support is either implemented or diagnosed as unsupported
- [ ] gate: upgrades detect upstream Better Auth schema drift and provide an actionable migration plan
- [ ] gate: representative 2FA, passkey, organization, and admin plugin sets pass database integration tests
- [ ] gate: generated projects do not require an undocumented escape hatch to discover plugin schema

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:database`, `area:cli`,
  `priority:p1`, `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: none; blocks operational Better Auth capability packs in EA-11.
- Delivery shape: new generator/migration adapter code using Better Auth's schema tooling.

### EA-10

#### Title

[enterprise-auth S11] Mount Better Auth interactive handlers and client integration

#### Body

Part of #<epic-placeholder>

Complete R2 of `seamless-auth-roadmap`: mount the upstream Better Auth handler at
a deliberate service path, integrate its client-side plugin requirements into
scaffolds, and reconcile upstream cookie/session semantics with NetScript's
normalized authentication ports. Avoid inventing duplicate sign-in endpoints.

#### Acceptance

- [ ] gate: configured Better Auth endpoints are mounted and reachable under a documented path/base URL
- [ ] gate: origin, CSRF, cookie prefix/domain/path/security, proxy, and trusted-origin behavior have production-safe defaults and negative tests
- [ ] gate: generated clients include the required client plugins for selected server plugins
- [ ] gate: NetScript capability discovery distinguishes upstream-handler operations from normalized port operations
- [ ] gate: session lookup, freshness, renewal, revoke, and sign-out ownership are documented and conformance-tested
- [ ] gate: multi-backend route/path/cookie collisions fail during configuration rather than at runtime

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:service`, `area:cli`,
  `priority:p1`, `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-00; EA-02 for coexistence; EA-09 for plugin-backed profiles.
- Delivery shape: new Better Auth handler adapter and scaffold/client generation.

### EA-11

#### Title

[enterprise-auth S12] Ship curated Better Auth capability profiles

#### Body

Part of #<epic-placeholder>

Turn Better Auth's broad plugin ecosystem into supported, testable NetScript
profiles rather than copying each feature. Initial profiles should cover 2FA,
passkeys, magic link, organizations, admin, API keys/multi-session where selected,
and rate-limit/session hardening. Enterprise SSO/SCIM plugins may be offered as an
alternative lane only with explicit ownership relative to WorkOS.

#### Acceptance

- [ ] gate: profile manifest declares server plugins, client plugins, schema, secrets, routes, environment, and normalized claims/capabilities
- [ ] gate: 2FA, passkey, magic-link, organization, and admin reference profiles pass generated-project smokes
- [ ] gate: recovery, enrollment, impersonation, invitation, revocation, and abuse/rate-limit negative cases are covered where applicable
- [ ] gate: upstream plugins remain the implementation source; NetScript code is configuration, adapters, mappings, and diagnostics
- [ ] gate: plugin compatibility/version diagnostics identify unsupported combinations before runtime
- [ ] gate: WorkOS overlap for SSO, SCIM, organizations, and admin has an explicit per-tenant owner and no dual writes
- [ ] gate: the stale nine-plugin/R0 wording in `seamless-auth-roadmap` is reconciled with shipped passthrough and the live catalog

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:cli`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: EA-09, EA-10, EA-12, EA-13.
- Delivery shape: predominantly config-first capability manifests plus targeted
  principal/session/client adapters.

### EA-12

#### Title

[enterprise-auth S13] Define organization-aware identity and authorization policy contracts

#### Body

Part of #<epic-placeholder>

Add the shared contract that the vendor integrations need: canonical
organization, membership, connection, role/group, assurance, and policy-decision
types, plus an authorization request over subject, organization, resource,
action, and context. Preserve the simple scope/role route guard as an adapter,
not the ceiling of the authorization model.

#### Acceptance

- [ ] gate: identity contract distinguishes user, linked account, organization, membership, backend, provider, and connection identifiers
- [ ] gate: authorization input includes tenant, subject, resource, action/relation, environment context, and assurance/freshness
- [ ] gate: decision includes allow/deny, safe reason, provider, policy/model version, and audit correlation
- [ ] gate: unknown tenants, memberships, claims, policy providers, and timeouts fail closed
- [ ] gate: claim normalization covers Entra app roles/groups, WorkOS roles/permissions, and Better Auth organization roles without conflating sources
- [ ] gate: existing path scope/role guards adapt to the new port without breaking simple applications
- [ ] gate: tenant isolation has model/property tests across storage, cache, routing, and authorization

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:service`, `priority:p1`,
  `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: none; foundational for EA-04 through EA-07 and EA-11.
- Delivery shape: new vendor-neutral core/service contracts and adapters.

### EA-13

#### Title

[enterprise-auth S14] Build an auth conformance, mocking, and scaffold test kit

#### Body

Part of #<epic-placeholder>

Expand the two current object builders into a security-focused test kit used by
all auth backends and generated projects. Include fake OIDC/JWKS behavior, signed
tokens, WorkOS/Better Auth sessions and webhooks, SCIM events, Conditional Access
claims challenges, multi-backend identities, clock/replay controls, and negative
cases.

#### Acceptance

- [ ] gate: every backend runs a shared suite for capability truth, authentication, expiry, refresh, revoke, malformed input, and unsupported operations
- [ ] gate: fake OIDC/JWKS supports rotation, bad issuer/audience/signature, nonce/state/replay, clock skew, refresh reuse, and claims challenges
- [ ] gate: WorkOS session/webhook, Better Auth handler/plugin, and Directory Sync/SCIM fixtures are deterministic and contain no live credentials
- [ ] gate: multi-backend routing, linking, logout, provider outage, and tenant-isolation scenarios are reusable
- [ ] gate: generated-project smoke profiles cover direct Entra, WorkOS enterprise, Better Auth application auth, and selected coexistence
- [ ] gate: docs/examples use the same fixtures and clearly distinguish mocked conformance from live-provider acceptance
- [ ] gate: CI exposes a compact failure matrix by backend, capability, and security invariant

#### Draft metadata

- Labels: `type:feat`, `area:auth`, `area:cli`, `area:tooling`,
  `priority:p1`, `epic:enterprise-auth`, `status:triage`
- Milestone: `Backlog / Triage`
- Dependencies: initial contract follows EA-00 and EA-12; expands alongside every adapter.
- Delivery shape: new shared testing package/fixtures and scaffold E2E profiles.

## Dependency map and proposed phasing

| Phase | Outcome | Issues | Why this order |
|---|---|---|---|
| 0 — truthful beta baseline | Stop promising unsupported auth paths. | EA-00 | Independent, security-relevant, and required before adding capabilities. |
| 1 — shared contracts and config-first reach | Define tenant/policy semantics; expose first-class Entra config; generate Better Auth schema; establish the conformance harness. | EA-01 (configuration portion), EA-09, EA-12, EA-13 (kernel) | Creates the contracts and tests adapters must satisfy while immediately leveraging code already shipped upstream. |
| 2 — interactive and composition | Make multiple lanes reachable: multi-backend routing, WorkOS AuthKit/SSO, Better Auth handler/client. | EA-02, EA-03, EA-10 | Converts today's isolated/authentication-read adapters into usable coexistence paths. |
| 3 — enterprise control plane | Onboarding, provisioning, audit, authorization, and secrets. | EA-04, EA-05, EA-06, EA-07, EA-08 | Builds lifecycle features on stable org/routing/policy/audit contracts. |
| 4 — capability breadth and hardening | Curated Better Auth profiles and expanded live/generated-project matrices. | EA-11, EA-13 expansion, EA-01 Microsoft token/challenge expansion | Broadens upstream leverage after schema, handler, policy, and conformance foundations are real. |

### Config-first leverage versus new adapter code

| Mostly configuration/upstream composition first | Requires a new NetScript adapter or core contract |
|---|---|
| Entra preset exposed through CLI/scaffold; Better Auth `plugins`/options profiles; Better Auth production rate-limit/session options; WorkOS Admin Portal launch/config; upstream MFA/passkey/magic-link/admin plugin selection | Backend-derived capability model; Microsoft claims-challenge/OBO/token seam; multi-backend router/linking; WorkOS interactive flow; Directory Sync projection/webhooks; audit envelope/bridge; policy/FGA provider; secret-reference port; Better Auth schema generator/handler mount; shared org/policy model; conformance kit |

Config-first does not mean “documentation only”: every profile still needs schema,
secret, route, client, claim, and test declarations. New adapters should translate
to vendor-neutral contracts and delegate actual identity functionality to the
upstream provider.

## Board-filing and release stop-lines

These are planning constraints, not draft issue acceptance:

1. Merge requires CI green plus opposite-family evaluation PASS on the PR. The
   standing beta-11 merge authorization applies only after that bar is met.
2. Stop before any `release:cut`, JSR publish, tag push, canary, or stable publish;
   release requires fresh owner sign-off in-turn.
3. Stop before closing milestone 13; that requires owner sign-off.
4. Any later sub-agent brief must repeat these stop-lines verbatim to be valid.
5. The #824 seed run remains drafts-only until owner ratification, and board
   filing requires the owner in-turn.

No GitHub issue, epic, label, milestone, PR, or release action is authorized by
this draft.
