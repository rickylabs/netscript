# Final Handoff: typed SDK client contributions RFC

## Delivery Identity

| Field               | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Draft PR            | `https://github.com/rickylabs/netscript/pull/1390` (#1390)  |
| Branch              | `docs/rfc-sdk-client-contribution`                          |
| Base                | `origin/main` at `fac9e339042c5394bf882311657d8981d353a1c3` |
| Reviewable RFC HEAD | `7a0d398087a6608ff1a55bb9fe4c47158edb72a7`                  |
| RFC                 | `rfcs/0000-sdk-client-contributions.md` (`0000`, Draft)     |
| Run dir             | `.llm/runs/docs-rfc-sdk-client-contribution--rfc/`          |
| PR phase            | `status:plan-eval`                                          |

`7a0d398087a6608ff1a55bb9fe4c47158edb72a7` is the exact substantive amended RFC/research commit
reviewed by the generator gates. The commit containing this handoff changes run metadata only; its
pushed SHA is recorded in the amendment PR comment so the handoff does not pretend it can contain
its own Git object id.

## Outcome

The carried-in Fable proposal was challenged rather than copied. The RFC ratifies a narrow,
package-owned request-header preparation axis behind three NetScript internal ports. The root's
post-generator oRPC v2 audit was reconciled as research, not an evaluator verdict. RFC-A is now
normatively upstream-major-neutral, implements against stable v1, and leaves the coordinated v2
migration to a separate RFC/spike. It does not authorize a generic client middleware, raw-link,
transport, query-policy, error-map, or server-plugin framework.

## Decisions Made

1. A contribution has protocol `{ family: "netscript.sdk-client", major: 1 }`, a validated id,
   runtime required/optional context declaration, exclusive lower-case header keys, a mandatory
   response-cache effect, and async `prepare`.
2. A literal tuple infers one context intersection per service. Duplicate id, context, header,
   reserved ownership, invalid limits, and widened/JavaScript boundary errors fail explicitly.
3. Contributors run sequentially against the same immutable snapshot and cannot see accumulated
   output. Valid disjoint results commute; tuple order selects only the first reported failure.
4. Query use is safe by construction: `invariant`, synchronous non-secret `partitioned`, or
   `direct-only`. Partition pairs are id-sorted full-key suffixes; direct-only services are absent
   from query/query-utils maps.
5. `@netscript/plugin-auth-core/sdk` owns the bearer factory. Procedure metadata is
   `NetScriptProcedureMeta.access.authentication = "none" | "optional" | "required"`, with
   first-party unmarked behavior defaulting to `"none"`.
6. Locale/`accept-language` is the non-auth proof. Trace was rejected as dogfood because final W3C
   trace fields belong to the client-span transport edge.
7. Discovery adds static module/export/target availability through `@netscript/plugin/config`;
   generated/application config explicitly activates literal tuples per service.
8. Discovery, codecs, fetch, retry, dedupe, cancellation, redirects, tracing, and server-defined
   errors remain SDK transport policy. Custom links remain exclusively #451.
9. Contribution failures are local stable errors with a fixed diagnostic allowlist. Header values,
   input, context, partition source values, resolver messages, and resolver causes do not cross the
   error/log/telemetry boundary.
10. Omitted contributions preserve current context, headers, query keys, and mapped result keys.
    Existing generic call sites retain defaults; current no-op `port`/`timeout` fields are
    deprecated but not removed by this RFC.
11. Public and generated declarations contain zero raw oRPC types, links, plugins, contexts,
    interceptors, metadata accessors, or upstream-major aliases. Package-private ports own procedure
    metadata, prepared outbound headers, and transport policy.
12. Contribution preparation runs exactly once per logical call above retries. Every attempt
    receives byte-equivalent immutable contributor headers/context; direct unmemoized link-header
    preparation is non-conforming.
13. `RequestHeadersHandlerPlugin` is only an optional incoming server companion and may have no
    headers on direct calls. It does not implement outbound composition, ownership, redaction, or
    cache partitioning.
14. RFC-A does not migrate to oRPC v2 beta or adopt v2 error/status, GET/CSRF, or OTel semantics. A
    separate v1.15.0 exact-family upgrade may be considered; the broad v2 migration requires its own
    RFC/spike and coordinated rollout.

## FCP-Safe Unresolved Questions

These implementation/sequencing questions remain open without changing the locked extension law:

1. Raise the 16-contribution ceiling if CI type evidence supports it; do not ship below 16.
2. Ship an explicit server-only environment credential helper in the first auth slice or keep it as
   an application example.
3. Schedule independent custom-link issue #451 alongside implementation or later.
4. Refine public names during FCP without changing defaults, ownership, cache safety, or composition
   semantics.
5. Use the preferred outer logical-call wrapper or immutable per-call memoization for prepare-once;
   either must pass count `1` and byte-equivalent retry fixtures.
6. Ratify procedure-auth metadata inside RFC-A/#1350 or in a dependent mini-RFC; it must exist
   before auth dogfood ships.
7. Install the stable-v1 incoming request-header handler by default in service presets or require
   explicit selection; direct calls must tolerate absence under an explicit policy.
8. Upgrade the exact oRPC family to stable v1.15.0 before RFC-A implementation or implement first on
   the current v1.14.x baseline.
9. In the separate v2 migration, require zero-downtime parallel endpoints or permit a coordinated
   atomic client/server rollout.
10. Confirm that GET enablement and its CSRF law remain transport/v2-migration scope.
11. Determine whether v2 OTel can replace final injection without violating NetScript span ownership
    or producing double spans.

Duplicate rejection, order independence, exactly-once per-logical-call preparation, reserved trace
ownership, zero raw oRPC symbols in public/generated declarations, no upstream callback arrays,
explicit activation, cache safety, separation from contract-defined errors, and no production v2
beta migration in RFC-A are not open.

## Validation Evidence

| Gate                     | Result                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| Exact base/merge-base    | PASS at `fac9e339042c5394bf882311657d8981d353a1c3`                                                       |
| RFC/harness formatting   | PASS, eight tracked Markdown files checked                                                               |
| Focused RFC links        | PASS, 1 document, 0 broken links/anchors                                                                 |
| Repository docs links    | PASS, 102 documents, 0 broken links/anchors                                                              |
| Docs accuracy            | PASS                                                                                                     |
| Exact-shape type proof   | PASS; required/optional context, conflicts, 16 accepted, 17 rejected                                     |
| Doctrine                 | PASS, `deno task arch:check` exit 0                                                                      |
| Diff hygiene             | PASS, `git diff --check`                                                                                 |
| Review-thread gate       | PASS, 0 threads / 0 unanswered                                                                           |
| Package publish dry-runs | PASS for contracts, SDK, plugin, and auth core                                                           |
| JSR package audit        | contracts/SDK/auth core exit 0; plugin exit 1 on four pre-existing module-tag plus cardinality findings  |
| Structured doc lint      | Pre-existing private refs: contracts 9, SDK 3, plugin 15, auth core 4                                    |
| Audit input              | PASS; 59 lines, SHA-256 `fa8b0ab5cd1afd57b8f6c20036a265fa7c8fb48764f88f97f289c44c0737d3d0`               |
| Stable dependency audit  | Seven oRPC v1.14.x dependencies behind to stable v1.15.0; no dependency mutation                         |
| Impact scan              | 91 `@orpc/*` reference files; 74 after excluding test paths/name patterns                                |
| Upstream audit           | Official releases/migration/request-header/TanStack/error docs and beta.25 codec/retry source reconciled |
| Amendment gates          | PASS; eight-file format, RFC/repo links, docs accuracy, type proof, doctrine, diff hygiene               |

The JSR/doc-lint findings are implementation baselines, not failures introduced by this docs PR and
not waivers. No runtime/scaffold E2E was run because this RFC changes no framework or generated
source; the RFC assigns the full one-pass runtime gate to implementation merge readiness.

## Board Reconciliation Proposal

No issue or milestone was mutated. After RFC acceptance, the maintainer/root orchestrator should:

1. reconcile #1348 acceptance with the narrow header/context/cache law;
2. narrow #1349 to descriptor, composer, context/query propagation, and cache safety;
3. keep #1350 as exact base error-map plus metadata repair;
4. keep #1351 as SDK-owned transport consolidation and, only after a separate low-risk decision, an
   exact-family stable-v1.15.0 update; do not put v2 in RFC-A;
5. place bearer convention, redaction, and auth delivery under #1352;
6. re-scope #1353 from a trace contribution to trace ownership/reserved-header conformance;
7. file the locale proof child only after acceptance;
8. cross-link generic discovery #1093;
9. keep custom link #451 and later #928/#934/#884 work independent except for shared vocabulary; and
10. propose a separate oRPC v2 migration RFC/spike after RFC-A review, without filing it in this
    run. It owns stable/beta policy, atomic exact-family versions, coordinated/parallel endpoints,
    route/meta/OpenAPI/Scalar, errors/status, middleware counts, GET/CSRF, OTel topology, desktop
    serialization, SSE/streams, query/cache safety, runtime matrix, full CLI/scaffold E2E, docs, and
    publish dry-run.

## Exact Fable Reviewer Instructions

Use the already-existing Claude Fable 5 session reserved by the root orchestrator. Do not launch a
new authoring or evaluator session from this branch.

Read in this order:

1. `.llm/tmp/orpc-v2-audit-followup.md` as the root-requested research amendment input;
2. `rfcs/0000-sdk-client-contributions.md`;
3. `research.md`, especially the proposal challenge, current API evidence, board state, upstream
   sources, type probe, and JSR consequences;
4. `plan.md`, including the locked decisions, risks, Plan Gate self-audit, and issue map;
5. `worklog.md` `## Design` and exact gate table;
6. `drift.md`; and
7. the carried proposal at
   `/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-A-sdk-client-composition.md`.

Perform a cross-RFC Plan & Design review, not implementation. Specifically try to falsify:

- minimality against current oRPC/NetScript seams;
- tuple inference and widened/runtime validation at the stated budgets;
- order independence and duplicate/reserved ownership law;
- auth and locale cache isolation across direct, server-query, and TanStack paths;
- redaction, cleartext, redirect, abort, and retry guarantees;
- transport/final-trace ownership and #451 separation;
- static plugin availability versus explicit activation;
- compatibility, JSR declaration boundaries, staged issue ownership, and executable gates;
- upstream-major neutrality and the sufficiency of the three internal adapter ports;
- prepare-once correctness under actual stable-v1 retry behavior, including wrapper versus memo;
- procedure metadata and incoming server request-header direct-call behavior; and
- the boundary and complete gate set for the separate v2 migration, especially GET/CSRF,
  mixed-version endpoints, and OTel span ownership.

For every finding, cite an RFC heading and repository/upstream evidence, classify it as blocking or
FCP-safe, and state the smallest correction. Explicitly say whether both auth and locale can be
implemented without adding a parallel framework. Record the observed reviewer identity, verdict, and
required RFC edits in the harness artifacts and a structured PR comment. Do not assign an RFC
number, implement package code, merge, close/create issues, mutate milestones, or move the PR past
the review lifecycle on the generator's behalf.

After Fable findings are reconciled, the root orchestrator—not this generator—should run the planned
Qwen adversarial pass against the revised RFC and the Fable verdict.
