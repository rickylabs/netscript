# Evaluation: OMB wave-0 proofs

## Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `test-openapi-mcp-wave0-proofs--wave0`       |
| Target         | Wave-0 proof / measurement artifacts         |
| Archetype      | N/A — proof/measurement slice                |
| Scope overlays | service                                      |
| Evaluator      | Qwen 3.7 Max / high · IMPL-EVAL · 2026-08-04 |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                                         |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` committed at `1fc6e3935`; first implementation slice `a9a28c4d1` came after                                                                                        |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` section with public surface, domain vocabulary, ports, constants, commit slices, deferred scope, and contributor path                                                   |
| Commit slices match design plan        | PASS   | 5 slices (S0–S4) in design; 8 commits trace matches ordered plan: bootstrap `b0be3673e`, plan lock `1fc6e3935`, P1 `a9a28c4d1`, P2 `5b0ba26b5`, P3 `5c041bdfd`, hygiene `65ea2304a`              |
| Each slice has a passing gate          | PASS   | S0: scoped fmt PASS; S1: scoped check/lint/fmt PASS + Fable re-review APPROVED; S2: same + Fable re-review APPROVED; S3: fixture PASS + Fable APPROVED; S4: leak check + review-thread gate PASS |
| No speculative seams (unused files)    | PASS   | Two committed experiment files (`p1-post-allocation-manifest.ts`, `p2-measure-live-spec.ts`) each directly produce a committed evidence file                                                     |
| Constants used for finite vocabularies | PASS   | Design checkpoint names `ProofStatus`, `F1Outcome`, `EndpointManifest`, `P2Measurement`, `SpecUnavailableEnvelope`; experiments use them without hardcoded string literals for domain values     |

## Static Gates

| Gate             | Command or check                                            | Result | Evidence                                                                  | Notes                                                                                       |
| ---------------- | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Narrow typecheck | `run-deno-check.ts --root <run>/proofs --ext ts,tsx`        | PASS   | `filesSelected: 2`, `totalOccurrences: 0`, `exitCode: 0`                  | Two experiment files; zero type errors                                                      |
| Slice typecheck  | same                                                        | PASS   | same                                                                      |                                                                                             |
| Format           | `run-deno-fmt.ts --root <run> --ext ts,tsx,md`              | PASS*  | 32 files selected; 9 Markdown line-length findings in briefs/reviews      | Briefs/reviews have pre-existing long-line drift; verdict files and experiment source clean |
| Lint             | `run-deno-lint.ts --root <run>/proofs --ext ts,tsx`         | PASS   | `filesSelected: 2`, `totalOccurrences: 0`, `exitCode: 0`                  | Zero lint findings                                                                          |
| Doc lint         | N/A                                                         | N/A    | No package/plugin docs changed                                            |                                                                                             |
| Publish dry-run  | N/A                                                         | N/A    | No published surface changed                                              |                                                                                             |
| Link/path check  | Evidence files cross-referenced from verdicts               | PASS   | All 9 evidence files exist at committed paths; verdicts cite them by name | P3 fixture blob, repo head, and assertion lines independently verified                      |
| No lint ignores  | `deno-lint-ignore` scan in `<run>/proofs/experiments/`      | PASS   | Zero hits in both experiment files                                        |                                                                                             |
| Lock/scope       | `git diff --exit-code HEAD -- deno.lock packages/ plugins/` | PASS   | exit 0; no diff                                                           | Lock SHA unchanged at `264f029ec…`                                                          |

## Fitness Gates

| Gate | Function                     | Result | Evidence                                                      | Violations |
| ---- | ---------------------------- | ------ | ------------------------------------------------------------- | ---------- |
| F-1  | File-size lint               | PASS   | Two experiment files; no oversize artifact                    | none       |
| F-2  | Helper-reinvention scan      | PASS   | Experiments use `fetch`, `URL`, Web Crypto, Deno fs directly  | none       |
| F-3  | Layering check               | N/A    | No package source                                             |            |
| F-4  | Inheritance audit            | N/A    | No package source                                             |            |
| F-5  | Public surface audit         | N/A    | No published surface                                          |            |
| F-6  | JSR publishability gate      | N/A    | No package/plugin export change                               |            |
| F-7  | Doc-score gate               | N/A    | No package docs                                               |            |
| F-8  | Workspace `lib` override     | N/A    | No tsconfig change                                            |            |
| F-9  | Permission declaration       | PASS   | Experiment permissions match plan validation rows             | none       |
| F-10 | Test-shape audit             | N/A    | No new test file; existing fixture executed, not edited       |            |
| F-11 | Forbidden-folder lint        | PASS   | All artifacts under authorized `proofs/` paths                | none       |
| F-12 | Naming-convention lint       | PASS   | Files named by proof and purpose                              | none       |
| F-13 | Saga and runtime invariants  | N/A    | No saga/runtime change                                        |            |
| F-14 | Console-log lint             | N/A    | No product source                                             |            |
| F-15 | Re-export-of-upstream lint   | N/A    | No package export                                             |            |
| F-16 | Folder-cardinality lint      | PASS   | `proofs/experiments/` (2 files), `proofs/evidence/` (9 files) | none       |
| F-17 | Abstract-derived co-location | N/A    | No abstract types                                             |            |
| F-18 | Sub-barrel lint              | N/A    | No barrel exports                                             |            |
| F-19 | Scoped source gate runners   | PASS   | Scoped check/lint/fmt wrappers used                           | none       |

## Runtime Gates

| Gate                 | Validation                                                           | Result | Evidence                                                                                                                 |
| -------------------- | -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| P1 lifecycle         | Owned SQLite scaffold + allocation callback + description + teardown | FAIL   | `proofs/evidence/P1-runtime.json`: `users` Finished/exit 1; missing `--allow-ffi`; ambiguous HTTP 200 not reused         |
| P2 no-DB measurement | Fresh `--db none` scaffold + live spec fetch + measurement           | PASS   | `proofs/evidence/P2-no-db.json`: 3657 bytes, 3 dotted operationIds, no truncation exceedance, complete keyword inventory |
| P2 DB measurement    | Carried from P1 failure                                              | FAIL   | `proofs/evidence/P2-db-failure.json`: explicit FAIL, no rerun/wrap/reuse                                                 |
| P3 auth fixture      | Focused existing test rerun (evaluator-independent)                  | PASS   | `deno test … --filter …` exit 0; 1 passed, 0 failed, 1 filtered out; lines 60, 69, 78 verified                           |
| Resource leak check  | `agentic:leak-check` with run/worktree/owned-root                    | PASS   | Zero run-owned survivors; foreign entries untouched                                                                      |

## Consumer Gates

| Consumer                      | Validation                                    | Result | Evidence                                                         |
| ----------------------------- | --------------------------------------------- | ------ | ---------------------------------------------------------------- |
| Generated DB scaffold spec    | Measurement of live SQLite scaffold spec      | FAIL   | `P2-db-failure.json`: product permission defect blocks live spec |
| Generated no-DB scaffold spec | Measurement of live `--db none` scaffold spec | PASS   | `P2-no-db.json`: attributed, hash-verified, complete             |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                                                                 | Notes                                      |
| ----- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| AP-1  | CLEAR  | Two experiment files; largest evidence file is 3657 bytes                                                                                | No oversize artifact                       |
| AP-2  | CLEAR  | Experiments use `fetch`, `URL`, `crypto.subtle`, `Deno.readFile` directly                                                                | No abstract helper layer                   |
| AP-3  | N/A    | No package source                                                                                                                        |                                            |
| AP-4  | N/A    | No package source                                                                                                                        |                                            |
| AP-5  | N/A    | No barrel exports                                                                                                                        |                                            |
| AP-6  | N/A    | No published surface                                                                                                                     |                                            |
| AP-7  | N/A    | No plugin                                                                                                                                |                                            |
| AP-8  | N/A    | No package source                                                                                                                        |                                            |
| AP-9  | N/A    | No service registry                                                                                                                      |                                            |
| AP-10 | CLEAR  | P1/P2 explicit FAIL verdicts; skipped/incomplete mapped to FAIL; no silent fallback                                                      | D10 normalization applied                  |
| AP-11 | N/A    | No saga                                                                                                                                  |                                            |
| AP-12 | N/A    | No trigger                                                                                                                               |                                            |
| AP-13 | N/A    | No worker                                                                                                                                |                                            |
| AP-14 | N/A    | No stream                                                                                                                                |                                            |
| AP-15 | N/A    | No CLI command                                                                                                                           |                                            |
| AP-16 | N/A    | No scaffold template                                                                                                                     |                                            |
| AP-17 | N/A    | No Aspire resource                                                                                                                       |                                            |
| AP-18 | N/A    | No AI surface                                                                                                                            |                                            |
| AP-19 | N/A    | No docs change                                                                                                                           |                                            |
| AP-20 | CLEAR  | P1 manifest binds projectRoot + runId + service identity + allocated port; P3 attribution has repo head + fixture blob + assertion lines | Runtime coupling is explicit and auditable |
| AP-21 | N/A    | No generated plugin registry                                                                                                             |                                            |
| AP-22 | N/A    | No DB schema                                                                                                                             |                                            |
| AP-23 | N/A    | No migration                                                                                                                             |                                            |
| AP-24 | N/A    | No seed data                                                                                                                             |                                            |
| AP-25 | N/A    | No configuration surface                                                                                                                 |                                            |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                   |
| --------------------- | ----- | -------------------------------------------------------------------------- |
| New entries           | 0     | No doctrine debt from proof/measurement artifacts                          |
| Resolved entries      | 0     | No existing debt entry was touched                                         |
| Deepened violations   | 0     | No package/plugin source changed                                           |
| Unrecorded violations | 0     | Product defect (`--allow-ffi`) is a rescope to #1133, not debt in this run |

## Findings

| Severity | Finding                                                                                                                                                                   | Evidence                                                                                                                            | Required action                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| low      | 6 of 11 committed briefs lack the required `## SKILL` chapter (S1-fable-rereview, S2-fable-review, S2-fable-rereview, S2-no-db-rescope, S2-review-fixes, S3-fable-review) | `grep -L "## SKILL" briefs/*.md` returned 6 files; the protocol requires every implementation/evaluation/side-fix brief to carry it | Document for future runs; not blocking for this verdict |
| low      | Format check reports 9 Markdown line-length findings in briefs/review files (not in verdict or evidence files)                                                            | `run-deno-fmt.ts` findings in `briefs/S1-fable-rereview.md` et al.                                                                  | Pre-existing drift; not blocking for proof artifacts    |
| info     | Seed RFC §9 was modified (additive P1 verdict record + `<sub>` update) per plan scope                                                                                     | `git diff origin/main..HEAD -- .llm/runs/plan-openapi-mcp-plugin--seed/rfc.md`; plan §Scope explicitly authorizes it                | No action needed; additive decision record              |

## Proof Verdict Assessment

### P1 — Post-allocation endpoint manifest

The committed `P1-verdict.md` says explicit `FAIL` and selects qualified F1(b). Evidence supports
this:

- **Allocation callback worked**: manifest at `P1-runtime.json` has complete service identity,
  non-zero port 3001, loopback-name host, atomic write marker.
- **Owned-run coherence failed**: Aspire described `users` as `Finished`/exit 1 with
  `Unhealthy: endpoint not responding in the 200 range`. The service log shows
  `NotCapable: Requires ffi access to the libsql native module`.
- **Ambiguous HTTP 200 correctly excluded**: `attributedToOwnedService: false`,
  `listenerOwnershipEstablished: false`, `describeFetchOrderingPreciselyTimestamped: false`. The
  evidence records three candidate explanations and explicitly states this is not pass evidence.
- **F1(b) selection is truthful**: The seam itself produced correct values; the generated runtime's
  permission defect prevented coherence. F1(b) is causally qualified and revisitable.
- **Teardown verified**: zero owned processes, zero port listeners, zero containers remaining.

The P1 FAIL verdict is honest, evidence-backed, and satisfies the plan's proof-artifact scope. A
FAIL that discovers a real product defect is a successful proof.

### P2 — Live spec fidelity and size

The committed `P2-verdict.md` says explicit `FAIL` because D7 requires both DB and no-DB scaffolds.

- **No-DB branch PASS (independently)**: 3657-byte OpenAPI 3.1.1 document; three dotted
  operationIds; 73/89/88-byte discovery rows; all views measured in source and locally dereferenced
  form; no local/external/unresolved refs; no non-2xx responses; no common error envelope inferred
  (correctly, for this template); complete keyword inventory with context-blind limitation stated.
- **Raw spec hash verified**: file is 3657 bytes, sha256 `8f8cf105…` matches `P2-no-db.json`
  `sourceSpec.sha256` claim exactly.
- **Truncation comparison correct**: `maxArrayLength: 5` vs `maxItems: 50`; `maxStringLength: 34` vs
  `maxStringLength: 2000`; `wholeResultByteCeiling: null` correctly reported.
- **DB branch correctly carried forward**: `P2-db-failure.json` references `P1-runtime.json`,
  classifies as `generated-runtime-permission-defect`, records `--allow-ffi` missing. The
  unattributed P1 HTTP 200 was explicitly not reused.
- **Combined FAIL is the only truthful D7/D12 verdict**: a blocked required branch maps to FAIL, not
  partial PASS or NOT_RUN.
- **#1128 acceptance correctly unchecked**: the issue body's gate box remains `[ ]`.

The P2 FAIL verdict is honest. The no-DB measurement is sound, reproducible evidence. The DB branch
is not laundered. The combined verdict correctly fails.

### P3 — Auth-guarded spec fixture

The committed `P3-verdict.md` says `PASS`.

- **Fixture independently re-executed by this evaluator**:
  `deno test --allow-all --frozen packages/service/tests/auth/define-service-auth_test.ts --filter 'defineService auth option enforces 401, 403, and 200'`
  → exit 0; 1 passed, 0 failed, 1 filtered out.
- **Assertion lines verified at source**: line 60 (`assertEquals(unauthenticated.status, 401)`),
  lines 61–64 (exact `{error: UNAUTHORIZED, message: missing-credential}` envelope), line 69
  (`assertEquals(forbidden.status, 403)`), lines 70–73 (exact
  `{error: FORBIDDEN, message: authz.missing-scope:docs:read}` envelope), line 78
  (`assertEquals(allowed.status, 200)`).
- **D9 wording byte-identical**: the plan's D9 `spec_unavailable` text appears verbatim in the P3
  verdict.
- **No production-feature claim**: the verdict explicitly states the mapping is configuration
  guidance and does not claim authenticated-spec support exists.
- **Fixture not edited**:
  `git diff origin/main..HEAD -- packages/service/tests/auth/define-service-auth_test.ts` is empty.

The P3 PASS verdict is honest and fully supported.

## Close-Gate Verification

| Issue | Closing keyword in PR body | Acceptance box checked | Linked evidence                | Verdict |
| ----- | -------------------------- | ---------------------- | ------------------------------ | ------- |
| #1127 | `Closes #1127`             | yes                    | commit `a9a28c4d1`, P1 verdict | PASS    |
| #1128 | none (explicitly withheld) | no                     | no-DB partial evidence only    | PASS    |
| #1129 | `Closes #1129`             | yes                    | commit `5c041bdfd`, P3 verdict | PASS    |

The close-gate semantics are truthful. Only #1127 and #1129 carry closing keywords, and both have
linked committed evidence with checked acceptance boxes. #1128 is explicitly partial/open — its
acceptance box remains unchecked and no closing keyword is present. This is the correct behavior for
a proof run whose required DB measurement is unavailable.

## Lessons for Promotion

| Lesson                          | Pattern                                                                                              | Applies to        | Confidence |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------- | ---------- |
| Proof FAIL as product-discovery | Honest FAIL verdicts in proof runs expose product defects that trigger rescope to later waves        | proof/measurement | high       |
| Serialized owned-runtime method | Shared-host constraint requires exact owned-PID/port capture and verified teardown between scaffolds | service / Aspire  | high       |
| Brief SKILL chapter discipline  | Advisory review briefs need the same SKILL chapter as implementation/evaluation briefs               | all harness runs  | medium     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verdict   | `PASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Rationale | The approved deliverable — three empirical, committed Wave-0 verdict files — is complete and truthful. P1 and P2 are explicit FAIL verdicts supported by measured evidence; P3 is PASS supported by an independently re-executed fixture. The plan explicitly encoded FAIL as a valid, informative proof result, and the honest FAIL verdicts correctly discover a product defect (`--allow-ffi` permission) that triggers rescope to #1133. The close-gate is truthful: #1127 and #1129 carry closing keywords with linked evidence; #1128 correctly remains open. Static gates pass for touched TypeScript; no lint ignores were added; no package, plugin, lock, or seed-RFC normative surface was changed (the seed RFC update is an additive decision record per plan scope). Resource hygiene and review-thread gates pass. Two low-severity procedural findings (missing SKILL chapters in 6 advisory briefs, pre-existing Markdown line-length drift) are documented but not blocking. The proof run delivered exactly what it was scoped to deliver: honest, evidence-backed verdicts that correctly distinguish measured results from blocked branches without laundering. |
