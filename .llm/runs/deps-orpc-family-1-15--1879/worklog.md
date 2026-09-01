# Worklog: oRPC family 1.15.0

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `deps-orpc-family-1-15--1879` |
| Branch | `deps/orpc-family-1-15` |
| Archetype | N/A — dependency maintenance only |
| Scope overlays | none |

## Design

### Public Surface

- None; dependency metadata and lock graph only.

### Domain Vocabulary

- `@orpc/*` family — all direct and transitive oRPC v1 packages resolved by the workspace lock.
- single-copy invariant — one resolved version per oRPC package, load-bearing for `@orpc/shared`.

### Ports

- None.

### Constants

- Target stable version: `1.15.0`; manifest range: `^1.15.0`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove the complete oRPC v1 family resolves once at 1.15.0 | required dependency and root gates | all oRPC dependency declarations, `deno.lock`, this run dir |

### Deferred Scope

- Transport policy (#1351), oRPC v2, Zod dedup (#1320), and `Symbol.hasInstance` removal.

### Contributor Path

Update all workspace occurrences together, regenerate the checked-in lock, and verify the exact
resolved-package keys plus `deno why` before accepting a family move.

## PLAN-EVAL

`PLAN-EVAL: N/A` — the issue fixes the exact stable target, complete manifest scope, forbidden
surfaces, lock invariant, and required commands. No architecture or material design decision remains.

## Baseline Evidence

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Stable authority | 0 | Seven direct packages report stable `1.15.0`. |
| `deno why @orpc/shared` before | 0 | Resolved copies: `1.14.6` and `1.14.7`. |
| Exact lock package keys before | 0 | 18 keys: 17 at `1.14.6`, `@orpc/otel` at `1.14.7`, plus both shared keys. |

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 1 | research/plan | Baseline SHA and required pre-change evidence captured; implementation authorized by PLAN-EVAL N/A. |
| 2026-09-01 | 1 | attempted manifest move | Single-copy/frozen/check passed locally, but root test exited 1 because prohibited and source specifiers remained at 1.14.6. |
| 2026-09-01 | 1 | strict lock-only retry | Restored every manifest; explicit lock-only targets updated 0 dependencies and the valid graph remained mixed because of exact source pins. |
| 2026-09-01 | 1 | corrected manifest boundary | Raised all manifest oRPC keys, including `plugin-workers-core`, regenerated the lock (exit 0), then stopped because stale 1.14.6 package keys still failed single-copy. |
| 2026-09-01 | 1 | coordinator fixture ruling | Raised the two exact upstream-tracking SDK fixture imports to 1.15.0; targeted type check exited 0. |
| 2026-09-01 | 1 | lock convergence | Removed only unreachable 1.14.6 package-key residue after Deno regeneration; `why`, no-mixed audit, and frozen install all exited 0. |
| 2026-09-01 | 1 | catalog fallout | Root test exposed one stale scaffold dependency-catalog test. Raised only its six oRPC catalog constants; focused test and full root test exited 0. |

## Gate Results

| Gate | Exit | Result |
| --- | ---: | --- |
| `deno task deps:latest --filter '@orpc/*'` | 0 | Stable authority is `1.15.0` for all seven direct packages. |
| Baseline `deno why @orpc/shared` | 0 | Two copies: `1.14.6`, `1.14.7`. |
| Raised-manifest `deno why @orpc/shared` | 0 | One copy at `1.15.0`. |
| Raised-manifest no-mixed-version audit | 0 | 17 package names, each only `1.15.0`. |
| Raised-manifest `deno ci` | 0 | Lock hash unchanged. |
| Raised-manifest `deno task check` | 0 | 2,996 files, 25 batches. |
| Raised-manifest `deno task test` | 1 | 4,634 passed, 5 failed; failures require forbidden manifest/source changes. |
| Restored-manifest explicit `deno update --lockfile-only` | 0 | `Updated 0 dependencies`; exact pins prevent complete lock-only move. |
| Corrected-boundary `deno install --lockfile-only` | 0 | All manifest oRPC keys raised; source untouched. |
| Corrected-boundary `deno why @orpc/shared` | 0 | Live `1.15.0` graph plus stale `1.14.6` key with no dependency path. |
| Corrected-boundary no-mixed audit | 1 | Five names retain both 1.14.6 and 1.15.0 lock keys. |
| Approved fixture targeted check | 0 | Exact `@orpc/client` and `@orpc/tanstack-query` 1.15.0 imports type-check. |
| Corrected-scope `deno why @orpc/shared` | 0 | Exactly one resolved copy: `1.15.0`. |
| Corrected-scope no-mixed audit | 0 | 17 oRPC package names, each only `1.15.0`. |
| Corrected-scope `deno ci` | 0 | Frozen install; lock hash unchanged. |
| Scaffold catalog focused test | 0 | 2 passed, 0 failed. |
| Corrected-scope root `deno task test` | 0 | 4,639 passed, 0 failed, 19 ignored. |

The earlier failed rows are retained as investigation evidence. Final gate rows will be captured
after the required single integration of then-current `main`.

## Handoff Notes

- Owner retains IMPL-EVAL. Do not run it or flip the draft PR ready.
