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
| 2026-08-30 | migration freeze  | Preserved the exact-head eight-receipt set at `c9a391811`: five PASS receipts and three terminal FAIL receipts. The red receipts capture the SDK README doctest `BaseMeta` mismatch and public doc-lint private-type findings; they are durable evidence for the resumed bounded repair, not a green sign-off. | `receipts/*.json`; NAS recovery checkpoint commit          |
| 2026-08-30 | repair archive    | Moved all eight attempt-1 receipts unchanged into `receipts/frozen-c9a391811/` before touching the repair. They remain append-only terminal evidence for the pre-repair content head and are not current proof.                                                                                 | Archive commit `9649b349cda5372838df20f4f17811d79c77e1e6` |
| 2026-08-30 | repair content    | Re-pinned the SDK doctest metadata guard to public `BaseContractMeta`; temporarily restored the stale empty-meta expectation and observed the required `TS2344`, then restored the correct exact-equality pin. Exported the NetScript-owned `BaseContractErrors` alias without re-exporting upstream oRPC types. | Content commit `3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d` |
| 2026-08-30 | repair validation | Focused SDK doctest passed 3/3. The committed contracts assertion scanner passed 4/4 and re-measured `contract-primitives.ts = 0`, `procedure-meta.ts = 0`; no SDK assertion scanner exists in slice 1. Exact public doc lint measured base 12, pre-repair 14, repaired 13; the public alias exposes fresh `MergedErrorMap` and `commonErrorMap` references, so the bounded repair leaves delta +1 and stops. | Focused wrapper output; corrected `drift.md` D-1           |
| 2026-08-30 | receipt recut     | Recut all eight named receipts with `--attempt 2` at content head `3c3f9b7c`; every `gitHead` equals `actualGitHead`. Six PASS; root `test` FAIL (4246 pass, 2 unrelated agentic failures, 19 ignored); `public-doc-lint` FAIL (13 findings). Explicit eight-file computation is `INSUFFICIENT` for those two FAIL receipts. Contracts JSR audit is supplemental PASS with one sanctioned INFO. | `receipts/*-final.json`; `audit/contracts.json`             |
| 2026-08-30 | repair cycle 2 AF-1 | Replaced the annotation-derived tautology with an unannotated inference probe over the actual `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` expression. Exact inferred metadata and error-map types are pinned to public `BaseContractMeta` and `BaseContractErrors`. A temporary `Record<never, never>` expectation failed with `TS2344: Type 'false' does not satisfy the constraint 'true'`, then was restored. | Content commit `64350c5af6109b8c5619520fac69b8369c062a0b` |
| 2026-08-30 | repair cycle 2 AF-2 | Published the NetScript-owned `commonErrorMap` value and `CommonErrorMap` type with ownership JSDoc. The public alias uses the existing public NetScript error vocabulary and does not re-export upstream oRPC names. Exact doc-lint counts are base 12, pre-repair 14, cycle 1 13, cycle 2 12; final incremental cost is 0. | Content commits `c57cac676920d6390d3748ef70ef5f5d0671c794`, `bb1a489ace2c162c1caca065fc2762d7807330d0`; `drift.md` D-1 |
| 2026-08-30 | repair cycle 2 AF-3 | Recut root `test` serially under quiet load. The fd-exhaustion failure cleared; one unrelated hybrid-launcher cancellation test remains red (4248 pass, 1 fail, 19 ignored). No `.llm/tools` files were changed. | `receipts/test-final.json`; `drift.md` D-6 |
| 2026-08-30 | receipt recut cycle 2 | Recut all eight named receipts with `--attempt 3` at content head `bb1a489a`; every `gitHead` equals `actualGitHead`. Six PASS; root `test` and baseline-red `public-doc-lint` are terminal FAIL. Exact eight-file computation is `INSUFFICIENT` for those two FAIL receipts only. Contracts JSR audit is supplemental PASS with one sanctioned INFO. | `receipts/*-final.json`; `audit/contracts.json` |
| 2026-08-30 | repair cycle 3 docs | Completed the contracts reference's published-symbol inventory for `commonErrorMap`, `CommonErrorMap`, `BaseContractErrors`, `BaseContractMeta`, `NetScriptAuthenticationRequirement`, and `NetScriptProcedureMeta`, including ownership, compatibility, and the unsupported-mutation warning for the shared singleton. `deno task docs:exports-drift` then exited 0 at the committed content head. | Content commit `235482767edd8a9793c9d6bf6f766441c51ef313`; `audit/docs-exports-drift.txt`; `drift.md` D-7 |
| 2026-08-30 | receipt recut cycle 3 | Recut all eight named receipts serially with `--attempt 4` at content head `23548276`; every `gitHead` equals `actualGitHead`. Six PASS; root `test` retains only the ruled zombie-sensitive hybrid-launcher failure, and `public-doc-lint` retains the 12-finding main baseline. Exact eight-file computation remains `INSUFFICIENT` for those two FAIL receipts. | `receipts/*-final.json` |

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

The host migration freezes this lane at the pushed receipt checkpoint. On the NAS, resume from the
remote branch, retain the red evidence, apply only the already-bounded SDK/doctest and adapter-boundary
repair, then regenerate exact-head receipts before Tier-A review and IMPL-EVAL.

## Repair receipt results — cycle 1

Content head: `3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d`.

| Receipt | Outcome | Attempt | Head attestation |
| --- | --- | ---: | --- |
| `check-final.json` | PASS | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |
| `lint-final.json` | PASS | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |
| `fmt-check-final.json` | PASS | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |
| `test-final.json` | FAIL | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |
| `public-doc-lint-final.json` | FAIL | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |
| `quality-gate-final.json` | PASS | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |
| `arch-check-final.json` | PASS | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |
| `publish-dry-run-final.json` | PASS | 2 | `gitHead == actualGitHead == 3c3f9b7c…` |

Sufficiency was recomputed over those eight explicit files, not a glob. Gate IDs and invocation IDs
are unique. Verdict: **INSUFFICIENT** because `test` and `public-doc-lint` are terminal FAIL; there
are no missing, duplicate, contradictory, nonterminal, or head-mismatched receipts.

## Repair receipt results — cycle 2

Content head: `bb1a489ace2c162c1caca065fc2762d7807330d0`.

| Receipt | Outcome | Attempt | Head attestation |
| --- | --- | ---: | --- |
| `check-final.json` | PASS | 3 | `gitHead == actualGitHead == bb1a489a…` |
| `lint-final.json` | PASS | 3 | `gitHead == actualGitHead == bb1a489a…` |
| `fmt-check-final.json` | PASS | 3 | `gitHead == actualGitHead == bb1a489a…` |
| `test-final.json` | FAIL | 3 | `gitHead == actualGitHead == bb1a489a…` |
| `public-doc-lint-final.json` | FAIL | 3 | `gitHead == actualGitHead == bb1a489a…` |
| `quality-gate-final.json` | PASS | 3 | `gitHead == actualGitHead == bb1a489a…` |
| `arch-check-final.json` | PASS | 3 | `gitHead == actualGitHead == bb1a489a…` |
| `publish-dry-run-final.json` | PASS | 3 | `gitHead == actualGitHead == bb1a489a…` |

Sufficiency was recomputed over those eight literal paths, not a glob. Gate IDs and invocation IDs
are unique, and every receipt is terminal and exact-head. Verdict: **INSUFFICIENT** because `test`
and `public-doc-lint` did not pass; there are no missing, duplicate, contradictory, nonterminal, or
head-mismatched receipts. The contracts assertion scanner re-measured
`contract-primitives.ts = 0` and `procedure-meta.ts = 0`. The supplemental contracts JSR audit
passes with one sanctioned oRPC slow-types INFO and remains outside the named eight.

## Repair receipt results — cycle 3

Content head: `235482767edd8a9793c9d6bf6f766441c51ef313`.

| Receipt | Outcome | Attempt | Head attestation |
| --- | --- | ---: | --- |
| `check-final.json` | PASS | 4 | `gitHead == actualGitHead == 23548276…` |
| `lint-final.json` | PASS | 4 | `gitHead == actualGitHead == 23548276…` |
| `fmt-check-final.json` | PASS | 4 | `gitHead == actualGitHead == 23548276…` |
| `test-final.json` | FAIL | 4 | `gitHead == actualGitHead == 23548276…` |
| `public-doc-lint-final.json` | FAIL | 4 | `gitHead == actualGitHead == 23548276…` |
| `quality-gate-final.json` | PASS | 4 | `gitHead == actualGitHead == 23548276…` |
| `arch-check-final.json` | PASS | 4 | `gitHead == actualGitHead == 23548276…` |
| `publish-dry-run-final.json` | PASS | 4 | `gitHead == actualGitHead == 23548276…` |

Sufficiency was recomputed over the eight literal paths. Gate IDs and invocation IDs are unique,
and every receipt is terminal and exact-head. Verdict: **INSUFFICIENT** because `test` and
`public-doc-lint` did not pass; there are no missing, duplicate, contradictory, nonterminal, or
head-mismatched receipts. The supplemental `docs:exports-drift` check exits 0 and remains outside
the approved named set.

## Repair cycle 4 — IMPL-EVAL `FAIL_FIX`

Content head: `42874803e572a5746834880e387501f0948c7362`.

### Finding repairs

| Finding | Repair |
| --- | --- |
| F-1 | `BaseContractErrors` now references the public `CommonErrorMap` type, while the mutable `commonErrorMap` value is withdrawn from the public root and its docs inventory row is removed. No upstream type was re-exported and the value was not frozen as a substitute. |
| F-2 | The assertion-budget test requires the stripped `contract-primitives.ts` source to contain `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` exactly once. D-5 now distinguishes the expression-inference pin from this real-initializer text pin. |
| F-3 | The inference test header states why this test reaches into `src/` for the now-private real error-map value. |
| F-4 | The reference row now matches `deno doc`: `type BaseContract = typeof baseContract`. |
| F-5 | `supervisor.md` records the leaf lane table, the lost cycles 1–3 Codex thread, cycle 4 thread, and both separate evaluator sessions. |

### F-2 perturbation evidence

With the committed assertion present, the real initializer was temporarily changed to
`oc.$meta<Record<never, never>>({}).errors(commonErrorMap)`. Running
`deno test --allow-read packages/contracts/tests/assertion-budget_test.ts` exited 1:

```text
base contract initializer remains pinned to NetScript procedure metadata ... FAILED
[Diff] Actual / Expected
-   0
+   1
FAILED | 4 passed | 1 failed
```

The initializer was restored. The same focused suite then passed 5/5, and the full supplemental
contracts run passed 16/16 at the content head.

### Public-surface measurements

- `deno task docs:exports-drift`: exit 0 at the content head.
- Public doc lint before F-1: 12 findings in the frozen `235482767` receipt.
- Public doc lint after F-1: 12 findings in the attempt-5 receipt.
- Sorted finding-set comparison: identical; the 12 pairs are recorded under
  `audit/public-doc-lint-cycle4.txt`.

### Receipt recut and sufficiency

The attempt-4 receipts were moved byte-for-byte, before recutting, into the new append-only
`receipts/frozen-235482767/` archive. All eight contracted paths were then explicitly recut through
`run-gate.ts` at `42874803e572a5746834880e387501f0948c7362`; every receipt records
`gitHead == actualGitHead` at that content head.

| Receipt | Outcome | Attempt | Head attestation |
| --- | --- | ---: | --- |
| `check-final.json` | PASS | 5 | `gitHead == actualGitHead == 42874803…` |
| `lint-final.json` | PASS | 5 | `gitHead == actualGitHead == 42874803…` |
| `fmt-check-final.json` | PASS | 5 | `gitHead == actualGitHead == 42874803…` |
| `test-final.json` | SKIPPED (R-1 policy) | 5 | `gitHead == actualGitHead == 42874803…` |
| `public-doc-lint-final.json` | FAIL (12, baseline-red/delta-0) | 5 | `gitHead == actualGitHead == 42874803…` |
| `quality-gate-final.json` | PASS | 5 | `gitHead == actualGitHead == 42874803…` |
| `arch-check-final.json` | PASS | 5 | `gitHead == actualGitHead == 42874803…` |
| `publish-dry-run-final.json` | PASS | 5 | `gitHead == actualGitHead == 42874803…` |

R-1 forbids another root `test` execution on this host. Because `run-gate.ts` cannot create an
honest new FAIL without executing the command, the current exact-head receipt records a policy
`SKIPPED` outcome and points to `frozen-235482767/test-final.json`, which retains the terminal
host-baseline FAIL. No result was fabricated and root `test` was not retried.

Sufficiency was recomputed over the eight literal paths, not a glob. Gate IDs and invocation IDs are
unique, every receipt is terminal and exact-head, and the verdict is **INSUFFICIENT** because
`public-doc-lint` did not pass (`FAIL`) and root `test` did not pass (`SKIPPED` under R-1). The
machine result is recorded in `audit/evidence-sufficiency-cycle4.json`.
