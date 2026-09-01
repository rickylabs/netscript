# Research

## Baseline

- Re-baselined at `38f2ce7358f80e4075c481b450b52e1a01c5984c`, the exact supplied `main` baseline.
- `wait-for-workers-runtime.ts` currently requires both `[Scheduler] Started with` and the stale `Starting with Web Worker pool` substring via `Array.every`.
- `plugins/workers/worker/worker.ts:156` emits the current in-process shape: `[Worker ${this.workerId}] Starting in-process job runner (queue concurrency: ${this.concurrency})...`.
- The producer is outside the ceiling and remains unchanged.

## Surface

- Target: the nested `packages/cli/e2e` harness owned by `@netscript/cli`.
- Effective profile: Archetype 6 CLI/tooling, internal E2E gate only; no scope overlay.
- Current doctrine verdict: `packages/cli` is Keep. Doctrine file 10 explicitly excludes the nested E2E workspace from the published doctrine-root denominator.
- Public/JSR surface: unchanged; jsr-audit is N/A because no export map, package entrypoint, JSDoc, or published runtime behavior changes.

## Relevant doctrine and debt

- A14/F-10/F-19 apply: semantic tests and scoped structured runners are the evidence surface.
- AP-18 is avoided: fixtures assert marker semantics, not a giant snapshot.
- Existing debt `scaffold-runtime-a8-f16-1333` is not deepened: this slice adds one focused test below the existing `tests/application/gates` surface and does not add a sibling under the over-cap source scaffold gate directory.

## Open questions

- None. The marker logic, diagnostic requirements, fixture text, file ceiling, commit order, and validation commands are locked by the leaf brief.

