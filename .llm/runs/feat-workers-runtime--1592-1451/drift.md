# Drift — workers runtime plumbing

## 2026-09-01 — Slice P

- **Product/design drift:** none. Slice P follows D1–D4 and stays within 8 of 10 allowed
  product/test/doc files.
- **Artifact lifecycle:** `context-pack.md` and `drift.md` were intentionally absent from the
  plan-only session. They are added now because implementation handoff requires the standard
  resumable artifacts.
- **Test placement refinement:** the plan allowed a new `job-runner-pool_test.ts` only if focused
  coverage did not fit an existing test. The cases fit `job-dispatcher_test.ts` at 484 lines, so the
  new sibling was removed to avoid deepening the existing worker-directory F-16 warning.
- **Baseline evidence:** refreshed doc lint at `main` `78be0e032`; counts remain 9 core / 20 plugin,
  with zero new diagnostics.
- **Runtime gate policy:** the assembly `scaffold.runtime` E2E is not run in this no-lease lane, per
  owner instruction and the plan's final-assembly timing.
