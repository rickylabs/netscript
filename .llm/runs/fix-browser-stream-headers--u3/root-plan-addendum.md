# Root normative PLAN addendum

Coordinator disposition2026-10-27, after full read of corrected native PLAN SHA256
`7fd0f254c5eb8d209e6aa54ec38c85fb0cd3f1e15440477a214e65924c165271`. The native proposal remains
verbatim. This addendum is normative for the independent feature PLAN evaluation; it is not an
independent PASS or permission to implement.

Root accepts the public `HeadersRecord` widening with an explicit external string-serializer source
compatibility/migration note. Root accepts paired real compiler controls and the explicit
permission-scoped env-denied test shape. No suppressions, casts or ambient credential fallback are
permitted.

The existing `create-stream-db_test.ts` is336 physical lines; adding210 would violate F10. Instead:

- Drop the incidental `packages/fresh/src/runtime/streams/mod.ts` comment-only owner.
- Move only the existing `startReferenceServer` harness into new focused
  `packages/fresh/tests/_fixtures/stream-db-test-runtime.ts`; import it in old/new tests. Correct
  `import.meta.url` anchors from the new helper location. Preserve old test assertions, server
  behavior, process readiness/exit/drain and failure cleanup. Do not duplicate the process harness
  or introduce a transport.
- Put ALL new Fresh header runtime and compiler controls in the already planned
  `packages/fresh/tests/streamdb-headers-contract_test.ts`; aim for at most480 readable physical
  lines. Keep below the doctrine500 physical-line boundary, without compression or removed controls.
  Existing runtime test changes are only the helper extraction/imports.
- Tests must explicitly retain `sanitizeOps`, `sanitizeResources` and exit sanitization enabled;
  close/drain all owned consumers, servers and children on failure. Prove actual native request
  header rotation and collection/native identity with meaningful controls.

## Locked prospective owners

| # | Product/test/doc owner                                        | Scope                                                                                    |
| - | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1 | `packages/fresh/src/runtime/streams/create-stream-db.ts`      | Direct public type, optional input, undefined-only legacy branch; approved widening note |
| 2 | `plugins/workers/streams/factory.ts`                          | Same direct forwarding; existing collection surface                                      |
| 3 | `packages/fresh/src/runtime/streams/create-stream-db_test.ts` | Existing harness extraction/import only; old assertions unchanged                        |
| 4 | `packages/fresh/tests/streamdb-headers-contract_test.ts`      | ALL new Fresh header runtime/compiler proofs, aim<=480 physical lines                    |
| 5 | `packages/fresh/tests/_fixtures/stream-db-test-runtime.ts`    | Only extracted existing reference-server harness, fixed anchors                          |
| 6 | `packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts` | Positive public/browser inference proof                                                  |
| 7 | `plugins/workers/tests/streams/factory-headers_test.ts`       | Actual native requests, rotation, explicit/absent auth and compiler controls             |
| 8 | `plugins/workers/tests/streams/live-query-consumer_type.ts`   | Positive worker header/inference proof; other factories untouched                        |
| 9 | `docs/site/durable-workflows/streams.md`                      | Callback/replace semantics and compatibility note; no issuer architecture                |

All other physical budgets in the corrected native proposal remain prospective unless this addendum
changes them. The extracted helper should remain near its original readable harness size; no
independent abstraction, private factory or broader fixture is authorized. A concrete budget/control
failure stops for root disposition before expansion.

Total prospective footprint remains22 including provenance. This addendum consumes one provenance
owner; use the existing worklog for supervision/root review rather than silently adding a separate
root-review file. Reserved records: `plan-eval.md`, `plan-eval-receipt.json`, `evaluate.md`,
`impl-eval-receipt.json`, `supervisor.md`. The other current run owners are
worklog/research/context/drift/initial-plan/corrected-plan/generation-receipt. Nine
product/test/doc + eight current run owners + five reserved review owners =22.

Conditional23rd owner pre-authorized ONLY if the actual `docs:exports-drift` or `docs:accuracy`
parity gate requires it: `docs/site/reference/fresh/index.md`. Retain the failing parity receipt and
reason; no speculative edit. No other owner is authorized without a binding disposition.

The current pinned feature/PLAN-EVAL route is selected by the live matrix query, not the generator
or a previous review route. The actual independent evaluator must be a separate session/vendor
family, with normal provider/expense/MCP guards and source/prompt seals. Root must read its actual
PASS before C1. No paid inference or implementation is authorized by this preparation artifact.
