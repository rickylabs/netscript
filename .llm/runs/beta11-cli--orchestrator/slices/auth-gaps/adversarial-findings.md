# Adversarial review — enterprise auth epic drafts (Fable 5 · medium)

> Review-only artifact for run `beta11-cli--orchestrator`, slice `auth-gaps`.
> Inputs: `research.md`, `epic-and-issues.md` (DRAFT ONLY), the 28-agent verified
> research synthesis (22 verified / 2 failed claims), and the live auth surface in
> this worktree. No GitHub objects were created or changed. Stop-lines in the
> brief remain in force verbatim.

## Overall verdict: PASS (0 blockers, 5 major, 7 minor)

The drafts are well-grounded: every repository claim spot-checked reproduces in
source, no quarantined (FAILED) synthesis claim is built upon, and the
lane-ownership architecture (KV OAuth direct / WorkOS broker / Better Auth
application lane / NetScript composition) matches the independently verified
matrix. Failures are of coverage, not truthfulness: machine/agent auth, Entra
multi-tenant admin consent + B2B guest, and outbound-IdP are absent or thin.

## Verdict per issue

| Item | Verdict | Rationale |
|---|---|---|
| Epic body | **AMEND** | Add missing children (F1, F2); otherwise sound. |
| EA-00 capability truthfulness | **KEEP** | Defect confirmed in code (see spot-check C1); correctly the only beta-critical item. |
| EA-01 Entra profile | **AMEND** | Missing multi-tenant admin-consent/issuer-`tid` validation and B2B guest scope (F2); add CA licensing caveat (F8); CAE phasing note (F9). |
| EA-02 multi-backend composition | **KEEP** | Matches verified single-entry registry gap. |
| EA-03 WorkOS AuthKit/SSO adapter | **KEEP** | Correctly delegates SAML termination to WorkOS. |
| EA-04 Organizations/Admin Portal | **AMEND** | Generalize to a per-tenant "connection setup" surface spanning all three lanes (F6). |
| EA-05 Directory Sync/SCIM | **AMEND** | Add "automatic, not real-time" language guard (F5) and a shared event-sync/webhook seam with EA-06 (F4). |
| EA-06 audit envelope + WorkOS bridge | **KEEP** | Matches synthesis conclusion 7 (WorkOS as enterprise sink, framework contract first). |
| EA-07 RBAC/FGA providers | **KEEP** | Portable-roles-not-raw-groups design matches verified guidance. |
| EA-08 secret references | **KEEP** | Vault correctly hedged as optional provider behind neutral port. |
| EA-09 Better Auth schema generation | **KEEP** | R1 of verified `seamless-auth-roadmap`; base-schema-only claim confirmed (4 models in `auth.prisma`). |
| EA-10 Better Auth handler mount | **KEEP** | R2; handler-not-mounted claim consistent with source. |
| EA-11 curated Better Auth profiles | **AMEND** | Note self-service SSO dashboard is hosted-offering-only (F7); WorkOS MFA API-surface split caveat if MFA wiring lands here (F3). |
| EA-12 org/policy contracts | **KEEP** | Foundational; matches "framework-native role map" conclusion. |
| EA-13 conformance/mocking kit | **KEEP** | Two-builder baseline confirmed; scope right. |
| Machine/agent/CLI auth | **MISSING-add** | F1. |
| Outbound IdP (NetScript-as-IdP) | **MISSING-add** (backlog-grade) | F2b under F1/F2 discussion; may be a deferred child. |

## Numbered findings

1. **[major] Machine/agent/CLI authentication is uncovered.** The synthesis
   matrix has a "Machine / agent / CLI auth" row (Entra client-credentials;
   WorkOS API Keys / CLI device flow / Agent Auth / MCP; Better Auth api-key /
   device-authorization-grant / MCP / JWT-Bearer plugins), and NetScript ships
   `@netscript/mcp` — yet no EA issue owns service-to-service, CLI device-flow,
   or agent auth. EA-11 only glances at "API keys/multi-session where selected".
   Add a child issue (or explicit EA-11/EA-12 scope) for machine identities,
   including the verified caveat that Entra service principals in a group holding
   an app role do **not** receive the `roles` claim.
2. **[major] Entra multi-tenant onboarding, admin consent, and B2B guest are
   absent.** The owner mandate names B2B guest explicitly; the synthesis matrix
   has a verified "Multi-tenant onboarding / admin consent" row (`/common` vs
   `/organizations`, per-tenant issuer validation where `iss` must contain
   `tid`, `prompt=consent`, service-principal creation, app-only permissions
   always needing admin consent). Neither `research.md` §2 nor EA-01 covers admin
   consent, guest (`#EXT#`) principal normalization, or a consent-URL runbook.
   Amend EA-01 (and EA-12 claim normalization) to include these. Outbound-IdP
   ("Being the IdP": WorkOS Connect / Better Auth OAuth 2.1 Provider) is likewise
   an uncovered matrix row — acceptable to defer, but the epic should say so
   deliberately.
3. **[major] WorkOS MFA is unowned and the drafts do not carry the quarantined
   MFA caveat.** Research §3 marks MFA "Missing as a NetScript contract" but no
   EA issue picks it up, and the synthesis FAILED claim #2 (AuthKit MFA reference
   is enroll/list, TOTP-only; challenge create/verify + SMS live in the separate
   standalone MFA API) is not recorded anywhere in the drafts. Any future MFA
   slice cut from these drafts risks designing against a merged API that does
   not exist. Add the constraint verbatim to whichever issue inherits MFA
   (EA-03 or a new child).
4. **[major] The single highest-leverage module in the synthesis — a shared
   idempotent event-sync/webhook consumer — is fragmented.** Synthesis
   conclusion 6 (verified via WorkOS events/data-syncing doctrine and Better
   Auth database hooks) says one event-consumer abstraction unlocks Directory
   Sync, audit emission, and role sync. The drafts re-specify webhook
   verification/idempotency separately in EA-05 and delivery semantics in EA-06
   with no shared contract. Amend EA-05/EA-06 to name a common events/webhook
   infrastructure seam (or add it to EA-12's contracts).
5. **[minor] "Real-time" guard should be explicit.** The drafts correctly avoid
   the FAILED "real-time Directory Sync" claim, but nothing prevents a later
   slice from reintroducing it. Add to EA-05: latency language must say
   "automatic", never "real-time", per the quarantined verdict.
6. **[minor] Per-tenant connection-setup surface is WorkOS-only.** Synthesis
   conclusion 5: onboarding ergonomics differ per lane (Admin Portal one-endpoint;
   Better Auth dashboard hosted-only; direct Entra needs a consent/claims/SCIM
   runbook). EA-04 models only the WorkOS case. Generalize the normalized
   "connection setup" record so all three lanes populate it.
7. **[minor] Better Auth self-service SSO dashboard caveat missing.** Verified:
   the self-service SSO registration dashboard is part of the hosted Better Auth
   Infrastructure offering, not the OSS plugin. EA-11's "alternative lane" for
   enterprise SSO/SCIM must state that OSS deployments need their own per-tenant
   registration UX.
8. **[minor] Conditional Access licensing nuance absent.** Verified caveat:
   baseline CA is Entra ID P1 but risk-based policies require P2 (Entra ID
   Protection). EA-01's CA gates should not let docs market "risk enforcement
   under P1".
9. **[minor] EA-01 makes claims-challenge continuation a hard gate; synthesis
   ranks CAE a differentiator, not table stakes.** Not a contradiction (basic
   CA compliance is code-free; the challenge continuation matters for long-lived
   tokens), but the phasing table already defers "Microsoft token/challenge
   expansion" to phase 4 while EA-01's acceptance implies phase 1. Align the
   gate with the phasing or split it.
10. **[minor] AD FS row is safe but should ban the unverified transparency
    claim.** The drafts correctly refuse to build AD FS support; the synthesis
    flags "AD FS tenants surface transparently via domain_hint" as an author
    inference. Add a doc-guard: do not cite that mechanism until independently
    confirmed.
11. **[minor] Group-claim caps are cited generically.** The verified numbers
    (150 SAML / 200 JWT including nested) would sharpen EA-01's group-overage
    gate; currently only "over-limit data" appears (EA-05) and "group-overage"
    (EA-01) without the caps.
12. **[minor] Stale-debt reconciliation is buried in EA-11.** The confirmed-stale
    "all 9 better-auth plugins … only via undocumented escape hatch" wording
    (`.llm/harness/debt/arch-debt.md:1240`; R0 passthrough now shipped in
    `packages/auth-better-auth/src/better-auth.ts`) is reconciled only as the
    last EA-11 gate, four dependency hops deep. Reconcile the debt record during
    epic filing instead, so no interim slice plans against stale truth.

## Capability-claim spot-checks (10 load-bearing claims)

| # | Claim (draft) | Verdict | Evidence |
|---|---|---|---|
| C1 | Auth service statically advertises `interactive-signin`, `oidc-callback`, `multi-backend` | **VERIFIED** | `plugins/auth/services/src/routers/v1-handlers.ts:54-65` — static `authCapabilities` literal includes all three unconditionally. |
| C2 | WorkOS backend mutations throw `AuthBackendOperationUnsupportedError` | **VERIFIED** | `packages/auth-workos/src/workos-backend.ts:10,218-219` constructs/exports the error. |
| C3 | Better Auth `plugins` + `betterAuthOptions` passthrough shipped (R0 done, debt wording stale) | **VERIFIED** | `packages/auth-better-auth/src/better-auth.ts:53-68` typed `plugins` and `betterAuthOptions` fields; stale wording confirmed at `.llm/harness/debt/arch-debt.md:1240`. |
| C4 | KV OAuth ships an `azureAd` preset | **VERIFIED** | `packages/auth-kv-oauth/src/providers.ts:256,360`. |
| C5 | Runtime backend registry holds exactly one entry | **VERIFIED** | `plugins/auth/services/src/backend-registry.ts` — `new Map([[activeName, backend]])`. |
| C6 | Core testing exports only `buildAuthUser`/`buildAuthSession` (+ re-exports) | **VERIFIED** | `packages/plugin-auth-core/src/testing/mod.ts:19,32` — two builders only. |
| C7 | Durable stream defines exactly five auth events | **VERIFIED** | `packages/plugin-auth-core/src/streams/mod.ts:22-32` — signin started/failed, token refreshed, session revoked, oidc completed. |
| C8 | Scaffold Prisma schema has baseline tables only | **VERIFIED** | `plugins/auth/database/auth.prisma` — 4 models: User, Session, Account, Verification. |
| C9 | CLI auth verbs (backend set/show, provider set, secret generate, session list/revoke) shipped by #709 | **VERIFIED** | `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts:25-110`. |
| C10 | WorkOS product surfaces cited (SSO, Directory Sync, Admin Portal, Audit Logs/Log Streams, RBAC, FGA) and Better Auth surfaces (50+ plugins, organization, admin, 2FA, passkey, SCIM, session mgmt, rate limit) | **VERIFIED** (via the 22 adversarially verified synthesis claims against live vendor docs) | Synthesis §1/§2; every vendor citation in the drafts maps to a verified claim; the two FAILED claims (real-time DSync, merged AuthKit MFA API) are **not asserted** in the drafts. Vault is appropriately hedged as a procurement/config concern (UNVERIFIED beyond product-page existence — the drafts already treat it that way). |

No claim was CONTRADICTED.

## Coverage-matrix deltas vs the workflow synthesis

Covered by drafts and matrix alike: OIDC SSO (direct Entra via KV OAuth), SAML
SP (WorkOS broker; Better Auth SAML acknowledged as alternative lane), SCIM
(WorkOS DSync primary, Better Auth SCIM alternative with single-writer rule),
groups/roles→portable role model, Conditional Access, audit/SIEM, AD FS
(deliberately not built), onboarding (WorkOS Admin Portal).

Deltas (matrix rows/conclusions absent or thin in drafts):

- **Machine/agent/CLI auth** — absent (F1).
- **Multi-tenant admin consent + B2B guest** — absent (F2).
- **Being the IdP (outbound)** — absent; defer explicitly (F2).
- **WorkOS MFA API-surface split** — quarantine caveat not carried (F3).
- **Shared event-sync adapter as one module** — fragmented (F4).
- **Per-tenant connection-setup surface across all three lanes** — WorkOS-only (F6).
- **Pricing/deployment default** (Better Auth self-hosted default, WorkOS
  per-connection escape hatch, no feature-gated WorkOS tiers) — economics not
  stated in the epic; harmless, but the phasing rationale would be stronger with
  it (informational, no finding).

## Final verdict

**PASS.** Zero blockers. The drafts are truthful and architecturally aligned
with independently verified evidence; apply the AMEND items (notably F1-F4)
before owner ratification and board filing. All stop-lines respected: no merges,
no release actions, no milestone changes, no GitHub board objects touched.
