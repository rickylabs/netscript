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

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| npm root catalog | gives workspace and npm peers one resolvable identity | issue #1295 / Deno catalog law |
| graph-wide guard | string-only catalog checks cannot prove deduplication | issue acceptance |

## Gate Results

Pending implementation.
