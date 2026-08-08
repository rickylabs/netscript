# Plan: production command composition kit RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-rfc-command-composition-kit--rfc` |
| Branch | `docs/rfc-command-composition-kit` |
| Phase | `research` |
| Target | `rfcs/0000-command-composition-kit.md` plus harness evidence |
| Archetype | Documentation overlay describing Archetypes 1, 2, 3, 4, 5, and 6 implementation surfaces |
| Scope overlays | `SCOPE-docs`, `SCOPE-service` |

## Archetype

This PR changes docs only, so `SCOPE-docs` is the active delivery profile. The RFC nevertheless
specifies a future cross-package seam: Archetype 4 is the primary public DSL shape (`@netscript/service`),
Archetype 2 covers database/telemetry ports and adapters, Archetype 1 covers receipt/schema
contracts, Archetype 3 covers the outbox relay and worker/saga delivery boundary, Archetype 5 covers
thin plugin adoption, and Archetype 6 covers explicit scaffold generators. The final plan will map
each staged implementation issue to one owning archetype rather than treating one package as all six.

## Current Doctrine Verdict

- `@netscript/service` (Archetype 4): **Refactor** — presets/assets clarity.
- `@netscript/database` (Archetype 2): **Refactor** — ports naming and a single composition root.
- `@netscript/telemetry` (Archetype 2): **Refactor** — confirm port/adapter split and OTEL subpath.
- `@netscript/workers` (Archetype 3): **Restructure**; `@netscript/sagas` (Archetype 3): **Refactor**.
- `@netscript/contracts` (Archetype 4): **Keep** with export/folder review.
- `plugins/*` (Archetype 5) remain thin consumers; `@netscript/cli` (Archetype 6) is **Restructure**.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1–A3 | Public contracts and the guide example must precede implementation and keep the 80% path coherent. |
| A6–A7 | Canonical request hashing must use Web Crypto/Web Platform primitives, not a vague helper. |
| A9–A11 | Ownership, package archetype, composition root, and store/relay extension axes must be explicit. |
| A12–A13 | The relay handoff, at-least-once delivery, crash boundaries, and saga refusal line must be honest. |
| A14 | Adapter conformance, injected failures, docs, and public-surface checks are part of the design. |

## Goal

Publish an implementable, domain-neutral RFC for one-store command composition that commits business
state, replay receipt, audit record, and outbox messages in one supported transaction, while refusing
cross-store atomicity and exactly-once delivery claims.

## Scope

- Re-baseline the proposal against current code, exports, tests, live issues/PRs, and primary store/runtime docs.
- Lock exact TypeScript contracts, semantic laws, adapter capability claims, error and telemetry vocabulary.
- Specify conformance/failure-injection tests, compatibility, staged implementation, docs/scaffold impacts, and issue decomposition.
- Maintain a draft PR and complete harness evidence; leave evaluation to the root orchestrator.

## Non-Scope

- No framework, package, plugin, generated-project, schema, or workflow implementation.
- No billing-domain vocabulary, distributed transaction coordinator, event-sourcing platform, ORM, or exactly-once claim.
- No RFC number assignment, merge, issue creation/closure, or milestone mutation.

## Hidden Scope

- Receipt schema ownership and migrations; canonical byte-level request hashing; actor/correlation privacy.
- Isolation and retry interaction; typed errors; OTEL cardinality/redaction; adapter refusal semantics.
- Relay lease/ack/retry behavior and the exact transition from local command to saga.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L0 | This PR is a ratification document only and changes no product code. | Issue #1361 and the owner brief make implementation a separate later issue. |
| L1 | The claim ceiling is one transaction on one store; cross-store atomicity is refused. | Prevents distributed-transaction and exactly-once fiction. |
| L2 | Business state, receipt, audit, and outbox rows are atomic only when one adapter transaction can write all four. | The public seam must expose capability rather than simulate missing guarantees. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Public package/subpath home and exact API shape | must resolve now | Re-baseline package dependencies and exports first. |
| Receipt ownership/schema generation and canonical hash bytes | must resolve now | Deferral would force adapter and migration rework. |
| Capabilities, isolation, typed failures, telemetry vocabulary | must resolve now | These define conformance and caller behavior. |
| FCP policy choices that do not invalidate the contract core | safe to defer | Must be listed explicitly in the final RFC. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Proposal overstates current APIs or adapter guarantees. | Verify each claim against `origin/main`, `deno doc`, focused tests, and primary adapter docs. |
| A convenient API hides transaction-client coupling or two-store impossibility. | Publish capabilities and refusal errors; include negative conformance cases. |
| Receipt/hash or OTEL design leaks sensitive/high-cardinality data. | Define canonicalization, keyed identities, redaction, and allowed attribute values explicitly. |
| RFC grows into a workflow/ORM framework. | Keep handler effects inside one transaction and hand durable multi-step work to outbox + workers/sagas. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-3 | risk | Keep the unit-of-work port capability-scoped, not a backend god interface. |
| AP-8/AP-9 | risk | No DI container or speculative distributed abstraction. |
| AP-11/AP-12 | risk | Require injected transaction/store/clock/telemetry dependencies and no hidden globals. |
| AP-14 | risk | Do not re-export Prisma, KV, OTEL, or hashing libraries. |
| AP-19 | risk | Specify permissions and data handling for adapters/relay. |
| AP-24 | risk | Adapter selection is a typed registry/composition decision, not command-internal switching. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| SCOPE-docs source alignment, scope separation, links, terminology | yes | Changed-file audit plus repo-native docs/link checks. |
| F-5 public-surface/JSR design audit | design-time | `deno doc` and export-map evidence for every proposed owner. |
| F-6/F-7 publish consequences | design-time | JSR audit recorded; no package mutation in this PR. |
| F-13 runtime invariants | design-time | Relay/saga laws and injected-failure conformance plan. |
| CLI/scaffold consumer gate | design-time | Current generator analysis; implementation gate deferred to #1363. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing package verdict/debt entries | none in RFC PR | Cite constraints; do not deepen or close package debt without code. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RFC structure/source alignment | Manual template/RFC-process audit plus focused `rg` checks | Required sections, no billing vocabulary, no product changes. |
| 2 | Local links | `deno task docs:links` when applicable plus direct path checks | Exit 0 / every referenced local path exists. |
| 3 | Markdown format | Repo-native formatting check scoped to owned Markdown | Exit 0. |
| 4 | API accuracy | `deno doc`/`--filter` on affected public entrypoints | Signatures match RFC rationale. |
| 5 | Diff/lock hygiene | Raw git status/diff against pinned base | Docs/run artifacts only; no lock churn. |

## Dependencies

- Tracking RFC issue #1361; implementation issue #1363; service-layout issue #1362; related issue #1364.
- Typed-error repair and any live issues discovered during re-baseline.
- Primary documentation for every database adapter whose guarantees appear in the capability matrix.

## Drift Watch

- Proposal claims invalidated by current code, exports, live board state, or primary adapter docs.
- Package ownership or dependency cycles that force a narrower public home.
- Any capability that cannot be proven uniformly and must become adapter-specific or refused.

