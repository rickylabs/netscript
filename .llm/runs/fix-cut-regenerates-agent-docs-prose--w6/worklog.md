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
| 2026-08-13 | 3 | implementation | Added post-bump agent-docs generation before all corpus consumers and explicit deduplicated staging ownership. |
| 2026-08-13 | 3 | gates | Focused tests, check/test/lint/fmt, two freshness runs, and disposable 0.0.7 rehearsal all pass. |
| 2026-08-13 | 3 | reconcile | PR #1628 remains draft/status:impl; no new comments or scope changes require adjustment. |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| focused release tests | PASS | 3 passed, 0 failed |
| check | PASS | 2,915 files; 25 batches; 0 findings |
| test | PASS | 3,386 passed; 0 failed; 17 ignored |
| lint | PASS | 2,034 files; 0 findings |
| fmt:check | PASS | 2,034 files; 0 findings |
| agent-docs freshness ×2 | PASS | identical semantic hash, `fresh:true` twice |
| disposable 0.0.7 cut + freshness | PASS | cut exit 0; immediate freshness exit 0; version-only classifier true |

Full command evidence is recorded in `evidence.md`.
