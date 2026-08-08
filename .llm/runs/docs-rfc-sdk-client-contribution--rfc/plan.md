# Plan: typed SDK client contribution RFC

## Run Metadata

| Field          | Value                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Run ID         | `docs-rfc-sdk-client-contribution--rfc`                                                                      |
| Branch         | `docs/rfc-sdk-client-contribution`                                                                           |
| Phase          | `plan-eval`; owner-directed external review is the next action                                               |
| Target         | `rfcs/0000-sdk-client-contributions.md` plus mandatory harness artifacts                                     |
| Archetype      | `2 Integration`; `4 Public DSL / Builder`; `5 Plugin`; `6 CLI / Tooling` (described implementation surfaces) |
| Scope overlays | `SCOPE-docs`                                                                                                 |

## Archetype

This is a docs-only RFC run whose proposed implementation crosses existing packages with different
assigned archetypes. The RFC carries the union of their design constraints and future gates without
claiming that this PR implements framework code.

## Current Doctrine Verdict

- `@netscript/sdk` and `@netscript/contracts`: **Keep**; add a package-owned type surface, not an
  upstream mirror.
- `@netscript/service`: **Refactor**; do not deepen its preset/primitive ambiguity by adding server
  plugin fields to a client descriptor.
- `@netscript/plugin`: historical **Restructure** is closed except current debt; add an open generic
  reference group and reject host switches.
- `@netscript/telemetry`: **Keep** at the transport boundary; final trace injection remains owned by
  the SDK adapter.
- `@netscript/plugin-auth-core`: integration/core owner of bearer conventions; `plugins/auth`
  remains a thin delivery shell.

## Goal

Produce the lightweight, decision-complete NetScript RFC for a minimal typed SDK client contribution
axis, grounded in the current repository and public upstream oRPC behavior.

## Scope

- Re-baseline source, type, export, test, docs, issue/PR, standard, and upstream claims.
- Lock the public/type contract, context and cache algebra, composition law, failure model,
  security/redaction boundary, plugin discovery, generated ergonomics, compatibility, migration,
  decomposition, and gates.
- Prove generality with auth plus a structurally different locale contribution.
- Produce the draft RFC and complete run artifacts; no framework implementation.

## Non-Scope

- No package/plugin/CLI implementation, RFC numbering, merge, issue creation/closure, milestone
  mutation, evaluator launch, release gate, or custom transport API.

## Hidden Scope resolved

- JSR/export consequences of recursive public types and the new auth-core subpath.
- Safe response-cache identity across direct, server-query, and TanStack paths.
- Board reconciliation against #1348–#1353, #1093, #451, #928, #934, and #884 without mutation.
- Current oRPC lock/stable state and an explicit inference ceiling.

## Locked Decisions

| Axis              | Decision                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extension axis    | Request-header preparation from typed per-call context only.                                                                                                               |
| Public protocol   | Package-owned `{ family: 'netscript.sdk-client', major: 1 }`, named id, runtime context declaration, owned header names, mandatory response-cache effect, async `prepare`. |
| Context inference | Literal tuple intersection; required properties make request context required; named static conflicts plus runtime validation.                                             |
| Ordering          | Sequential deterministic evaluation of the same snapshot; contributors cannot observe accumulated output; valid results commute.                                           |
| Conflict policy   | Duplicate id/context/header or reserved/undeclared header is an error; never last-writer-wins.                                                                             |
| Cache safety      | `invariant`, synchronous non-secret `partitioned`, or `direct-only`; direct-only services have no generated query maps.                                                    |
| Auth              | First-party bearer factory in auth core; per-call async resolver; unmarked metadata defaults to `none`; redacted stable failures.                                          |
| Second consumer   | Locale/`accept-language`, proving optional context and partitioned representation outside auth.                                                                            |
| Metadata          | `NetScriptProcedureMeta.access.authentication = "none" \| "optional" \| "required"`; unmarked procedures default to `"none"`.                                              |
| Trace             | Transport-owned and reserved; #1353 becomes trace-ownership conformance rather than a contribution.                                                                        |
| Transport         | Discovery/codec/fetch/retry/dedupe/trace/error remain SDK-owned; raw oRPC callbacks and links are not descriptor fields. #451 stays separate.                              |
| Query policy      | No arbitrary defaults/invalidation callbacks; only canonical full-key partition suffix and context propagation.                                                            |
| Plugin discovery  | Optional static module/export/target references; installation exposes availability, explicit generated config activates per service.                                       |
| Inference budget  | 16 contributions/service, 8 context keys/contributor, 16 header keys/contributor; type proof recorded.                                                                     |
| Compatibility     | Omitted tuple exactly preserves behavior/key shapes; old generic defaults remain; no-op `port`/`timeout` are deprecated but not removed here.                              |
| Error ownership   | Stable local preparation error, not a server-defined error-map member.                                                                                                     |

## Open-Decision Sweep

Every brief-named implementation fork is resolved in the RFC. Remaining questions are safe for FCP:

1. a ceiling may be raised after CI type evidence but not lowered below 16;
2. server credential convenience export timing;
3. independent #451 scheduling; and
4. semantic-preserving public naming refinements.

## Risk Register

| Risk                                     | Mitigation / RFC gate                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Parallel abstraction or upstream leakage | Descriptor maps only to native async headers; no public oRPC types; doc-lint and declaration inspection.                        |
| Tuple/context inference cost             | Per-service tail recursion, 16 limit, named markers, type fixtures at 16/17.                                                    |
| Auth special case                        | Locale consumer and generic header/context/cache law; auth factory is one constrained implementation.                           |
| Cross-principal cache leak               | Mandatory response-cache effect, id-sorted partition suffix, direct-only omission, two-principal tests.                         |
| Secret leakage                           | All values sensitive by default; fixed diagnostic allowlist; source failures discarded; redaction snapshots and OWASP baseline. |
| Trace breakage                           | Reserve trace keys and keep final injection at client-span transport edge.                                                      |
| Hidden plugin behavior                   | Static discovery and explicit per-service generated selection; duplicate/mismatch failures.                                     |
| Board duplication                        | #451 sole custom-link owner; reconcile #1353 and add locale child only after acceptance.                                        |

## Anti-Patterns resolved

| AP                               | Resolution                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------- |
| AP-9 premature abstraction       | Reject every proposal field without necessity at the header/context boundary. |
| AP-11 hidden globals             | Per-call resolver; no module-scope credential reads or global registries.     |
| AP-14 upstream re-export         | NetScript-owned descriptor/context/error/reference vocabulary only.           |
| AP-24 closed switch              | Generic `sdkClients` reference group and synthetic third-party gate.          |
| AP-25 side effects outside edges | Secret resolution is per request; dispatch stays at the HTTP adapter.         |

## Implementation Contract (for future PRs)

### Public surface first

1. `NetScriptProcedureMeta` and exact base contract annotation.
2. Contribution descriptor/helper/type algebra and error diagnostic.
3. Client and query context generics with compatibility defaults.
4. Plugin static reference plus auth-core factory export.

### Runtime second

1. Construction validation and reserved ownership.
2. Per-call preparation wrapper over the single oRPC header resolver.
3. Canonical cache partitions/direct-only map omission.
4. Redacted errors, abort/retry behavior, and transport integration.

### Delivery third

1. Auth and locale proofs.
2. Generic plugin discovery and generated explicit tuples.
3. Docs, scaffold, publish, and full CLI E2E gates.

## Fitness Gates

The RFC contains the full future gate matrix. This docs PR runs:

- Markdown formatting;
- focused RFC internal-link/path validation;
- repository docs links and accuracy;
- source/API/export and live-board alignment review;
- non-product type probe;
- current package JSR/doc-lint baseline scan;
- doctrine check and PR metadata/thread readiness where applicable.

Framework implementation issues inherit type, runtime, redaction, cache isolation, plugin parity,
JSR/publish/consumer, CLI/scaffold, architecture, and full runtime E2E gates enumerated in the RFC.

## Arch-Debt Implications

No new debt entry is required for a docs-only RFC. Existing private-type-ref and package cardinality
findings are baseline evidence, not waived by the RFC. Implementation must not add to them. Any
unavoidable new deviation requires a debt entry with owner/exit criteria in its own PR.

## Validation Plan

| Order | Gate                 | Command/check                                               | Expected result                                                                       |
| ----- | -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1     | Source/API alignment | `deno doc`, focused source/tests/exports, live GitHub reads | All prescriptive claims grounded.                                                     |
| 2     | Type ergonomics      | ignored `.llm/tmp/` Deno type proof                         | Valid 16 tuple and required context pass; conflicts/17 fail under `@ts-expect-error`. |
| 3     | RFC integrity        | `deno fmt --check`; focused link checker                    | Exit 0.                                                                               |
| 4     | Repository docs      | `deno task docs:links`; `deno task docs:accuracy`           | Exit 0.                                                                               |
| 5     | Publish consequences | package audit + structured doc-lint on four roots           | Baseline recorded; no RFC source mutation.                                            |
| 6     | Doctrine             | `deno task arch:check`                                      | Exit 0 or exact unrelated baseline recorded.                                          |
| 7     | GitHub readiness     | draft/labels/body/thread/commit verification                | Required labels, one status, no milestone mutation/closing keyword.                   |

## Plan Gate Self-Audit

The RFC plan is ready for external evaluation: it states the current implementation and gap,
compares the broad proposal with the existing oRPC seam and narrower alternatives, locks public
placement and composition/failure/security laws, names migration and compatibility behavior, maps
implementation slices and issues, and defines executable fitness gates. The RFC carries no product
implementation and leaves only the four explicitly FCP-safe questions open. This is a generator
self-audit, not a PLAN-EVAL verdict; the owner-designated external reviewer remains authoritative.

## Dependencies and Board Reconciliation

- #1348 remains tracking/RFC record.
- #1349–#1352 retain implementation ownership with narrowed bodies.
- #1353 is re-scoped to trace transport ownership, not deleted.
- A locale proof child is proposed only after acceptance; none is filed in this run.
- #1093 supplies generic discovery.
- #451 remains the only custom-link issue.
- #928/#934 align on protocol/metadata vocabulary but do not block the minimal seam.

## Drift Watch

- Any review request that puts upstream callback arrays back in the descriptor.
- Any query path that receives auth/locale context without safe full-key partitioning.
- Any auth helper placed in the thin plugin rather than auth core.
- Any trace contributor that can author `traceparent`/`tracestate`.
- Any generated activation based only on installation or runtime scanning.
