# Worklog — #1466 `NetScriptProcedureMeta`

## Design

### Public surface

- Contracts owns `NetScriptAuthenticationRequirement`, `NetScriptProcedureMeta`, and the canonical
  oRPC-adapter alias `BaseContractMeta`.
- SDK exposes structural `ProcedureMetaFromNode` and `ProcedureMeta` extractors only through the
  same subpaths as the existing input/output extractors; the SDK root remains unchanged.
- `ActionMethod` gains an optional type-only metadata marker so query-factory metadata is
  recoverable from the consumer value's type.

### Compatibility boundary

- Metadata evolves through additive optional readonly fields with no version discriminant.
- Generic position 3 remains `BaseContractErrors`; metadata occupies position 4 through
  `BaseContractMeta = NetScriptProcedureMeta & Record<never, never>`.
- SDK extraction is structural and adds no `@netscript/contracts` source dependency. Runtime
  interpretation remains deferred to RFC Stage 2 / S3.

### Evidence design

- Real-export positive/negative fixtures prove exact metadata and unchanged contract-error literals
  through base routes, direct clients, generated clients, and query factories.
- The receipted `test` gate includes runtime storage, doc-JSON independence, and assertion-budget
  tests. Changed-line inspection is review only, not evidence.
- Assertion baselines independently re-measured at evaluator head `a3452650d` are 0 for contracts
  primitives and both SDK port files, 1 for each service-client implementation/mapping file, and 5
  for the query-factory implementation; no angle-bracket assertions were found. The new metadata
  file starts at 0.
- Final evidence is the exact eight distinct-`gateId` receipt set in `plan.md`; per-member doc lint,
  JSR audits, and member dry-runs are supplemental.

### Commit slices

1. Contracts vocabulary, builder/error-channel soundness, runtime storage proof.
2. Structural SDK extraction, direct/generated/query declaration propagation.
3. Publish, compatibility, and final receipt sufficiency evidence.

### Deferred scope

- Runtime metadata readers/ports, contribution preparation, transport behavior, auth dogfood,
  discovery, CLI generation, and all RFC stages after 1b.

### Contributor path

Add future metadata as optional readonly fields on the contracts-owned interface. Consume it through
the SDK's structural extractors and exact-contract carriers; do not import oRPC metadata types or
add runtime interpretation in this slice family without the RFC-owned Stage 2 port.

## Progress log

| Date       | Phase             | Event                                                                                                                                                                                                                                                                                                                 | Evidence                                                   |
| ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 2026-08-30 | plan              | Phase 1 research and plan committed.                                                                                                                                                                                                                                                                                  | `9e70b30a3`                                                |
| 2026-08-30 | plan-eval         | Fresh opposite-family evaluator returned `FAIL_PLAN`; all decisions were ruled and A-1–A-8 were prescribed as transcription repairs.                                                                                                                                                                                  | `plan-eval.md`, evaluator commit `a3452650d`               |
| 2026-08-30 | plan-eval repair  | Re-measured assertion baselines; transcribed T-1–T-3 and R-1–R-2 into the implementation contract. No package implementation started.                                                                                                                                                                                 | This commit                                                |
| 2026-08-30 | plan-eval cycle 2 | Separate-session evaluator verified A-1–A-8 and returned `PASS`.                                                                                                                                                                                                                                                      | `plan-eval.md`, evaluator commit `1df5ff3e4`               |
| 2026-08-30 | slice 1           | Added the contracts metadata vocabulary, exact builder/route metadata typing, real-export fixtures, runtime storage proof, assertion budget, contracts-side doc-JSON independence proof, and public ownership/compatibility docs.                                                                                     | Slice content commit; final SHA recorded in the PR comment |
| 2026-08-30 | slice 1 gate      | Focused structured check selected 26 files with zero diagnostics; contracts tests passed 14/14; scoped lint and TS format selected 26 files with zero findings. `quality:gate` and the separately contracted `arch:check` exited successfully. Contracts JSR audit reported only the sanctioned oRPC slow-types INFO. | Local gate output                                          |
| 2026-08-30 | slice 1 gate      | Full-export contracts doc lint has zero missing JSDoc but exits 1 on 11 `private-type-ref` diagnostics from the sanctioned oRPC-bound surface. This makes the planned final `public-doc-lint` PASS receipt unsatisfiable without a ruled gate change.                                                                 | `drift.md` D-1                                             |

## Slice 1 gate results

| Gate                           | Result   | Scope / evidence                                                                                                                                              |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structured check               | PASS     | Narrow contracts slice: 26 TypeScript files, zero diagnostics; includes the real-export `_type.ts` fixture.                                                   |
| Structured test                | PASS     | Narrow contracts suite: 14 passed, 0 failed; includes runtime storage, assertion-budget, and contracts doc-JSON independence tests.                           |
| Structured lint                | PASS     | Narrow contracts slice: 26 files, zero findings.                                                                                                              |
| Structured format              | PASS     | Narrow contracts TypeScript slice: 26 files, zero findings.                                                                                                   |
| Assertion budget               | PASS     | Committed scanner measured `contract-primitives.ts = 0`, `procedure-meta.ts = 0`; no angle-bracket assertions, imports in metadata, or explicit `any` tokens. |
| `quality:gate`                 | PASS     | Root contracted task; quality scan had zero findings and `arch:check` completed.                                                                              |
| `arch:check`                   | PASS     | Separately contracted root task; no FAIL findings. Existing WARN/INFO inventory remains.                                                                      |
| Contracts JSR audit            | PASS     | Exact `--root packages/contracts`; one sanctioned `F-JSR-7` oRPC slow-types INFO, no WARN/FAIL.                                                               |
| Contracts full-export doc lint | **FAIL** | Exact `deno task doc:lint --root packages/contracts --pretty`; 11 `private-type-ref`, 0 missing JSDoc, 0 other. See D-1.                                      |

The coordinator directed the complete eight-receipt set to be recorded at the committed slice head,
including terminal red receipts. Receipt outcomes and sufficiency are recorded in the slice PR
comment. No expensive gate was run.
