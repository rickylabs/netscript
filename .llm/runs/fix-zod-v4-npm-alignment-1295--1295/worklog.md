# Worklog: Zod npm alignment

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-zod-v4-npm-alignment-1295--1295` |
| Branch | `fix/zod-v4-npm-alignment-1295` |
| Archetype | cross-cutting manifests + Archetype 6 guard |
| Scope overlays | none |

## Design

### Public Surface

- No framework export changes; member `zod` import aliases retain the same local name.
- `deps:check` gains a Zod single-instance invariant.

### Domain Vocabulary

- `ZodAlignmentFinding` — a precise manifest, lock, or source violation.
- `ZodAlignmentReport` — inspected paths, resolved instances, and findings.

### Ports

- Filesystem inputs only; the audit core accepts text/paths so negative controls do not mutate the repository.

### Constants

- `ZOD_CATALOG_RANGE` — `^4.4.3`.
- allowed workspace specifier — `catalog:`.
- allowed oRPC source subpath — `@orpc/zod/zod4`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | locked harness plan and draft PR | composed Plan-Gate | run artifacts |
| 1 | RED Zod graph guard with negative controls | live guard fails; unit tests prove predicates | `.llm/tools/deps/*`, root task, run artifacts |
| 2 | npm catalog alignment and reviewed lock | guard/deno info/check green | root/member manifests, SDK oRPC import, lock, run artifacts |
| 3 | publish and train readiness evidence | publish/doc/CI/review gates | run artifacts and PR metadata |

### Deferred Scope

- Actual JSR publication is deferred by #1312; dry-run and train soak are the available bar.

### Contributor Path

Change Zod only in the root catalog, run `deno task deps:check`, and inspect the single-instance report before accepting lock changes.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-05 | 0 | research | Reproduced three instances, violated peers, 18 member specifiers, and one non-v4 oRPC import. |
| 2026-08-05 | 1 | negative controls | Six tests prove the documented boundary and reject unknown v3 parents, JSR member/source specifiers, AI/MCP v3 resolution, and the oRPC compatibility root. |
| 2026-08-05 | 1 | RED | Live guard failed with 21 findings: catalog 1, member specifier 18, lock instance 1, oRPC surface 1. |
| 2026-08-05 | 1 | reconcile | Draft PR #1315 targets `canary/0.0.5-canary.13`; issue scope and labels remain current. |
| 2026-08-05 | 2 | GREEN attempt | Catalog/member/oRPC alignment removed measured MCP peer-to-3 warnings, but guard still found Zod 3. |
| 2026-08-05 | 2 | drift | Native provenance found hard v3 paths through kvdex and AG-UI; exact-one-instance acceptance remains unearned. |
| 2026-08-05 | 2 | rescope | Owner rewrote #1295 to align workspace/AI/MCP v4 while documenting the exact residual boundary; full collapse moved to #1320. |
| 2026-08-05 | 2 | GREEN | Guard passes with npm Zod 4 for AI/MCP and only the exact `@ag-ui/core@0.0.52` / `@olli/kvdex@3.6.7` v3 parents. |
| 2026-08-05 | 2 | focused proof | 977-file targeted check and 27 CLI/service/streams tests pass, including the generated workspace compile fixture. |
| 2026-08-05 | 3 | publish proof | Repository publish dry-run exits 0; `deno doc --lint` passes all exports for the 19 affected package/plugin roots. |
| 2026-08-05 | 3 | architecture proof | `quality:gate`, dependency checks, docs accuracy, and focused lint/format all pass; doctrine reports baseline warnings only. |
| 2026-08-05 | 3 | cloud repair | Canary code-quality exposed a Zod 4 `private-type-ref` in the plugin manifest schema; a local public validator contract preserves the runtime Zod object and makes the exact cloud doc-lint command green. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| npm root catalog | gives workspace and npm peers one resolvable identity | issue #1295 / Deno catalog law |
| graph-wide guard | string-only catalog checks cannot prove deduplication | issue acceptance |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Guard predicate tests | PASS | 6 passed, 0 failed |
| Live graph guard | PASS | two instances, with residual v3 restricted to `@ag-ui/core@0.0.52` and `@olli/kvdex@3.6.7` |
| Targeted check | PASS | 977 files, 9 batches, 0 diagnostics |
| Focused tests | PASS | 27 passed, 0 failed |
| Dependency / architecture | PASS | `deps:check` and `quality:gate`; baseline warnings only |
| Documentation accuracy | PASS | repository docs accuracy gate |
| Publish dry-run | PASS | full workspace simulation completed successfully |
| `deno doc --lint` | PASS | all exports across 19 affected package/plugin roots |
| Focused lint / format | PASS | changed TypeScript and boundary documentation |
| Plugin publish surface | PASS | exact cloud `deno doc --lint` command; 63 plugin tests, including 5 manifest tests |
