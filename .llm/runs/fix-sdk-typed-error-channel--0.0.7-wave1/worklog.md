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
| 2026-08-15 | S3    | Examples           | Literal `isSuccess` then `isDefined` branches terminate every failure path; all six codes and code-selected schema data are shown.             |
| 2026-08-15 | S3    | Compile proof      | SDK fence passed `docs:snippets`; discover Step 3/4 and copyable function passed page-isolated checks with a real `baseContract` fixture.       |
| 2026-08-15 | S3    | Gates              | Source format, accuracy, source/rendered links, caveats, build, doctest, and focused example compilation passed; final gates remain S4-only.   |

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
| S3 discover example compile           | PASS                                   | Step 3/4 pair and end-to-end function; real base-contract fixture               |
| S3 SDK doctest                        | PASS                                   | 3/3 results                                                                     |
| S3 source links                       | PASS                                   | 103 docs; 0 broken links, anchors, or orphans                                   |
| S3 site verify                        | PASS                                   | Build, rendered-output, rendered links, and caveats; raw exit 0                 |
| S3 scope/lock hygiene                 | PASS                                   | Four landed product/test files and `deno.lock` unchanged                        |
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

| Planned location | Disposition | Final location and wording |
| ---------------- | ----------- | -------------------------- |
| `sdk.md:12-20` | Retained with required scope | `sdk.md:12-22` now limits non-drift to input, output, and declared-error types; transport/arbitrary throws are explicitly non-defined failures. |
| `sdk.md:31-38` | Retained and corrected | `sdk.md:33-41` says the L1 method's input, output, and declared-error union are inferred from the contract. |
| `sdk.md:58-70` | Retained and corrected | `sdk.md:61-71` says `baseContract` error schemas flow through the client promise and `safe()`, while runtime non-defined failures remain outside the contract. |
| `sdk.md:113-114` | Retained with cross-reference | `sdk.md:118-120` scopes direct-call inference to input/output/declared errors and points rejecting calls to the `safe()` section. |
| `sdk.md:196-198` | Replaced completely | `sdk.md:203-249` names all six codes, branches on literal `isSuccess` then `isDefined`, throws non-defined failures, demonstrates `NOT_FOUND` schema data, and scopes `isDefinedError`. |
| `discover-services.md:9-14` | Retained with required scope | `discover-services.md:11-15` names input/output/declared errors and keeps discovery/transport failures non-defined. |
| `discover-services.md:96-101,114-115` | Retained and corrected | `discover-services.md:99-118` states `baseContract` carries the six errors and the call comment includes declared-error inference; the prerequisite row also names declared errors. |
| `discover-services.md:135-154` | Replaced completely | `discover-services.md:137-176` names all six codes, uses literal discriminants, terminates every failure, demonstrates `NOT_FOUND` schema data, and scopes `isDefinedError`. |
| `discover-services.md:205-229` | Replaced completely | `discover-services.md:227-264` makes the copyable function return only from `isSuccess`, throws the non-defined branch, and demonstrates `VALIDATION_ERROR` schema data before throwing the defined failure. |

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

This accuracy PASS proves only the invariants implemented by that script; it is not treated as
proof of the page-level error narrative.

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
