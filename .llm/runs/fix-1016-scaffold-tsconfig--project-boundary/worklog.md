# Worklog: scaffold TypeScript project boundaries (#1016)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1016-scaffold-tsconfig--project-boundary` |
| Branch | `fix/1016-scaffold-tsconfig` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `netscript init` generated workspace contract: root `tsconfig.json`.
- Generated Fresh/Vite application contract: `apps/<app>/tsconfig.json`.

### Domain Vocabulary

- TypeScript project boundary — a self-contained `tsconfig.json` that stops parent discovery.
- Root boundary — empty file set, no TypeScript ownership of the Deno workspace.
- App boundary — Vite/Fresh transform options with an empty editor file set.

### Ports

- Existing `ScaffolderPort.writeFile(path, content, overwrite)` — preserves create/skip behavior; no new port.

### Constants

- `SCAFFOLD_FILES.TSCONFIG` — root/app `tsconfig.json`.
- `SCAFFOLD_FILES.TSCONFIG_APPHOST` — existing unrelated Aspire file remains unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove root/app upward lookup terminates through Tier-1 generators and force-aware writers. | Targeted scaffold/template tests; scoped wrappers; parent A/B; quality gate. | constants; two generators; two writers; four named test files; run artifacts |

### Deferred Scope

- Existing projects — this fix changes newly generated output only.
- General TypeScript editor configuration — the boundary is intentionally an empty file set.
- New standalone e2e framework — real A/B plus canonical scaffold runtime gate provide issue evidence.

### Contributor Path

Start at `scaffold-files.ts`, then follow the root/app generator imports into `scaffoldRoot()` and `writeNormalizedAppFiles()`; semantic expectations live beside those writers and in workspace generator tests.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | pre-plan | research | Baseline failure reproduced for Prisma and on first Vite SSR request; proposed contents prototyped successfully. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Empty `files` sets | Avoid editor overreach while terminating lookup. | Empirical A/B and issue constraint. |
| No template asset | Tier-1 JSON is small and avoids generated asset churn. | Owner brief and existing generator layout. |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Vite process startup succeeds before the fix; the first SSR request is the actual failing operation. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate formal evaluator | NOT_RUN | Hard stop before implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 6 / JSR | NOT_RUN | planned | Run after implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Before: database generate | PASS (failure reproduced) | exit 1, unresolved Astro parent extends | Confirms defect. |
| Before: Vite SSR | PASS (failure reproduced) | Vite SSR error on first `/` request | Starting the process alone is insufficient. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Prototype root/app configs | PASS | db generate exit 0; SSR HTTP 200; Deno check 0 before/after | Research-only temp prototype, not implementation. |

## Handoff Notes

- PLAN-EVAL should inspect locked decisions D1/D2 and the empirical distinction between Vite startup and SSR request.
