# Worklog: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1` |
| Branch         | `fix/sdk-typed-error-channel`              |
| Archetype      | `1 — Small Contract` slice                 |
| Scope overlays | `docs`                                     |

## Design

### Public surface

- Existing: `baseContract`, `BaseContract`, `BaseContractRoute`, `BaseContractOutputRoute` — exact
  error/meta generics corrected in place.
- Existing: `DefinedError`, `SafeSuccess`, `SafeFailure`, `SafeResult`, `safe`, `isDefinedError`,
  and `ServiceClient*` — exact error channel corrected in place.
- Existing contract builder metadata slot stays explicitly `Record<never, never>`; no metadata
  vocabulary, initialization, or export is introduced.
- No internal helper, adapter, upstream module, or additional subpath becomes public.

### Domain vocabulary

- `BaseContractErrors` — exact `typeof commonErrorMap` merge, not open `ErrorMap`.
- `DefinedErrorLike` — private structural extraction boundary matching the upstream error identity
  without exporting the upstream class.
- `NarrowDefined<TError>` — private conditional type retaining the original code/data members and
  adding the runtime-proven `defined: true` marker.
- `SafeResult<TOutput,TError>` — success, non-defined failure, and defined failure discriminated by
  `isSuccess`/`isDefined`.
- No metadata domain vocabulary in this leaf; #1466 owns it.

### Ports

- No new port. The existing `ServiceClient` contract in `src/ports/service-client.ts` must retain
  the promise error identity; inventing a parallel port in `errors.ts` would not repair end-to-end
  flow.

### Constants

- No new constants. The six existing common error-map keys remain the complete vocabulary.

### Commit slices

See `plan.md` “Commit slices.” All implementation slices are blocked pending fresh Tier-A review and
PLAN-EVAL PASS.

### Deferred scope

- Client contributions, transport changes, new codes, server raising behavior, oRPC v2, plugin-local
  base-contract erasures, and broad soundness cleanup.

### Contributor path

Future contract error additions update the private explicit `CommonErrorMap` shape and its
`commonErrorMap` value together; the explicit annotation is required by `isolatedDeclarations`
because the published builder references `typeof commonErrorMap`. The real-export fixture then
forces the exact key union to stay synchronized. No code union or metadata vocabulary is exported.

## Progress log

| Time       | Slice | Step               | Notes                                                                                                                                         |
| ---------- | ----- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Plan  | Bootstrap/research | Re-baselined exact branch/base; read required skills, doctrine, harness, Accepted RFC, issues, and docs.                                      |
| 2026-08-15 | Plan  | Public inspection  | `deno doc` confirmed current `safe`, `isDefinedError`, `SafeResult`, and `baseContract` signatures.                                           |
| 2026-08-15 | Plan  | RED                | Executed TS2339 `error.code` on `never` with `deno eval --check --unstable-kv`.                                                               |
| 2026-08-15 | Plan  | Consumer scan      | Executed whole-repo searches; identified `@netscript/fresh`, CRUD, query/desktop/type fixtures, CLI/template, docs, and baseline consumers.   |
| 2026-08-15 | Plan  | Rescope            | Required out-of-scope `service-client.ts`; conditional contracts barrel; live #1466 ownership conflict. Stopped all product work.             |
| 2026-08-15 | Plan  | Amendment          | Coordinator authorized the sixth client-port path, assigned metadata vocabulary to #1466, denied the barrel, and locked six paths.            |
| 2026-08-15 | Eval  | PLAN-EVAL          | Terminal PASS at `f76a3c45b`; incorporated advisories A1-A5 without editing the evaluator artifact.                                           |
| 2026-08-15 | S1    | RED                | Real-export fixture recorded TS18046 (`unknown`) and TS2339 (`never`) together in one structured run; not rerun for tidier output.            |
| 2026-08-15 | S1    | Builder            | Exact `typeof commonErrorMap` error generic and explicit `Record<never, never>` fourth slot; no metadata vocabulary or new export.            |
| 2026-08-15 | S1    | Fixture            | Uses contracts-root `CursorPaginationInputSchema` and `SuccessSchema`; asserts six keys, undeclared rejection, and empty meta slot.           |
| 2026-08-15 | S1    | Gates              | Focused structured check/test/lint/format pass; CRUD and workers soundness consumers included. Root/final-slice gates not run.                |
| 2026-08-15 | S1    | Tier-A             | Fresh Tier-A PASS at `dc034d680`; coordinator authorized S2 only.                                                                             |
| 2026-08-15 | S2    | Public inspection  | `deno doc` confirmed upstream `ClientPromiseResult`, `ErrorFromErrorMap`, `ThrowableError`, and literal `SafeResult` arms before source edit. |
| 2026-08-15 | S2    | Error channel      | Defaulted three-parameter `ServiceClientMethod` carries the real error map; `SafeFailure<TError = ThrowableError>` retains its default.       |
| 2026-08-15 | S2    | Assertions         | Removed both S2 suppressions and replaced them with exact code-union/defined-error assertions plus code-specific data and plain-error guards. |
| 2026-08-15 | S2    | Consumers          | Checked query, desktop, RFC, assignability, service-query, and Fresh consumers; ran SDK query/desktop plus Fresh extraction tests.            |
| 2026-08-15 | S2    | Reconcile          | Observed S1 Tier-A PASS; no issue/label/checklist mutation, no #1348/#1466 touch, no scope adjustment, and S3 remains blocked.                |
| 2026-08-15 | S3    | Narrative          | Both published pages now scope contract typing to input/output/declared errors and keep transport/arbitrary throws on the non-defined branch. |
| 2026-08-15 | S3    | Examples           | Literal `isSuccess` then `isDefined` branches terminate every failure path; all six codes and code-selected schema data are shown.            |
| 2026-08-15 | S3    | Compile proof      | SDK fence passed `docs:snippets`; discover Step 3/4 and copyable function passed page-isolated checks with a real `baseContract` fixture.     |
| 2026-08-15 | S3    | Gates              | Source format, accuracy, source/rendered links, caveats, build, doctest, and focused example compilation passed; final gates remain S4-only.  |

## Gate results

| Gate                                  | Result                                 | Evidence                                                                       |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| Current SDK raw publish dry-run       | PASS (baseline inspection only)        | `deno publish --dry-run --allow-dirty`, exit 0; no actual slow-type diagnostic |
| Current contracts raw publish dry-run | PASS with sanctioned slow-type warning | `deno publish --dry-run --allow-dirty --allow-slow-types`, exit 0              |
| Current JSR audit                     | KNOWN RED / INFO                       | SDK `F-DOCT-5`; contracts sanctioned slow-type INFO; not leaf verdicts         |
| S1 RED                                | EXPECTED FAIL                          | Exactly TS18046 + TS2339 in one structured check                               |
| S1 focused check                      | PASS                                   | 4 files, 1 batch, 0 diagnostics; includes CRUD + workers consumer              |
| S1 focused test                       | PASS                                   | 3/3 results; SDK doctest + workers health soundness                            |
| S1 focused lint                       | PASS                                   | 2 edited TS files, 0 findings                                                  |
| S1 focused format write/check         | PASS                                   | 2 edited TS files, 0 findings; final check clean                               |
| S2 focused check                      | PASS                                   | 15 affected files, 1 batch, 0 diagnostics                                      |
| S2 focused/consumer tests             | PASS                                   | 12/12 results across 4 test files                                              |
| S2 focused lint                       | PASS after one recorded correction     | Initial 2 `verbatim-module-syntax`; final 3 files, 0 findings                  |
| S2 focused format write/check         | PASS                                   | 3 edited TS files, 0 findings                                                  |
| S3 docs source format                 | PASS                                   | Structured receipt; exit 0, `Docs source format: OK`                           |
| S3 docs accuracy                      | PASS                                   | Structured receipt; 199 published source pages checked                         |
| S3 SDK snippet compile                | PASS                                   | 36 Tier-1 candidates, 22 checked, 14 existing exemptions                       |
| S3 discover example compile           | PASS                                   | Step 3/4 pair and end-to-end function; real base-contract fixture              |
| S3 SDK doctest                        | PASS                                   | 3/3 results                                                                    |
| S3 source links                       | PASS                                   | 103 docs; 0 broken links, anchors, or orphans                                  |
| S3 site verify                        | PASS                                   | Build, rendered-output, rendered links, and caveats; raw exit 0                |
| S3 scope/lock hygiene                 | PASS                                   | Four landed product/test files and `deno.lock` unchanged                       |
| Root/final-slice gates                | NOT RUN                                | Explicitly reserved for slice 4                                                |

### S1 structured JSON verdicts

The RED fixture was checked once before product implementation:

```json
{
  "exitCode": 1,
  "command": "deno check --unstable-kv <files>",
  "selection": { "filesSelected": 1, "batches": 1, "failedBatches": 1 },
  "summary": {
    "totalOccurrences": 2,
    "uniqueOccurrences": 2,
    "uniqueCodes": 2,
    "uniquePaths": 1
  },
  "groups": [
    {
      "code": "TS18046",
      "message": "'discriminated.error' is of type 'unknown'.",
      "count": 1,
      "location": "packages/sdk/tests/readme-doctest_test.ts:21:5"
    },
    {
      "code": "TS2339",
      "message": "Property 'code' does not exist on type 'never'.",
      "count": 1,
      "location": "packages/sdk/tests/readme-doctest_test.ts:26:19"
    }
  ]
}
```

Two post-change check iterations failed and were fixed rather than hidden:

```json
{
  "exitCode": 1,
  "command": "deno check --unstable-kv <files>",
  "selection": { "filesSelected": 4, "batches": 1, "failedBatches": 1 },
  "summary": { "totalOccurrences": 2, "uniqueCodes": 2, "uniquePaths": 1 },
  "groups": [
    { "code": "TS9010", "count": 1, "location": "contract-primitives.ts:21:7" },
    { "code": "TS9027", "count": 1, "location": "contract-primitives.ts:21:7" }
  ],
  "resolution": "Added an exact private CommonErrorMap annotation required by isolatedDeclarations."
}
```

```json
{
  "exitCode": 1,
  "command": "deno check --unstable-kv <files>",
  "selection": { "filesSelected": 4, "batches": 1, "failedBatches": 1 },
  "summary": { "totalOccurrences": 1, "uniqueCodes": 1, "uniquePaths": 1 },
  "groups": [
    { "code": "TS2322", "count": 1, "location": "contract-primitives.ts:54:7" }
  ],
  "resolution": "Removed a redundant satisfies expression whose contextual type widened literal values; oc.errors still enforces ErrorMap compatibility."
}
```

Final focused check:

```json
{
  "exitCode": 0,
  "command": "deno check --unstable-kv <files>",
  "selection": { "filesSelected": 4, "batches": 1, "failedBatches": 0 },
  "summary": {
    "totalOccurrences": 0,
    "uniqueOccurrences": 0,
    "uniqueCodes": 0,
    "uniquePaths": 0
  },
  "groups": []
}
```

Focused tests:

```json
{
  "exitCode": 0,
  "command": [
    "deno",
    "test",
    "--reporter=tap",
    "--allow-all",
    "packages/sdk/tests/readme-doctest_test.ts",
    "plugins/workers/services/src/routers/health-soundness_test.ts"
  ],
  "summary": {
    "passed": 3,
    "failed": 0,
    "ignored": 0,
    "totalResults": 3,
    "uniqueFailures": 0
  },
  "failures": []
}
```

Focused lint:

```json
{
  "exitCode": 0,
  "selection": { "filesSelected": 2, "batches": 1 },
  "summary": {
    "totalOccurrences": 0,
    "uniqueOccurrences": 0,
    "uniqueRules": 0,
    "uniquePaths": 0
  },
  "groups": []
}
```

Focused format write and final check:

```json
{
  "exitCode": 0,
  "command": "deno fmt",
  "mode": "write",
  "summary": {
    "filesSelected": 2,
    "batches": 1,
    "failedBatches": 0,
    "findings": 0,
    "ignoredFindings": 0
  },
  "findings": []
}
```

```json
{
  "exitCode": 0,
  "command": "deno fmt --check",
  "mode": "check",
  "summary": {
    "filesSelected": 2,
    "batches": 1,
    "failedBatches": 0,
    "findings": 0,
    "ignoredFindings": 0
  },
  "findings": []
}
```

### S2 structured JSON verdicts

Final focused check, including SDK query/desktop/RFC/assignability/service-query consumers and the
Fresh error-extraction consumer:

```json
{
  "exitCode": 0,
  "command": "deno check --unstable-kv <files>",
  "selection": { "filesSelected": 15, "batches": 1, "failedBatches": 0 },
  "summary": {
    "totalOccurrences": 0,
    "uniqueOccurrences": 0,
    "uniqueCodes": 0,
    "uniquePaths": 0
  },
  "groups": []
}
```

Final focused and consumer tests:

```json
{
  "exitCode": 0,
  "command": [
    "deno",
    "test",
    "--reporter=tap",
    "--allow-all",
    "packages/sdk/tests/readme-doctest_test.ts",
    "packages/sdk/tests/query/query-factory_test.ts",
    "packages/sdk/tests/desktop/desktop-rpc-client_test.ts",
    "packages/fresh/src/diagnostics/error/extract_test.ts"
  ],
  "summary": {
    "passed": 12,
    "failed": 0,
    "ignored": 0,
    "totalResults": 12,
    "uniqueFailures": 0
  },
  "failures": []
}
```

The first lint run failed and was corrected rather than hidden:

```json
{
  "exitCode": 1,
  "selection": { "filesSelected": 3, "batches": 1 },
  "summary": {
    "totalOccurrences": 2,
    "uniqueOccurrences": 2,
    "uniqueRules": 1,
    "uniquePaths": 1
  },
  "groups": [
    {
      "rule": "verbatim-module-syntax",
      "message": "Import identifier only used in types",
      "count": 2,
      "path": "packages/sdk/tests/readme-doctest_test.ts",
      "locations": ["4:3", "6:3"]
    }
  ],
  "resolution": "Marked both exported schema imports type-only."
}
```

Final focused lint:

```json
{
  "exitCode": 0,
  "selection": { "filesSelected": 3, "batches": 1 },
  "summary": {
    "totalOccurrences": 0,
    "uniqueOccurrences": 0,
    "uniqueRules": 0,
    "uniquePaths": 0
  },
  "groups": []
}
```

Final focused format write and check:

```json
{
  "exitCode": 0,
  "command": "deno fmt",
  "mode": "write",
  "summary": {
    "filesSelected": 3,
    "batches": 1,
    "failedBatches": 0,
    "findings": 0,
    "ignoredFindings": 0
  },
  "findings": []
}
```

```json
{
  "exitCode": 0,
  "command": "deno fmt --check",
  "mode": "check",
  "summary": {
    "filesSelected": 3,
    "batches": 1,
    "failedBatches": 0,
    "findings": 0,
    "ignoredFindings": 0
  },
  "findings": []
}
```

The S2 doctest-only run also passed 3/3 before the broader 12-test consumer run. The S1 RED block
above was not edited or rerun. `typed-queue_test.ts` was not selected, so #1667 was not encountered.
Root/final-slice gates were not run.

### S3 disposition receipt

| Planned location                      | Disposition                   | Final location and wording                                                                                                                                                                                   |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sdk.md:12-20`                        | Retained with required scope  | `sdk.md:12-22` now limits non-drift to input, output, and declared-error types; transport/arbitrary throws are explicitly non-defined failures.                                                              |
| `sdk.md:31-38`                        | Retained and corrected        | `sdk.md:33-41` says the L1 method's input, output, and declared-error union are inferred from the contract.                                                                                                  |
| `sdk.md:58-70`                        | Retained and corrected        | `sdk.md:61-71` says `baseContract` error schemas flow through the client promise and `safe()`, while runtime non-defined failures remain outside the contract.                                               |
| `sdk.md:113-114`                      | Retained with cross-reference | `sdk.md:118-120` scopes direct-call inference to input/output/declared errors and points rejecting calls to the `safe()` section.                                                                            |
| `sdk.md:196-198`                      | Replaced completely           | `sdk.md:203-249` names all six codes, branches on literal `isSuccess` then `isDefined`, throws non-defined failures, demonstrates `NOT_FOUND` schema data, and scopes `isDefinedError`.                      |
| `discover-services.md:9-14`           | Retained with required scope  | `discover-services.md:11-15` names input/output/declared errors and keeps discovery/transport failures non-defined.                                                                                          |
| `discover-services.md:96-101,114-115` | Retained and corrected        | `discover-services.md:99-118` states `baseContract` carries the six errors and the call comment includes declared-error inference; the prerequisite row also names declared errors.                          |
| `discover-services.md:135-154`        | Replaced completely           | `discover-services.md:137-176` names all six codes, uses literal discriminants, terminates every failure, demonstrates `NOT_FOUND` schema data, and scopes `isDefinedError`.                                 |
| `discover-services.md:205-229`        | Replaced completely           | `discover-services.md:227-264` makes the copyable function return only from `isSuccess`, throws the non-defined branch, and demonstrates `VALIDATION_ERROR` schema data before throwing the defined failure. |

### S3 structured JSON verdicts

Final source-format receipt:

```json
{
  "gateId": "docs-source-format",
  "invocationId": "fix-sdk-typed-error-channel-s3-source-format-final",
  "gitHead": "ca7ade409be0cc0c064e75f5bfa1bd109e06d013",
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 444,
  "stdout": "Docs source format: OK"
}
```

Final docs-accuracy receipt:

```json
{
  "gateId": "docs-accuracy",
  "invocationId": "fix-sdk-typed-error-channel-s3-docs-accuracy-final",
  "gitHead": "ca7ade409be0cc0c064e75f5bfa1bd109e06d013",
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 11532,
  "summary": "199 published source pages; 91/91 root/direct public commands from 149 recursive paths"
}
```

This accuracy PASS proves only the invariants implemented by that script; it is not treated as proof
of the page-level error narrative.

SDK-page snippet compilation:

```json
{
  "gate": "docs:snippets",
  "outcome": "PASS",
  "exitCode": 0,
  "census": {
    "scanned": 581,
    "tsLike": 298,
    "tier1": 36,
    "checked": 22,
    "exempt": 14,
    "outsideFloor": 262,
    "malformed": 0
  }
}
```

The SDK error fence is in the Tier-1 floor and compiles directly against the real
`@netscript/contracts` and `@netscript/sdk/client` workspace entrypoints. Discover-services is
outside the current day-one snippet floor, so its changed examples were compiled page-isolated in
two batches. The only supplied prelude replaced the project-local `@my-app/contracts` import with a
real `baseContract` route of the same `list` input/output shape; the documented client construction,
branching, exact code annotation, and code-specific `data` accesses were unchanged:

```json
{
  "gate": "discover-services-error-examples",
  "verdict": "PASS",
  "results": [
    {
      "source": [105, 146],
      "code": 0,
      "rootLockUnchanged": true,
      "temporaryLockRewritten": true,
      "diagnostics": "Check discover-services.md Step 3/4"
    },
    {
      "source": [232],
      "code": 0,
      "rootLockUnchanged": true,
      "temporaryLockRewritten": true,
      "diagnostics": "Check discover-services.md end-to-end function"
    }
  ]
}
```

SDK doctest:

```json
{
  "schemaVersion": 1,
  "command": [
    "deno",
    "test",
    "--reporter=tap",
    "--allow-all",
    "packages/sdk/tests/readme-doctest_test.ts"
  ],
  "exitCode": 0,
  "durationMs": 5485,
  "summary": { "passed": 3, "failed": 0, "ignored": 0, "totalResults": 3 },
  "failures": []
}
```

Link/build/scope verdicts:

```json
{
  "docsSourceLinks": {
    "command": "deno task docs:links",
    "outcome": "PASS",
    "exitCode": 0,
    "docs": 103,
    "brokenLinks": 0,
    "brokenAnchors": 0,
    "orphans": 0
  },
  "siteVerify": {
    "command": "deno task --cwd docs/site verify",
    "outcome": "PASS",
    "exitCode": 0,
    "covers": ["source-format", "build", "rendered-output", "rendered-links", "caveats"]
  },
  "scope": {
    "outcome": "PASS",
    "productAndTestFilesByteIdentical": true,
    "denoLockUnchanged": true,
    "newFiles": 0
  }
}
```

The known raw-red `surface:diff`, JSR `F-DOCT-5`, and pinned raw doc-lint baselines were not run in
this slice and remain known red; no green claim is made. `typed-queue_test.ts` was not selected, so
#1667 was not encountered. Root/final-slice gates remain reserved for S4.

## Handoff

S3 is complete and stops here for fresh Tier-A review. No S4 work started, no evaluator was
launched, no acceptance box was ticked, and no metadata vocabulary or acceptance claim was
introduced.

## S4 final-gate receipt — stopped on new raw doc-lint findings

All executed S4 receipts certify immutable content head `c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd`.
For every receipt below, the head read before the gate and the actual head verified afterward were
identical; no waiver was used. `deno.lock` also remained byte-identical throughout.

The matrix stopped after raw Contracts and SDK `deno doc --lint` attribution proved new leaf-owned
private-type-reference findings. Correcting those findings would require edits to the already-landed
S1/S2 product files, which S4 forbids. The remaining JSR audits and specifier/export guards were
therefore not executed and are not claimed.

### Executed structured verdicts

```json
{
  "gateId": "root-check",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "uncached": true,
  "selection": { "filesSelected": 2925, "batches": 25, "failedBatches": 0 },
  "summary": { "totalOccurrences": 0, "uniqueOccurrences": 0, "uniqueCodes": 0, "uniquePaths": 0 }
}
```

```json
{
  "gateId": "root-test",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "uncached": true,
  "durationMs": 335918,
  "summary": {
    "passed": 4207,
    "failed": 0,
    "ignored": 19,
    "totalResults": 4226,
    "uniqueFailures": 0
  },
  "typedQueue1667Encountered": false
}
```

```json
{
  "gateId": "scoped-lint",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "selection": {
    "roots": ["packages/contracts", "packages/sdk"],
    "filesSelected": 105,
    "batches": 1
  },
  "summary": { "totalOccurrences": 0, "uniqueOccurrences": 0, "uniqueRules": 0, "uniquePaths": 0 }
}
```

```json
{
  "gateId": "scoped-fmt",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "mode": "check",
  "selection": {
    "roots": ["packages/contracts", "packages/sdk"],
    "filesSelected": 105,
    "batches": 1
  },
  "summary": { "failedBatches": 0, "findings": 0, "ignoredFindings": 0 }
}
```

```json
{
  "gateId": "quality-scan",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "rootCoverage": {
    "workspaceMembers": 37,
    "publishableMembersInsideBoundary": 35,
    "uncoveredPublishedMembers": []
  },
  "scan": {
    "roots": ["packages", "plugins", "docs/site"],
    "findings": [],
    "allowCount": 7,
    "allowanceFailures": []
  },
  "existingAllowances": { "issue": 1276, "count": 7 }
}
```

```json
{
  "gateId": "arch-check",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "uncachedUnderlyingCommands": true,
  "affectedPackages": {
    "contracts": { "fail": 0, "warn": 2, "info": 1 },
    "sdk": { "fail": 0, "warn": 1, "info": 1 }
  },
  "notes": [
    "The repository's existing npm-catalog warnings were emitted but are non-failing.",
    "zod-alignment PASS: zod@3.25.76 and zod@4.4.3; residual v3 owners unchanged."
  ]
}
```

```json
{
  "gateId": "docs-source-format",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "summary": "Docs source format: OK"
}
```

```json
{
  "gateId": "docs-accuracy",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "summary": {
    "publishedSourcePages": 199,
    "shippedCorpusFiles": 181,
    "publicCommands": "91/91 root/direct from 149 recursive paths",
    "freshRootImports": 6
  },
  "existingWarning": "@tanstack/ai-preact@0.10.4 peer expects @tanstack/ai@^0.41.0; resolved 0.39.1"
}
```

### Public-surface attribution

The raw gate remains RED at both base and head. Raw finding sets are not equal because this leaf is
an explicitly breaking published-contract change. The delta is exactly the 15 planned signature
changes on existing symbols/export paths; it adds no symbol or export path. After subtracting that
authorized delta, the base and head finding sets are byte-for-byte equivalent as normalized JSON.

```json
{
  "gateId": "surface-diff",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "RED",
  "exitCode": 1,
  "classification": "KNOWN BASE RED plus authorized breaking signature delta",
  "base": {
    "gitTree": "0ef48c2ec661a7e6d55ec2faf5def6ae7dd2e6eb",
    "findingCount": 972,
    "undeclaredMajorCount": 524,
    "findingSetSha256": "55744a8522197fbb450349ca7185631188c97add132c356e173259875ae9406c"
  },
  "head": {
    "findingCount": 987,
    "undeclaredMajorCount": 539,
    "findingSetSha256": "7720483a169a126af09a3117875d410ac74171f94005b8386dd32f201e8690a1"
  },
  "attribution": {
    "authorizedDeltaCount": 15,
    "unexpectedAdded": [],
    "unexpectedRemoved": [],
    "headAfterAuthorizedDeltaCount": 972,
    "headAfterAuthorizedDeltaSha256": "55744a8522197fbb450349ca7185631188c97add132c356e173259875ae9406c",
    "attributedBaselineSetsEqual": true,
    "newExports": []
  },
  "authorizedSymbols": [
    "@netscript/contracts . baseContract",
    "@netscript/sdk . SafeFailure",
    "@netscript/sdk . SafeResult",
    "@netscript/sdk . ServiceClientMethod",
    "@netscript/sdk . ServiceClientShape",
    "@netscript/sdk . isDefinedError",
    "@netscript/sdk . safe",
    "@netscript/sdk ./client SafeFailure",
    "@netscript/sdk ./client SafeResult",
    "@netscript/sdk ./client ServiceClientMethod",
    "@netscript/sdk ./client ServiceClientShape",
    "@netscript/sdk ./client isDefinedError",
    "@netscript/sdk ./client safe",
    "@netscript/sdk ./ports ServiceClientMethod",
    "@netscript/sdk ./ports ServiceClientShape"
  ]
}
```

### Publish dry-runs

```json
{
  "gateId": "publish-dry-run",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "summary": "Workspace dry run complete",
  "existingWarnings": [
    "unanalyzable dynamic imports in unrelated packages",
    "ignored npm lifecycle scripts"
  ]
}
```

```json
{
  "gateId": "contracts-raw-publish-dry-run",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "command": "deno publish --dry-run --allow-dirty --allow-slow-types",
  "sanctionedWarning": "Publishing a library with slow types is not recommended"
}
```

```json
{
  "gateId": "sdk-raw-publish-dry-run",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "command": "deno publish --dry-run --allow-dirty",
  "actualSlowTypeDiagnostics": 0
}
```

### Blocking raw doc-lint delta

Both raw gates remain RED, but their finding sets are not merely the pinned baseline. Contracts has
three added findings and one removed minified upstream identity (`oc`), for a net +2. SDK has ten
added findings and no removals. Every added finding names an S1/S2 public signature or a private
helper/upstream alias introduced to express it.

```json
{
  "gateId": "contracts-raw-doc-lint",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "RED",
  "exitCode": 1,
  "base": { "gitTree": "0ef48c2ec661a7e6d55ec2faf5def6ae7dd2e6eb", "count": 9 },
  "head": { "count": 11 },
  "added": [
    ["baseContract", "ContractBuilder"],
    ["baseContract", "Schema"],
    ["baseContract", "BaseContractErrors"]
  ],
  "removed": [["baseContract", "oc"]],
  "classification": "NEW LEAF-OWNED RED; S4 BLOCKER"
}
```

```json
{
  "gateId": "sdk-raw-doc-lint",
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "RED",
  "exitCode": 1,
  "base": { "gitTree": "0ef48c2ec661a7e6d55ec2faf5def6ae7dd2e6eb", "count": 3 },
  "head": { "count": 13 },
  "added": [
    ["ServiceClientMethod", "ThrowableError"],
    ["ServiceClientMethod", "ClientPromiseResult"],
    ["ServiceClientShape", "ProcedureErrorFromNode"],
    ["SafeFailure", "ThrowableError"],
    ["SafeFailure", "NonDefinedSafeFailure"],
    ["SafeFailure", "DefinedSafeFailure"],
    ["SafeResult", "ThrowableError"],
    ["isDefinedError", "NarrowDefined"],
    ["safe", "ThrowableError"],
    ["safe", "ClientPromiseResult"]
  ],
  "removed": [],
  "classification": "NEW LEAF-OWNED RED; S4 BLOCKER"
}
```

### Not executed after the mandated stop

```json
{
  "gitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "actualGitHead": "c7cba6d9bd6aef1fbeb0e8e9778a5d979c8544bd",
  "waiver": null,
  "outcome": "NOT_RUN",
  "reason": "S4 stopped when new doc-lint findings proved that source changes would be required",
  "gates": [
    "contracts-jsr-audit",
    "sdk-jsr-audit (known F-DOCT-5 red not reclassified)",
    "netscript-jsr-specifiers",
    "selected export guards"
  ]
}
```

No Aspire, Docker, browser, `e2e:cli`, runtime lease, or evaluator was used. No issue, label,
checkbox, readiness, or metadata state was changed.

## S4-R — plan-only amendment: finding→correction mapping

Generator: native Claude session (see `supervisor.md` § S4-R Amendment Supervisor Identity). This
section amends the S4 stop with a per-finding disposition. No product/test/docs/lock file was
touched to produce this section; every mechanism below was verified against an isolated scratch
probe outside the repository tree (`deno doc --lint` on synthetic fixtures), not against the actual
S1/S2 source, and against the real `@orpc/client`/`@orpc/contract`/`@orpc/shared` `.d.ts` files
already resolved in this workspace's Deno cache. The repair itself remains a separate, freshly
authorized implementation slice.

### How `deno doc --lint`'s `private-type-ref` actually resolves (probe-verified)

The diagnostic is **syntactic and single-hop**, not a deep semantic graph walk:

1. It flags a directly-named identifier in a public declaration's own text (including default type
   parameter values) when that identifier resolves to a symbol not exported/reachable from the
   entrypoint being linted.
2. It does **not** recurse into a flagged private type's own body — `BaseContractErrors` (private
   relative to `packages/contracts/src/public/mod.ts`, though file-level `export`ed) is flagged when
   named by `baseContract`, but its own internal reference to `MergedErrorMap`/`commonErrorMap` is
   never separately checked, because `BaseContractErrors` itself isn't a root symbol being linted
   from that entrypoint.
3. TypeScript's built-in utility types (`Omit`, `Extract`, `Exclude`, `Record`, `Pick`, `Readonly`)
   are never themselves flagged; only their generic *arguments* are, if those name private types.
4. An anonymous inline object/tuple/conditional type literal with no name at all cannot be flagged —
   there is nothing to resolve.
5. `typeof aBinding` is flagged exactly like a named type alias when `aBinding` is a private local or
   an un-reexported import — **but** `typeof aPublicAliasForTheSameValue` is not flagged, because the
   check resolves the specific identifier used, not the underlying value.

Probe evidence (scratch fixture, not part of this repo):

```text
public type 'usesTypeofDirectly' references private type 'secretConst'      # typeof private const -> flagged
public type 'usesPrivateAliasByName' references private type 'PrivateAlias' # named private alias -> flagged
usesInlineAnon: { x: number }                                               # inline literal -> clean
public type 'fnWithDefault' references private type 'PrivateDefault'        # generic default -> flagged
fnWithErrorDefault<T = Error>                                               # global default -> clean
public type 'usesOmit' references private type 'Base'                       # Omit<Base,'q'> flags Base, not Omit
usesPrivateBinding -> flagged; usesPublicBinding (typeof PublicName, same value) -> clean
```

Also confirmed directly against `packages/contracts/mod.ts`/`packages/sdk` entrypoints at head
`c7cba6d9b`: the 3 contracts and 10 SDK additions are exactly and only the ones the S4 receipt
already named; the other 4 pre-existing findings (7 in `BaseContractRoute`/`BaseContractOutputRoute`,
1 in `crud/create-crud-contract.ts`, plus SDK's 3 unrelated pre-existing findings in
`query-client.ts`/`query-client-factory.ts`/`plugin-streams-core`) are baseline noise, unchanged by
this leaf, and out of scope for this amendment.

### Root-cause origin of each private type

| Private type | Origin | Nature |
| --- | --- | --- |
| `ThrowableError` | `@orpc/shared`, re-exported by `@orpc/client` | `type ThrowableError = Registry extends {throwableError: infer T} ? T : Error` — with the empty ambient `Registry` interface (confirmed: no `declare module '@orpc/shared'` augmentation exists anywhere in this repo), this resolves to exactly `Error`. |
| `ClientPromiseResult<T,E>` | `@orpc/client`/`@orpc/shared` | `= PromiseWithError<T,E> = Promise<T> & { __error?: { type: E } }` — a real `Promise` plus an optional phantom marker property that never exists at runtime, used only so `safe()` can recover `E` at the type level. |
| `NonDefinedSafeFailure`, `DefinedSafeFailure`, `NarrowDefined`, `DefinedErrorLike` | local to `errors.ts`, declared without `export` | Package-owned helper aliases already private by design; the finding is that the *public* `SafeFailure`/`isDefinedError` declarations name them directly. |
| `ProcedureErrorFromNode` | local to `service-client.ts`, declared without `export` | Reaches into oRPC's own `ErrorMap`/`ErrorFromErrorMap` (also private to us) to derive `TError` from a raw `~orpc.errorMap`. |
| `ContractBuilder`, `Schema` | `@orpc/contract` | `Schema<TIn,TOut> = StandardSchemaV1<TIn,TOut>` (a real standard, but not re-exported by us); `ContractBuilder` is oRPC's own chainable builder **class** (`.route()/.input()/.output()/.errors()/.meta()`, ~15+ members across 4 interfaces). |
| `BaseContractErrors` | local to `contract-primitives.ts`, `export`ed from the file but not re-exported by `src/public/mod.ts` | Private relative to the publish entrypoint, not relative to the file. |

### Finding → correction mapping (13 findings, grouped by symbol per the requested table)

| # | Finding (public type → private type) | Disposition | Correction | Why type-safe, not a suppression |
| - | --- | --- | --- | --- |
| 1 | `SafeFailure` → `ThrowableError` | **Inlined (default swap)** | `SafeFailure<TError = Error>` (was `= ThrowableError`) | `ThrowableError` resolves to exactly `Error` in this dependency graph today (empty `Registry`, no augmentation anywhere in-repo). Same resolved default, spelled without importing the private name. Documented trade-off below. |
| 2 | `SafeFailure` → `NonDefinedSafeFailure` | **Restructured away (inlined)** | The public `SafeFailure<TError>` union's non-defined arm is written inline: `[Exclude<TError, DEL>, undefined, false, false] & { error: Exclude<TError, DEL>; data: undefined; isDefined: false; isSuccess: false }`, where `DEL` is `DefinedErrorLike`'s body inlined (see #3). | Byte-identical resolved type; only the source-level reference to the private alias is removed. `NonDefinedSafeFailure` itself stays declared, unchanged, for internal use by `createSafeFailure` (a non-exported function, never linted). |
| 3 | `SafeFailure` → `DefinedSafeFailure` | **Restructured away (inlined)** | Defined arm inlined the same way: `[Extract<TError, DEL> & DefinedError, undefined, true, false] & {...}`, with `DEL = Error & { readonly defined: boolean; readonly code: string; readonly status: number; readonly data: unknown }` (i.e. `DefinedErrorLike`'s current body) written out at each of the (now 4, across the two arms) points it's needed. `DefinedError` is already a public export — safe to name directly. | Same reasoning as #2. `DefinedErrorLike` itself is not itself flag-eligible until named from a public declaration; inlining its body avoids ever naming it there. Verified inline-literal exemption via probe. |
| 4 | `SafeResult` → `ThrowableError` | **Inlined (default swap)** | `SafeResult<TOutput, TError = Error>` | Same as #1; `SafeResult` only adds `SafeSuccess<TOutput> \| SafeFailure<TError>`, no other private ref. |
| 5 | `isDefinedError` → `NarrowDefined` | **Restructured away (inlined)** | `export function isDefinedError<T>(error: T): error is Extract<T, Error & { readonly defined: boolean; readonly code: string; readonly status: number; readonly data: unknown }> & DefinedError` | `NarrowDefined<T> = Extract<T, DefinedErrorLike> & DefinedError`; both `NarrowDefined` and `DefinedErrorLike` are inlined at the one call site that needs them publicly. Predicate result type is unchanged bit-for-bit. |
| 6 | `safe` → `ThrowableError` | **Inlined (default swap)** | `safe<TOutput, TError = Error>(...)` | Same as #1. |
| 7 | `safe` → `ClientPromiseResult` | **Restructured away (inlined)** | Parameter type becomes `promise: Promise<TOutput> & { __error?: { type: TError } }` (drop the `type ClientPromiseResult`/`type ThrowableError` imports from `@orpc/client`; keep the runtime `isDefinedError as orpcIsDefinedError` value import, which is not a type and was never flagged). | Structurally identical to `PromiseWithError<TOutput,TError>` (`@orpc/shared`'s real definition, confirmed from the installed `.d.ts`). Any real oRPC client promise is structurally assignable to this literal; the phantom `__error` marker is preserved so `TError` inference still works — it is not dropped, only un-named. |
| 8 | `ServiceClientMethod` → `ThrowableError` | **Inlined (default swap)** | `ServiceClientMethod<TInput, TOutput, TError = Error>` | Same reasoning as #1, in `service-client.ts`. |
| 9 | `ServiceClientMethod` → `ClientPromiseResult` | **Restructured away (inlined)** | Return type becomes `(input: TInput, options?: ServiceRequestOptions) => Promise<TOutput> & { __error?: { type: TError } }` | Same reasoning as #7; duplicated locally in `service-client.ts` rather than shared across files, since sharing would require exporting a new internal type (forbidden). |
| 10 | `ServiceClientShape` → `ProcedureErrorFromNode` | **Restructured away (inlined, redesigned)** | See dedicated subsection below — this is the one finding that required redesigning the private helper's *body*, not just its call site. | See below. |
| 11 | `baseContract` → `BaseContractErrors` | **Restructured away (inlined)** | See dedicated subsection below. | See below. |
| 12 | `baseContract` → `Schema` | **Made public (existing NetScript alias)** | See dedicated subsection below. | See below. |
| 13 | `baseContract` → `ContractBuilder` | **UNRESOLVED — reports, does not plan around** | None proposed. | See below. |

### #10 — `ServiceClientShape` → `ProcedureErrorFromNode` (service-client.ts)

Naively inlining `ProcedureErrorFromNode`'s current body into `ServiceClientShape` does **not**
work: its body directly names `ErrorMap` and `ErrorFromErrorMap` (both private, from
`@orpc/contract`), so inlining would just relocate the private reference one level up (new findings
on those two names instead of on `ProcedureErrorFromNode`) — that is the "suppression wearing a
different hat" failure mode the brief warns about, so it was rejected.

Correction: redesign `ProcedureErrorFromNode`'s body so it never names an oRPC-private type, mirroring
the same "NetScript-owned structural mirror" technique `ContractSchemaInput`/`ContractSchemaOutput`/
`ContractProcedureMetadata` already use for input/output instead of depending on oRPC's own procedure
type. Inlined directly into `ServiceClientShape`:

```ts
export type ServiceClientShape<TContract extends ContractLike> = TContract extends
  ContractProcedureLike ? ServiceClientMethod<
    ProcedureInputFromNode<TContract>,
    ProcedureOutputFromNode<TContract>,
    TContract extends {
      readonly '~orpc': {
        readonly errorMap: infer TErrorMap extends Record<string, { readonly data?: unknown } | undefined>;
      };
    } ? {
        [K in keyof TErrorMap]: K extends string
          ? TErrorMap[K] extends { readonly data?: infer TDataSchema }
            ? Error & {
                readonly defined: true;
                readonly code: K;
                readonly status: number;
                readonly data: ContractSchemaOutput<TDataSchema>;
              }
            : never
          : never;
      }[keyof TErrorMap] | Error
      : Error
  >
  : { [K in keyof TContract]: TContract[K] extends ContractLike ? ServiceClient<TContract[K]> : never };
```

Why this is type-safe rather than a shim: it does not import `DefinedError` from `errors.ts` (that
would fail differently — see note below), it does not name `ErrorMap`/`ErrorFromErrorMap`/`ORPCError`,
and it reuses `ContractSchemaOutput`, already public and already used elsewhere in this file for the
identical purpose (schema → inferred value type). The intersection literal `Error & {readonly
defined: true; code: K; status: number; data: ContractSchemaOutput<TDataSchema>}` is structurally
identical to what `DefinedError<K, ContractSchemaOutput<TDataSchema>>` would produce (confirmed
against `errors.ts`'s own `DefinedError` interface shape) and to what oRPC's real `ORPCError<K,TData>`
class actually looks like at runtime (`extends Error { readonly defined: boolean; code; status; data
}`, confirmed from `@orpc/client`'s installed `.d.ts`) — real thrown contract errors structurally
satisfy it. This is the same "duck-type against oRPC's real runtime shape" technique `errors.ts`
already uses for `DefinedErrorLike`, applied at a different call site. The constraint on `infer
TErrorMap` is narrowed from oRPC's own `ErrorMap` to an equivalent-width `Record<string, {data?:
unknown} \| undefined>` structural bound — width-compatible with any real `~orpc.errorMap` value, so
no real contract narrows out.

**Note on why `DefinedError` (from `errors.ts`) was not imported instead:** `ports/mod.ts` (an
existing SDK entrypoint that re-exports `ServiceClientShape`) does not currently re-export
`DefinedError` — it is exported only via `client/mod.ts`. Since the private-type-ref check is
per-entrypoint, importing `DefinedError` into `service-client.ts` would make `ServiceClientShape`
pass when linted through `client/mod.ts` but newly fail when linted through `ports/mod.ts` (a type
public via one subpath is still "private" relative to another subpath that doesn't re-export it).
Fixing that would require editing `ports/mod.ts` — a fourth file, out of scope. The inline
intersection literal above avoids the cross-entrypoint dependency entirely.

### #11 — `baseContract` → `BaseContractErrors` (contract-primitives.ts)

Inlining `BaseContractErrors`'s current body (`MergedErrorMap<Record<never,never>, typeof
commonErrorMap>`) naively relocates the problem to `MergedErrorMap` (private) and then to
`commonErrorMap` (a private local const — probe-confirmed that `typeof aPrivateConst` is itself
flagged). Two facts resolve this cleanly:

1. **`MergedErrorMap<Record<never,never>, T>` is provably equivalent to plain `T`.** Verified against
   the real `@orpc/contract@1.14.6` types in a scratch fixture: `type ErrorsA = MergedErrorMap<Record<never,never>, CommonErrorMapType>` and `type ErrorsB = CommonErrorMapType` type-checked as mutually
   assignable (`ErrorsA extends ErrorsB` and `ErrorsB extends ErrorsA` both `true`) — merging onto an
   empty base is a no-op. So the third generic slot can be `typeof commonErrorMap`'s structure
   directly, no `MergedErrorMap`/`Omit` needed.
2. **The six schemas already have public aliases.** `domain/schemas.ts` exports both the private
   lowercase values used to build `commonErrorMap` (`notFoundErrorSchema`, etc.) *and* public
   PascalCase re-exports of the identical value (`export const NotFoundErrorSchema =
   notFoundErrorSchema;`, etc.), and the six PascalCase names are already re-exported through
   `packages/contracts/src/public/mod.ts`. Probe-confirmed: `typeof PublicAlias` (for the same value)
   is not flagged even though `typeof privateBinding` is.

Correction — switch `contract-primitives.ts`'s import of the six schemas from the private lowercase
names to the public PascalCase names (same file, same `../domain/schemas.ts` module, no edit to
`domain/schemas.ts` itself), use them for both `commonErrorMap`'s value *and* the inlined annotation:

```ts
Readonly<{
  NOT_FOUND: Readonly<{ status: 404; message: 'Resource not found'; data: typeof NotFoundErrorSchema }>;
  VALIDATION_ERROR: Readonly<{ status: 422; message: 'Validation failed'; data: typeof ValidationErrorSchema }>;
  UNAUTHORIZED: Readonly<{ status: 401; message: 'Authentication required'; data: typeof UnauthorizedErrorSchema }>;
  FORBIDDEN: Readonly<{ status: 403; message: 'Access denied'; data: typeof ForbiddenErrorSchema }>;
  RATE_LIMITED: Readonly<{ status: 429; message: 'Too many requests'; data: typeof RateLimitErrorSchema }>;
  SERVICE_UNAVAILABLE: Readonly<{ status: 503; message: 'Service temporarily unavailable'; data: typeof ServiceUnavailableErrorSchema }>;
}>
```

This preserves the exact six literal codes and code-specific `data` types (the public PascalCase
export is declared `ContractSchema<X,X>`-typed on the same runtime value, itself a public,
already-used NetScript structural type — see #12). **Verification owed at implementation time:**
`deno check` must confirm `oc.errors(commonErrorMap)`'s actual call-site constraint
(`U extends ErrorMap`) still accepts the value once `commonErrorMap` is built from the
`ContractSchema`-typed public aliases rather than the raw Zod-typed private ones; this was verified
structurally (standard-schema shape) but not against the exact live `oc.errors` overload.

### #12 — `baseContract` → `Schema` (contract-primitives.ts)

`Schema<TIn,TOut>` is oRPC's private alias for `StandardSchemaV1<TIn,TOut>`. NetScript already has a
public structural mirror of exactly this shape: `ContractSchema<TOutput,TInput>`
(`domain/schema-types.ts`, re-exported via `src/public/mod.ts`), documented in-file as "Standard
Schema metadata consumed by oRPC and other validator-neutral callers" — i.e. it was built to be
duck-type-compatible with standard-schema consumers such as oRPC's own builder.

Correction: replace both `Schema<unknown, unknown>` generic arguments on `baseContract`'s annotation
with `ContractSchema<unknown, unknown>`. This makes the reference public (option "make the referenced
type public" from the diagnostic's own hint) using a name NetScript already exports — no new export
is introduced. **Verification owed at implementation time:** `deno check` must confirm
`ContractBuilder`'s generic constraint (`TInputSchema/TOutputSchema extends AnySchema`) accepts
`ContractSchema<unknown,unknown>` in the "no `.input()`/`.output()` called yet" position, and that
the class's covariance/method-checking doesn't reject the substitution. The structural shapes match
(`~standard: {version, vendor, validate}`), but class-generic substitutability was reasoned, not
`deno check`-proven, in this plan-only turn.

### #13 — `baseContract` → `ContractBuilder` (contract-primitives.ts) — UNRESOLVED

This is the one finding this amendment does **not** resolve, and reports rather than plans around,
per the brief's explicit instruction.

`ContractBuilder` is oRPC's own chainable builder **class** (`ContractProcedureBuilder` /
`...WithInput` / `...WithOutput` / `...WithInputOutput`, ~15+ chained methods, extending
`ContractProcedure`). An explicit type annotation on `baseContract` is mandatory — `deno doc --lint`
requires one (an unannotated `const` initialized from a generic call is a different, worse
diagnostic class: `missing-explicit-type`), and the annotation must name the actual return type of
`oc.errors(commonErrorMap)`, which is a `ContractBuilder<...>` instance.

Three paths were considered and all three are blocked by this leaf's own constraints:

1. **Re-export `ContractBuilder` (and `Schema`, transitively) from `src/public/mod.ts`.** This is the
   textbook "make the referenced type public" fix the diagnostic itself suggests — but `src/public/mod.ts`
   is the explicitly forbidden fourth file, and doing so is also a new export name, both prohibited
   by this amendment's scope.
2. **Locally reconstruct `ContractBuilder`'s full structural surface as an inline/private type.**
   Technically possible (TypeScript permits anonymous structural interfaces with methods) but this
   means hand-duplicating oRPC's entire builder algebra (`.route()/.input()/.output()/.errors()/.meta()`
   across four builder interfaces plus the base `ContractProcedure` members) inside NetScript's own
   package, permanently coupled to oRPC's exact internal shape and guaranteed to drift on the next
   `@orpc/contract` version bump. This is exactly what doctrine AP-1/AP-9 forbid ("do not grow
   `errors.ts`/contract primitives into a generic error framework or invent a second client algebra")
   and what the plan's own risk register already flags ("tight builder annotation breaks
   CRUD/plugin/handler inference"). Rejected as unsafe, not merely inconvenient.
3. **Revert to an inference-erasing annotation** (e.g. `ReturnType<typeof oc.errors>`, the pre-leaf
   base state, which only names `oc` and reproduces the *already-pinned* baseline finding instead of
   a new one). This was the actual base-commit approach. Rejected: `ReturnType` on an *uninstantiated*
   generic function collapses `oc.errors`'s type parameter to its `ErrorMap` upper bound, which erases
   the exact six literal codes back to oRPC's full ~13-code vocabulary — the precise regression #1350
   exists to fix. Directly violates the "accepted exact six error codes" invariant this amendment is
   bound to preserve. Rejected.

No fourth option was found that both (a) keeps the explicit, literal-preserving annotation and (b)
never names `ContractBuilder`. This is reported as a genuine architectural limit of the three-file,
no-new-export ceiling, not an oversight — a coordinator ruling is needed on whether to authorize a
narrow, single-purpose re-export of `ContractBuilder`/`Schema` type names only (a scope amendment
touching `src/public/mod.ts`), or to accept `baseContract → ContractBuilder` as permanent,
irreducible, leaf-owned known-red debt alongside the existing pinned baseline.

### Surface-delta effect

Every proposed correction above (#1–#12) is **purely notational**: each rewrites how a type is
*spelled* in source (inlined vs. named, or renamed to an existing public alias for the identical
value), without changing what the type *resolves to*. `SafeFailure<TError = Error>` resolves to the
same shape as `SafeFailure<TError = ThrowableError>` did (given the empty `Registry`); the inlined
`ProcedureErrorFromNode` replacement produces the same per-code `DefinedError`-shaped union the
locked plan already specified. None of this changes any of the 15 authorized breaking signature
changes recorded in `worklog.md`'s `surface-diff` receipt — the delta stays exactly 15, neither
exceeded nor silently shrunk. Finding #13 (`ContractBuilder`) is unresolved but also does not change
the surface delta; it leaves `baseContract`'s resolved type exactly as S1 already locked it (only its
open doc-lint finding count is unchanged: contracts moves from 11 to net **9 pinned-baseline-parity +
1 new (`ContractBuilder`, replacing the pinned `oc`)** if this specific mapping is implemented as
proposed — i.e. from +2 new down to +1 new, not to zero, pending the coordinator ruling on #13). SDK
resolves cleanly to **0 new** (all 10 findings dispositioned without residue).

### What this amendment does not do

- It does not implement any of the above in `contract-primitives.ts`, `errors.ts`, or
  `service-client.ts`. Those remain at the S1–S3 landed content; nothing in the three authorized
  product files changed as part of S4-R.
- It does not add, suppress, or ignore any doc-lint diagnostic.
- It does not touch `packages/contracts/src/public/mod.ts`, `#1348`, or `#1466`.
- It does not tick any PR checkbox or change `status:` labels.

## S5 — source repair receipt: stopped on fifth-path export-corpus drift

S5 started from the coordinator-specified head
`bd97a7c03a3fe9b9c2534fd53c9fb0518801bb31`. The implementation content was committed as
`622218ac38150a2e3345149ca5b11bf823256734` before the head-bound final gates. Four and only four
authorized product/test paths changed:

1. `packages/contracts/src/application/contract-primitives.ts`
2. `packages/sdk/src/client/errors.ts`
3. `packages/sdk/src/ports/service-client.ts`
4. `packages/sdk/tests/readme-doctest_test.ts`

`deno.lock` remained byte-identical to the S5 starting head. No metadata vocabulary,
`NetScriptProcedureMeta`, barrel export, lint suppression, runtime lease, Aspire, Docker, or
`e2e:cli` was introduced or run.

### Delivered public-signature corrections

- `baseContract` uses the coordinator-verified instantiation expression
  `ReturnType<typeof oc.errors<Readonly<{...the exact six-entry map...}>>>`. Its six data schemas
  are public `ContractObjectSchema<X, X>` types. The fourth builder slot still resolves exactly to
  `Record<never, never>`. `ContractBuilder` is no longer imported; raw doc lint shows the only
  `baseContract` private reference is the pinned `oc` baseline.
- Findings #1/#4/#6/#8 replace the leaf-new `ThrowableError` defaults with `Error`. This is a
  **declared design decision**, not a notational claim: the repo-wide unaugmented oRPC `Registry`
  makes `ThrowableError` resolve to `Error` today, but spelling `Error` forecloses a downstream
  `Registry.throwableError` augmentation for these leaf-new signatures. The coordinator explicitly
  accepted that trade-off for S5.
- Findings #2/#3 inline the literal non-defined and defined `SafeFailure` arms while leaving the
  private helper aliases available only to the non-exported constructor.
- Finding #5 inlines the exact `isDefinedError` predicate target.
- Findings #7/#9 inline `Promise<TOutput> & { __error?: { type: TError } }` in `safe` and
  `ServiceClientMethod`.
- Finding #10 structurally derives each defined error from the procedure's `~orpc.errorMap` and
  `ContractSchemaOutput`, plus the plain `Error` arm.
- Findings #7/#9/#10 are a **bounded accepted coupling**, not purely notational. Named drift risk:
  **if oRPC renames `__error`, `TError` inference degrades silently**. Duplication is limited to the
  two public promise signatures; no helper was exported to hide it.
- S4-R #11/#12 were not implemented. They are superseded/refuted by the verified `baseContract`
  annotation. `packages/contracts/src/public/mod.ts` remains untouched.

### One-shot type-level RED and retained GREEN

The temporary base-style assertion used `ReturnType<typeof oc.errors>` while the adjacent delivered
assertion read `baseContract` through `@netscript/contracts`. The structured run was executed once
and was not rerun for tidier output:

```json
{
  "exitCode": 1,
  "command": "deno check --unstable-kv <files>",
  "selection": { "filesSelected": 1, "batches": 1, "failedBatches": 1 },
  "summary": {
    "totalOccurrences": 1,
    "uniqueOccurrences": 1,
    "uniqueCodes": 1,
    "uniquePaths": 1
  },
  "groups": [{
    "code": "TS2344",
    "message": "Type 'false' does not satisfy the constraint 'true'.",
    "count": 1,
    "path": "packages/sdk/tests/readme-doctest_test.ts",
    "location": "49:3",
    "assertion": "Equal<keyof ReturnType<typeof oc.errors>['~orpc']['errorMap'], ExpectedBaseErrorCode>"
  }],
  "greenInSameRun": {
    "packageEntrypointAssertion": "Equal<keyof typeof baseContract['~orpc']['errorMap'], ExpectedBaseErrorCode>",
    "guards": ["IsAny<BaseErrorCode> is false", "[BaseErrorCode] is not [never]", "NOT_FOUND data retains .shape"],
    "diagnostics": 0
  }
}
```

The temporary base assertion and its `oc` import were then removed. The exact-six, non-`any`,
non-`never`, undeclared-code rejection, `.shape` retention, and empty-meta-slot assertions remain in
the checked-in test. Final structured check:

```json
{
  "exitCode": 0,
  "command": "deno check --unstable-kv <files>",
  "selection": { "filesSelected": 4, "batches": 4, "failedBatches": 0 },
  "files": [
    "packages/contracts/mod.ts",
    "packages/contracts/crud.ts",
    "packages/sdk/mod.ts",
    "packages/sdk/tests/readme-doctest_test.ts"
  ],
  "summary": { "totalOccurrences": 0, "uniqueOccurrences": 0, "uniqueCodes": 0, "uniquePaths": 0 }
}
```

### Focused structured verdicts

```json
{
  "gateId": "contracts-doc-lint-all-entrypoints",
  "outcome": "RED_BASELINE_PARITY",
  "exitCode": 1,
  "entrypoints": ["./crud.ts", "./mod.ts", "./query.ts", "./transform.ts"],
  "combinedPrivateTypeRef": 9,
  "newLeafFindings": 0,
  "baseContractPrivateRefs": ["oc"]
}
```

```json
{
  "gateId": "sdk-doc-lint-all-entrypoints",
  "outcome": "RED_BASELINE_PARITY",
  "exitCode": 1,
  "entrypointCount": 12,
  "combinedPrivateTypeRef": 3,
  "newLeafFindings": 0
}
```

```json
{
  "gateId": "contracts-sdk-tests",
  "outcome": "PASS",
  "exitCode": 0,
  "summary": { "passed": 78, "failed": 0, "ignored": 0, "totalResults": 78, "uniqueFailures": 0 },
  "typedQueue1667Encountered": false
}
```

```json
{
  "gateId": "scoped-lint",
  "outcome": "PASS",
  "exitCode": 0,
  "selection": { "roots": ["packages/contracts", "packages/sdk"], "filesSelected": 105, "batches": 1 },
  "summary": { "totalOccurrences": 0, "uniqueOccurrences": 0, "uniqueRules": 0, "uniquePaths": 0 }
}
```

```json
{
  "gateId": "scoped-fmt",
  "outcome": "PASS",
  "exitCode": 0,
  "selection": { "roots": ["packages/contracts", "packages/sdk"], "filesSelected": 105, "batches": 1 },
  "summary": { "failedBatches": 0, "findings": 0, "ignoredFindings": 0 }
}
```

### Exact-head durable receipts executed before the scope stop

```json
{
  "gateId": "quality-gate",
  "gitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "actualGitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 10237,
  "requestHash": "bdc703d10280f46ebde0b4b0db97bf1a2b97101fbbae8361cf54b9b2f60fa645",
  "contains": ["quality:scan", "arch:check"]
}
```

```json
{
  "gateId": "netscript-jsr-specifiers",
  "gitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "actualGitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 955,
  "requestHash": "ed50e53c41b10327b74c79060ed7ac6e64976b81040a71ad04924cdb1e03ff79",
  "summary": { "scanned": 2361, "allowances": 1, "ranges": 0, "failures": 0 }
}
```

### Blocking selected export guard — fifth product path required

At exact content head `622218ac38150a2e3345149ca5b11bf823256734`, the read-only canonical export
corpus check failed:

```json
{
  "gateId": "docs-exports-drift / check:mcp-export-corpus",
  "gitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "actualGitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "waiver": null,
  "outcome": "RED",
  "exitCode": 1,
  "message": "MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus",
  "requiredAdditionalPath": "packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts",
  "classification": "LEAF-OWNED GENERATED-SURFACE DRIFT; fifth product path requires coordinator rescope"
}
```

The generated file was not regenerated or edited. The gate catalog has no dedicated
`check:mcp-export-corpus` entry, so this stop-triggering diagnostic was executed by its canonical
read-only task rather than misrepresented as a `run-gate.ts` receipt. That limitation is reported,
not waived.

Per the explicit fifth-path stop rule, the rest of the S5 matrix was not executed after this
finding:

```json
{
  "gitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "actualGitHead": "622218ac38150a2e3345149ca5b11bf823256734",
  "waiver": null,
  "outcome": "NOT_RUN",
  "reason": "Selected export guard requires an unauthorized fifth product path",
  "gates": [
    "contracts-jsr-audit",
    "sdk-jsr-audit (known F-DOCT-5 remains pre-existing red)",
    "remaining selected export guards",
    "workspace and raw package publish dry-runs",
    "surface:diff attribution"
  ]
}
```

No claim is made that `surface:diff` proves `baseContract`: its `deno doc` declaration rendering
drops the instantiation argument, so the signal is a known tooling false negative. The published
change remains fully disclosed as breaking, including `SafeFailure` arm changes and failure
`null` → `undefined` consumer impact.

## S6 — derived MCP export-corpus refresh

S6 started from the coordinator-specified rebased head
`9cdba6321ea3f2d5af20f269b6bd81393dbd84d3`. PR #1691 had separately repaired the export corpus
against `main` and merged as `61bfd858d20f3bf61e7ee45b5646537af567f247`; after that rebase, the
only remaining corpus drift was the five approved SDK signature changes from this leaf. PR #1692
replaces accidentally closed PR #1671 for the same branch and work.

The canonical generator was run twice without hand-editing the output. Both runs emitted identical
structured provenance:

```json
{
  "command": "deno task gen:mcp-export-corpus",
  "runs": 2,
  "outcome": "PASS",
  "exitCode": 0,
  "byteIdentical": true,
  "generatedFileSha256": "f7bbc8925481e8682f84f9057263387030838e6bc7ee366c56e98a9b2829f904",
  "embeddedCorpus": {
    "schemaVersion": 1,
    "frameworkVersion": "0.0.6",
    "sha256": "a8f0779228987ed7e304dc032d45d1488b0cfb651b088d563c1e17fbafa2fb0b",
    "uncompressedBytes": 2134032,
    "compressedBytes": 309455,
    "packageCount": 35,
    "subpathCount": 270,
    "symbolCount": 7611
  }
}
```

The gzip/base64 payload was decoded before commit and compared to the starting-head payload by the
identity tuple `(packageName, subpath, symbol)`. This is the semantic evidence; the generated-file
text diff is not treated as proof:

```json
{
  "gateId": "mcp-export-corpus-semantic-delta",
  "outcome": "PASS",
  "schemaVersionUnchanged": true,
  "frameworkVersionUnchanged": true,
  "surfacesUnchanged": true,
  "surfaceCount": { "before": 270, "after": 270 },
  "entryCount": { "before": 7611, "after": 7611 },
  "addedExports": 0,
  "removedExports": 0,
  "changedSignatureCount": 5,
  "changedSignatures": [
    "@netscript/sdk:.#SafeFailure",
    "@netscript/sdk:.#SafeResult",
    "@netscript/sdk:.#ServiceClientMethod",
    "@netscript/sdk:.#isDefinedError",
    "@netscript/sdk:.#safe"
  ],
  "jsDocChanges": 0
}
```

The generator output was committed alone as immutable content commit
`b427e035488e5eabd9f3a92870787006aa9a6813`. The canonical check was then reproduced at that exact
head:

```json
{
  "gateId": "check:mcp-export-corpus",
  "gitHead": "b427e035488e5eabd9f3a92870787006aa9a6813",
  "actualGitHead": "b427e035488e5eabd9f3a92870787006aa9a6813",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "schemaVersion": 1,
  "frameworkVersion": "0.0.6",
  "sha256": "a8f0779228987ed7e304dc032d45d1488b0cfb651b088d563c1e17fbafa2fb0b",
  "packageCount": 35,
  "subpathCount": 270,
  "symbolCount": 7611
}
```

The scoped package lint/format wrappers reproduced the coordinator-declared pre-existing tooling
red at the same immutable content head. They each exited `1` with zero findings. Their actual local
failure detail was an early Deno workspace-configuration parse error (`packages/*` read as a string
where `WorkspaceConfig` was expected), so neither command reached a source diagnostic. This is
reported as tooling red, not as a formatting or lint regression:

```json
{
  "gitHead": "b427e035488e5eabd9f3a92870787006aa9a6813",
  "actualGitHead": "b427e035488e5eabd9f3a92870787006aa9a6813",
  "waiver": null,
  "gates": [
    {
      "gateId": "mcp-scoped-lint",
      "outcome": "RED_PRE_EXISTING_TOOLING",
      "exitCode": 1,
      "filesSelected": 115,
      "batches": 1,
      "findings": 0,
      "failure": "Failed to parse workspace configuration"
    },
    {
      "gateId": "mcp-scoped-fmt",
      "outcome": "RED_PRE_EXISTING_TOOLING",
      "exitCode": 1,
      "filesSelected": 115,
      "batches": 1,
      "findings": 0,
      "failure": "Failed to parse workspace configuration"
    }
  ]
}
```

Scope verification against the S6 starting head found exactly one changed product path:
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`. The four S5
source/test paths and `deno.lock` remained byte-identical. No runtime lease, Aspire, Docker,
`e2e:cli`, evaluator, issue/label/checkbox/readiness, or merge action was performed.

## S7 — consumer-visible breaking and migration disclosure

S7 started from the coordinator-specified head
`1772dfdf9f26a9c7ed76f196e93505732696fb30` after IMPL-EVAL returned
`PASS-WITH-FINDINGS` on `bcc9f393d`. The topic supervisor had already repaired the PR-body half of
F1. Per the coordinator ruling, S7 did not rewrite the twelve existing commits; instead, the new
consumer-facing amendment commit carries both a `docs(sdk)!` marker and a `BREAKING CHANGE:` footer.

### Published migration disclosure

Both authorized pages now contain an explicit **0.0.7 intentional pre-1.0 breaking change; not
patch-compatible** section. Each page gives the same complete migration matrix:

1. `SafeFailure` / `SafeResult` failure payload: the second tuple slot and object `data` property
   move from `null` to `undefined`, including the concrete
   `failure.data === null` → `failure.data === undefined` migration.
2. The `TError` default for `SafeFailure`, `SafeResult`, and `safe` moves from `unknown` to `Error`.
3. `ServiceClientMethod<TInput, TOutput>` becomes
   `ServiceClientMethod<TInput, TOutput, TError = Error>` and returns
   `Promise<TOutput> & { __error?: { type: TError } }`; the optional phantom marker is identified as
   the mechanism `safe()` uses to recover the procedure error type.
4. `safe()` no longer accepts `PromiseLike<TOutput>`; its parameter is
   `Promise<TOutput> & { __error?: { type: TError } }`. Non-`Promise` thenables now produce
   `TS2345`, with `Promise.resolve(thenable)` as the migration.
5. The documented result-handling path is `result.isSuccess` followed by `result.isDefined`, so a
   non-defined failure cannot fall through as success.
6. Tuple destructuring remains supported because the success/failure shapes remain
   tuple-and-object intersections; the docs explicitly do not claim tuple removal.

The SDK hub also documents the pre-cut F4 characteristic: a bare `Promise` defaults `TError` to
`Error`, so the `isDefined: true` arm has `error: never` because
`Extract<Error, DefinedErrorLike>` is empty. That arm is unreachable to the type checker but can be
returned at runtime when an `ORPCError` with `defined: true` rejects the bare promise. A
service-client promise carrying contract error typing is required for a typed defined-error arm.
The text points to the existing `_PlainErrorRejectedFromDefinedArm` assertion without changing the
test.

The earlier drift entries no longer contradict each other: both now point to #1693 as the backing
follow-up for deferred benchmark/reference prose, and record that the same issue tracks later
re-evaluation of the accepted `ThrowableError` → `Error` substitution decision.

### Breaking-marked content commit

```json
{
  "commit": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "subject": "docs(sdk)!: disclose 0.0.7 typed-error breaking changes and migration",
  "breakingFooter": "BREAKING CHANGE: SafeFailure/SafeResult failure payload changes null -> undefined, default TError changes unknown -> Error, and safe() no longer accepts non-Promise thenables. Pre-1.0 intentional break; not patch-compatible. See PR #1692.",
  "debtReference": "Refs #1693"
}
```

### Exact-head structured gate receipts

All final commands below ran at immutable content head
`29c9e40aad391381e79afa92a6052cbcd07d9a4a`:

```json
{
  "gateId": "docs:snippets",
  "gitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "actualGitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "outcome": "PASS",
  "exitCode": 0,
  "census": {
    "scanned": 581,
    "ts": 213,
    "tsx": 78,
    "typescript": 7,
    "tsLike": 298,
    "tier1": 36,
    "checked": 22,
    "exempt": 14,
    "outsideFloor": 262,
    "malformed": 0
  }
}
```

```json
{
  "gateId": "docs-source-format",
  "invocationId": "sdk-typed-error-s7-source-format",
  "gitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "actualGitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 223,
  "requestHash": "b92bd2a4471968dd3d58219ab2200a368a2fca2703fce03206a12105d23142cf",
  "stdout": "Docs source format: OK"
}
```

```json
{
  "gateId": "docs-accuracy",
  "invocationId": "sdk-typed-error-s7-docs-accuracy",
  "gitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "actualGitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 8640,
  "requestHash": "743dcd4a345037ec14c817c7f3bed19febdcf2a664570e9bdab2fc1dc8ff5cd6",
  "summary": "199 published source pages; 91/91 root/direct public commands from 149 recursive paths",
  "nonBlockingExistingWarning": "@tanstack/ai-preact peer @tanstack/ai constraint mismatch"
}
```

```json
{
  "gateId": "docs:exports-drift",
  "gitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "actualGitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "outcome": "PASS",
  "exitCode": 0,
  "summary": "Exports & Symbols drift check: PASS"
}
```

```json
{
  "gateId": "check:mcp-export-corpus",
  "gitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "actualGitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "outcome": "PASS",
  "exitCode": 0,
  "unchanged": true,
  "sha256": "a8f0779228987ed7e304dc032d45d1488b0cfb651b088d563c1e17fbafa2fb0b",
  "packageCount": 35,
  "subpathCount": 270,
  "symbolCount": 7611
}
```

```json
{
  "gateId": "s7-packages-scope",
  "command": "git diff --name-only 1772dfdf9f26a9c7ed76f196e93505732696fb30..HEAD -- packages/",
  "gitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "actualGitHead": "29c9e40aad391381e79afa92a6052cbcd07d9a4a",
  "outcome": "PASS",
  "exitCode": 0,
  "paths": [],
  "denoLock": "BYTE_IDENTICAL",
  "exportCorpusGeneratedFile": "BYTE_IDENTICAL"
}
```

`docs:accuracy` proves only the invariants its script checks; the page-level migration narrative is
not inferred from that gate. No package, test, reference-doc, lock, or generated-corpus file was
changed. No runtime lease, evaluator, review request, label, checkbox, readiness, issue mutation, or
merge action was performed.

## 2026-08-23 — S8 amendment-review prose corrections A1–A4

Starting head: `34eb1f5245d578dce01c88046aa22f8f6deabf02`. The focused opposite-family
amendment review at `7b0024967` returned `ACCEPT-WITH-FINDINGS`; S8 corrects its four bounded prose
findings without changing product, tests, generated output, or the lock.

### Finding dispositions

| Finding | Correction on both consumer pages |
| --- | --- |
| A1 — `SafeFailure` arm change omitted | The migration tables now state that the old single failure arm exposed `isDefined: boolean`, while 0.0.7 exposes literal `false` and `true` arms. Consumers that typed the property as an undifferentiated boolean or narrowed one arm must branch on the literal. |
| A2 — `baseContract` key-space tightening omitted | The tables now state the open error-map key space is the exact six-code union: `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, and `SERVICE_UNAVAILABLE`. Comparing against an undeclared code is now a type error—both an intended safety benefit and a consumer break. |
| A3 — private vocabulary in the F4 explanation | The SDK page now uses only exported `SafeFailure`, `safe`, `isDefinedError`, and `DefinedError` vocabulary. It retains the exact behavior: a bare promise's defined arm is unreachable to the type checker but may occur at runtime, so the promise must carry contract error typing for a typed defined arm. Private helper/type names and the test path were removed. |
| A4 — old `safe()` signature overstated | The tables now say old `SafeFailure`/`SafeResult` defaulted `TError` to `unknown`, while old `safe<TOutput>` had no `TError` parameter and inherited that default through `SafeResult<TOutput>`. |

The existing sentence “The tuple form has **not** been removed” is byte-for-byte retained on both
pages. The `null` → `undefined`, `unknown` → `Error`, `ServiceClientMethod`, `PromiseLike` → marked
`Promise`, discriminated-result migration, and explicit pre-1.0/not-patch-compatible disclosures are
also retained.

### Breaking-marked content commit

```json
{
  "commit": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "subject": "docs(sdk)!: complete typed-error migration disclosure",
  "breakingFooter": "BREAKING CHANGE: SafeFailure now has literal defined and non-defined arms, and baseContract rejects error codes outside its six declared literals. This extends the documented 0.0.7 pre-1.0 migration; it is not patch-compatible. See PR #1692.",
  "debtReference": "Refs #1693"
}
```

### Exact-head structured gate receipts

All final commands below ran at immutable content head
`8e568e49f3b4cff21ead698591abce2db0ec5f5c`:

```json
{
  "gateId": "check:mcp-export-corpus",
  "gitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "actualGitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "unchanged": true,
  "sha256": "a8f0779228987ed7e304dc032d45d1488b0cfb651b088d563c1e17fbafa2fb0b",
  "packageCount": 35,
  "subpathCount": 270,
  "symbolCount": 7611
}
```

```json
{
  "gateId": "s8-packages-plugins-scope",
  "command": "git diff --name-only 34eb1f5245d578dce01c88046aa22f8f6deabf02..HEAD -- packages/ plugins/",
  "gitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "actualGitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "paths": [],
  "denoLock": "BYTE_IDENTICAL",
  "exportCorpusGeneratedFile": "BYTE_IDENTICAL"
}
```

```json
{
  "gateId": "docs:snippets",
  "gitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "actualGitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "census": {
    "scanned": 581,
    "ts": 213,
    "tsx": 78,
    "typescript": 7,
    "tsLike": 298,
    "tier1": 36,
    "checked": 22,
    "exempt": 14,
    "outsideFloor": 262,
    "malformed": 0
  }
}
```

```json
{
  "gateId": "docs:accuracy",
  "invocationId": "sdk-typed-error-s8-docs-accuracy",
  "gitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "actualGitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 8275,
  "requestHash": "248e287e45996f0342949331ff5c4dc2bc3869f435fd6e5e4f49dbf6ba62a36e",
  "summary": "199 published source pages; 91/91 root/direct public commands from 149 recursive paths",
  "nonBlockingExistingWarning": "@tanstack/ai-preact expects @tanstack/ai ^0.41.0; resolved 0.39.1"
}
```

```json
{
  "gateId": "docs:links",
  "gitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "actualGitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "docs": 103,
  "brokenLinks": 0,
  "brokenAnchors": 0,
  "orphans": 0
}
```

```json
{
  "gateId": "docs:exports-drift",
  "gitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "actualGitHead": "8e568e49f3b4cff21ead698591abce2db0ec5f5c",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "summary": "Exports & Symbols drift check: PASS"
}
```

No product, plugin, test, metadata, reference-doc, lock, generated-corpus, PR-body, or supervisor
comment change was made. No runtime lease, evaluator, review request, label, checkbox, readiness,
issue mutation, or merge action was performed.

## 2026-08-23 — S9 agent-docs generated cascade

S9 started from the coordinator-specified, clean head
`587ade9f30e619410a4192daadab137b0548eb88`. That head contains the separate opposite-family A1–A4
delta-review PASS for S8. CI run `32631459037`, quality job `97174828651`, had failed only because
S7/S8 changed two `docs/site` inputs without refreshing the downstream agent-docs bundle.

The canonical cascade was run in its dependency order, without hand editing:

1. `deno task gen:agent-docs-prose`
2. `deno task gen:assets-barrel`
3. `deno task gen:publish-assets`

### Measured generated path set

The first complete cascade produced this exact `git status --porcelain=v1` set, and the second
complete cascade retained it:

```text
 M .llm/assets/agent-docs/prose.json.gz
 M .llm/assets/agent-docs/provenance.json
 M packages/cli/src/kernel/assets/agent-docs.generated.ts
 M packages/mcp/src/publish-assets.generated.ts
```

No `docs/site/**`, test, non-generated package source, or `deno.lock` path changed. The generated
content commit is:

```json
{
  "commit": "120172c466bf6a3d18da80012145347072377513",
  "subject": "chore(assets): regenerate agent-docs prose and derived assets",
  "cause": "S7/S8 SDK docs changes made the agent-docs prose bundle and its derived barrels stale",
  "handEdited": false
}
```

### Determinism — complete cascade pass 1 versus pass 2

Every measured path was byte-identical after the two full ordered runs:

```json
{
  "outcome": "PASS",
  "runs": 2,
  "paths": [
    {
      "path": ".llm/assets/agent-docs/prose.json.gz",
      "pass1Sha256": "5082cf83b11ddfe64ac26f1c37c719074c55e244382ade26d310861b53348df0",
      "pass2Sha256": "5082cf83b11ddfe64ac26f1c37c719074c55e244382ade26d310861b53348df0"
    },
    {
      "path": ".llm/assets/agent-docs/provenance.json",
      "pass1Sha256": "fee682e73c243a207fd8e83557d5a96a62acf95f7ec1f3c14294e3908289e8b7",
      "pass2Sha256": "fee682e73c243a207fd8e83557d5a96a62acf95f7ec1f3c14294e3908289e8b7"
    },
    {
      "path": "packages/cli/src/kernel/assets/agent-docs.generated.ts",
      "pass1Sha256": "b838cd7505b10ba0f24c0da3c8836ceed1a9ab1e975168d1fc0bbdd20b05246a",
      "pass2Sha256": "b838cd7505b10ba0f24c0da3c8836ceed1a9ab1e975168d1fc0bbdd20b05246a"
    },
    {
      "path": "packages/mcp/src/publish-assets.generated.ts",
      "pass1Sha256": "5fec4b20254a3fa9fa7d1f0dad4bdad10b00d41e9737da96711a2956f5ca90c3",
      "pass2Sha256": "5fec4b20254a3fa9fa7d1f0dad4bdad10b00d41e9737da96711a2956f5ca90c3"
    }
  ]
}
```

### Exact-head structured gate receipts

All selected gates ran at immutable generated-content head
`120172c466bf6a3d18da80012145347072377513`. An initial durable-runner preflight used the abbreviated
SHA `120172c46` and was rejected before gate execution because the runner requires exact string
equality. No receipt was produced by that rejected invocation. Every evidence-bearing invocation
below uses the full SHA and has `gitHead == actualGitHead`, with no waiver.

```json
{
  "gateId": "agent-docs-prose",
  "invocationId": "sdk-typed-error-s9-agent-docs-prose",
  "gitHead": "120172c466bf6a3d18da80012145347072377513",
  "actualGitHead": "120172c466bf6a3d18da80012145347072377513",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 12160,
  "requestHash": "9c24d015c0c7d72d724e0e4010be07cf3c7faae01ccbdd6c2c57e2d0549275a8",
  "fresh": true,
  "stalePaths": []
}
```

```json
{
  "gateId": "assets-barrel",
  "invocationId": "sdk-typed-error-s9-assets-barrel",
  "gitHead": "120172c466bf6a3d18da80012145347072377513",
  "actualGitHead": "120172c466bf6a3d18da80012145347072377513",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 717,
  "requestHash": "57ec4456cfbca0a889aba6c5d395bf015da244e36140a98b93871567ee4c5a39"
}
```

```json
{
  "gateId": "publish-assets",
  "invocationId": "sdk-typed-error-s9-publish-assets",
  "gitHead": "120172c466bf6a3d18da80012145347072377513",
  "actualGitHead": "120172c466bf6a3d18da80012145347072377513",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 315,
  "requestHash": "a10cf114c57501fc9d391b35a009d7beca76250784c361472f77f6ac0bf17f8b"
}
```

```json
{
  "gateId": "check:mcp-export-corpus",
  "gitHead": "120172c466bf6a3d18da80012145347072377513",
  "actualGitHead": "120172c466bf6a3d18da80012145347072377513",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "unchanged": true,
  "sha256": "a8f0779228987ed7e304dc032d45d1488b0cfb651b088d563c1e17fbafa2fb0b",
  "generatedFileSha256": "f7bbc8925481e8682f84f9057263387030838e6bc7ee366c56e98a9b2829f904",
  "packageCount": 35,
  "subpathCount": 270,
  "symbolCount": 7611
}
```

```json
{
  "gateId": "docs:exports-drift",
  "gitHead": "120172c466bf6a3d18da80012145347072377513",
  "actualGitHead": "120172c466bf6a3d18da80012145347072377513",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "summary": "Exports & Symbols drift check: PASS"
}
```

```json
{
  "gateId": "contracts-sdk-tests",
  "command": ["deno", "test", "--reporter=tap", "--allow-all", "packages/contracts", "packages/sdk"],
  "gitHead": "120172c466bf6a3d18da80012145347072377513",
  "actualGitHead": "120172c466bf6a3d18da80012145347072377513",
  "waiver": null,
  "outcome": "PASS",
  "exitCode": 0,
  "durationMs": 5601,
  "summary": { "passed": 78, "failed": 0, "ignored": 0, "totalResults": 78, "uniqueFailures": 0 }
}
```

After the checks, the worktree was clean. `deno.lock` remained byte-identical at SHA-256
`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`. The MCP export corpus did
not move; no decoded attribution was needed.

At S9 start, PR #1692 was externally observed as ready with sole `status:ready-merge`, despite the
brief describing it as draft. S9 forbids readiness and label mutations, so this generator did not
change that supervisor-owned state. No runtime lease, evaluator, review, issue, checkbox, metadata,
or merge action was performed.
