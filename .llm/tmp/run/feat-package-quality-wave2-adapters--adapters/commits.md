# Commit Log — feat-package-quality-wave2-adapters--adapters

> One row per pushed slice. Scaffolded at staging; no implementation commits yet.
> No slice is committed until PLAN-EVAL returns `PASS`.

| # | Commit | Subject | Gate proven |
|---|--------|---------|-------------|
| 1 | `1933bce` | docs(plan): Wave 2 research, plan, and design checkpoint | Plan-Gate input (research.md, plan.md, worklog.md, drift.md) |
| 2 | `29bf0bf` | docs(logger): add package docs and doctests | Slices 1-3: logger `/docs`, task hygiene, doctest, doc-lint, publish dry-run, lint, fmt |
| 3 | `9fd385c` | docs(harness): record 2a logger evidence and telemetry drift | Harness evidence for slices 1-3 + telemetry full-export doc-lint escalation |
| 4 | `966a746` | fix(telemetry): publish clean exported contracts | Slices 4-6: telemetry doc-lint full sweep clean (168→0), docs parity, publish dry-run 0 slow types |
| 5 | `37665e2` | fix(aspire): publish clean schema surface | Slices 7-9: aspire doc-lint clean, `./helpers` export removed, publish dry-run, tests |
| 6 | `5394902` | docs(logger): meet package readme threshold | Slice 3 DoD: logger README ≥150 lines |
| 7 | `4bacb67` | chore(tools): add scoped deno lint and fmt runners | Validation-process fix: scoped non-mutating fmt/lint runners |
| 8 | `df5be37` | fix(telemetry): use type-only imports for lint | IMPL-EVAL fix: telemetry `verbatim-module-syntax` lint errors |
| 9 | `32d8894` | fix(aspire): pin @std/assert in tests for lint gate | IMPL-EVAL fix: aspire `no-unversioned-import` lint errors |
