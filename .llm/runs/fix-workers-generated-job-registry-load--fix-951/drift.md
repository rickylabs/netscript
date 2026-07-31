# Drift — #951

## D1 — the issue's mechanism was narrower than the defect

**Filed:** "The worker service registers only its built-in health-check job."

**Found:** that is one of four ways the generated registry failed to reach the runtime
registry, and it is not the primary one. `workers-api` — the service the issue describes —
was in fact the *only* entrypoint whose resolution was correct. The three that were broken:

1. `bin/combined.ts` resolved `../../<path>` against its own module URL and landed in
   `<root>/plugins/`, one directory short of the project root.
2. `bin/worker.ts` never loaded the registry (called `startWorkerProcess()` with no options).
3. `bin/scheduler.ts` never loaded it either.

Because `loadGeneratedJobRegistry` returned `{}` for every miss, all four paths — plus a
wrong cwd and a malformed module — were observationally identical.

**Resolution:** fixed all four, and made the miss impossible to hide. Stated in the PR body.

## D2 — a second, distinct defect found and not fixed here

`src/aspire/workers-contribution.ts` `declareEnv` returns `WORKERS_API_URL` as a literal
string rather than an Aspire service reference. This is the likely mechanism behind Grok
4.5's "workers missing `ServiceReferences`" report in the same issue. Different file,
different fix, different blast radius — filed separately as **#977** rather than folded into a
registry fix. `WorkersAspireContribution` also registers `workers-combined` alongside both
`workers-scheduler` and `workers-worker`, so the scheduler and worker each run twice; noted,
not changed.

## D3 — process: single-session run

`run-loop.md` requires PLAN-EVAL and IMPL-EVAL in separate sessions. This run was executed
as a single-agent issue fix; the generator ran its own gate set and no independent evaluator
session was dispatched. Recorded per `run-loop.md` §7.5 rather than left implicit.

## D4 — already-scaffolded projects keep the old inline glue

The fix to `src/adapter/resources/glue/runtime.stub.ts` changes what `netscript plugin
install workers` *emits*. Projects scaffolded before this change still carry their own copy
of the loader in `workers/runtime.ts`. That copy uses `projectFileUrl`, which resolves
correctly, so those projects are not broken — but they do not gain the loud startup check
until the glue is regenerated.
