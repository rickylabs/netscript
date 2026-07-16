# Worklog — fix #791 Aspire/CLI generator emission

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-781a-aspire-generator-emission--codex` |
| Branch | `fix/781a-aspire-generator-emission` |
| Baseline | `7d353be24ccdf0de656f1e70ae73167102da8528` |
| Phase | Plan & Design — ready for supervisor PLAN-EVAL |

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
| Plan bootstrap | in progress | pending | Plan-Gate inputs prepared | pending |
| C1 executable emission | pending | pending | pending | pending |
| C2 environment projection | pending | pending | pending | pending |
| C3 bounded restore | pending | pending | pending | pending |

## Gate results

Pending implementation.

## Reconcile notes

- Bootstrap: #791 is open at `status:impl`, milestone `0.0.1-beta.10`; #781 is open as the
  coordinating parent. Final draft PR must close only #791 and reference #781 without a closing
  keyword.

