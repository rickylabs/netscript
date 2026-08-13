# Worklog: JSR specifier token boundary

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `fix-1631-specifier-token-boundary--w8` |
| Branch         | `fix/1631-specifier-token-boundary`     |
| Archetype      | N/A                                     |
| Scope overlays | none                                    |

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

| # | Slice                                                               | Gate                           | Files                                       |
| - | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| 1 | Bootstrap the harness record and draft review surface.              | Artifact review                | Run directory                               |
| 2 | Prove punctuation regression and strict controls RED/guarded.       | Focused Deno tests             | Scanner/readiness tests; evidence           |
| 3 | Share the canonical parser across scanner, readiness, and rewriter. | Focused tests + required gates | Tooling implementation/tests; run artifacts |

### Deferred Scope

- Release dispatch/publication — owner-owned after merge readiness.

### Contributor Path

Edit the shared NetScript JSR parser vocabulary first, then prove behavior through scanner/readiness
tests; do not introduce call-site regexes.

## Progress Log

| Time       | Slice | Step      | Notes                                                                                                                                      |
| ---------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-13 | 1     | PLAN-EVAL | N/A: small deterministic owner-specified fix.                                                                                              |
| 2026-08-13 | 2     | RED       | Punctuation assertion and composed range-pin gate failed pre-fix; bare/stale strictness controls stayed green.                             |
| 2026-08-13 | 3     | Implement | Shared parser landed across scanner, readiness residue audit, and bump rewriter.                                                           |
| 2026-08-13 | 3     | Reconcile | Issue #1631 remains open; draft PR #1632 has `Closes #1631`, required taxonomy, and milestone 0.0.6. No new review comments changed scope. |

## Gate Results

| Gate                                 | Result                                              | Evidence                |
| ------------------------------------ | --------------------------------------------------- | ----------------------- |
| Focused scanner/readiness/bump tests | PASS — 37/37                                        | `evidence.md`           |
| `deno task check`                    | PASS — 2,917 files, zero findings                   | `evidence.md`           |
| `deno task test`                     | PASS — 3,401 tests / 624 steps, 17 ignored          | `evidence.md`           |
| `deno task lint`                     | PASS — 2,034 files, zero findings                   | `evidence.md`           |
| `deno task fmt:check`                | PASS — 2,034 files, zero findings                   | `evidence.md`           |
| `deno task publish:readiness`        | PASS — `versionless-specifiers` scanned 2,359 files | `evidence.md`           |
| Lock hygiene                         | PASS — root and fresh-ui lock diffs empty           | pre-commit verification |

## Handoff Notes

- IMPL-EVAL is mandatory and owner-triggered by draft → ready; do not flip this PR.
- Review the shared matcher terminator, template-placeholder controls, and composed range failures
  first.
