# Worklog: SDK contribution conflict diagnostics

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-sdk-contribution-conflict-diagnostics--1349` |
| Branch         | `feat/sdk-contribution-conflict-diagnostics`       |
| Archetype      | `2 — Integration`                                  |
| Scope overlays | `none`                                             |

## Design

### Public Surface

- `SdkClientContributionDiagnostic.conflictingContributionId?` — earlier owner/opposing descriptor
  id while preserving the current claimant/offender in `contributionId`.
- `SdkClientContributionError.conflictingContributionId?` and `toJSON()` mirror the diagnostic.

### Domain Vocabulary

- claimant — the later descriptor currently being validated; remains `contributionId`.
- conflicting owner — the earlier descriptor that already reserved the id/context/header;
  `conflictingContributionId`.
- offending descriptor — the valid descriptor that triggers a non-ownership construction rejection.
- diagnostic id policy — validates only the stable public id syntax without accepting a descriptor.

### Ports

- None added or changed. The stable-v1 client adapter remains private.

### Constants

- Move `CONTRIBUTION_ID_PATTERN` unchanged into the role-named diagnostic-id policy module; do not
  change `CONTRIBUTION_FIELDS`, `RESERVED_HEADERS`, `RESERVED_CONTEXT_KEYS`, or the 16-contribution
  budget.

### Commit Slices

| # | Slice                                                | Gate                                                                                            | Files                                                                                                                                                                                                                                                                                                                   |
| - | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Prove deterministic contribution conflict identities | focused/full SDK tests, scoped static wrappers, doc A/B, dry-run, carrier cascade, quality/arch | `packages/sdk/src/client/errors.ts`, `packages/sdk/src/internal/client-contributions/{contribution-diagnostic-id,prepared-call}.ts`, `packages/sdk/src/desktop/application/desktop-rpc-client.ts`, `packages/sdk/tests/client-contribution-validation_test.ts`, this run dir, generated carrier outputs only if changed |

### Deferred Scope

- Docs paragraph — owned by active sibling PR #1922.
- Trace authorship — owned by active sibling PR #1921.
- Every unrelated #1350/#1351 and private-link surface — explicitly prohibited.

### Contributor Path

Read `SdkClientContributionDiagnostic` first, then follow its fields through `fail()` in
`prepared-call.ts`; construction rejection tests in `client-contribution-validation_test.ts` pin the
public role semantics.

## Progress Log

| Time       | Slice | Step                  | Notes                                                                                                                                    |
| ---------- | ----- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-02 | 1     | design checkpoint     | Audit consumed; public additive field and role semantics locked before source edits.                                                     |
| 2026-09-02 | 1     | PLAN-EVAL             | `N/A` — owner supplied the completed audit, exact gap, compatibility constraint, acceptance cases, file boundaries, and gates.           |
| 2026-09-02 | 1     | implementation        | Added claimant/owner diagnostics, meaningful pre-validation ids, and exact six-case tests.                                               |
| 2026-09-02 | 1     | quality review        | Extracted diagnostic-id policy after the first composite gate exposed a new 514-line F-1 warning; final `prepared-call.ts` is 499 lines. |
| 2026-09-02 | 1     | reconcile             | Live issue #1349 remains open at milestone 27 (0.0.7); no closing keyword is authorized; sibling boundaries remain unchanged.            |
| 2026-09-02 | 1     | implementation commit | `672b67b61` records the source, tests, harness design, and primary gate evidence.                                                        |
| 2026-09-02 | 1     | clean-tree publish    | SDK `deno publish --dry-run` passed and listed the intended package, including `contribution-diagnostic-id.ts`.                          |
| 2026-09-02 | 1     | carrier cascade       | All three generators passed; only the expected MCP export corpus/provenance changed.                                                     |
| 2026-09-02 | 1     | initial IMPL-EVAL     | Native Claude/Fable 5 medium returned PASS with one behavioral and one brief-bookkeeping observation, both non-blocking.                  |
| 2026-09-02 | 1     | precedence remediation | Restored baseline protocol-before-id rejection order using the non-throwing diagnostic id and added an exact doubly-invalid pin.         |
| 2026-09-02 | 1     | remediation gates     | Check/lint/fmt, 19 focused tests, 229 SDK tests, quality, and explicit architecture gates all pass; `prepared-call.ts` remains 499 lines. |

## Decisions

| Decision                             | Reason                                                       | Source          |
| ------------------------------------ | ------------------------------------------------------------ | --------------- |
| Optional `conflictingContributionId` | Additive and preserves all existing readers/semantics.       | `plan.md` D1–D3 |
| Valid ids only                       | Prevents misleading or unsafe synthetic descriptor identity. | `plan.md` D4    |

## Acceptance Diagnostics

| Case                     | Exact construction diagnostic                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate id             | `{code:"SDK_CONTRIBUTION_CONFLICT", phase:"construction", contributionId:"test:duplicate", conflictingContributionId:"test:duplicate"}`                          |
| Header ownership         | `{code:"SDK_CONTRIBUTION_CONFLICT", phase:"construction", contributionId:"test:header-claimant", conflictingContributionId:"test:owner", headerName:"x-tenant"}` |
| Context ownership        | `{code:"SDK_CONTRIBUTION_CONFLICT", phase:"construction", contributionId:"test:context-claimant", conflictingContributionId:"test:owner"}`                       |
| Unsupported family/major | `{code:"SDK_CONTRIBUTION_VERSION", phase:"construction", contributionId:"test:unsupported-version"}`                                                             |
| More than 16             | `{code:"SDK_CONTRIBUTION_LIMIT", phase:"construction", contributionId:"test:limit-16"}`                                                                          |
| Dependency/order field   | `{code:"SDK_CONTRIBUTION_INVALID", phase:"construction", contributionId:"test:<field>"}` for each rejected field                                                 |
| Desktop-incompatible     | `{code:"SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED", phase:"construction", contributionId:"test:desktop"}`                                                           |

## Drift

| Drift                                                           | Severity | Logged in drift.md |
| --------------------------------------------------------------- | -------- | ------------------ |
| `rtk` is not installed/on PATH                                  | minor    | yes                |
| Owner requires non-draft PR rather than harness bootstrap draft | minor    | yes                |

## Gate Results

### Static Gates

| Gate           | Command or check                                                                                  | Result                          | Notes                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| SDK check      | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx` | PASS, exit 0                    | 102 files, 1 batch, 0 failed batches/diagnostics.                             |
| SDK lint       | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/sdk --ext ts,tsx`  | PASS, exit 0                    | 102 selected/processed, 0 findings.                                           |
| SDK format     | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts,tsx`   | PASS, exit 0                    | 102 selected/processed, 0 findings.                                           |
| JSDoc examples | `deno task docs:jsdoc-examples`                                                                   | PASS, exit 0                    | 2,040 files; 358 examples; 357 checked; `unboundName=116`, unchanged ceiling. |
| Doc lint A/B   | full SDK export map via `deno doc --lint` on `origin/main` and worktree                           | BASELINE exit 1; CURRENT exit 1 | Same 3 pre-existing `private-type-ref` diagnostics; new diagnostics = 0.      |

### Fitness Gates

| Gate         | Result       | Evidence                                                | Notes                                                                                                                           |
| ------------ | ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Code quality | PASS, exit 0 | `deno task quality:gate`                                | Repository scanner findings 0; 7 existing allowances; composite architecture gate passed.                                       |
| Architecture | PASS, exit 0 | `deno task arch:check`                                  | SDK has no new F-1 warning; remaining SDK F-16/A9 notices pre-exist.                                                            |
| JSR audit    | PASS, exit 0 | clean-tree `deno publish --dry-run` from `packages/sdk` | Intended file list; no slow-type or metadata failure. The first pre-commit invocation exited 1 only because the tree was dirty. |

### Runtime Gates

| Gate                              | Result       | Evidence           | Notes                                                       |
| --------------------------------- | ------------ | ------------------ | ----------------------------------------------------------- |
| Focused contribution construction | PASS, exit 0 | structured wrapper | 19 passed, 0 failed, 0 ignored.                             |
| Full SDK package                  | PASS, exit 0 | structured wrapper | 229 passed, 0 failed, 0 ignored.                            |
| External runtime                  | N/A          | owner boundary     | No Aspire, Docker, browser, or E2E gate applies or was run. |

### Consumer Gates

| Consumer                          | Result       | Evidence                                                             | Notes                                                                                                               |
| --------------------------------- | ------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@netscript/sdk/client` type/docs | PASS         | check + doc A/B + examples                                           | Additive optional field; zero new doc diagnostics.                                                                  |
| publish dry-run                   | PASS, exit 0 | clean-tree exact command after commit `672b67b61`                    | Listing emitted on stderr and ended `Success Dry run complete`.                                                     |
| carrier cascade                   | PASS, exit 0 | `gen:assets-barrel` → `gen:publish-assets` → `gen:mcp-export-corpus` | Corpus SHA-256 `2899a7da...a9c9`; 35 packages, 272 subpaths, 7,803 symbols; only expected generated corpus changed. |
| lock hygiene                      | PASS         | `sha256sum deno.lock`                                                | `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`; unchanged.                                      |

## Handoff Notes

- Evaluator should inspect claimant/owner orientation first, then all six measured construction
  diagnostics, exact `toJSON()` shapes, and redaction.
- Acceptance-evidence block is supportable: audit rows 1–6 and 8–10 remain SHIPPED without edits;
  this slice closes row 7 with exact structured/JSON assertions and full green package gates.
