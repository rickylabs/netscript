# Worklog: Slice G consumer guidance and hosted acceptance hook

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-cli-resource-slice-acceptance--1354-g` |
| Branch | `feat/cli-resource-slice-acceptance` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- No new public library or command surface. Existing `netscript generate resource` is exercised through E2E gate definitions.
- Existing generated `AGENTS.md` and `WEB-LAYER.md` content gains one consumer-facing command instruction.
- Existing `scaffold.runtime` suite gains two selected gate IDs.

### Domain Vocabulary

- `GateId` — existing stable union derived from `GATE`.
- `GateDefinition` / `CommandGateDefinition` — existing semantic gate contracts.
- `Resource slice` — existing generated Fresh route/view/island/loader set plus optional partial.
- Existing Archetype-6 spine remains `CliCommand<Input>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`; this slice introduces or modifies none of them.
- No layer-2 abstract is introduced.
- Affected vertical feature: existing `src/public/features/generate/resource/`; this slice only consumes its command from E2E.
- Extension axes and registries are unchanged.

### Ports

- `CommandExecutor` — consumed by the existing E2E runner; its captured stdout is evaluated through `stdoutIncludes`.
- Existing app/client/procedure resolvers are exercised through the public command and not modified.
- No new port is introduced.

### Constants

- `GATE.SCAFFOLD_RESOURCE_GENERATE` — `scaffold.resource-generate`.
- `GATE.SCAFFOLD_RESOURCE_RERUN` — `scaffold.resource-rerun`.
- Resource/client/procedure/variant — `people`, `users`, `list`, `--partial`.
- Rerun summary — `Resource slice applied: 0 written, 11 skipped, 0 conflicts.`.

### Command, composition, and generated-output contract

- Command surface: `generate resource people --client users --procedure list --partial --app <generated-app>`.
- Composition owner: `createScaffoldGates()` and `RUNTIME_GATES` both place the pair after `database.codegen` and its adjacent `generated.service-client-contract` probe, before `scaffold.ui-data-screen` and generated quality/type-check gates.
- Generated outputs: eight owned core/partial leaves plus three shared generated/router files.
- Permissions: no new permissions; execution uses the existing CLI command gate.
- Semantic tests: exact argv/cwd, gate order, captured stdout requirement, direct membership, materialized suite reachability, rendered guidance, and exact declared references.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Add resource acceptance gates, runtime selection, generated guidance, and the reachable-suite stdout fixture | focused/static unit tests; structured CLI gates; asset/publish/fitness gates | exactly the eight amended product files plus this run directory |

### Deferred Scope

- Hosted `scaffold.runtime` execution — CI/evaluator only by owner direction.
- Resource generator internals, command registration, templates, and service-query — already owned by prior slices.
- Resource removal, crash atomicity, and concurrent locking — explicitly deferred by #1354.

### Contributor Path

Add future scaffold steps by defining focused gate data beside `resource-slice-gates.ts`, composing it once in `createScaffoldGates()`, selecting its stable ID in the applicable capability list, and proving direct membership plus materialized-suite reachability. Update generated guidance through the pure builders and keep referenced paths covered by exact semantic tests.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-09-03 | G | bootstrap/research/design | Clean exact Slice F baseline verified; seven-file product scope remains sufficient. |
| 2026-09-03 | G | implementation | Implemented exactly the seven locked product files and kept `deno.lock` untouched. |
| 2026-09-03 | G | ceiling stop | Full CLI unit discovery proved that the existing `suite-runner_test.ts` success fake needs the rerun gate's captured skip summary; that is an eighth product file, so the owner-mandated stop condition fired. |
| 2026-09-03 | G | rescope/resume | Fetched amended plan `8896b3b768798593e3078b3db07170d148550aac`; PR #1891 authorizes item 8 and ceiling 8. Updated only the existing fake's stdout expression. |
| 2026-09-03 | G | author gates | Focused and full CLI unit suites plus check/lint/fmt, assets, publish, docs, JSR, doctrine, and quality gates all passed. Hosted runtime remains CI-owned. |
| 2026-09-03 | G | implementation commit | Created the Slice G implementation commit with all eight amended product paths and the run artifacts; exact SHA is reported from pushed `HEAD`. |
| 2026-09-03 | G | push/PR | Pushed implementation commit `97ad667cc0bf99f974e1673ed7d4dfce41932ba3` and opened non-draft stacked PR #1958 with the exact labels and milestone 0.0.7. |
| 2026-09-03 | G | IMPL-EVAL cycle 1 | Separate evaluator returned `FAIL_IMPL`/`FAIL_FIX`: runtime selection preceded database codegen and resource `users` collided with init's existing route alias. |
| 2026-09-03 | G | cycle-2 correction | Changed the resource name to `people`; selected the pair after `database.codegen` and its immediately adjacent service-client contract probe; mirrored definition order and strengthened direct/materialized order assertions. |
| 2026-09-03 | G | stock-init proof | Isolated local-source sqlite init, service generation, codegen, and the exact resource command twice all exited 0; first run wrote 11 and rerun skipped 11 with zero conflicts. No `e2e:cli` runtime suite was run. |
| 2026-09-03 | G | cycle-2 author gates | Focused 88/88 and full CLI 1716/1716 plus final check/lint/fmt, assets, publish, docs, doctrine, and quality gates all passed; `deno.lock` remains unchanged. |
| 2026-09-03 | G | live-main merge | Fetched coordinator-confirmed `origin/main` `e14322c511bbf26018c617c12f639474b6092c32` and merged it without rebasing. Conflict resolution retained main's final Slice F implementation and all eight Slice G product files. Merge commit: `008d3264c5352abf6d1e3798d580550ec98e7e7c`. |
| 2026-09-03 | G | carrier regeneration check | Asset barrel, publish assets, emitted samples, and MCP export corpus all passed with no generated diff. |
| 2026-09-03 | G | first live-main runtime | The unsplit `scaffold.runtime` run exposed that `scaffold.ui-data-screen` had already added a quoted route entry rejected by the resource reconciler. Moved that existing gate after the resource rerun within the eight-file ceiling and committed `a2366577fd8232c8e08e078b03d1e3cc84793b92`. |
| 2026-09-03 | G | exact-head runtime retries | Two unsplit runs at `a2366577` passed resource generation, identical rerun, UI generation, and every generated-project quality/type-check gate. Both later timed out only in `runtime.aspire-start`; each reported 42 passed/1 failed and cleanup passed. Live diagnostics showed healthy Postgres/Garnet/Redis containers but Aspire-advertised proxy ports diverged from Docker mappings on the shared host. |
| 2026-09-03 | G | exact-head Tier A | Focused 68/68, full CLI 1788/1788, check 1004 files/0 diagnostics, scoped lint/fmt 8/8, carriers, docs, JSR, dependency, architecture, quality, and publish gates completed at `a2366577`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| `PLAN-EVAL: N/A` | Owner states the plan is locked and evaluated; this author lane implements only its mechanical Slice G. | user brief |
| Resource `people`; client `users`; procedure `list` | Keeps explicit client/procedure selection while avoiding init's existing `appRoutes.users` alias. | IMPL-EVAL cycle 1 stock-init reproduction |
| Execute after database codegen and its service-client contract probe | Procedure resolution imports generated Zod CRUD output; the existing probe must remain immediately adjacent to codegen, so the resource pair follows it and precedes generated quality/type-check gates. | evaluator finding + full-suite invariant |
| Run the full hosted acceptance after the prerequisite merge | The coordinator explicitly superseded the earlier author-lane prohibition and requested exact-head hosted acceptance. | owner resume instruction |
| Resource generation precedes UI data-screen generation | `ui:add data-screen` writes a quoted router key that the intentionally fail-closed resource reconciler will not rewrite. | first live-main hosted run |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Captured-stdout reachability required item 8; PR #1891 amended the locked plan and the authorized fixture update is complete. | significant, resolved | yes |
| Slice F's remote branch advanced by three harness-evidence commits after the dispatched baseline; product files are disjoint and the PR still targets that branch. | minor | yes |
| Runtime prerequisites were not traced at design time: codegen output and router-alias ownership both blocked the original gate. | high, resolved | yes |
| Existing service-client order regression requires its contract probe immediately after codegen; the resource pair follows that probe within the same ceiling. | significant, resolved | yes |
| Live-main UI data-screen mutation had to move after the resource pair; runtime prerequisites include prior shared-file mutations. | high, resolved | yes |
| Shared-host Aspire/DCP advertised proxy ports diverged from healthy Docker mappings in two exact-head retries. | infrastructure, hosted proof pending | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| focused regressions | structured test wrapper over resource/guidance, runtime capability, service-client order, UI order, registry, and runner tests | PASS, exit 0 | 68 passed, 0 failed, 0 ignored. |
| CLI check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS, exit 0 | 1004 files, 9 batches, 0 failed batches, 0 diagnostics. |
| authorized-file lint | structured lint wrapper with no-exclusion temporary config | PASS, exit 0 | 8 selected/processed, 0 findings/refusals. |
| authorized-file format | structured fmt wrapper with no-exclusion temporary config | PASS, exit 0 | 8 selected/processed, 0 findings/refusals. |
| full CLI unit suite | structured test wrapper, executable `/var/tmp` | PASS, exit 0 | 1788 passed, 0 failed, 0 ignored. |
| `check:assets-barrel` | canonical regeneration plus generated-file diff | PASS, exit 0 | No generated asset-barrel diff. |
| `check:publish-assets` | canonical publish-asset check | PASS, exit 0 | Freshness check passed. |
| `check:emitted-samples` | canonical emitted-sample validation | PASS, exit 0 | 48 TypeScript samples from 38 artifact paths. |
| `check:mcp-export-corpus` | canonical corpus freshness check | PASS, exit 0 | 35 packages / 273 subpaths / 7,846 symbols; SHA-256 `ddbc949e…`. |
| CLI JSR audit | `audit-jsr-package.ts --root packages/cli --text` | PASS, exit 0 | 1004 files / 134,124 LOC / 280 test files; dry-run OK; 21 existing WARN findings, 0 FAIL. |
| Fresh JSR audit | `audit-jsr-package.ts --root packages/fresh --text` | PASS, exit 0 | 182 files / 26,465 LOC / 39 test files; dry-run OK; 2 existing WARN findings, 0 FAIL. |
| CLI publish dry-run | `deno task --cwd packages/cli publish:dry-run` | PASS, exit 0 | Three exports checked; existing dynamic-resolution warnings only; `Success Dry run complete`. |
| workspace publish dry-run | `deno task publish:dry-run` | PASS, exit 0 | Workspace simulation completed with `Success Dry run complete`. |
| CLI doc lint | structured full-export-map doc lint | PASS, exit 0 | 3 entrypoints, 0 diagnostics. |
| Fresh doc lint delta | structured full-export-map doc lint plus raw diff | BASELINE, raw exit 1 | 45 existing mainline diagnostics (28 private-type references, 17 missing JSDoc); zero `packages/fresh` delta from `origin/main`. |
| dependency usage | `deno task deps:why @netscript/fresh` | PASS, exit 0 | sourceUsed=true, sourceHitCount=107, likelyDeadImport=false, fullyRemovable=false. |
| production install | `deno task deps:prod-install` | PASS, exit 0 | OK in 277 ms. |
| `docs:readme-fences` | repository task | PASS, exit 0 | 36 READMEs, 169 fences, 74 checked; 7 expected type errors, 0 syntax-invalid/unattributed failures. |
| `docs:jsdoc-examples` | repository task | PASS, exit 0 | 35 members, 2,060 files, 359 checked candidates, 0 failures; `unboundName=116`, `typeError=14`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `arch:check` | PASS, exit 0 | Every reported package/plugin root has `FAIL=0`; CLI baseline `WARN=62 INFO=1`. | Dependency checks passed with warning-only catalog census. |
| `quality:gate` | PASS, exit 0 | Scanner findings 0; allowances 7; coverage 37/37 workspace members and 35 publishable members. | Includes a second green `arch:check`. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| `scaffold.runtime` merge-head run | FAIL, exit 1 | 23 gates passed, resource gate failed, cleanup passed | Exposed the UI data-screen ordering prerequisite; fixed in `a2366577`. |
| `scaffold.runtime` exact-head run | INFRA FAIL, exit 1 | 42 passed, 1 failed (`runtime.aspire-start`), cleanup passed | All #1354/resource/generated-project gates passed; Aspire convergence timed out after 300 s. |
| `scaffold.runtime` exact-head retry | INFRA FAIL, exit 1 | 42 passed, 1 failed (`runtime.aspire-start`), cleanup passed | Same shared-host DCP proxy mismatch; healthy backing containers, divergent advertised/mapped ports. Isolated hosted receipt pending. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| generated guidance/resource acceptance | PASS | focused structured tests: 68/68 plus exact-head runtime prefix | Runtime proved first write, zero-write rerun, UI ordering, and generated project check/lint/fmt before the later Aspire infrastructure timeout. |
| stock-init resource command | PASS, exit 0 | sqlite init + service generation + database codegen + exact `generate resource people --client users --procedure list --partial --app cycle2-proof-web` twice | First stdout: `Resource slice applied: 11 written, 0 skipped, 0 conflicts.` Rerun stdout: `Resource slice applied: 0 written, 11 skipped, 0 conflicts.` |

## Handoff Notes

- Inspect the two stable IDs, the `people` command arrays, direct `RUNTIME_GATES` selection, codegen/contract/resource materialized order, and identical guidance sentence first.
- PR #1891 supplied the minimal plan amendment; the authorized item-8 fix is green in both focused and full-suite coverage.
- An isolated hosted `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` PASS remains required because both exact-head shared-host runs reached all #1354 gates but timed out later at Aspire startup.
- PR #1958 must be retargeted from the now-merged Slice F branch to `main`; lifecycle remains implementation/evaluation until isolated hosted proof and fresh IMPL-EVAL pass.
