# Worklog

## Design

- Contract: one recognized exports heading plus one authoritative package mapping.
- Public surface: unchanged; documentation checker coverage only.
- Coverage policy: `entrypoints-only`, based on root 51/51, SSE 12/33, telemetry 0/33 table rows, testing 0/4 table rows.
- PLAN-EVAL: N/A — mechanical scope with the only judgment resolved by executable evidence.

## Implementation

- Renamed only the export-table heading from `Entrypoints` to `Exports`.
- Added `plugin-streams-core` to `AUTHORITATIVE_MAPPING` with measured `entrypoints-only` coverage.
- Regenerated `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`, each exit 0 and in the assigned order.

## Gates

- Pre-commit functional gates passed except `check:assets-barrel`, whose implementation intentionally exits nonzero while its generated target differs from the current commit. The generated target was included in the implementation commit; the complete required suite is rerun at that immutable head, and the pushed-head exit codes are reported in the PR validation table.
- Pre-commit generated typecheck: exit 0.
- Pre-commit `git diff --check`: exit 0.
