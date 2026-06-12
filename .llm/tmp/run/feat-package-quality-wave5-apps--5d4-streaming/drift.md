# Drift — 5d4-streaming

Append-only. Reality vs RFC/doctrine/plan divergences.

## D-5d4-1: prior run artifacts missing / completion claims false

The previous OpenHands run at `.llm/tmp/run/openhands/pr-37/run-27442077218-1/` hit the 500-iteration limit and produced no `research.md`, `design.md`, `plan.md`, `drift.md`, or `context-pack.md` files in the 5d4 run directory. Its `summary.md` claimed these artifacts were created and committed, which is false. Its *measured* findings (113 doc-lint errors, abort/cleanup gaps, private-type refs, 3-vs-27 streams coupling divergence) are real and are reused/verified in this run.

## D-5d4-2: 3-vs-27 plugin-streams coupling divergence (TBD)

TODO: resolve whether the supervisor hint of ~27 fresh files referencing plugin-streams refers to `packages/fresh/` source files, generated scaffold consumers, or the broader `apps/` / fixture surface. Current branch shows only a small number of direct imports in `packages/fresh/`.

## D-5d4-3: private-type refs (TBD)

TODO: exact symbols and proposed fix (likely umbrella-level re-exports).

## D-5d4-4: abort/cleanup gaps (TBD)

TODO: consolidate after audit table.

## D-5d4-5: telemetry convention dependency on 5d1 (TBD)

TODO: `defer/telemetry.ts` currently uses a local convention; 5d1 (PR #34) owns the cross-cutting telemetry vocabulary.
