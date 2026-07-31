# Context Pack — fix-workers-generated-job-registry-load--fix-951

## Subject

GitHub issue **#951** — a job compiled into `.netscript/generated/plugin-workers/job-registry.ts`
is not registered by the running worker runtime, surfacing as oRPC `NOT_FOUND` at
`triggerJob` time. Reported independently by 3 of 4 agents in the four-model build
experiment; the most expensive defect in that set.

## Archetype and overlays

Archetype 5 (Plugin Package) + SCOPE-service. Doctrine references in `plan.md`.

## Files that matter

| File                                                       | Role                                                       |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| `plugins/workers/src/runtime/generated-jobs.ts`            | The loader. Single resolver + startup check live here.     |
| `plugins/workers/bin/runtime.ts`                           | `start*Process` APIs; `registerProjectJobs` helper.         |
| `plugins/workers/bin/combined.ts`                          | Was the off-by-one resolver; now a bare `startCombinedProcess()`. |
| `plugins/workers/bin/worker.ts`, `bin/scheduler.ts`        | Unchanged files that now load the registry via the runtime. |
| `plugins/workers/services/src/generated-jobs.ts`, `main.ts` | Workers API registration path.                             |
| `plugins/workers/src/adapter/resources/glue/runtime.stub.ts` | Emits `workers/runtime.ts` into scaffolded projects.      |
| `plugins/workers/tests/runtime/generated-jobs_test.ts`     | The regression guards.                                     |

## Invariants a future change must not break

1. `resolveGeneratedJobRegistryUrl()` is the only place the registry path becomes a URL.
   The entrypoint guard test enforces this by source scan.
2. A generated registry that exists but does not reach the runtime registry is a **startup
   failure**, never a `NOT_FOUND` at call time.
3. `absent` (no compiled registry) stays non-fatal and is always reported with the path
   that was checked.

## State

Branch `fix/workers-generated-job-registry-load` off `8e0bcef39`. Gates recorded in
`worklog.md`. Follow-ups recorded in `drift.md` D2.
