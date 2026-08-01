# Worklog: plugin doctor runtime truth

## Design

### Public Surface

- `PluginContributions.doctor` and `PluginBuilder.withDoctor()` declare a module contribution.
- `netscript plugin doctor` remains the command surface and throws a kernel exit error after output.

### Domain Vocabulary and Ports

- Existing `DoctorCheck` / `DoctorReport` remain unchanged.
- Host mapping adds remediation-bearing check messages; dynamic import is an injected edge where
  practical.
- No new AppHost client or live-resource port.

### Constants

- Reuse `WORKERS_JOB_REGISTRY_PATH` and the saga generator's canonical registry path.
- Define a stable non-zero doctor exit code in the command feature.

### Commit Slices

See `plan.md`; ordered contract/bridge → plugin checks → exit regression → evidence.

### Deferred Scope

- Acceptance boxes 4 and 6 (live AppHost/resource truth), triggers, and streams.

### Contributor Path

Add a plugin-owned doctor module returning `DoctorReport`, register it with `.withDoctor(path)`,
and keep host execution generic.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | bootstrap | complete | Owner-approved PLAN-EVAL PASS recorded. |
| 2026-08-01 | S1-S3 | implemented | Manifest doctor module, generic host bridge, worker/saga registry checks, and exit propagation landed locally. |
| 2026-08-01 | S3 | regression | Targeted command/contract tests: 7 passed, 0 failed. |

## Gate Results

### Static gates

| Gate | Result | Evidence |
| --- | --- | --- |
| CLI scoped check | PASS | 743 files; 0 diagnostics |
| plugin scoped check | PASS | 153 files; 0 diagnostics |
| workers scoped check | PASS | 98 files; 0 diagnostics |
| sagas scoped check | PASS | 71 files; 0 diagnostics |
| touched-file lint | PASS | exit 0 |
| touched-file format check | PASS | exit 0 |
| targeted tests | PASS | 26 passed, 0 failed |
| `quality:gate` | PASS | quality scan: no findings; doctrine checks: no failures |

### Acceptance evidence

- Box 1: absent registry rows are `error`; command renders the plugin summary and throws
  `RemoteError(1, ...)`. Command regression asserts `exitCode === 1`.
- Box 2: `checkRuntimeConfig` was deleted because it had no failure state.
- Box 3: workers and sagas populate `DoctorSpec.extraChecks`; `.withDoctor(path)` carries the
  adapter module into the manifest snapshot and the host executes its checks generically.
- Box 5: **not evidenced on the production path**. `project-config-loader.ts` converts child-process
  Zod output into a plain `Error` string. The use case expands structured `issues` when a loader
  preserves them, but the shipped child adapter currently does not. Leave the issue box unticked.
- Box 7: zero-registry command test renders the workers error/remediation and asserts exit code 1.

### Before / after fixture

The same zero-registry fixture printed all healthy/warning rows and `EXIT_CODE=0` at baseline
`3ab64720f`. Current code prints three workers registry errors, the command
`netscript plugin workers compile-registry`, a failed-plugin summary, and `EXIT_CODE=1`.

### Reconcile note

Draft PR #1045 carries `Closes #1022`, milestone 0.0.3, `type:fix`, `area:cli`, `area:plugins`,
`priority:p1`, and exactly one lifecycle label (`status:impl`). Acceptance boxes 4, 5, and 6 remain
unticked; 4/6 are owner-deferred AppHost work, and 5 is blocked by the existing child-loader error
transport rather than misrepresented as complete.

### IMPL-EVAL correction

- Fixed the blocking false-red for workers registries emitted by `netscript generate plugins`.
  The predicate now recognizes both the runtime generator's default-import/direct-map shape and the
  compile-registry namespace-import/handler-resolver shape; positive tests cover both.
- Sagas has one writer shape: `generate-runtime-registries.ts` delegates to `generateSagaRegistry`,
  so both command paths share the same namespace-import and `resolveSagaDefinition` output. A
  positive doctor test covers it.
- The default host loader intentionally changed from metadata-only loading to manifest loading.
  This imports plugin modules so `contributions.doctor` is available. Import failures are caught by
  the manifest-resolution boundary and become a workspace `error` report rather than escaping.
- Passing `cli` through `normalizePluginManifest` revives the previously dropped auth doctor hook;
  retained as a small drive-by correctness fix.
- Known risk: source `.ts` doctor modules resolve in local/copied-source plugins. Published/compiled
  binary resolution needs a production-package smoke in a follow-up; debt
  `cli-plugin-doctor-published-module` records the missing proof.
- Correction gates: all four scoped check/lint/fmt roots passed with zero findings; 33 targeted
  tests passed, including command exit 0 on output produced by both real workers generators and the
  real shared sagas generator. `quality:gate` also exited 0 with no new findings.

### IMPL-EVAL round 3 correction

- Restored `loadRegisteredPluginMetadata` as the doctor default. It reads static descriptors and
  never imports project `workers/jobs/*.ts` or saga source.
- Workers and sagas emit `scaffold.plugin.json` as a plugin-owned install artifact. Its
  `doctorEntrypoint` is a local file URL for source installs or the versioned `./doctor` package
  export for published installs. The imported adapter reaches registry constants and resource
  scaffolders only; generated project registries and project job/saga modules are read as text via
  `PluginCommandContext.fileSystem`, never imported.
- Metadata parse failures are captured per plugin as `manifestError`. Doctor-module import failures
  are also plugin-local; the sibling regression proves a broken doctor remains `error` while a
  healthy plugin still renders `healthy`.
- `scaffold.plugins`: 12 passed, 1 failed at `behavior.plugins-health` for the correct #1010
  dependency. `generate plugins` printed `Plugin registry generation complete: 0 written.`, then
  workers and sagas rendered registry errors with remediation commands and doctor exited 1. The gate
  still encodes the old exit-0 lie; it is recorded as depending on #1010 rather than weakening doctor.
- Targeted tests: 21 passed (19 nested install cases), 0 failed. Scoped checks completed without
  diagnostics; all four lint and format roots passed with zero findings.

### IMPL-EVAL round 4 publish correction

- Cause verified: both plugin packages exported `./doctor` while their explicit `publish.include`
  allowlists omitted the root `doctor.ts` module. Added it beside the other individually listed root
  modules; no glob or source behavior changed.
- Publish dry-run command: `deno task publish:dry-run` (repo task invokes
  `.llm/tools/release/run-publish-dry-run.ts`). Verbatim relevant output:

  ```text
  Task publish:dry-run deno run --allow-read --allow-write --allow-run .llm/tools/release/run-publish-dry-run.ts
  Publishing a workspace...
  Check plugins/sagas/doctor.ts
  Check plugins/workers/doctor.ts
  Simulating publish of @netscript/plugin-sagas@0.0.2 with files:
     file:///home/codex/repos/fix-1022/plugins/sagas/doctor.ts (113B)
  Success Dry run complete
  ```

  Exit code: `0`; zero publish problems. The complete workspace output also simulated
  `@netscript/plugin-workers@0.0.2` and its module graph included `plugins/workers/doctor.ts`.
- `deno task quality:gate`: exit `0`; existing warning-only doctrine/dependency findings, no failures.
- Scoped checks: workers `99` files / `0` diagnostics; sagas `72` files / `0` diagnostics.
