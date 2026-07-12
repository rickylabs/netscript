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
| 2026-07-12 | slice 2 | implementation | Added normalized surface gate, 34-package/258-export/6,654-symbol baseline, declarations, CI, fixtures, and doctrine convention. |
| 2026-07-12 | slice 2 | gate | Classifier 3/3; live task patch; two-snapshot CLI returned undeclared=1 and declared=0; scoped check/lint/fmt passed after formatting. |
| 2026-07-12 | slice 2 | reconcile | Stable blocking flip remains deferred on open #309; Deno-doc deprecation payload loss logged as D5 and handled by declaration-local source fallback. |
| 2026-07-12 | slice 3 | implementation | Added hard release completion/fix-forward wording, generated Claude mirror, and tightened major declarations to exact package/export/symbol matches. |
| 2026-07-12 | slice 3 | gate | Version 7/7, surface 3/3, scoped wrappers, live patch, docs links, mirror check, and Claude validation all pass. |
| 2026-07-12 | slice 3 | reconcile | #309 remains open for stable blocking; no release, publish, PR, issue-state, label, or milestone mutation performed. |
| 2026-07-12 | evaluate | IMPL-EVAL | Separate Claude Opus 4.8 session `63940c83-7803-48ff-9820-3fdc96ea3c04` independently reproduced gates and returned PASS. |
| 2026-07-12 | close | commit trail | Slices `132ae6e6`, `14c6c172`, and `dc4c6bf3` pushed with explicit refspec; evaluator artifact prepared for final push. |

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
| Scoped check | release+deps wrappers | PASS | 36 files, 0 findings. |
| Scoped lint | release+deps wrappers | PASS | 36 files, 0 findings. |
| Scoped fmt | release+deps wrappers | PASS | 36 files, 0 findings after formatting six owned files. |
| Focused version tests | `deno task version:bump:test` | PASS | 7 passed, 0 failed. |
| Surface classifier | `deno task surface:diff:test` | PASS | 3 passed, 0 failed. |
| Root manifest format | explicit `deno fmt --check` | PASS | 1 file. |
| Docs links | `deno task docs:links` | PASS | 96 docs; 0 broken links/anchors/orphans. |
| Skill mirror | sync + `agentic:sync-claude:check` | PASS | 17 skills, 21 mirrored files. |
| Claude surface | `agentic:check-claude` | PASS | settings, mirror, and hook lock checks green. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-10 | PASS | coordinator + exact wrapper tests | Full workspace pattern classes and lock mirrors covered. |
| F-5 | PASS | live baseline + patch verdict | 34 packages, 258 exports, 6,654 symbols. |
| F-19 | PASS | scoped check/lint/fmt wrappers | 36 selected TypeScript files, zero findings. |
| IMPL-EVAL | PASS | `evaluate.md` | Separate opposite-family review; no blocking findings or debt. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Release cut/publish | N/A | prohibited | No release side effects. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| CI surface-diff task | PASS | `deno task surface:diff` | Live current vs committed baseline = patch. |
| Snapshot verdict CLI | PASS | explicit before/after paths | Undeclared major exit 1; declared major exit 0; stale deprecation warning emitted. |

## Handoff Notes

- Beta subset is complete and independently evaluated PASS. Stable-line blocking remains open on
  #309; the evaluator recorded one low, non-blocking watch note about broad version-string
  replacement for the eventual stable cut.

## Orchestrator rebase (Tier-A)

- Branch conflicted with post-#714 main in `cut.ts` (writeReleasePrBody vs the slice's
  createReleasePr edits) → GitHub created no PR merge commit, so PR #740 CI never triggered
  (beta-8 known pattern). Rebased onto main, kept main's mkdir-bearing `writeReleasePrBody`,
  widened `createReleasePr` files param to `readonly string[]`. Scoped check 0 findings;
  version:bump:test 8/8; surface:diff:test 3/3.
