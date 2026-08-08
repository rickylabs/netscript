# Final Handoff: typed SDK client contributions RFC

## Delivery Identity

| Field               | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Draft PR            | `https://github.com/rickylabs/netscript/pull/1390` (#1390)  |
| Branch              | `docs/rfc-sdk-client-contribution`                          |
| Base                | `origin/main` at `fac9e339042c5394bf882311657d8981d353a1c3` |
| Reviewable RFC HEAD | `89ae608ea935ba8b2776d55e7cb5a09cc29e2520`                  |
| RFC                 | `rfcs/0000-sdk-client-contributions.md` (`0000`, Draft)     |
| Run dir             | `.llm/runs/docs-rfc-sdk-client-contribution--rfc/`          |
| PR phase            | `status:plan-eval`                                          |

`89ae608ea935ba8b2776d55e7cb5a09cc29e2520` is the exact substantive RFC/research commit reviewed by
the generator gates. The commit containing this handoff changes run metadata only; its pushed SHA is
recorded in the S3 PR comment so the handoff does not pretend it can contain its own Git object id.

## Outcome

The carried-in Fable proposal was challenged rather than copied. The RFC ratifies a narrow,
package-owned request-header preparation axis over oRPC's existing async headers/context seam. It
does not authorize a generic client middleware, raw-link, transport, query-policy, error-map, or
server-plugin framework.

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

## FCP-Safe Unresolved Questions

Only these questions remain open:

1. Raise the 16-contribution ceiling if CI type evidence supports it; do not ship below 16.
2. Ship an explicit server-only environment credential helper in the first auth slice or keep it as
   an application example.
3. Schedule independent custom-link issue #451 alongside implementation or later.
4. Refine public names during FCP without changing defaults, ownership, cache safety, or composition
   semantics.

Duplicate rejection, order independence, per-call async preparation, reserved trace ownership, no
upstream callback arrays, explicit activation, cache safety, and separation from contract-defined
errors are not open.

## Validation Evidence

| Gate                     | Result                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Exact base/merge-base    | PASS at `fac9e339042c5394bf882311657d8981d353a1c3`                                                      |
| RFC/harness formatting   | PASS, eight tracked Markdown files checked                                                              |
| Focused RFC links        | PASS, 1 document, 0 broken links/anchors                                                                |
| Repository docs links    | PASS, 102 documents, 0 broken links/anchors                                                             |
| Docs accuracy            | PASS                                                                                                    |
| Exact-shape type proof   | PASS; required/optional context, conflicts, 16 accepted, 17 rejected                                    |
| Doctrine                 | PASS, `deno task arch:check` exit 0                                                                     |
| Diff hygiene             | PASS, `git diff --check`                                                                                |
| Review-thread gate       | PASS, 0 threads / 0 unanswered                                                                          |
| Package publish dry-runs | PASS for contracts, SDK, plugin, and auth core                                                          |
| JSR package audit        | contracts/SDK/auth core exit 0; plugin exit 1 on four pre-existing module-tag plus cardinality findings |
| Structured doc lint      | Pre-existing private refs: contracts 9, SDK 3, plugin 15, auth core 4                                   |

The JSR/doc-lint findings are implementation baselines, not failures introduced by this docs PR and
not waivers. No runtime/scaffold E2E was run because this RFC changes no framework or generated
source; the RFC assigns the full one-pass runtime gate to implementation merge readiness.

## Board Reconciliation Proposal

No issue or milestone was mutated. After RFC acceptance, the maintainer/root orchestrator should:

1. reconcile #1348 acceptance with the narrow header/context/cache law;
2. narrow #1349 to descriptor, composer, context/query propagation, and cache safety;
3. keep #1350 as exact base error-map plus metadata repair;
4. keep #1351 as SDK-owned transport consolidation and coherent oRPC-family update;
5. place bearer convention, redaction, and auth delivery under #1352;
6. re-scope #1353 from a trace contribution to trace ownership/reserved-header conformance;
7. file the locale proof child only after acceptance;
8. cross-link generic discovery #1093; and
9. keep custom link #451 and later #928/#934/#884 work independent except for shared vocabulary.

## Exact Fable Reviewer Instructions

Use the already-existing Claude Fable 5 session reserved by the root orchestrator. Do not launch a
new authoring or evaluator session from this branch.

Read in this order:

1. `rfcs/0000-sdk-client-contributions.md`;
2. `research.md`, especially the proposal challenge, current API evidence, board state, upstream
   sources, type probe, and JSR consequences;
3. `plan.md`, including the locked decisions, risks, Plan Gate self-audit, and issue map;
4. `worklog.md` `## Design` and exact gate table;
5. `drift.md`; and
6. the carried proposal at
   `/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-A-sdk-client-composition.md`.

Perform a cross-RFC Plan & Design review, not implementation. Specifically try to falsify:

- minimality against current oRPC/NetScript seams;
- tuple inference and widened/runtime validation at the stated budgets;
- order independence and duplicate/reserved ownership law;
- auth and locale cache isolation across direct, server-query, and TanStack paths;
- redaction, cleartext, redirect, abort, and retry guarantees;
- transport/final-trace ownership and #451 separation;
- static plugin availability versus explicit activation; and
- compatibility, JSR declaration boundaries, staged issue ownership, and executable gates.

For every finding, cite an RFC heading and repository/upstream evidence, classify it as blocking or
FCP-safe, and state the smallest correction. Explicitly say whether both auth and locale can be
implemented without adding a parallel framework. Record the observed reviewer identity, verdict, and
required RFC edits in the harness artifacts and a structured PR comment. Do not assign an RFC
number, implement package code, merge, close/create issues, mutate milestones, or move the PR past
the review lifecycle on the generator's behalf.

After Fable findings are reconciled, the root orchestrator—not this generator—should run the planned
Qwen adversarial pass against the revised RFC and the Fable verdict.
