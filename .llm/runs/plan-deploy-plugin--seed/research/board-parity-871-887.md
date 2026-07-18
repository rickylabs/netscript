# Enterprise-auth board (#871–#887) — pattern-parity digest

Source: read-only GitHub API sweep of `rickylabs/netscript` issues #871–#887, 2026-07-18 (Opus 4.8
research sub-agent, this run). All 17 are open issues (no PRs in range), authored by the owner,
created 2026-07-18 in one filing burst. Citations are issue numbers; GitHub is the source of truth.

## 1. Per-issue table

| # | Role | Title | Labels (namespaced) | Milestone | One-line scope |
|---|------|-------|---------------------|-----------|----------------|
| **871** | **EPIC** | Epic: Enterprise auth | `type:umbrella` `area:auth` `priority:p1` `status:triage` `epic:enterprise-auth` | Backlog / Triage | Umbrella: vendor-neutral identity/session/policy kernel leveraging KV OAuth + WorkOS + Better Auth; 16 children. |
| 872 | S1 / EA-00 | Make auth capability discovery backend-truthful | `type:fix` `area:auth` `area:service` `wave:v1` `priority:p0` `status:triage` | **none** | Derive advertised capabilities from backend ports, not a static list; kill false unsupported-op paths. Only beta-critical. |
| 873 | S2 / EA-01 | First-class Microsoft Entra ID OAuth/OIDC profile | `type:feat` `area:auth` `area:cli` `priority:p1` `status:triage` | Backlog / Triage | Typed Entra preset: tenant authority, tid/claims/app-roles, consent, B2B guests; explicit "not MSAL parity". |
| 874 | S3 / EA-02 | Compose multiple auth backends with tenant-aware routing | `type:feat` `area:auth` `area:service` `priority:p1` `status:triage` | Backlog / Triage | Deterministic org/domain/connection routing; account linking, provenance. |
| 875 | S4 / EA-03 | Complete WorkOS AuthKit + enterprise SSO interactive adapter | `type:feat` `area:auth` `priority:p1` `status:triage` | Backlog / Triage | WorkOS sign-in/callback/refresh/logout + SAML/OIDC connections. |
| 876 | S5 / EA-04 | Normalize per-tenant enterprise connection setup | `type:feat` `area:auth` `area:cli` `priority:p1` `status:triage` | Backlog / Triage | One normalized connection-setup record across providers. |
| 877 | S6 / EA-05 | Integrate WorkOS Directory Sync and SCIM lifecycle | `type:feat` `area:auth` `area:database` `priority:p1` `status:triage` | Backlog / Triage | Directory/SCIM projection via shared event-sync consumer; "automatic" not "real-time". |
| 878 | S7 / EA-06 | Enterprise audit events + bridge WorkOS Audit Logs | `type:feat` `area:auth` `area:telemetry` `priority:p1` `status:triage` | Backlog / Triage | Stable audit envelope + optional provider bridge. |
| 879 | S8 / EA-07 | Add WorkOS RBAC/FGA authorization providers | `type:feat` `area:auth` `area:service` `priority:p1` `status:triage` | Backlog / Triage | RBAC from authoritative claims + FGA relationship provider over the shared policy port. |
| 880 | S9 / EA-08 | Enterprise auth secret-reference and rotation lifecycle | `type:feat` `area:auth` `area:cli` `priority:p1` `status:triage` | Backlog / Triage | Vendor-neutral secret reference/rotation contract (overlap window, redaction). |
| 881 | S10 / EA-09 | Generate Better Auth plugin schema and migrations | `type:feat` `area:auth` `area:cli` `area:database` `priority:p1` `status:triage` | Backlog / Triage | Deterministic per-plugin schema/migration generation; drift detection. |
| 882 | S11 / EA-10 | Mount Better Auth interactive handlers + client integration | `type:feat` `area:auth` `area:cli` `area:service` `priority:p1` `status:triage` | Backlog / Triage | Mount upstream handler at a deliberate path; reconcile cookies/sessions. |
| 883 | S12 / EA-11 | Ship curated Better Auth capability profiles | `type:feat` `area:auth` `area:cli` `priority:p1` `status:triage` | Backlog / Triage | 2FA/passkey/magic-link/org/admin profiles as config manifests. |
| 884 | S13 / EA-12 | Organization-aware identity + authorization policy contracts | `type:feat` `area:auth` `area:service` `priority:p1` `status:triage` | Backlog / Triage | Canonical org/membership/connection/role + authz request contracts. Foundational. |
| 885 | S14 / EA-13 | Auth conformance, mocking, and scaffold test kit | `type:feat` `area:auth` `area:cli` `area:tooling` `priority:p1` `status:triage` | Backlog / Triage | Shared security test kit: fake OIDC/JWKS, fixtures, multi-backend, scaffold E2E smokes. |
| 886 | S15 / EA-14 | Authenticate machines, agents, CLIs, and MCP clients | `type:feat` `area:auth` `area:service` `area:cli` `area:ai-core` `priority:p1` `status:triage` | Backlog / Triage | Non-browser identity lane: client-creds, M2M, device flow, API keys, MCP. |
| 887 | S16 / EA-15 | Define outbound NetScript-as-IdP support | `type:feat` `area:auth` `area:service` `priority:p2` `status:triage` | Backlog / Triage | Deferred, RFC-first; no custom auth server. |

`epic:` = `epic:enterprise-auth` on every row.

## 2. Board shape

- Exactly **one epic** (#871, `type:umbrella`), flat one level deep — 16 sub-issues, no nested
  epics. Children tracked as a Markdown checklist under `## Children` (not GitHub-native
  sub-issues); each child links back via prose `Part of #871`.
- **Two identifier schemes run in parallel**: titles use S1–S16; body `## Metadata` uses EA-00–EA-15
  (zero-indexed, off by one). Consistent but a readability hazard.
- **Phasing is a dependency DAG, not waves.** Encoded in the `Dependencies:` metadata line, rooted
  at ~four zero-dependency foundations: EA-00 capability truth, EA-12 identity+authz contracts,
  EA-09 Better Auth schema, EA-08 secrets. EA-02 composition sits one layer up, feeding vendor
  adapters.
- **Issue archetypes**: vendor-neutral core/contract (S1, S3, S9, S13) — the "kernel"; per-provider
  adapters (S2, S4, S6, S7, S8, S10–S12); scaffold/CLI story (`area:cli` recurring; S5 dedicated);
  a single shared test kit (S14) that "expands alongside every adapter"; cross-cutting new lane
  (S15); deliberately deferred RFC (S16, the only p2).
- Exactly one **p0** (S1, also the only `wave:v1` — and anomalously the only issue with **no
  milestone**); everything else p1 except S16 (p2). All in `status:triage`, milestone
  Backlog / Triage.
- **Area labels double as package routing** (`area:service`, `area:database`, `area:telemetry`,
  `area:tooling`, `area:cli`, `area:ai-core`).

## 3. Body conventions (recurring template)

1. `Part of #871` as the literal first line — reference, never a closing keyword.
2. One scoping paragraph (3–8 lines): what exists, what to leverage upstream, and an explicit
   **anti-scope boundary** ("do not reproduce SAML parsing", "not MSAL parity", "automatic, never
   real-time", "normalize configuration and policy, not implement another authorization server").
3. `## Acceptance` — every item phrased `- [ ] gate: <declarative assertion>`. Gates are testable
   invariants, not tasks. Recurring themes: fail closed; tenant-safe; redaction of
   secrets/tokens/PII; negative tests (replay, bad issuer/audience, malformed input); unsupported
   ops not advertised; single lifecycle owner per overlapping provider surface. No shell commands —
   predicates the conformance kit (S14) mechanizes.
4. `## Metadata` with exactly two lines: `Dependencies:` (EA-NN topological ordering +
   co-ownership notes) and `Delivery shape:` (the core-vs-adapter split stated per issue, e.g.
   "core/service contract correction, not vendor adapter work"; "new WorkOS interactive adapter
   code using upstream AuthKit/SSO APIs").

Epic body adds `## Epic acceptance` (nine cross-cutting `- [ ] gate:` invariants, including "all
implementation PRs satisfy CI and the required opposite-family evaluation before merge") and
`## Children`.

## 4. Decomposition lessons for the deploy board

Mirror:

1. One umbrella epic (`type:umbrella` + new `epic:deploy` + an `area:` route), body = epic
   acceptance gates + children checklist; never a closing keyword on it.
2. Uniform child template: `Part of #<epic>` → scoping paragraph with explicit anti-scope boundary
   ("do not reimplement the provider's CLI/API") → `## Acceptance` as `- [ ] gate:` predicates →
   `## Metadata` with `Dependencies:` + `Delivery shape:`.
3. Lead with a vendor-neutral core-contract issue (S1+S13 analogue): deploy target/descriptor/
   capability-discovery contract, backend-truthful, fail-closed. Make the correctness-critical
   slice p0 and (unlike auth) milestone it.
4. One issue per deploy target/adapter, each `Delivery shape: adapter over the shared deploy port
   using upstream tooling; provider remains the implementation source`.
5. A dedicated scaffold-story issue (`area:cli`): select, configure, mock, smoke-test a deploy
   profile.
6. A migration/rollout-lifecycle issue (S10 analogue): deterministic, diffable, destructive-change
   detection; overlap-window + rollback gates.
7. A secrets/config-reference issue (S9 clone): credentials referenced not serialized; redaction
   across logs, generated files, diffs, telemetry.
8. An audit/telemetry issue (S7 clone): versioned deploy events through a shared event seam; core
   success must not silently depend on the audit provider.
9. A single shared conformance + mock + scaffold-E2E test-kit issue (S14 clone), ending in a CI
   failure matrix by target × capability × invariant.
10. Encode phasing in `Dependencies:` DAG, rooted at the core contract + capability-truth issues.
11. State the core-vs-adapter lane in every `Delivery shape:` line.
12. Carve deferred scope into a `priority:p2` RFC-first backlog issue.

Do differently:

13. **Single identifier scheme** (auth's S-vs-EA off-by-one is a standing decode tax) — use `DP-N`
    in both titles and cross-references.
14. **Milestone every child at creation, especially the p0** (auth's sole p0 is the only
    unmilestoned issue).
15. Apply `wave:` labels consistently or not at all.
16. Move scoped children out of `status:triage` (exactly one `status:` each; ready → ready).
17. Prefer GitHub-native sub-issues for automatic rollup.
18. Right-size the provider matrix — collapse adapters where one suffices rather than mechanically
    reproducing 16 slices.
