# Worklog: `plugin install --no-samples`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1017-plugin-install-no-samples--codex` |
| Branch | `fix/1017-plugin-install-no-samples` |
| Archetype | `6 — CLI / Tooling` with affected Archetype 5 connectors |
| Scope overlays | `none` |

## Design

### Public Surface

- Public command remains `netscript plugin install <kind> --no-samples`.
- `DispatchPluginScaffoldOptions.includeSamples` carries the internal CLI boundary value.
- `InstallStarterResource` gains one optional, documented samples policy exported from
  `@netscript/plugin/adapter`; undefined retains emit-all behavior.

### Domain Vocabulary

- `includeSamples` — boolean install intent serialized into `ScaffolderContext.options`.
- starter samples policy — discriminates omit-on-no-samples from alternate structural input.
- empty barrel input — a plugin-owned structural fallback that emits a valid module with no sample exports.

### Ports

- Existing `ProcessPort` remains the subprocess seam; no new port is introduced.
- Existing `FileSystemPort` remains the adapter write seam; no new port is introduced.

### Constants

- Exact forbidden sample paths are a single E2E constant/list containing the six issue paths.
- Existing default starter inputs remain the canonical sample-enabled values.

### Archetype 6 Surface Inventory

- Existing spine abstracts and command composition are untouched.
- Vertical feature: `public/features/plugins/install` plans and dispatches install.
- Adapter boundary: `public/features/plugins/dispatch` serializes plugin scaffold context.
- Extension axis: plugin starter resources, declared by `@netscript/plugin/adapter` and populated by each connector.
- Permission and command vocabularies are unchanged.

### Archetype 5 Connector Inventory

- workers composes job/task resources plus barrel/runtime glue from core adapter primitives.
- sagas composes saga resource plus barrel/runtime glue.
- triggers composes webhook/scheduled/file-watch resources plus barrel/runtime glue.
- streams composes stream resource plus barrel.
- No core/sibling contracts are redefined.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Prove no-samples crosses the official-plugin boundary and yields valid sample-free workspaces for all four plugins. | scoped check/lint/format, adapter + CLI tests, quality gate, exact-path E2E, one scaffold.runtime run | listed production/test/E2E files plus run artifacts |

### Deferred Scope

- Other scaffold options and starter-resource lifecycle redesign — unrelated to #1017.
- Existing doctrine debt — unchanged.

### Contributor Path

Plugin authors classify sample-only starters in `src/adapter/plugin.ts`; if a structural starter
references samples, they provide its no-samples input there. The core adapter interprets that policy,
while the CLI only serializes the boolean install intent.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | plan | research/design | Cause verified; four barrel hazards confirmed. |
| 2026-08-01 | 1 | implementation | Threaded `includeSamples`; added published starter samples policy; classified six samples; added four empty barrel alternatives. |
| 2026-08-01 | 1 | black-box | Four-kind true-userland suite passed with exact-path absence and structural type-check. |
| 2026-08-01 | 1 | reconcile | PR #1028 and issue #1017 remain milestone 0.0.3; scope and acceptance unchanged. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Empty structural barrels under no-samples | Prevent dangling exports while retaining workspace structure. | code inspection / plan D3 |
| Alternate `ItemScaffolder` rather than alternate input | Fixed sample barrel stubs cannot produce empty modules from different inputs. | PLAN-EVAL amendment |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| All four barrels, not only workers, reference samples. | minor | yes |
| `scaffold.runtime` reached Aspire but AppHost timed out during `database.init`. | minor/environmental | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| CLI check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts` | PASS | `filesSelected=742`, `failedBatches=0`, `totalOccurrences=0`. Wrapper added `--unstable-kv` itself. |
| Plugin check | `deno run -A .llm/tools/run-deno-check.ts --root packages/plugin --ext ts` | PASS | `filesSelected=153`, `failedBatches=0`, `totalOccurrences=0`. |
| Scoped lint | `run-deno-lint.ts --root packages/cli --root packages/plugin --root plugins --ext ts,tsx` | PASS | `filesSelected=1257`, exit 0, zero occurrences. |
| Requested raw lint | `deno lint packages/cli packages/plugin plugins` | PASS | `Checked 622 files`. |
| Scoped format | `run-deno-fmt.ts --root packages/cli --root packages/plugin --root plugins --ext ts,tsx` | PASS | `filesSelected=1257`, `failedBatches=0`, `findings=0`. |
| Adapter tests | `deno test --allow-all packages/plugin/src/adapter` | PASS | `11 passed, 0 failed`. |
| CLI plugin feature tests | `deno test --allow-all packages/cli/src/public/features/plugins` | PASS | `22 passed (54 steps), 0 failed`. |
| Adapter doc lint | `deno doc --lint packages/plugin/src/adapter/mod.ts` | PASS | `Checked 1 file`; new exported type/field documented. |
| Plugin publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/plugin` | PASS | `Success Dry run complete`; two pre-existing dynamic-import warnings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code-quality scan | PASS | `quality:scan`: `ok=true`, no findings | Seven existing explicit allowances; none added. |
| Doctrine/architecture | PASS with pre-existing WARN/INFO | `deno task quality:gate` completed | No `FAIL`; existing package/plugin documentation/cardinality warnings remain out of scope. |
| Full plugin doc wrapper | Existing debt | `totalPrivateTypeRef=15`, `totalMissingJSDoc=0` after focused fix | Private-type refs pre-date this slice; the new adapter surface is clean under focused doc lint. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Four-kind no-samples black-box | PASS | `Summary: passed=8 failed=0` | One scratch project; worker, saga with KV, trigger, stream; six paths absent; structural `.ts` outputs passed `deno check --unstable-kv`. |
| `scaffold.runtime` (single run) | FAIL (environment) | raw summary `passed=14 failed=1`; exit 1 | All scaffold/plugin gates passed. `database.init` failed when Aspire AppHost timed out after 300s; missing `certutil` and certificate trust warnings. Not rerun per brief. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Existing sample-enabled official installs | PASS | CLI feature tests and first 14 runtime-suite gates | Undefined/default policy still emits all samples. |
| Sample-free generated workspace | PASS | true-userland assertion gate | Empty barrels and workers/sagas/triggers runtime glue type-check; streams correctly has no runtime glue. |

## Handoff Notes

- IMPL-EVAL should inspect the published `InstallStarterSamplesPolicy`, exact six-path E2E list,
  and the environmental attribution of the single `scaffold.runtime` failure.
