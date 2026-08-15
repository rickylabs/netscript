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

Future contract error additions begin in the single `commonErrorMap`; the derived builder/client
types and RED fixture must then expose the new literal and schema-derived data automatically. No
second code union is hand-maintained.

## Progress log

| Time       | Slice | Step               | Notes                                                                                                                                       |
| ---------- | ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Plan  | Bootstrap/research | Re-baselined exact branch/base; read required skills, doctrine, harness, Accepted RFC, issues, and docs.                                    |
| 2026-08-15 | Plan  | Public inspection  | `deno doc` confirmed current `safe`, `isDefinedError`, `SafeResult`, and `baseContract` signatures.                                         |
| 2026-08-15 | Plan  | RED                | Executed TS2339 `error.code` on `never` with `deno eval --check --unstable-kv`.                                                             |
| 2026-08-15 | Plan  | Consumer scan      | Executed whole-repo searches; identified `@netscript/fresh`, CRUD, query/desktop/type fixtures, CLI/template, docs, and baseline consumers. |
| 2026-08-15 | Plan  | Rescope            | Required out-of-scope `service-client.ts`; conditional contracts barrel; live #1466 ownership conflict. Stopped all product work.           |
| 2026-08-15 | Plan  | Amendment          | Coordinator authorized the sixth client-port path, assigned metadata vocabulary to #1466, denied the barrel, and locked six paths.          |

## Gate results

| Gate                                  | Result                                 | Evidence                                                                       |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| Current SDK raw publish dry-run       | PASS (baseline inspection only)        | `deno publish --dry-run --allow-dirty`, exit 0; no actual slow-type diagnostic |
| Current contracts raw publish dry-run | PASS with sanctioned slow-type warning | `deno publish --dry-run --allow-dirty --allow-slow-types`, exit 0              |
| Current JSR audit                     | KNOWN RED / INFO                       | SDK `F-DOCT-5`; contracts sanctioned slow-type INFO; not leaf verdicts         |
| Implementation gates                  | NOT RUN                                | Prohibited before PLAN-EVAL; no product files changed                          |

## Handoff

Fresh Tier-A reviews this amended head first; a separate PLAN-EVAL session follows only after that
review. This generator must not self-evaluate or implement before `PASS`.
