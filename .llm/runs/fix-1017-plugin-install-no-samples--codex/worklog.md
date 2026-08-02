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

## Follow-up slice: `check-test` registry alignment (2026-08-02)

### Design

- Public surface: none; presentation-test and E2E assertion coverage only.
- Domain vocabulary: the true-userland suite's exact ordered gate IDs remain the contract.
- Ports/constants: no new ports or constants; reuse the suite registry and existing required-path list.
- Commit slice: update the stale full-list expectation and conditionally restore four workers
  materialisation assertions, proven by the requested focused/full CLI/static/E2E gates.
- Deferred scope: AI plugin behavior (#1039), production install behavior, and PR/issue metadata.
- Contributor path: when the suite's gate sequence changes intentionally, update the one complete
  ordered expectation in `suite-registry_test.ts`; retain artifact assertions independently of
  sample-file policy when the generated project proves them.

### Implementation outcome

- Task 1 landed: the test name now says four no-samples installs, and its single ordered
  full-list `assertEquals` includes worker, saga, trigger, and stream.
- Task 2 was dropped after empirical verification. Under `--no-samples`, none of the four old
  `plugins/workers/...` materialisation paths exists. The first run proved the two TypeScript paths
  absent with `TS2307`; a narrowed second run reported the JSON and Prisma paths missing explicitly.
  No production behavior or assertion was fudged to manufacture those artifacts.

### Raw gate output

`deno test --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts`

```text
Check packages/cli/e2e/tests/presentation/suite-registry_test.ts
running 9 tests from ./packages/cli/e2e/tests/presentation/suite-registry_test.ts
registry exposes scaffold capability suites from constants ... ok (1ms)
native desktop suite is registered with an honest fixture preflight ... ok (2ms)
capability suites select only their scoped gates ... ok (4ms)
plugin suite includes all official plugin and generated-check gates ... ok (2ms)
true userland suite runs init, four no-samples plugin installs, assertion, and cleanup ... ok (2ms)
runtime suite includes full scaffold, database, runtime, and behavior gates ... ok (1ms)
runtime suite waits for the generated app and requests its home page ... ok (1ms)
runtime suite omits database resource wait for sqlite ... ok (539µs)
runtime suite selects mssql database resource wait for mssql ... ok (852µs)

ok | 9 passed | 0 failed (35ms)
EXIT_CODE=0
```

`deno test --allow-all packages/cli`

```text
ok | 493 passed (454 steps) | 0 failed (53s)
EXIT_CODE=0
```

`deno run --allow-all .llm/tools/run-deno-check.ts --root packages/cli --ext ts`

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1017"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":742,"batches":7,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

```text
EXIT_CODE=0
```

`deno lint packages/cli/e2e`

```text
Checked 107 files
EXIT_CODE=0
```

`deno fmt --check packages/cli/e2e`

```text
from /home/codex/repos/fix-1017/packages/cli/e2e/README.md:
 64 | -The structured native report is written to
 64 | +The structured native report is written to `.llm/tmp/desktop-native-e2e/evidence.json`. A
 65 | -`.llm/tmp/desktop-native-e2e/evidence.json`. A host-inapplicable gate is `NOT_RUN`, not a pass.
 65 | +host-inapplicable gate is `NOT_RUN`, not a pass. The current WSL execution reached the signed
 66 | -The current WSL execution reached the signed manifest through ephemeral-CA TLS but failed in the
 66 | +manifest through ephemeral-CA TLS but failed in the packaged runtime because
 67 | -packaged runtime because `op_desktop_verify_ed25519` was unavailable; that recorded `FAIL` is the
 67 | +`op_desktop_verify_ed25519` was unavailable; that recorded `FAIL` is the Linux verdict until the
 68 | -Linux verdict until the consumed runtime/SDK seam is reconciled and the complete gate reruns green.
 68 | +consumed runtime/SDK seam is reconciled and the complete gate reruns green.

error: Found 1 not formatted file in 111 files
EXIT_CODE=1
```

The owned file passes independently:

```text
$ deno fmt --check packages/cli/e2e/tests/presentation/suite-registry_test.ts
Checked 1 file
```

Task 2 empirical failures before it was reverted:

```text
TS2307 [ERROR]: Cannot find module '.../plugins/workers/mod.ts'.
TS2307 [ERROR]: Cannot find module '.../plugins/workers/services/src/main.ts'.
Found 2 errors.
Summary: passed=7 failed=1
EXIT_CODE=1
```

```text
missing expected artifact: plugins/workers/scaffold.plugin.json
missing expected artifact: plugins/workers/database/schema.prisma
Summary: passed=7 failed=1
EXIT_CODE=1
```

Final E2E after Task 2 was dropped:

```text
scratch project outside checkout: /tmp/netscript-userland-install-20d8ccb333c180b2/plugin-smoke-20260802-001345
present artifacts: deno.json, workers/mod.ts, workers/runtime.ts, sagas/mod.ts, sagas/runtime.ts, triggers/mod.ts, triggers/runtime.ts, streams/mod.ts
type-checked structural outputs: workers/mod.ts, workers/runtime.ts, sagas/mod.ts, sagas/runtime.ts, triggers/mod.ts, triggers/runtime.ts, streams/mod.ts
no copied packages/, plugin src tree, scaffold entrypoint, or monorepo path leaks found
Summary: passed=8 failed=0
EXIT_CODE=0
```

### Reconcile

This follow-up keeps the existing PR and partial `Refs #1017` framing. No PR/issue mutation or push
was performed. AI behavior remains deferred to #1039. The unrelated README formatting finding was
recorded without widening this assertion-only slice.

## Follow-up slice: symmetric plugin source-leak assertions (2026-08-02)

### Design

- Public surface: none; this only strengthens the embedded true-userland E2E assertion script.
- Domain vocabulary: forbidden source-leak paths for each installed official plugin.
- Ports/constants: no new ports; extend the existing ordered `forbiddenPaths` list.
- Commit slice: append the nine verified saga/trigger/stream repository paths and prove they are
  absent from a real generated userland project.
- Deferred scope: production code, AI plugin behavior (#1039), suite registry, PR/issue metadata,
  and the unrelated E2E README formatting debt.
- Contributor path: when another plugin is added to this suite, mirror each real repository source
  tree/entrypoint in `forbiddenPaths` and validate against the real userland gate.

### Repository-path verification

```text
$ ls -1 plugins/{sagas,triggers,streams}
Each contains: scaffold.ts, src, tests
Only plugins/workers contains the additional worker directory.
EXIT_CODE=0
```

### Outcome

All nine symmetric assertions landed. The real userland gate found no saga, trigger, or stream
source leak, so no product escalation or scope change was needed. Existing workers and `packages`
entries remain unchanged and in their original order.

### Raw gate output

`deno task e2e:cli run scaffold.userland-install --cleanup`

```text
Task e2e:cli deno run --allow-all packages/cli/e2e/cli.ts 'run' 'scaffold.userland-install' '--cleanup'
scratch project outside checkout: /tmp/netscript-userland-install-f0feed4d189832/plugin-smoke-20260802-002715
present artifacts: deno.json, workers/mod.ts, workers/runtime.ts, sagas/mod.ts, sagas/runtime.ts, triggers/mod.ts, triggers/runtime.ts, streams/mod.ts
type-checked structural outputs: workers/mod.ts, workers/runtime.ts, sagas/mod.ts, sagas/runtime.ts, triggers/mod.ts, triggers/runtime.ts, streams/mod.ts
no copied packages/, plugin src tree, scaffold entrypoint, or monorepo path leaks found
{"passed":8,"failed":0,"skipped":0}
EXIT_CODE=0
```

`deno test --allow-all packages/cli/e2e`

```text
running 9 tests from ./packages/cli/e2e/tests/presentation/suite-registry_test.ts
registry exposes scaffold capability suites from constants ... ok (1ms)
native desktop suite is registered with an honest fixture preflight ... ok (1ms)
capability suites select only their scoped gates ... ok (2ms)
plugin suite includes all official plugin and generated-check gates ... ok (1ms)
true userland suite runs init, four no-samples plugin installs, assertion, and cleanup ... ok (1ms)
runtime suite includes full scaffold, database, runtime, and behavior gates ... ok (1ms)
runtime suite waits for the generated app and requests its home page ... ok (1ms)
runtime suite omits database resource wait for sqlite ... ok (1ms)
runtime suite selects mssql database resource wait for mssql ... ok (620µs)

ok | 73 passed | 0 failed (4s)
EXIT_CODE=0
```

`deno lint packages/cli/e2e`

```text
Checked 107 files
EXIT_CODE=0
```

`deno fmt --check packages/cli/e2e/suites/scaffold/true-userland-install-suite.ts`

```text
Checked 1 file
EXIT_CODE=0
```

### Reconcile

The existing PR #1028 and partial `Refs #1017` framing remain unchanged. No push or GitHub mutation
was performed. AI behavior remains deferred to #1039, and the unrelated E2E README was untouched.
