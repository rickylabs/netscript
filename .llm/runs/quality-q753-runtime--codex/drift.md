# Drift Log: #753 deeper elimination

## 2026-07-12 — Owner-directed push workflow

- **What:** The harness normally requires a draft PR, per-slice pushes, and PR comments.
- **Source:** Harness run loop versus the slice brief.
- **Expected:** Draft PR commit/comment trail.
- **Actual:** Owner explicitly prohibited opening PRs and required a final force-with-lease push.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; owner slice brief.

## 2026-07-12 — Rejected branch unavailable on origin

- **What:** The prior rejected suppression pass cannot be inspected after the mandated reset.
- **Source:** `git fetch origin quality/q753-runtime-h` returned remote ref not found.
- **Expected:** Prior worklog might provide an allowance count.
- **Actual:** The reproducible base scan at `3b3d615b` is 31 findings and 12 allowances.
- **Severity:** minor
- **Action:** accept
- **Evidence:** baseline scanner output in `worklog.md`.

## 2026-07-12 — Queue test permission declaration

- **What:** The queue package test task did not grant environment access used by its tests and the
  Node `debug` dependency.
- **Source:** `deno task test` failed three tests/modules with `NotCapable`; the same suite passed
  35/35 with the required permission.
- **Expected:** The package's checked-in test task is green.
- **Actual:** The task needed `--allow-env`, matching the tests' existing behavior.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `packages/queue/deno.json`; test table in `worklog.md`.
