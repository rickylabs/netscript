# Worklog: JSR specifier token boundary

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1631-specifier-token-boundary--w8` |
| Branch | `fix/1631-specifier-token-boundary` |
| Archetype | N/A |
| Scope overlays | none |

## Design

### Public Surface

- Internal shared parser/matcher exports consumed only by repository release tooling.

### Domain Vocabulary

- NetScript JSR package name, exact semver, range operator, export subpath, and token boundary.

### Ports

- None; parsing is pure and filesystem scanning retains its existing seam.

### Constants

- Canonical scoped-name, semver, and boundary pattern sources.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Bootstrap the harness record and draft review surface. | Artifact review | Run directory |
| 2 | Prove punctuation regression and strict controls RED/guarded. | Focused Deno tests | Scanner/readiness tests; evidence |
| 3 | Share the canonical parser across scanner, readiness, and rewriter. | Focused tests + required gates | Tooling implementation/tests; run artifacts |

### Deferred Scope

- Release dispatch/publication — owner-owned after merge readiness.

### Contributor Path

Edit the shared NetScript JSR parser vocabulary first, then prove behavior through scanner/readiness tests; do not introduce call-site regexes.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-13 | 1 | PLAN-EVAL | N/A: small deterministic owner-specified fix. |

## Gate Results

Pending implementation.

## Handoff Notes

- IMPL-EVAL is mandatory and owner-triggered by draft → ready; do not flip this PR.
