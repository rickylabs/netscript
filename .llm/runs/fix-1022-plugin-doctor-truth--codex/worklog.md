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
  binary resolution needs a production-package smoke in a follow-up; record as debt before claiming
  published-binary parity.
