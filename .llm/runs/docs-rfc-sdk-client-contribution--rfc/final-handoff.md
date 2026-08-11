# Final Handoff: RFC-A PLAN-EVAL cycle-1 remediation

## Delivery Identity

| Field                         | Value                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Draft PR                      | `https://github.com/rickylabs/netscript/pull/1390` (#1390)                                    |
| Branch                        | `docs/rfc-sdk-client-contribution`                                                            |
| Base                          | `origin/main` at `fac9e339042c5394bf882311657d8981d353a1c3`                                   |
| Formal cycle-1 verdict        | `FAIL_PLAN / CHANGES_REQUESTED`; `plan-eval.md` at `f1a29fe1a65d59f71a59bf4b6b2a48fc49e1e86f` |
| Reviewable remediation commit | `78a7cecd1d5eaafa7a65bc25a21af497567128dc`                                                    |
| Verified remote handoff HEAD  | `bc955459046c19a31fe00195b32f37f25a04e24f`                                                    |
| RFC                           | `rfcs/0000-sdk-client-contributions.md` (`0000`, Draft)                                       |
| Run dir                       | `.llm/runs/docs-rfc-sdk-client-contribution--rfc/`                                            |
| Verified lifecycle            | exactly one `status:plan-eval`                                                                |

The PR stays draft. This is author remediation of authoritative Fable findings F-A1 through F-A10,
not a self-evaluation or PASS claim. No RFC number, issue, milestone, merge, evaluator, or product
framework implementation was created or mutated.

## Cycle-1 Finding Reconciliation

| Finding | Normative correction                                                                                                                                                                                                                                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-A1    | The zero-oRPC gate applies to named new RFC-A protocol nodes and all generated client declarations. Existing `ContractLike`/contracts leakage is a non-growing #1350/#1278 allowlist, not an impossible whole-graph prerequisite.                                                                                    |
| F-A2    | Default server keys remain exact three-tuples; partitioning appends `['$netscript.sdk-context', serializedPairs]` for exact five-tuples. The RFC dispositions action/query factories, `CacheKey`/`CacheQuery`, key bridge, KV persister, collections, recursive TanStack wrapping, and the current upstream fixture. |
| F-A3    | Every widened public generic has an explicit compatibility default preserving the current no-contribution shape.                                                                                                                                                                                                     |
| F-A4    | Unary/ordinary retries prepare once per logical-call epoch. Iterator-phase stream reconnect is a new epoch and refreshes credentials exactly once; its retries replay that epoch's immutable record.                                                                                                                 |
| F-A5    | RFC-A v1 is HTTP-only. Desktop MessagePort options do not accept contributions; types, construction, and generators reject attempted selection rather than silently dropping auth.                                                                                                                                   |
| F-A6    | Private ports live only in `packages/sdk/src/internal/client-contributions/`, with no barrel/export. SDK doc-graph and packed-consumer negative tests prove their absence.                                                                                                                                           |
| F-A7    | Contributors see only their declared-context projection plus signal. Retry/cache/trace/dedupe fields and the private prepared-call channel stay transport-owned; forced unary retry uses `context.retry: 1`, and comparison covers only the contribution projection.                                                 |
| F-A8    | Stable v1 already infers GET. The v2 spike must preserve GET by replacing removed inference and configuring `allowMethods`/CSRF, or retire GET and replace dedupe. Atomic lock family, dedupe-effectiveness, OTel topology, Desktop, stream, and all other migration gates are explicit.                             |
| F-A9    | `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` is committed and imports real contract/client/query/key surfaces while modeling only proposed RFC declarations.                                                                                                                              |
| F-A10   | Stable-v1 header/retry and header-safe dedupe facts are cited; raw input is sensitive borrowed data; stable v1 remains maintained; Stage 1a keeps #1350's filed `safe()` repair while Stage 0 assigns metadata Stage 1b.                                                                                             |

The core design is unchanged: a package-owned typed per-call request-header contribution seam, auth
plus locale dogfoods, three private adapter responsibilities, explicit cache effects, stable-v1
implementation, and upstream-major-neutral public/generated RFC-A declarations.

## FCP-Safe Questions

1. Outer wrapper versus immutable per-unary-call memoization; both use the private channel, while
   stream reconnect always creates a fresh preparation epoch.
2. Ratify procedure-auth metadata inside RFC-A/#1350 or assign a dependent Stage 1b owner.
3. Install the incoming stable-v1 request-header server companion by default or explicitly; direct
   calls must tolerate absent headers.
4. Move the lock-pinned whole oRPC v1 family to v1.15.0 before or after the seam.
5. In the separate v2 RFC, require parallel endpoints or permit an atomic coordinated rollout.
6. In that v2 RFC, preserve current GET with replacement inference/`allowMethods`/CSRF or retire GET
   and replace dedupe.
7. Prove whether v2 OTel can replace final injection without violating NetScript span ownership or
   creating double spans. v1 package selection/renaming remains #1351.
8. Retain 16 contributions as the minimum supported inference budget; raise it only with CI
   evidence.

## Validation Evidence

| Gate                           | Evidence                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Real-surface type fixture      | PASS — Deno check exit 0; 0.92 s/268,448 KiB informational observation                                                   |
| Targeted format/lint           | PASS — 9 files checked; fixture lint 1 file/0 findings                                                                   |
| Focused RFC links              | PASS — 1 document, 0 broken links/anchors                                                                                |
| Repository docs links/accuracy | PASS — 102 documents/0 broken; accuracy PASS                                                                             |
| Doctrine                       | PASS — `deno task arch:check` exit 0; warning-only baseline unchanged                                                    |
| Diff hygiene                   | PASS — working-tree and aggregate `origin/main...HEAD`; one original `implement.md` trailing blank corrected             |
| Review threads                 | PASS — 0 total / 0 unanswered                                                                                            |
| Git/PR metadata                | PASS — explicit-refspec push; draft/main; required labels; sole `status:plan-eval`; milestone null; #1348 reference only |

No CLI/scaffold runtime E2E is appropriate for this RFC-only change; implementation stages retain
the full runtime gates. Existing JSR/doc-lint baselines remain recorded in `research.md` and are not
waived.

## Board-Stage Reconciliation Proposal

No issue or milestone was mutated. After acceptance, maintainers should:

1. keep #1348 as the RFC/tracking record and narrow #1349 to the descriptor, composer,
   client/query/key/cache seam, private adapters, reconnect law, and Desktop rejection;
2. keep #1350's filed `safe()` error repair as Stage 1a, then explicitly widen it or assign a
   dependent Stage 1b owner for `NetScriptProcedureMeta` before auth dogfood;
3. keep #1351 on transport consolidation, lock-only whole-family stable-v1.15.0 decision, unary/
   reconnect/dedupe conformance, and v1 OTel package selection—never v2 migration;
4. keep #1352 on auth-core bearer/redaction/delivery and re-scope #1353 to final trace ownership;
5. file the locale proof child only after RFC acceptance, cross-link #1093, and leave #451 as the
   sole custom-link issue; and
6. propose a separate v2 RFC/spike only after RFC-A review. It must gate stable-dist-tag policy,
   atomic exact-family versions, coordinated or parallel endpoints, route/meta/OpenAPI/Scalar
   parity, error semantic/status parity, middleware counts, replacement method inference,
   `allowMethods`/GET/POST/CSRF law, dedupe effectiveness, OTel topology/no double spans, Desktop
   MessagePort serializer parity, SSE/stream reconnect credentials, query/cache partitions,
   Deno/browser/server matrix, package checks, CLI/scaffold E2E, docs snippets, and publish dry-run.

## Exact Fable Cycle-2 Instructions

Use the existing owner-designated Claude Fable 5 evaluator session; do not launch a new evaluator.
Read in this order:

1. `.llm/runs/docs-rfc-sdk-client-contribution--rfc/plan-eval.md` completely;
2. `rfcs/0000-sdk-client-contributions.md` at the reviewable remediation commit above;
3. `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`;
4. `research.md` section “Formal PLAN-EVAL cycle 1 amendment”;
5. `plan.md`, especially locked decisions, validation plan, and board stages;
6. `worklog.md` `## Design`, decisions, drift, and exact gate table;
7. `drift.md` cycle-1 entry; and
8. this handoff.

Re-evaluate each F-A1 through F-A10 individually and record PASS/remaining smallest correction with
an RFC heading and repository/upstream evidence. In particular, verify the scoped declaration gate,
all server/cache key paths and defaults, stream credential refresh, Desktop rejection, private-port
absence, contribution context projection/private channel, corrected v2 GET direction and complete
spike gates, in-tree inference evidence, and #1350 Stage 1a/1b reconciliation. Confirm whether the
plan is now implementable without guessing and whether auth plus locale still require no parallel
framework.

Do not assign an RFC number, implement framework code, merge, create/close issues, mutate
milestones, start Qwen, or advance the PR beyond the lifecycle authorized by the root orchestrator.
