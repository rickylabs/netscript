# Worklog

## Design

- **Public surface:** no public package surface changes; docs policing adopts all twelve existing export-map entries.
- **Domain vocabulary:** `PackageMapping` and `SymbolCoverage` only.
- **Ports:** none.
- **Constants:** none.
- **Commit slices:** one mechanical docs/tooling slice, proved by the required docs and corpus gates.
- **Deferred scope:** package code, reference symbol-table expansion, other #1777 packages.
- **Contributor path:** update the package export map and its reference `## Exports` table together; `docs:exports-drift` enforces entrypoint parity.

`PLAN-EVAL: N/A` — mechanical issue with a complete contract and one measurement-resolved policy choice.

## Research evidence

The twelve `deno doc --json` probes found 0 page-wide symbol gaps for root, `/public`, and `/builders`, but 157 unique gaps across the remaining layered surfaces. Selected policy: `entrypoints-only`.

## Implementation

- Renamed only the table heading to `## Exports`.
- Added `plugin-triggers-core` to `AUTHORITATIVE_MAPPING` with all twelve exports in scope and an evidence-based `entrypoints-only` reason.

## Preliminary gate pass

All required commands except `check:assets-barrel` returned 0 before the implementation commit. `check:assets-barrel` returned 1 because its task intentionally runs the generator and then requires the generated barrel to have no uncommitted diff; the newly generated barrel was not committed yet. The implementation commit now contains that output, so the complete gate set must be rerun at the final pushed head. This initial red is retained here rather than hidden.

## Reconcile

- Live issue #1807 remains open at `status:impl`, with `type:docs`, `area:docs`, `area:tooling`, priority P2, and milestone 27.
- The resolving PR will carry `Closes #1807` and exact acceptance-evidence mappings.
- No new issue comments or scope adjustments were found.
