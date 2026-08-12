# Worklog: release cut regenerates agent-docs prose

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cut-regenerates-agent-docs-prose--w6` |
| Branch | `fix/cut-regenerates-agent-docs-prose` |
| Archetype | N/A — release tooling |
| Scope overlays | none |

## Design

### Public Surface

- `prepareRelease` — shared stable/canary version bump and preparation path.
- `PREPARED_RELEASE_GENERATED_OUTPUTS` — authoritative generated files staged by a cut.

### Domain Vocabulary

- Agent-docs corpus — `prose.json.gz` plus `provenance.json`, generated from the built docs site.
- Prepared release files — coordinated version writers plus generator-owned assets.

### Ports

- Existing `PrepareReleaseDependencies.runCommand` is the test seam; no new port is needed.

### Constants

- Reuse canonical agent-docs output constants from `build-agent-docs-bundle.ts`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Bootstrap the harness contract and draft PR | artifact review | run directory |
| 2 | Make tests independently fail for gate order and both staged outputs | focused pre-fix reds | `prepare-release_test.ts`, run evidence |
| 3 | Regenerate then stage the complete corpus | focused test + required gates + disposable dry-run | `prepare-release.ts`, run evidence |

### Deferred Scope

- IMPL-EVAL and draft→ready transition — explicitly owned by the orchestrator.

### Contributor Path

Future version-coupled assets are added to the generator sequence and
`PREPARED_RELEASE_GENERATED_OUTPUTS`, then covered independently in `prepare-release_test.ts`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-13 | 1 | bootstrap | PLAN-EVAL: N/A; owner supplied a complete mechanical contract and gates. |
| 2026-08-13 | 2 | pre-fix tests | Gate sequence and explicit prepared-output ownership each fail independently; full output in `evidence.md`. |

## Gate Results

Not run yet. Full untruncated evidence is recorded in `evidence.md`.
