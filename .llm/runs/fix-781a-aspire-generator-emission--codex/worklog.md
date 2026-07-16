# Worklog — fix #791 Aspire/CLI generator emission

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-781a-aspire-generator-emission--codex` |
| Branch | `fix/781a-aspire-generator-emission` |
| Baseline | `7d353be24ccdf0de656f1e70ae73167102da8528` |
| Phase | Implement — supervisor-authorized Plan-Gate override |

## Design

### Public surface and command surface

- No CLI command, option, binary, or export is added or renamed.
- Existing exported `buildViteEnvVarName(resourceName, endpointName?)` retains its shape and changes
  only invalid-character normalization in the `full` return value.
- Generated outputs affected: `.helpers/_aspire-compat.mts`, `register-apps.mts`,
  `register-tools.mts`, `register-plugins.mts`, `register-services.mts`, and
  `register-background.mts`.

### Archetype-6 spine and vertical catalog

- Existing spine abstracts remain unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`,
  `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract is introduced.
- The affected vertical surface is the existing scaffold/Aspire generator path under the CLI
  kernel template registry; no new feature or sub-feature folder is introduced.

### Domain vocabulary and constants

- `ViteEnvVarNames`: existing pair whose full key now uses identifier-safe segments.
- `PrimaryDatabaseProvider`: the configured `PrimaryDatabase` key projected under two established
  environment aliases.
- `SqliteDatabaseUrl`: absolute file URL derived from workspace root + database key + filename.
- `GarnetRestoreTimeoutMs`: finite 10,000 ms startup bound.
- `DenoNoLegacyAbortFlag`: local generator constant for corrected Deno HTTP request-signal behavior.

### Ports, adapters, and external systems

- No new port or adapter is warranted.
- Aspire SDK `addExecutable()` remains the resource adapter boundary.
- Node `pathToFileURL` provides cross-platform file URL conversion.
- Node `execFileSync` remains at the generated runtime edge, now with a timeout.

### Composition and extension axes

- Existing AppHost registration order and composition root remain unchanged.
- Existing extension axes/registries remain unchanged; no new variant is introduced.
- Generated resource capability emission is corrected at the existing register generators.

### Permissions and side effects

- No new Deno permissions are required.
- `--unstable-no-legacy-abort` changes request-signal semantics for plugin HTTP executables only.
- Garnet filesystem/process side effects remain inside `_aspire-compat.mts`, the designated runtime
  edge.

### Semantic test strategy

- Reverse existing assertions that require `withBrowserLogs()`, invalid `deno task` flags,
  hyphenated full Vite keys, and workdir-relative SQLite URLs.
- Assert exact semantic fragments and explicit absence; do not snapshot giant generated files.
- Preserve assertions proving dependency-age remains on valid `deno run` resources.
- Regenerate and parity-check embedded assets before focused and full gates.

### Commit slices

See `plan.md` C1–C3. Each cluster updates this worklog and `context-pack.md`, runs its focused gate,
commits, pushes, comments on the draft PR, and records a reconcile note before the next cluster.

### Deferred scope

Findings 7 and 9, Garnet lifecycle redesign, npm-island lock debt, and unrelated worker/plugin
runtime behavior.

### Contributor path

To change an emitted Aspire resource, edit the owning generator under
`packages/cli/src/kernel/templates/aspire/helpers/`, update the narrow semantic test beside it, edit
source `.template` assets when generated helper runtime behavior changes, run
`deno task gen:assets-barrel`, and finish with `check:assets-barrel` plus `scaffold.runtime`.

## Research evidence

| Check | Result |
| --- | --- |
| Issue #791 + #781 API read | PASS; body and all comments read via authenticated REST API |
| Latest base merge | PASS; already up to date at `7d353be` |
| Prior re-baseline read | PASS from preserved local ref `4e9113e` |
| Invalid task argv reproduction | Expected FAIL, exit 1 (`unexpected argument`) |
| Focused baseline tests | PASS: 17 suites / 128 steps, with identified false-green assertions |

## Slice progress

| Slice | Status | Commit | Focused gate | Push / PR comment |
| --- | --- | --- | --- | --- |
| Plan bootstrap | complete | `79ccd9bb` | Plan-Gate inputs prepared | pushed; PR #795 opened |
| C1 executable emission | complete | `8336acff` | focused tests 8 suites / 80 steps; scoped CLI check/lint/fmt PASS | pushed; PR comment posted |
| C2 environment projection | complete | pending | focused tests 12 suites / 94 steps; scoped Aspire/CLI check/lint/fmt PASS | pending |
| C3 bounded restore | pending | pending | pending | pending |

## Gate results

### C1 executable capability/argv emission

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused generator tests | PASS | 8 suites / 80 steps, exit 0 |
| Scoped check | PASS | helper root, 20 files, 0 findings |
| Scoped lint | PASS | helper root, 20 files, 0 findings |
| Scoped format | PASS | helper root, 20 files, 0 findings |

Existing invalid expectations were deliberately reversed: generic executable apps now assert no
`withBrowserLogs()`, app/Tauri/task/tool argv assert valid `['task', taskName]` shapes, and DB CLI
mode explicitly remains free of the unsupported dependency-age flag. Valid `deno run` dependency-
age usage remains asserted, and plugin API resources now assert `--unstable-no-legacy-abort`.

### C2 database and Vite environment projection

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused generator/helper tests | PASS | 12 suites / 94 steps, exit 0 |
| Scoped check | PASS | Aspire + CLI helper/assets roots, 68 files, 0 findings |
| Scoped lint | PASS | Aspire + CLI helper/assets roots, 68 files, 0 findings |
| Scoped format | PASS | Aspire + CLI helper/assets roots, 68 files, 0 findings |

The former hyphen-preserving full Vite-key assertion now requires identifier-safe underscores.
The former resource-workdir-relative SQLite assertions now require the generated workspace-root
`pathToFileURL` helper and explicitly reject `file:./database/...`. Database consumers project both
`DB_PROVIDER` and `DATABASE_PROVIDER` from `PrimaryDatabase`; DB CLI/tool-relative URLs remain
unchanged because those resources already execute inside their database directories.

## Reconcile notes

- Bootstrap: #791 is open at `status:impl`, milestone `0.0.1-beta.10`; #781 is open as the
  coordinating parent. Final draft PR must close only #791 and reference #781 without a closing
  keyword.
- Supervisor continuation: on 2026-07-16 the supervisor recorded plan commit `79ccd9bb` and draft
  PR #795, then explicitly instructed this lane to implement the locked plan. This is the written
  Plan-Gate override allowed by `run-loop.md`; this lane did not dispatch or self-certify PLAN-EVAL.
- C1 reconcile: #791 and #781 have no new comments changing scope. The implementation matches the
  locked executable-emission cluster; no dependency, export, debt, or suppression was introduced.
- C2 reconcile: the environment fixes remain at the owning source/helper-template layers and the
  embedded asset was regenerated. No new suppression, dependency, public export, or architecture
  exception was introduced.
