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

| Time       | Slice | Step               | Notes                                                                                                                                       |
| ---------- | ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Plan  | Bootstrap/research | Re-baselined exact branch/base; read required skills, doctrine, harness, Accepted RFC, issues, and docs.                                    |
| 2026-08-15 | Plan  | Public inspection  | `deno doc` confirmed current `safe`, `isDefinedError`, `SafeResult`, and `baseContract` signatures.                                         |
| 2026-08-15 | Plan  | RED                | Executed TS2339 `error.code` on `never` with `deno eval --check --unstable-kv`.                                                             |
| 2026-08-15 | Plan  | Consumer scan      | Executed whole-repo searches; identified `@netscript/fresh`, CRUD, query/desktop/type fixtures, CLI/template, docs, and baseline consumers. |
| 2026-08-15 | Plan  | Rescope            | Required out-of-scope `service-client.ts`; conditional contracts barrel; live #1466 ownership conflict. Stopped all product work.           |
| 2026-08-15 | Plan  | Amendment          | Coordinator authorized the sixth client-port path, assigned metadata vocabulary to #1466, denied the barrel, and locked six paths.          |
| 2026-08-15 | Eval  | PLAN-EVAL          | Terminal PASS at `f76a3c45b`; incorporated advisories A1-A5 without editing the evaluator artifact.                                         |
| 2026-08-15 | S1    | RED                | Real-export fixture recorded TS18046 (`unknown`) and TS2339 (`never`) together in one structured run; not rerun for tidier output.          |
| 2026-08-15 | S1    | Builder            | Exact `typeof commonErrorMap` error generic and explicit `Record<never, never>` fourth slot; no metadata vocabulary or new export.          |
| 2026-08-15 | S1    | Fixture            | Uses contracts-root `CursorPaginationInputSchema` and `SuccessSchema`; asserts six keys, undeclared rejection, and empty meta slot.         |
| 2026-08-15 | S1    | Gates              | Focused structured check/test/lint/format pass; CRUD and workers soundness consumers included. Root/final-slice gates not run.              |

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

## Handoff

S1 is complete and stops here for fresh Tier-A review. Slice 2 is not authorized in this session;
`errors.ts`, `ports/service-client.ts`, and both docs pages remain untouched. No evaluator was
launched and no metadata acceptance box was ticked.
