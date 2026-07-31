# Plan — #951 generated job registry not loaded by the worker runtime

## Archetype and doctrine verdict

- **Archetype 5 — Plugin Package** (`plugins/workers`), with the **SCOPE-service** overlay
  (the change touches `services/` and background runtime entrypoints).
- Doctrine verdict source: `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`.
- Thinness law holds: the fix stays inside workers-specific wiring. Registry *compilation*
  already delegates to `renderRegistryModule` in `@netscript/plugin/cli`; registry *types*
  come from `@netscript/plugin-workers-core`. Nothing convention-bearing moves into the
  plugin, and nothing core-owned is re-implemented.

## Architecture decisions LOCKED

1. **One resolver.** `resolveGeneratedJobRegistryUrl()` in
   `src/runtime/generated-jobs.ts` is the only place the generated registry path becomes a
   URL. Every entrypoint calls it or a function that calls it. The defect was two resolvers
   disagreeing; the durable fix is that a second one cannot exist.
2. **Loading is a three-state outcome, not a best-effort object.** `absent` (project emitted
   no registry — legitimate), `loaded` (module read, definitions present), and **throw**
   (module present but unusable). The previous `{}` return collapsed all three.
3. **Registration is verified by read-back, not by write success.** After registering,
   `registerGeneratedJobRegistry` re-reads every declared id from the runtime registry and
   throws naming the missing ids. A write that reports success but does not land is the exact
   failure users saw; counting successful writes would not catch it.
4. **The load outcome is always reported.** `describeGeneratedJobRegistry` produces one
   startup line naming the resolved path and, on `absent`, the cwd. An off-by-one path is
   then visible in seconds instead of hours. Logging happens at the edges (`bin/`,
   `services/src/main.ts`), not in the runtime module, per AP-25.
5. **Background entrypoints load by default.** `startWorkerProcess` / `startSchedulerProcess`
   / `startCombinedProcess` load and verify the project registry when the caller supplies no
   `definitions`. Callers that already loaded it (generated glue) still pass theirs.
6. **The generated glue stops duplicating the loader.** The emitted `workers/runtime.ts`
   becomes a call to `startCombinedProcess()`. A copy of the loader in user-visible generated
   code is a second implementation that will drift again.
7. **`absent` stays non-fatal.** A project with no compiled registry is legitimate. Making it
   fatal would break every workspace that has not run the compiler yet.

## Open-decision sweep

| Decision                                             | Resolution                                                         | Status         |
| ---------------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| Change `loadGeneratedJobRegistry`'s return type?     | Add `status` + `url` fields; keep `definitions`/`registry` optional | resolved now   |
| Anchor resolution on a project-root marker walk-up?  | No — ambiguous in a workspace with nested `deno.json`               | resolved now   |
| Make `absent` fatal?                                 | No (decision 7)                                                    | resolved now   |
| Feed the generated handler map into the worker pool? | Yes — `options.registry ?? generated?.registry`                     | resolved now   |
| Aspire `ServiceReferences` for `WORKERS_API_URL`     | Out of scope — filed separately                                     | safe to defer  |

## Risk register

| Risk                                                                  | Mitigation                                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Additive fields on `GeneratedWorkersJobRegistry` break a consumer      | Purely additive; `{definitions, registry}` still destructures. Only in-repo caller was `bin/combined.ts`. |
| A malformed generated registry now crashes startup instead of degrading | That is the intent, and it is what all three reports asked for. `absent` stays non-fatal so no-jobs projects are unaffected. |
| Read-back verification costs one `get` per job at startup             | Bounded by job count, once per process; `registerStaticJobDefinitions` already did a `get` per job. |
| Scaffolded projects keep the old inline glue until reinstall           | Recorded in `drift.md`; the plugin's own entrypoints are fixed regardless.        |

## Expected gate set

From `gates/archetype-gate-matrix.md`, Archetype 5 column:

- Static: `fmt:check`, `lint`, `check`, `doc:lint`.
- Fitness: `arch:check` (F-1, F-3, F-5, F-9, F-11, F-12, F-14, F-16..F-19), `quality:scan`.
- Runtime/Aspire validation: **required** for Archetype 5 — `e2e:cli` (`scaffold.runtime`).
- Consumer import validation: `deno task test` covers the plugin's own consumers.
- Release-gate class: this run changes plugin scaffold output (`runtime.stub.ts`), so
  `scaffold.runtime` is in scope per `gates/release-gates.md`.

## Debt implications

No new debt entries. The run removes an implicit one: a duplicated loader with divergent
path resolution and no failure signal.

## Deferred scope

- The `workers` Aspire contribution declares `WORKERS_API_URL` as a literal string rather
  than an Aspire service reference (`declareEnv` in `src/aspire/workers-contribution.ts`).
  Grok 4.5's "workers missing `ServiceReferences`" symptom points here. It is a distinct
  defect in a different file with a different fix; filed rather than folded in.
- `WorkersAspireContribution` registers `workers-combined` **and** `workers-scheduler` **and**
  `workers-worker`, so the scheduler and worker run twice. Noted, not changed.
