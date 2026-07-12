# Worklog: #309 release engineering and API-stability gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-309-release-api-stability-gates--codex` |
| Branch | `feat/309-release-api-stability-gates` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `deno task version:bump -- <version>` — coordinated zero-residue root/workspace/lock bump.
- `deno task surface:diff` — compare live normalized Deno-doc output with the committed baseline.
- `surface-diff.ts --write-baseline` — maintainer-only explicit baseline refresh.
- `surface-diff.ts --baseline <path> --current <path>` — deterministic local/fixture verdict path.

### Domain Vocabulary

- `SurfaceSnapshot` — schema-versioned package/export/symbol signatures plus root version.
- `SymbolSnapshot` — normalized public declarations and optional removal version.
- `SurfaceChange` — `major | minor` change with package/export/symbol/reason.
- `SurfaceVerdict` — highest required semver class: `major | minor | patch`.
- `MajorDeclaration` — explicit package/export/symbol approval with rationale.
- `DeprecationWarning` — exported symbol at/past its declared removal major/minor.

### Ports

- Deno process command — obtains `deno doc --json` for each export.
- Filesystem — reads manifests/baseline/declarations and writes only explicit baseline output.
- GitHub Actions — observational beta rollout on package-touching PRs.

### Constants

- `SURFACE_SCHEMA_VERSION = 1`.
- `CHANGE_KINDS = ["major", "minor"]`; patch is absence of signature changes.
- `VOLATILE_DOC_KEYS` strips location/JSDoc/body/resolution data.
- default baseline and declaration paths are resolved from repository root.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | One coordinator proves root, every workspace member class, scaffold manifests, and lock mirrors bump with no residue. | coordinator tests | bump tool, cut tool/tests, root task, worklog/context |
| 2 | Normalized surface snapshots classify synthetic and live Deno-doc changes and expose beta CI rollout. | classifier tests + local two-snapshot verdict + live task | surface tool/tests/baseline/declarations, root task, workflow, doctrine, worklog/context |
| 3 | Release completion policy is canonical and mirrored; all scoped gates and separate IMPL-EVAL complete. | mirror/Claude validation + scoped wrappers + evaluator | release skill/mirror, run artifacts |

### Deferred Scope

- Blocking stable-line surface gate — remains on #309 after beta observation.
- Automatic changelog/version intent inference — explicit major declarations are sufficient here.
- Actual release execution — prohibited by the slice brief.

### Contributor Path

To evolve the gate, start in `surface-diff.ts` pure normalization/classification exports, add a
synthetic Deno-doc fixture test, run the focused test, then refresh the baseline explicitly only
when the reviewed API delta should become the new reference.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | bootstrap | research/plan | Preflight passed; plan recorded before implementation. |
| 2026-07-12 | slice 1 | implementation/gate | Unified coordinator; `version:bump:test` passed 7/7; `deno.lock` unchanged. |
| 2026-07-12 | slice 1 | reconcile | Issue #309 remains open by scope; no PR/comment action authorized; no plan adjustment. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `.llm/tools/release` placement | CI/release fitness helper, not product CLI | netscript-tools skill |
| Doctrine file 02 for deprecation | Existing stability/semver section; expected file 10 does not exist | doctrine audit |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| D1 PLAN-EVAL owner waiver | significant | yes |
| D2 expected doctrine filename absent | minor | yes |
| D3 runtime identity unavailable | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Scoped check/lint/fmt | planned | NOT_RUN | Before handoff. |
| Focused version tests | `deno task version:bump:test` | PASS | 7 passed, 0 failed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-10 | PASS | coordinator + exact wrapper tests | Full workspace pattern classes and lock mirrors covered. |
| F-5/F-19 | NOT_RUN | planned surface tests/wrappers | Before handoff. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Release cut/publish | N/A | prohibited | No release side effects. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| CI surface-diff task | NOT_RUN | planned live task | Non-blocking beta rollout. |

## Handoff Notes

- Evaluator should inspect normalization stability, major declaration matching, every-member bump
  coverage, lock hygiene, and the non-blocking workflow choice first.
