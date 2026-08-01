# Worklog: dependency-mode plugin Prisma schema resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1014-plugin-schema-dependency-mode--dependency-schema` |
| Branch | `fix/1014-plugin-schema-dependency-mode` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `netscript plugin install` behavior only; no command spelling or exported API changes.
- `JsrPackageFileFetcher` remains the injected published-file read port.

### Domain Vocabulary

- Resolved package schema fragment — normalized published path plus bytes.
- Schema source ladder — package-resolved fragments when declared in metadata, otherwise copied
  plugin source.
- Declared schema — `manifest.capabilities.hasDatabaseMigrations === true`.

### Ports

- `JsrPackageFileFetcher` — existing testable external JSR file seam.
- `FileSystemPort` / `ScaffolderPort` — existing copied-source read and root-target write seams.

### Constants

- No new finite command IDs or extension axes. Database path components reuse `SCAFFOLD_DIRS` and
  current `.prisma` suffix policy.

### Archetype-6 Checkpoint

- Spine abstracts/type parameters: unchanged by this slice.
- Layer-2 abstracts: none introduced.
- Vertical feature: `public/features/plugins/install`; kernel policy adapter:
  `kernel/adapters/plugin/db-integration.ts`.
- Extension axes/registries: existing `DbEngineRegistry`; no new registry.
- Generated output: `database/<engine>/schema/plugins/<name>/<fragment>.prisma`.
- Composition/commands/permissions: unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove dependency installs resolve, prioritize, copy, and validate published schema fragments while local/no-DB/dry-run behavior remains intact. | focused tests + scoped wrappers + `quality:gate` + one-pass `scaffold.userland-install` | DB integration + tests; public install/JSR adapter + tests; userland suite; run artifacts |

### Deferred Scope

- `InstallSpec.prismaContract` consumer design — unused seam is not required for backward-compatible
  0.0.2 installation.
- Legacy generic placeholder generation — report the stale expectation, but do not redesign the
  maintainer scaffolder.

### Contributor Path

Add schema contributions under a plugin package's `database/**/*.prisma`, include them in publish
metadata, and declare `hasDatabaseMigrations`; the public install resolver discovers them without a
host-side plugin-name mapping.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | 1 | research | Baseline functional repro: zero copies/no target; 0.0.2 metadata mapping verified. |
| 2026-08-01 | 1 | design | Source ladder, declaration signal, error boundary, and gate set locked. |
| 2026-08-01 | 1 | plan gate | Canonical Qwen PLAN-EVAL launch failed authentication before an agentic turn; implementation remains stopped. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Package metadata wins over copied placeholder | The published fragment is authoritative in dependency mode. | plan D3 / issue watch-for |
| Kernel owns target layout; public JSR edge owns network resolution | Preserves CLI layering and test seams. | doctrine A8/AP-25; plan D1–D2 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| No PR/push trail by owner instruction | minor process override | yes |
| Formal evaluator unavailable | significant process blocker | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Scoped check/lint/fmt | planned | NOT_RUN | After implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1…F-19 / applicable F-CLI | NOT_RUN | planned quality gate/review | After implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Focused plugin install tests | NOT_RUN | planned | Before consumer E2E. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `scaffold.userland-install` | NOT_RUN | confirmed suite ID | Run once after units are green. |

## Handoff Notes

- PLAN-EVAL should challenge D1–D5 and the userland suite's stale placeholder expectation first.
- Resume only after the approved evaluator can authenticate or the owner explicitly waives the
  Plan-Gate in writing; closed-model substitution and self-certification are prohibited.
