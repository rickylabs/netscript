# Drift Log: dependency-mode plugin Prisma schema resolution

Drift is append-only.

## 2026-08-01 — Owner-local commit trail

- **What:** The run will not open a draft PR, push commits, or post per-slice PR comments.
- **Source:** User instruction: “commits only; the supervisor owns the PR” and “Do not push and do not open a PR.”
- **Expected:** Harness normally opens a draft PR at bootstrap and uses it as the commit trail.
- **Actual:** Local commits and run artifacts are the only authorized trail.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` recorded override.

## 2026-08-01 — Placeholder expectation is not current dependency behavior

- **What:** The true-userland suite expects `plugins/workers/database/schema.prisma`, but current
  plugin-owned adapter resources do not emit Prisma files; the legacy kernel scaffolder is the only
  repository writer of that generic placeholder.
- **Source:** Repository search across `packages/plugin/src/adapter`, `plugins/workers/src/adapter`,
  and `packages/cli/src/kernel/adapters/plugin/scaffolder.ts`.
- **Expected:** The issue prompt allowed that the expectation might pass because a placeholder was
  generated somewhere.
- **Actual:** It describes an older/legacy path and is not evidence of the published real fragment.
- **Severity:** minor
- **Action:** fix the assertion within the slice; defer legacy placeholder redesign.
- **Evidence:** `research.md` findings 2 and 7.
