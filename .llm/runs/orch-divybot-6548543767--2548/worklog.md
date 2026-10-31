# Worklog

## Design

1. Public surface: coordinated stable/canary release now updates item dependencies in `packages/fresh-ui/registry.json`; installer contract stays exact pinned JSR.
2. Domain vocabulary: maintained release asset, canonical registry, historical v1 fixture. Existing BumpResult/discovery interfaces suffice.
3. Ports: existing filesystem and Git discovery; no new port.
4. Constants: explicit maintained release asset path list; fixture uses `0.0.0-fixture`. Existing canonical specifier matcher owns version syntax.
5. Commit slices: bootstrap run; implementation (bump discovery/tests, specifier regression, v1 fixture, registry README, required generated carriers) proved by focused tests, scoped gates and release rehearsal; evaluation and evidence follow.
6. Deferred scope: installer/schema changes, publication, merging.
7. Contributor path: `packages/fresh-ui/src/registry/README.md` explains exact first-party pin ownership and validation.

PLAN-EVAL: N/A; routine bounded release-file discovery repair with supplied acceptance.

## Bootstrap

Routing queried as feature JSON. Owner overrides evaluator to Claude Opus 5.5 high, read-only; public artifacts omit session identifiers and use repo-relative paths only. rtk absent; direct commands used. Owner directive `Refs #2548` and draft/no labels overrides generic delivery boilerplate.
