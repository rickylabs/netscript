# IMPL-EVAL — BLOCKING finding on 98ce3ef81. Fix before ready.

Evaluator: Opus 5 supervisor. The bridge (C1), the exit code (C2) and the honest ticks (C3) all
pass — verified against the diff, not the plan. One confirmed defect blocks marking ready.

## BLOCKING — the workers check false-errors on a CORRECTLY generated project

`.netscript/generated/plugin-workers/job-registry.ts` is written by **two different generators with
two different output shapes**, and your check only recognises one of them.

1. `plugins/workers/src/cli/registry-compiler.ts` (`compileWorkersRegistry`, reached via
   `netscript plugin workers compile-registry`) emits
   `import * as job0 from …` + `resolveJobHandler(job0, …)`. Your regexes match this.
2. `plugins/workers/src/cli/runtime-registry-generator.ts` (`generateRuntimeRegistries`, driven by
   `plugins/workers/scaffold.runtime.json` → `runtimeRegistries[0].registryPath` =
   `.netscript/generated/plugin-workers/job-registry.ts`, `varPrefix: "job"`, `kind: "workers-job"`)
   emits a **default** import — `import job0 from '…';` — and registry entries `[job0.id, job0]`.
   There is no `* as` and no `resolveJobHandler` anywhere in its output.

This is the `netscript generate plugins` path — the same flow the issue's clean-room project used.

Measured, not argued. Feeding a faithful sample of generator (2)'s output through your exact
predicate from `plugins/workers/src/adapter/plugin.ts`:

    {"declared":0,"handlers":0,"definitions":3,"loadable":false}

`declared > 0` is false because `import \* as job\d+ ` cannot match a default import. So on a
project whose registry is present, non-empty and fully correct, `every declared job is registered`
returns `ok:false` → report `error` → `netscript plugin doctor` exits 1.

Two consequences, both worse than the bug we are fixing:

- We replace "green with no evidence" with "red with no cause". #1022 exists because the doctor
  could not be trusted; a doctor that fails a healthy project is untrusted in the other direction,
  and an agent that hits one false red stops running the tool. That is the discoverability bar for
  this cluster.
- The remediation we print is actively harmful: `netscript plugin workers compile-registry` writes
  generator (1)'s shape over generator (2)'s file at the same path, so following our advice
  rewrites a working registry into a different shape.

Note the shipped tests do not catch this — both new tests only exercise the *absent* registry case.
That gap is the reason the defect survived to the diff.

### What to do

Make the workers checks recognise the registry as the runtime actually loads it, not as one
generator happens to spell it. Concretely, either:

- **(preferred)** assert the contract the loader depends on rather than the syntax: the runtime
  entrypoint is `plugins/workers/src/runtime/generated-jobs.ts` — check the exports and the entry
  count it needs (`registry`, `jobDefinitions`, non-empty maps), so both generator shapes pass and
  a genuinely broken registry still fails; or
- accept both shapes explicitly — count `import (\* as )?job\d+ ` for declared, and treat an entry
  as registered if it appears in either `resolveJobHandler(job\d+,` or the `[job\d+.id, job\d+]`
  map form.

Whichever you pick, **add a positive test per generator**: build a sample from each generator's real
output and assert the checks report `ok:true` and the command exits **0**. A doctor with no
green-path test is how this defect got here. Do the same audit for sagas — `plugins/sagas/scaffold.runtime.json`
also declares a `registryPath` of `.netscript/generated/plugin-sagas/sagas.registry.ts`; confirm
which generator actually writes it in the `generate plugins` flow and that your predicate passes on
that output. If sagas has only one shape, say so with the evidence.

## Non-blocking — please answer in `worklog.md`, do not silently change

1. You swapped the doctor's default loader from `loadRegisteredPluginMetadata` to
   `loadRegisteredPlugins`. The former is documented "without importing plugin modules into the CLI
   process"; the latter imports every plugin. This is defensible — it is the only way to read
   `contributions.doctor` — but it is a real behaviour change. State it in the PR body so a reviewer
   sees it, and confirm a plugin that throws on import degrades to a reported `error` rather than
   crashing the command.
2. `normalizePluginManifest` now also passes through `cli: definition.cli`, which was previously
   dropped. That looks like a genuine latent bug (the auth-backend check was dead on this path), but
   it is beyond #1022's stated scope. Keep it, and name it in the PR body as a drive-by fix.
3. Confirm the dynamic `import(moduleUrl)` of a plugin's `.ts` adapter still resolves when the CLI
   runs from a compiled/published binary rather than source, or record it as known debt.

## Gates

Re-run the scoped gates after the fix: `.llm/tools/run-deno-check.ts --root <each touched root>
--ext ts,tsx` (do **not** pass `--unstable-kv`), touched-root lint/fmt, and the doctor tests
including the new green-path ones. Do not run `e2e:cli run scaffold.runtime`.

Keep boxes 4 and 6 unticked with the stated reason. Push to `fix/1022-plugin-doctor-truth`; PR #1045
stays draft until this is fixed. Record the correction in `drift.md`.
