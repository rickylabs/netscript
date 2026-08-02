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

- `SCAFFOLD_FILES.TSCONFIG_ROOT` / `TSCONFIG_APP` — explicit root/app `tsconfig.json` names.
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
| 2026-08-01 | S1 | implementation | Added two Tier-1 generators, root/app writes, file constant, and semantic tests. |
| 2026-08-01 | S1 | targeted gate | 66 tests / 242 steps passed. |
| 2026-08-01 | S1 | consumer A/B | Generated 176-file project beneath invalid parent; Deno check and db generate exited 0; SSR `/` returned HTTP 200. |
| 2026-08-01 | S1 | runtime gate | Canonical one-pass suite stopped at `database.init` because Aspire certificate trust timed out; 16 prior gates passed and cleanup passed. |

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
| Retired evaluator canary | former Qwen/OpenRouter route | RESOLVED | Owner waiver removes this dependency from the 0.0.3 fix train; no further probe. |
| PLAN-EVAL | owner-designated separate Opus 5 supervisor | PASS | `plan-eval.md`; three binding conditions observed. |
| Scoped check | wrapper, `packages/cli`, 744 files / 7 batches | PASS | 0 occurrences; exit 0. |
| Scoped lint | wrapper, `packages/cli`, 744 files / 4 batches | PASS | 0 occurrences; exit 0. |
| Scoped format | wrapper, `packages/cli`, 744 files / 4 batches | PASS | 0 findings; exit 0. |
| Targeted tests | `deno test -A .../scaffold .../templates` | PASS | 66 tests / 242 steps / 0 failed. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code quality | PASS | `deno task quality:gate` exit 0 | No findings; seven pre-existing named allowances. |
| Doctrine | PASS with warnings | `deno task arch:check` within quality gate | Exit 0; warnings are pre-existing and outside this slice. |
| JSR doc lint | PASS | CLI export map, three entrypoints | 0 errors / missing JSDoc / private refs. |
| JSR publish dry-run | PASS with existing warnings | `deno publish --dry-run --allow-dirty` | Exit 0; three pre-existing unanalyzable dynamic imports, no slow-type failure. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Before: database generate | PASS (failure reproduced) | exit 1, unresolved Astro parent extends | Confirms defect. |
| Before: Vite SSR | PASS (failure reproduced) | Vite SSR error on first `/` request | Starting the process alone is insufficient. |
| After: database generate | PASS | `db generate completed successfully.`; exit 0 | First attempt hit unrelated Aspire certificate timeout before Prisma; retry with `ASPIRE_DCP_USE_DEVELOPER_CERTIFICATE=false` completed. |
| After: Vite SSR | PASS | `HTTP/1.1 200`, HTML body | Real request to `/`; initial dependency cold-start exceeded 60s, following request completed immediately. |
| `scaffold.runtime` | FAIL (environment) | `passed=16 failed=1`; `database.init` timed out starting AppHost | Exact one-pass gate was run once. Failure is Aspire certificate trust (`certutil` unavailable), not a tsconfig resolution failure. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Prototype root/app configs | PASS | db generate exit 0; SSR HTTP 200; Deno check 0 before/after | Research-only temp prototype, not implementation. |
| Generated root/app configs | PASS | root/app content inspected in fresh `repro-after` | Both self-contained, no `extends` or `include`; created count increased 174 → 176. |

## Handoff Notes

- Slice reviewer should inspect the exact config shapes, force-aware writes, semantic tests, and unchanged Deno behavior.
- IMPL-EVAL must treat the parent A/B as manual end-to-end evidence plus unit property tests, and must not report `scaffold.runtime` green.
