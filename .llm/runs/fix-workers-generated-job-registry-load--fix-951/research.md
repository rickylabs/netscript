# Research — #951 generated job registry not loaded by the worker runtime

## Re-baseline

The issue carries **no comments**, so no prior verification exists. Every claim below was
re-derived against `origin/main` @ `8e0bcef39`. The issue's *symptom* is accurate; its
*mechanism* ("the worker service registered only its built-in health job") is one of four
distinct silent-load paths, not the whole defect.

## Findings

### F1 — `bin/combined.ts` resolved the registry one directory short of the project root

`plugins/workers/bin/combined.ts:19` (pre-fix):

```ts
const registryUrl = new URL(`../../${WORKERS_JOB_REGISTRY_PATH}`, import.meta.url);
```

`import.meta.url` is `<root>/plugins/workers/bin/combined.ts`, so the base directory is
`<root>/plugins/workers/bin/`. Two `../` segments reach `<root>/plugins/`, not `<root>/`.
Verified by evaluation, not inspection:

```
combined.ts resolves to: file:///proj/plugins/.netscript/generated/plugin-workers/job-registry.ts
expected               : file:///proj/.netscript/generated/plugin-workers/job-registry.ts
```

The `workers-combined` Aspire resource therefore never found the registry.

### F2 — `bin/worker.ts` and `bin/scheduler.ts` never loaded the registry at all

Both are one-liners over `startWorkerProcess()` / `startSchedulerProcess()` with **no
options**. `bin/runtime.ts` then ran `registerStaticJobDefinitions(runtime.jobRegistry,
options.definitions)` with `options.definitions === undefined`, which returns immediately.
Neither the `workers-worker` nor the `workers-scheduler` resource registered a single
generated job.

### F3 — every miss was indistinguishable from "this project has no jobs"

`loadGeneratedJobRegistry` mapped `Deno.errors.NotFound` to `{}`, and returned
`definitions: undefined` when the module exported no recognizable map.
`registerStaticJobDefinitions` opened with `if (!definitions?.size) return;`. So F1, F2, a
wrong cwd, and a malformed generated module all produced the same observable: a running
worker runtime with the health-check job and nothing else, and no log line anywhere.

### F4 — only `workers-api` ever registered generated jobs, and only by luck of cwd

`services/src/main.ts:51` used `projectFileUrl(WORKERS_JOB_REGISTRY_PATH)`, which is
`Deno.cwd()`-anchored. `WorkersAspireContribution` sets `workdir: ctx.projectRoot` for all
four resources, so this path works — but it made the entire feature depend on one resource
starting in the right directory and winning the race against the first `triggerJob` call.
That is the reported "returned *after* the parent record had already been written" shape:
the trigger reached `workers-api` before `workers-api` finished registering.

### F5 — both failure surfaces read from the same KV registry

- `services/src/routers/jobs.ts` `triggerJob` → `registry.get(jobId)` → `notFound(...)` →
  oRPC `NOT_FOUND` (GPT-5.6 Sol's symptom).
- `worker/job-dispatcher.ts:55` → `Job '<id>' not found in registry` (Claude Fable 5's
  symptom: "handler present, dispatcher still reporting 'not found in registry'").

Both are the same missing KV row. The handler being present is consistent — `WorkerPool`
sets `fallbackToDynamicImport: true`, so handlers resolve from `workers/jobs/` regardless;
it is the *definition* that is missing.

### F6 — the existing checks looked just past the defect

- `plugins/workers/services/src/generated-jobs_test.ts` asserted
  `registerGeneratedJobDefinitions **tolerates** a missing generated registry` — the silent
  degrade was encoded as the desired contract. It also constructed the registry URL itself,
  so it never exercised the resolution that was actually broken.
- `tests/cli/registry-compiler-golden_test.ts` locks the emitted registry byte-for-byte. It
  proves the compiler writes the job; it says nothing about whether anything loads it. All
  three reporters got past this check — the file on disk was correct in every case.
- The `scaffold.runtime` E2E brings the graph up and probes `workers-api`, whose load path
  (F4) was the one that worked.

### F7 — the generated runtime glue duplicated the loader

`src/adapter/resources/glue/runtime.stub.ts` emitted `workers/runtime.ts` into scaffolded
projects with its own inline copy of stat/import/`instanceof Map` logic. A second copy of
the loader in generated user code is how the two implementations drifted in the first place.

## Open questions closed during research

- **Is the `--profile scaffold` include allowlist in `scaffold.runtime.json` also dropping
  user jobs?** No. That allowlist only applies to the scaffold-time
  `generate-runtime-registries` run. `netscript plugin workers add-job` goes through
  `LocalWorkersRuntimeBackend.writeArtifactsAndCompile` → `compileWorkersRegistry`, which
  has no include filter. This matches the issue's step 3 ("Confirm the job appears in
  job-registry.ts") — the compiler is not at fault.
- **Does the workers plugin redefine a core-owned convention here?** No. Registry
  compilation delegates to `renderRegistryModule` from `@netscript/plugin/cli`; the
  registries are `@netscript/plugin-workers-core` types. The loading/validation being fixed
  is workers-specific wiring and stays in the plugin (Archetype 5 thinness law holds).

## jsr-audit surface note

`plugins/workers/deno.json` exports `./runtime` → `bin/runtime.ts`. The change adds exports
(`resolveGeneratedJobRegistryUrl`, `registerGeneratedJobRegistry`,
`describeGeneratedJobRegistry`, `GeneratedJobRegistryError`, `GeneratedWorkersJobRegistry`)
and widens two existing signatures. All new symbols carry explicit return types and JSDoc;
no slow types introduced.
