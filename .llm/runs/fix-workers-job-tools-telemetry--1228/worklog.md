# Worklog — workers scaffold job tools telemetry (#1228)

## Design

### Public surface

- `createJobTools(ctx): JobTools` from `@netscript/plugin-workers-core`.
- Existing scaffold-local `./job-tools.ts` import paths remain valid through thin re-exports.

### Domain vocabulary

- `JobTools`, `JobToolSpan`, active job span, child span, job progress event, runtime progress
  callback, W3C trace context.

### Ports and composed primitives

- `JobHandlerContext.reportProgress` is the runtime progress port.
- `@netscript/telemetry` active-span, event, child-span, and job-progress primitives are composed;
  no new telemetry port or backend is introduced.

### Constants

- Progress total: `100`; progress unit: `percent`.

### Commit slices

| # | Slice | Proof | Files |
| --- | --- | --- | --- |
| 0 | Harness plan and draft PR | composed Plan-Gate checklist | run artifacts |
| 1 | No-op-resistant RED and core wiring | focused real-provider test RED→GREEN | workers-core helper/exports/config, both scaffold re-exports, test, run artifacts |
| 2 | Caveat/debt closure | marker sweep + docs gates | affected docs, `arch-debt.md`, run artifacts |
| 3 | Merge readiness | selected archetype/publish/runtime gates + composed evaluation | evidence artifacts and PR metadata |

### Deferred scope

Structured logging, API expansion, provider configuration, and executor refactoring.

### Contributor path

Scaffolded jobs keep importing `createJobTools` from adjacent `job-tools.ts`; the adjacent file
re-exports the core-owned implementation. Extend behavior in the core telemetry module and prove it
at the exported helper boundary.

## Plan-Gate

| Row | Result | Evidence |
| --- | --- | --- |
| Research current | PASS | `research.md`, baseline `c38401366` |
| Decisions locked / open sweep | PASS | `plan.md` D1–D4; no must-resolve items |
| Slices / risks / gates / deferrals | PASS | tables and sections above + `plan.md` |
| JSR surface scan | PASS | `research.md` JSR section |
| Evaluator protocol | composed per milestone-run.md (orchestrator waiver) | owner directive; ruling D6 |

## Progress

| Time | Slice | Event | Evidence |
| --- | --- | --- | --- |
| 2026-08-04 | research | Read live issue first; body is literally `(see above)` | `gh`, connector, REST agree |
| 2026-08-04 | plan | Locked core-owned delegation and production-default test | plan D1–D4 |
| 2026-08-04 | 1 | RED | Real-provider test failed 0/1 because no child span was exported by the stubs. |
| 2026-08-04 | 1 | GREEN | Same production-default test passed 1/1; focused core/workers/triggers check passed. |
| 2026-08-04 | 1 | review | Core delegates to existing telemetry primitives; both plugin files are thin re-exports; no new backend or fake-only seam. |
| 2026-08-04 | 1 | reconcile | #1228 remains open; draft PR #1281 carries `Closes #1228`, milestone 0.0.5, and `status:plan`. |
| 2026-08-04 | 2 | caveat audit | Removed all five structured no-op markers, the satisfied debt entry, and additional false unstructured no-op claims; retained console-backed logging and unrelated caveats. |
| 2026-08-04 | 2 | docs gates | Scoped caveat references resolve (22 markers / 18 pages), docs accuracy passes, and internal links/anchors pass. |

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| No-op-resistant RED | EXPECTED FAIL | 0/1: child span absent from exporter. |
| Job-tools telemetry GREEN | PASS | 1/1: parent events, progress, callback, child span and parenting exported. |
| Focused check | PASS | workers-core root/telemetry plus both scaffold re-exports. |
| False-claim sweep | PASS | No job-tools no-op marker, debt ID, stub claim, or `still no-op` claim remains in docs/debt. |
| Caveat reference check | PASS | `check-caveat-refs.ts docs/site`: 22 markers across 18 pages resolve. |
| Docs accuracy | PASS | `deno task docs:accuracy`. |
| Docs links | PASS | 102 docs; zero broken links or anchors. |
