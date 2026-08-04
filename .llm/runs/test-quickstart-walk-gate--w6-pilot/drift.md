# Drift

- 2026-08-05: none. D6 composed evaluation is the evaluator rule supplied by the milestone run, not a scope deviation.
- 2026-08-05: CI path classification selected `scaffold.runtime.sqlite`, which failed in pre-existing SQLite AppHost generation (`withReference` on a connection-string-less `sqlite` resource). The slice does not change scaffold output or SQLite; `ci:skip-scaffold` was applied with a PR rationale so a fresh synchronization evaluates the owned gate surface.
