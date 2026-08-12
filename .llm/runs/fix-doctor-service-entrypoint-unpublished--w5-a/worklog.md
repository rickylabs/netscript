# Worklog: W5-A plugin doctor service entrypoint release window

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-doctor-service-entrypoint-unpublished--w5-a` |
| Branch | `fix/doctor-service-entrypoint-unpublished` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `netscript plugin doctor` behavior is preserved; no package export or command signature changes.
- `SERVICE_ENTRYPOINT_RESOLVES_CHECK` remains the named doctor check.

### Domain Vocabulary

- Exact-version-unpublished exclusion — confirmed HTTP 404 for the pinned version metadata only.
- Registry failure — every non-404 HTTP/network/parse failure; remains an error.

### Ports

- Existing `loadJsrExportMap(packageSpecifier, version)` dependency remains the test seam.
- Existing JSR fetch adapter remains the network edge.

### Constants

- `SERVICE_ENTRYPOINT_RESOLVES_CHECK` — unchanged critical check identity.
- A named exclusion message constant may be added for stable reporting/tests.

### Archetype 6 checkpoint

- Existing spine abstracts: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, `Registry<TKey, TValue>`; none change.
- Layer-2 abstracts, feature catalog, registries, composition, command names, exit codes, output
  formats, template paths, and permission requirements are unchanged.
- Relevant vertical feature: `public/features/plugins/doctor`; relevant adapter:
  `public/infra/jsr/fetch-jsr-export-map.ts`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Activate harness and open draft PR | artifact review | run dir, evidence skeleton |
| 1 | Prove all three baseline failure modes | focused red test run | doctor invariant tests, evidence/worklog |
| 2 | Enforce exact-404 exclusion without weakening published checks | focused green tests + static gates | doctor use case, JSR adapter/tests, artifacts |
| 3 | Prove release-blocking suite and final gates | full requested gate set | evidence/worklog/context only |

### Deferred Scope

- #1597 E2E gate changes and release operations are explicitly excluded.

### Contributor Path

Follow `doctor-plugin-invariants_test.ts` from a service-entrypoint scenario into
`checkServiceEntrypoint`, then follow the injected loader to `fetch-jsr-export-map.ts` for registry
transport behavior.

## Plan-Gate

- `PLAN-EVAL: N/A` recorded before implementation. This is a small leaf fix with owner-specified
  contract, exact predicate, three tests, files, hazards, and gates; no material design decision is open.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | 0 | bootstrap | Clean requested branch confirmed at exact baseline; research and design recorded. |
| 2026-08-12 | 1 | pre-fix test | Focused set exited 1: unpublished 404 expected warning but received error; published-defect and 503 controls passed. |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused discriminating pre-fix test | EXPECTED RED (exit 1; 2 pass / 1 fail) | `slices/w5-a-doctor/evidence.md` |

Remaining gates are not run yet.

## Handoff Notes

- Evaluator should inspect exact-status discrimination, the published negative fixture, 503 behavior,
  and confirm #1597 files are unchanged.
