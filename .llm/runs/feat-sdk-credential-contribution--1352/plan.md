# Plan: typed bearer credential contribution (#1352)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-sdk-credential-contribution--1352` |
| Branch | `feat/sdk-credential-contribution` |
| Phase | `implement` |
| Target | `packages/plugin-auth-core`, `packages/plugin`, `plugins/auth`, focused docs |
| Archetype | 2 Integration + 4 Public DSL/Builder + 5 Plugin Package |
| Scope overlays | service contract/client guidance; no local runtime gate |

## Archetype

`plugin-auth-core` remains an Archetype 2 integration package consuming the SDK port; `plugin`
remains the Archetype 4 manifest builder; `plugins/auth` remains thin Archetype 5 glue. SDK is also
Archetype 2 on current doctrine and service remains Archetype 4, but their source is intentionally
unchanged in S5.

## Current Doctrine Verdict

`plugin-auth-core`, `plugin`, SDK, and `plugins/auth` are Keep. `service` is Refactor for pre-existing
builder-role debt that this slice must not deepen or edit.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | The typed factory, reference record, and explicit starter shape precede implementation. |
| A7 | URL, Headers, WebCrypto, and typed callbacks are sufficient; no ambient runtime helper. |
| A10/A11 | Bearer credential preparation and SDK-client reference are named extension axes composed explicitly. |
| A14 | Runtime, non-disclosure, surface, JSR, and lock gates preserve the contract. |

## Goal

Land the locked S5 bearer contribution and declarative auth-plugin availability contract through
the shipped SDK contribution seam, without rebuilding or widening that seam.

## Scope

- Public `@netscript/plugin-auth-core/sdk` bearer factory with metadata, cleartext, and cache laws.
- Auth-contract access metadata.
- Declarative SDK-client reference type, builder/merge support, and exports.
- Auth manifest reference plus an emitted but explicitly selected starter contribution.
- Focused tests and the two planned documentation pages/README updates.

## Non-Scope

- SDK/client-link/service implementation edits; upstream interceptor arrays; ambient credential
  discovery; CLI raw-fetch migration; S6 trace ownership; S7 locale; local runtime/Aspire/Docker/
  browser/e2e execution.

## Hidden Scope

- Runtime-generated credential non-disclosure assertions cover errors, console/stderr, spans,
  request URLs, cache partitions, manifest references, and starter artifacts using boolean/count
  observations only.
- The required scoped run artifacts do not count against the locked 27 implementation-file ceiling;
  the product/docs touch set does.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| S5-1 | Use the RFC factory signature and fixed id/header/protocol. | Preserves the stable seam and caller inference. |
| S5-2 | Unmarked defaults to `none`; resolver is skipped for `none`. | Installing auth cannot leak credentials to existing procedures. |
| S5-3 | Reject credential-bearing non-local cleartext unless explicitly allowed. | Browser-safe development without silent production downgrade. |
| S5-4 | Require caller-selected `partitioned` or `direct-only` cache behavior. | Tokens never become cache keys; unsafe caching is omitted. |
| S5-5 | Plugin manifests contain references only and never auto-activate. | Availability and application selection remain distinct. |
| S5-6 | Use `Refs #1352`; leave closure and remote `scaffold.runtime` to the supervisor. | Required partial-delivery and close-gate contract. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| CLI auth-session migration | safe to defer | Explicit URLs are not modeled by the public SDK transport. |
| Remote `scaffold.runtime` | safe to defer | Required at merge readiness in authorized CI/OpenHands, prohibited locally here. |
| S6/S7 header callback work | safe to defer | Ordered follow-on slices; S5 must not edit their shared SDK file. |

PLAN-EVAL: N/A — the owner supplied a locked, exact S5 contract, ordered touch set, risk policy,
acceptance evidence, and gate list; no architecture or rework-forcing decision remains open.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Credential appears in diagnostics or generated source | Runtime-generated values; boolean/count-only assertions over every required channel. |
| Auth attaches to public/unmarked procedure | Metadata tri-state tests; unmarked defaults to `none`; resolver-call count asserted. |
| Unsafe cleartext emission | Parsed-host loopback allowlist plus explicit opt-in test. |
| Cache cross-principal leak | Explicit non-secret partition or `direct-only`; factory never derives a partition. |
| Public SDK internals leak | No SDK source/export edits; existing #1886 tripwires retained and rerun through focused SDK tests. |
| Lock or doc baseline moves | Exact hash and A/B diagnostic deltas recorded; no lock churn accepted. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11/AP-25 | risk | Universal auth-core SDK module performs no ambient/global IO. |
| AP-13 | risk | No console output in published code; tests capture and inspect output. |
| AP-14 | risk | Export only NetScript-owned factory/reference types, not upstream oRPC types. |
| AP-18 | risk | Assert semantic fields and leak booleans, not generated-string snapshots. |
| AP-23 | risk | Auth plugin wires named reference/resource; no inline host activation. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-14/F-15/F-16/F-18/F-19 | yes | `quality:gate`, scoped wrappers, focused manual review |
| F-6/F-7 | yes | JSR audits, publish dry-runs, `deno doc`, doc-lint A/B |
| Consumer imports | yes | auth-core SDK subpath and plugin config/SDK export probes |

## Arch-Debt Implications

No new debt is planned. Existing plugin module-tag/cardinality, auth documentation, and service
Refactor entries remain pre-existing and must not be deepened.

## Validation Plan

Run the focused contract/bearer/plugin tests, structured check/test/lint/fmt wrappers for every
changed publishable root plus the owner-requested SDK/service roots, quality/architecture gates,
JSR audits, per-package publish dry-runs, public `deno doc` probes, doc-lint A/B, `git diff --check`,
touch-count, forbidden-export assertions, and exact lock hash. Do not run a local runtime, browser,
Aspire, Docker, or `e2e:cli` command.

## Dependencies

- #1349 contribution seam, #1351 transport consolidation, and #1886 acceptance tripwires are
  present on the re-baselined `main`.

## Drift Watch

- Any SDK adapter/client-link/service implementation edit, file outside the locked set, 28th
  implementation file, lock mutation, new doc diagnostic, or need for ambient credential storage.
