# Drift Log: SDK trace-header authorship proof

## 2026-09-02 — Normative amendment reverses historical migration

- **What:** The issue's original trace-contribution migration is no longer valid.
- **Source:** Issue #1353's 2026-08-13 RFC 0001 Stage 5 amendment.
- **Expected:** Historical body proposed `traceContextContribution()` and removal of transport injection.
- **Actual:** Transport injection must remain; no trace contribution/public export may ship.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `research.md` audit and live issue body.

## 2026-09-02 — Main already enforces most guarantees

- **What:** Production reserved-header enforcement, transport spans, and retry/reconnect epochs were
  already merged through #1349's slices.
- **Source:** `prepared-call.ts`, `http-client-link.ts`, `stable-v1-adapter.ts`, and existing tests.
- **Expected:** The carried issue history described a migration-sized feature.
- **Actual:** Only explicit negative/composition/topology test proof remained.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `research.md` four-guarantee table.

## 2026-09-02 — Owner requires a non-draft implementation PR

- **What:** The owner brief overrides the harness draft-on-start convention.
- **Source:** PR contract in the implementation brief.
- **Expected:** Generic harness runs open draft PRs with the bootstrap commit.
- **Actual:** This leaf must open non-draft with all labels and milestone in the opening action.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` override and PR creation receipt.

## 2026-09-02 — MCP export corpus is already stale on baseline

- **What:** The owner gate expected a no-public-surface slice to inherit a green corpus check.
- **Source:** `deno task check:mcp-export-corpus` on the branch and a detached `origin/main`
  worktree at `77ad823d`.
- **Expected:** Exit 0 because this slice changes no export.
- **Actual:** Both commands exit 1 with the same stale-corpus error.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md` gate table; `git diff` contains no package source/export file.
