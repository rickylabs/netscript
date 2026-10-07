# C1 implementation evidence — S2 review handoff

Current state: S1 supervisor sign-off committed at `5023427004b37a561570a1a23bb4b7e21faf0c51`; S2 implemented and frozen for review; S3 pending. Read [S2 handoff](./s2-implementation.md), [S2 gates](./s2-gate-evidence.json), [S2 mutations](./s2-mutation-evidence.json) and [S2 hashes](./s2-source-manifest.json). This artifact provides implementation evidence, not an evaluator verdict or whole-C1 completion claim. The separate-family whole-chain PLAN-EVAL PASS remains untouched. The following S1 evidence is retained as historical slice detail.

## Product files

| File | Change |
| --- | --- |
| `packages/contracts/commands.ts` | Focused public manifest with module/example/permission documentation; no root export enlargement |
| `packages/contracts/src/domain/command-errors.ts` | Three exact strict payload schemas; closed literal error map; service-independent structural safe-failure validation |
| `packages/contracts/src/application/command-contract.ts` | `commandBaseContract`, `CommandContractErrors`, input/output and output-only routes preserving live `BaseContractMeta`; safe constructor translation |
| `packages/contracts/tests/commands-type_test.ts` | Real contracts/commands and SDK/client positive/negative fixtures plus four runtime proving tests |
| `packages/contracts/README.md` | Opt-in route example, error/status/data table, typed route and safe-mapping documentation |
| `packages/contracts/deno.json` | Declared `./commands` export, publish include and package check entrypoint |

The six base errors retain their exact types. Three command errors are opt-in: `COMMAND_CONFLICT`, `IDEMPOTENCY_KEY_REUSE`, `COMMAND_IN_PROGRESS`. `CommandContractErrors` is closed, not an open error-map index signature. Builder and both route aliases retain the existing metadata generic. No service implementation import, dependency changes, casts, suppression comments, lock/cache removal or reload. No executor/database/relay changes. Source hashes are in [s1-source-manifest.json](./s1-source-manifest.json).

## Tests and mutation controls

[Per-test mutation evidence](./s1-mutation-evidence.json) preserves named failing tests, wrapper output, mutated exit1 and restored exit0 for every added runtime test:

| Named test | Production mutation | Mutated / restored exit |
| --- | --- | --- |
| command contracts opt in to exact errors and preserve route metadata | Replace the conflict message literal | 1 / 0 |
| command schemas reject malformed retry hints and preserve exact payloads | Remove integer validation so fractional retry hints are accepted | 1 / 0 |
| command error mapping forwards only validated safe payloads to declared constructors | Dispatch optimistic conflict to the idempotency-reuse constructor | 1 / 0 |
| command error mapping rethrows business operational and unsafe failures unchanged | Change strict schemas to stripping schemas so unsafe extra fields are mapped | 1 / 0 |

Runtime mutations use the structured test wrapper with `--no-check` so each failure is a named behavioral failure rather than a compiler-only failure. All production mutations were restored. The final normal test gate type-checks the restored fixture.

The same real-export fixture also fails under builder metadata erasure, status literal widening and command-code erasure, each checked by the structured check wrapper (exit1 with `commands-type_test.ts` diagnostics, restored exit0). It proves all nine codes through the public `ServiceClient`, SDK `safe()` and `isDefinedError()`, preserves each command data discriminant, and rejects an undeclared code and malformed metadata/data. Negative fixtures use expected TypeScript diagnostics, with no shadow client/error type declarations.

## Actual gates

[Gate evidence](./s1-gate-evidence.json) records exact argv and actual exits. Final stable S1 results:

| Gate | Actual exit | Result |
| --- | --- | --- |
| Structured contracts check, `--unstable-kv`, source TypeScript | 0 | 31 selected files; no diagnostics |
| Structured contracts tests | 0 | 20 passed, 0 failed; includes all four new tests |
| Structured contracts lint | 0 | No findings |
| Structured contracts source fmt check | 0 | No findings |
| Full five-entry export-map doc lint | 1 | 17 combined upstream private-type-ref diagnostics, 0 missing JSDoc, 0 other |
| Baseline four-entry export-map doc comparison | 1 | 9 existing combined private-type-ref diagnostics, 0 missing JSDoc, 0 other |
| `quality:scan` via durable run-gate receipt | 0 | No findings; no new suppression |
| `arch:check` via durable run-gate receipt | 0 | No failures; baseline warnings retained |
| Materialized per-member contracts `publish:dry-run` | 0 | All five entries checked; isolated slow-type analysis passes and dry run completes |

Doc lint exits are reported honestly under the existing sanction in `docs/architecture/doctrine/02-public-surface.md`, section “Sanctioned exception: slow-types for oRPC-bound packages”: binding contracts to real oRPC builders may retain upstream private-type-ref diagnostics as the accepted cost of sound types. Full-map attribution: eight existing diagnostics in `contract-primitives.ts`, one existing diagnostic in `create-crud-contract.ts`, eight new oRPC generic references in `command-contract.ts`. There are no new NetScript-owned private-type leaks in the combined map. No runner change, suppression, upstream re-export or type erasure was applied. Publish was checked independently and passes.

The materialized published file list includes `commands.ts` plus the two command implementation files; all tests/fixtures are excluded. It rewrites the existing catalog dependency for the consumer manifest. Raw durable receipts and unredacted tool output are retained in the task-private runtime directory; this public artifact contains repository-relative evidence and no operational infrastructure. Receipts identify the pre-signoff HEAD `86541a1114e7d12c526257fb45a4f696514638c3`; source hashes identify the uncommitted S1 product content.

An initial post-format check/test run exited1 because formatting split a negative fixture assignment and moved its expected-diagnostic comment above the assignment instead of the rejected property. The comment was moved onto the property. The final check/test/lint/fmt and mutation controls were rerun and pass as recorded; initial failures are retained in the evidence history.

## Historical S1 next action

Review S1 source and evidence substantively, sign off/commit/push/comment on draft PR #2082, then release S2 to this lane. Do not mark #1482 complete yet: service command value/opaque-definition/failure/codec implementation, deterministic bounded versioned JCS, S3 clean consumer/dependency/declaration/JSR gates and independent per-leaf IMPL-EVAL remain pending. No material deviation from the locked plan was needed.
