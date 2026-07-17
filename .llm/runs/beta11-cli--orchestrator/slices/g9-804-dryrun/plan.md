# Plan — issue #804

## Locked decisions

1. Add a generic scaffold plan/apply seam in `@netscript/plugin` that returns deterministic artifact paths and invokes persistence only when not dry-run.
2. Route each plugin family's existing consolidated add handler through that seam; do not add guards to individual verbs.
3. In dry-run mode, include the same generated registry path(s) a real run reports without invoking registry writers.
4. Add temp-directory before/after snapshots for every add verb and compare dry-run planned paths with a real run's written paths.

Open decisions: none. Deferred: non-add mutating verbs and unrelated CLI parser consolidation.

## Slice and gates

- S1 proves all plugin add dry-runs are write-free and accurately planned. Touches the shared plugin CLI seam, four plugin CLI backends, tests, and this run dir. Gates: full touched plugin test dirs; scoped check/lint/fmt wrappers; `quality:scan`; `arch:check`.

Risks: registry plans could drift from writers (mitigated by constants/current compiler result paths and real-vs-plan tests); injected test services could mask writes (mitigated by temp-dir integration snapshots).

Debt: none created. Scope overlays: none.
