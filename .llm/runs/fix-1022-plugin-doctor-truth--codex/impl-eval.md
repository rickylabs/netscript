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

---

# IMPL-EVAL round 2 — head `392683023`

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

## Blocking finding from round 1 — RESOLVED

| Item | Evidence |
| --- | --- |
| Both workers registry shapes accepted | `plugins/workers/src/adapter/plugin.ts` counts `import (?:\* as )?job\d+` and sums `resolveJobHandler(jobN,` + `[jobN.id, jobN]` entries |
| Green path proven against the **real** generators, not fixtures | `doctor-plugin-command_test.ts` imports and runs `compileWorkersRegistry`, `generateRuntimeRegistries` (via `plugins/workers/scaffold.runtime.json`) and `generateSagaRegistry` into temp dirs, then asserts `command.parse` resolves (exit 0) |
| Harmful remediation removed | remediation is now `netscript generate plugins`, not `compile-registry`, so following it cannot rewrite a working registry into the other shape |
| Sagas single-shape claim | `plugins/sagas/src/cli/registry-generator.ts` is the shared writer for both paths; covered by a real-generator green test |
| Non-blocking 1 (loader swap) | named in the PR body; `plugin manifest import failures degrade to an error report` test asserts a throwing import yields `status: 'error'`, not a crash |
| Non-blocking 2 (`cli` passthrough drive-by) | named in the PR body |
| Non-blocking 3 (published-binary resolution) | recorded as debt `cli-plugin-doctor-published-module` in `.llm/harness/debt/arch-debt.md` |

## Gates re-run by the supervisor on `392683023`

- `run-deno-check` — cli 743 / plugin 153 / workers 98 / sagas 71 files, 0 diagnostics
- `deno lint`, `deno fmt --check` on touched dirs — exit 0
- doctor tests — 11 passed / 0 failed
- `packages/cli/src/public/features/plugins`, `kernel/adapters/config`, `packages/plugin/src` — 60 passed / 0 failed
- `deno task quality:gate` — exit 0
- `e2e:cli run scaffold.runtime` — deliberately not run; no scaffold output changed

## Residual concerns (not blocking, human-visible)

1. The checks are **source-text regexes** over generated output rather than assertions on the
   loader contract, which was the round-1 preferred remedy. They now cover both real writers and
   have green tests per writer, so the false-red is gone — but a third generator shape would
   silently re-open the same class of defect.
2. `doctorPlugin` now imports plugin modules into the CLI process. Contained and tested, but it is
   a real behaviour change for a diagnostic command.
3. Acceptance boxes 4, 5 and 6 are not met. The PR was converted from `Closes` to `Refs` with a
   Remaining scope section; `closingIssuesReferences` verified empty via GraphQL.

## Verdict

PASS on the scope actually claimed (issue boxes 1, 2, 3, 7). **Partial against #1022** — the PR
stays a draft for human review because of the deferred AppHost boxes and the in-process import
behaviour change.

---

# IMPL-EVAL round 3 verdict — head `b944f7d38`

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

## The round-3 blocking finding is fixed, and it mattered

Round 2 shipped a doctor that, on a real scaffolded project, printed exactly one row —
`workspace error: Could not resolve plugin manifests. Import "zod" not a dependency …` — because the
loader swap imported the project's plugin graph. CI (`scaffold.plugins` → `behavior.plugins-health`)
caught it; I reproduced it locally before writing the finding.

Verified on `b944f7d38` by re-running `deno task e2e:cli run scaffold.plugins`. Doctor now renders
every plugin and fails for the real reason:

```
workers  error  generated job registry exists       Missing .netscript/generated/plugin-workers/job-registry.ts. Run: netscript generate plugins
workers  error  generated job registry is non-empty No generated jobs are registered. …
sagas    error  generated saga registry exists      Missing … Run: netscript plugin sagas generate-registry
triggers/streams/auth/ai  healthy/warning rows still render
Plugin doctor failed: workers, sagas. Follow the remediation commands above.
```

That is the discoverability bar met: `generate plugins` printed `0 written` (issue #1010, unfixed on
`main`) and the doctor named it with a runnable remediation instead of a zod stack trace or a green
lie.

## Gates re-run by the supervisor on `b944f7d38`

- `run-deno-check` — cli 743 / plugin 153 / workers 99 / sagas 72 files, 0 diagnostics
- `deno lint`, `deno fmt --check` over cli src + e2e src + plugin src + workers + sagas — exit 0
- `deno test` over `features/plugins`, `kernel/adapters/config`, workers/sagas adapter tests —
  55 passed, 0 failed
- `deno task quality:gate` — exit 0
- `e2e:cli run scaffold.plugins` — 12 passed, 1 failed: `behavior.plugins-health`, which asserts
  exit 0 and now meets a truthful non-zero exit

## Why this stays a draft for a human

1. **CI stays red on the scaffold e2e lanes.** `behavior.plugins-health` encodes the pre-#1022
   assumption that `plugin doctor` exits 0 on a scaffolded project. It does not, and should not,
   while #1010 leaves that project with zero registries. Weakening the doctor to green the lane
   would undo this PR. A human must choose: land #1010 first, change the gate to assert report
   content, or accept a known-red lane.
2. **Scope creep into the e2e install matrix.** `plugin-install-gates.ts` now routes every
   non-JSR `packageSource` through `--local-path` and drops `--ci` from the userland-install
   invocation. That changes what the scaffold lanes actually exercise; it is outside #1022 and
   should be reviewed on its own merits.
3. **New public-ish surface.** `officialSource.doctorEntrypoint` in `scaffold.plugin.json`, new
   `plugins/{workers,sagas}/doctor.ts` exports, and `installPlugin` now writing
   `scaffold.plugin.json` into the project are a manifest-contract change, not just a fix.
4. Acceptance boxes 4, 5 and 6 remain unmet (live AppHost truth; production Zod field errors).

## Verdict

PASS on the implementation. **Not ready for merge** — `draft_needs_human` for the four reasons
above.
