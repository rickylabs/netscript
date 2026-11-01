# Drift

- RTK binary unavailable; structured wrappers run directly with their actual exit codes retained.
- Research found generated CLI consumers: declared surface extended before implementation to include
  the two canonical generated assets and existing generated-normalizer tests. This triggers e2e-cli
  CI, which the coordinator owns; full local runtime suite remains prohibited.
- No new architecture debt. Existing database Refactor/AP-17 debt remains outside this slice.
- PLAN-EVAL round 1 required the public reference and changelog in scope. Plan and writable surface
  updated before implementation; no API expansion beyond the planned refusal reason.
- Final handoff/lesson evidence is included in the implementation slice rather than an additional
  docs-only commit; final evaluator verdict stays outside Git to preserve its exact target head.
- CI follow-up: updating the public reference also invalidates the shipped agent-docs prose corpus.
  Canonical `gen:agent-docs-prose` and its freshness gate are added to the repair slice, with declared
  generated outputs in supervisor.md. No parser behavior change is needed.
- User's CI-failure follow-up requires finishing the pending runtime gate. Existing manual e2e-cli
  workflow dispatched remotely at the pushed branch, leaving coordinator-owned labels untouched and
  starting no local runtime. Final head must carry its own CI evidence after any repair push.
