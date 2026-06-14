# Drift — 5d3-route

Append-only. Reality vs RFC/doctrine/plan divergences.

## D-5d3-001 — previous run summary claims no artifacts

Previous trace `.llm/tmp/run/openhands/pr-36/run-27442056651-1/` stated "No other files were created or modified." This run seeds the run directory with `research.md`, `drift.md`, `worklog.md`, `commits.md`. Drift is procedural, not architectural.

## D-5d3-002 — file-size baseline exceeds F-1 cap

All three route entrypoints are over the 500-LOC soft cap:
`route/mod.ts` 755 LOC, `route/contract.ts` 764 LOC, `route/manifest.ts` 534 LOC.
Mitigation: decomposition into `route/types.ts`, `route/navigation.ts`,
`route/manifest-types.ts`, and `route/_internal/` (plan slices 2–7).

## D-5d3-003 — 180 doc-lint errors concentrated in route surface

Committed `deno-doc-lint.txt` shows 106 `missing-jsdoc` and 74 `private-type-ref` errors across the
three route files. The `private-type-ref` errors include cross-package builder leaks (e.g.
`builders/define-page/navigation.tsx` referencing `TypedRouteTarget`). Mitigation: move link
helpers into `route/navigation.ts` and make all public helper types explicit in `route/types.ts`.

## D-5d3-004 — package-wide dry-run failures are out of 5d3 scope

`dry-run-raw.txt` reports 62 package-wide problems (excluded-module + missing-explicit-return-type
in form/query). These are not route-specific and will remain after 5d3 unless the umbrella
explicitly expands scope. 5d3 target: route surface contributes 0 new problems; baseline delta
recorded in plan side-effect ledger SE-5d3-003.

## D-5d3-005 — route schema vocabulary should align to `@netscript/contracts`

Current `contract.ts` exposes Zod-specific `SchemaLike` from `builders/define-page/types.ts`.
Plan (design.md § oRPC/contracts alignment) proposes redefining the public type contract around
`ContractSchema<T>` from `@netscript/contracts`, with Zod kept as an internal implementation
adapter. This is a type-level narrowing, not a runtime change; consumer compatibility is the
consumer-import gate (slice 22).

## D-5d3-006 - 5d2 merge superseded stale builder probes

The pre-5d2 5d3 branch contained failed-agent probe tests under builders/define-page/alias_test.ts and zod_compat_test.ts. After syncing the evaluated 5d2 builder decomposition, those probes failed type-check and were not present on the supervisor branch, so the sync removes them. Route doc-lint remains open for 5d3 slices.
