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
| 2 | Align the hosted browser/runtime tail with the neutral init resource and generated `people` route; close the missing app-root negative case | focused resource/probe/command tests; both hosted runtime tiers; fresh IMPL-EVAL | five owner-authorized existing product files, one existing Slice G test, and this run directory |

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
| 2026-09-03 | G | fresh IMPL-EVAL cycle 3 | The requested native Fable 5 medium route failed before a turn (`unrecognized_model`/HTTP 404); a fresh lane-policy fallback session used Claude transport/OpenRouter `z-ai/glm-5.3-flash` at max effort and returned `PASS_IMPL` for evidence head `0cc736365`. Exact route facts are recorded in `evaluate.md`. |
| 2026-09-03 | G | isolated hosted acceptance | GitHub Actions run `33717890456` and its failed-jobs retry passed both resource gates, generated check/lint/fmt, runtime startup, and cleanup on PostgreSQL and SQLite. Both tiers exited 1 only at the later stale `behavior.app-reference` users-preview assertion: retry totals PostgreSQL 89/1, SQLite 84/1. The owning probe is outside the eight-file ceiling, so lifecycle remains blocked. |
| 2026-09-03 | G | final issue acceptance audit | Ten implementation checkboxes have direct test/hosted evidence. The generator-specific missing-app-root negative test and the complete exit-0 hosted gate remain unproved, so #1354 stays open and PR #1958 keeps `Refs #1354` / `status:impl-eval`. |
| 2026-09-03 | G | OS-restart hosted diagnosis | Retrieved complete run `33719217078` logs: PostgreSQL job `100534800206` was 89/1 and SQLite job `100534800209` was 84/1; both failed only at the same retired `/examples/users?preview=loading` marker. Git history proves the probe predates Slice F while Slice F removed its showcase renderer and explicitly assigned hosted acceptance to Slice G. |
| 2026-09-03 | G | owner-authorized acceptance amendment | Expanded the final ceiling to eleven existing product files: probe neutral `/examples/users` and generated `/people`, pin resource rerun before the browser gate, and add the generator-specific unresolved-app-root zero-write regression. Initial focused wrapper passes 48/48; lint passes 11/11 and format passes after one mechanical formatting correction. No host runtime was started. |
| 2026-09-03 | G | changed-head Tier A | At `8341c0743`, focused tests passed 79/79, full CLI passed 1789/1789, structured check covered 1004 files with 0 diagnostics, lint/fmt passed 11/11, all carrier/docs gates passed, `arch:check` reported `FAIL=0`, and `quality:gate` exited 0 with 0 scanner findings. |
| 2026-09-03 | G | changed-head hosted diagnosis | Run `33731170586` proved the prior correction: `behavior.app-reference` passed in both tiers. PostgreSQL then reported 90/1 and SQLite 85/1; only `behavior.island-served-surface` failed because its pre-Slice-F probe still required `ServiceShowcaseLab` at `/examples/users`. Cleanup passed in both jobs. |
| 2026-09-03 | G | served-island correction | Extended the accepted resource-scope correction to thirteen existing product files. The served-surface gate now probes `/people` and `PeopleIsland`, with semantic tests pinning the marker/module/bundle/receipt contract and excluding the retired showcase identity. Initial correction-focused wrapper passes 8/8. No host runtime was started and the interrupted pre-fix evaluator turn wrote no receipt. |
| 2026-09-03 | G | proactive hosted-tail audit | Canceled pending run `33732473476` before its runtime jobs after source inspection proved the next two gates still depended on the removed Rename showcase. This was not an unchanged runtime rerun: no new runtime result was consumed, and the next dispatch requires a corrected product head. |
| 2026-09-03 | G | hydration/refetch correction | Extended the accepted resource-scope correction to eighteen existing product files. Hydration now requires the `/people` output plus a browser-reachable QueryClient. The existing refetch gate invalidates the active generated `users.list` query and requires exactly one completed 2xx refetch, without changing generator output or reviving the deferred mutation showcase. Focused browser-tail/resource/suite regressions pass 97/97; no host runtime was started. |
| 2026-09-03 | G | current-main convergence | `origin/main` advanced from `e14322c511` to `94fe507af` while the run was active. Committed the acceptance correction, fetched, and merged current main without rebasing in `964d3cdd3`; the merge was clean and the main-relative product delta remained exactly eighteen files with no lock movement. |
| 2026-09-03 | G | doctrine cleanup | The first refetch implementation made `probe-island-hydration.ts` 560 lines and added an A8 size warning. Consolidated the duplicate browser lifecycle and query expressions inside the same accepted file and brought it within the 500-line doctrine cap; focused hydration/service-client tests pass 37/37. No debt exception was added. |
| 2026-09-03 | G | complete-tail hosted diagnosis | Run `33735122923` passed static and `behavior.island-served-surface`, then both tiers failed only at the new hydration observer: SQLite 86/1, PostgreSQL 91/1, cleanup passed. Private Preact graph traversal could not find the QueryClient. Replaced it with the public browser module contract `@netscript/fresh/query#getIslandQueryClient`, required the generated `users.list` cache entry, and kept the refetch on that singleton. No generator/Fresh product code changed. |
| 2026-09-03 | G | public-singleton exact-head gates | At product head `9cba13fec`, focused tests passed 120/120, full CLI passed 1,795/1,795, structured check covered 1,004 files with zero diagnostics, 18-file lint/fmt were clean, `arch:check` returned `FAIL=0` with CLI baseline `WARN=62`, and `quality:gate` returned 0 scanner findings / 7 allowances / 37 workspace members. |
| 2026-09-03 | G | decisive hosted acceptance | Changed-head run `33736497671` completed successfully at evidence head `0e1717dab`: PostgreSQL job `100588348258` passed 103/103 and SQLite job `100588348306` passed 98/98, with zero failures/skips. In both reports the resource first run exited 0 with 11 writes, the identical rerun exited 0 with 11 skips, generated check/lint/fmt passed, the full app-reference/served-surface/hydration/refetch tail passed, and `cleanup.aspire-stop` exited 0. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| `PLAN-EVAL: N/A` | Owner states the plan is locked and evaluated; this author lane implements only its mechanical Slice G. | user brief |
| Resource `people`; client `users`; procedure `list` | Keeps explicit client/procedure selection while avoiding init's existing `appRoutes.users` alias. | IMPL-EVAL cycle 1 stock-init reproduction |
| Execute after database codegen and its service-client contract probe | Procedure resolution imports generated Zod CRUD output; the existing probe must remain immediately adjacent to codegen, so the resource pair follows it and precedes generated quality/type-check gates. | evaluator finding + full-suite invariant |
| Run the full hosted acceptance after the prerequisite merge | The coordinator explicitly superseded the earlier author-lane prohibition and requested exact-head hosted acceptance. | owner resume instruction |
| Resource generation precedes UI data-screen generation | `ui:add data-screen` writes a quoted router key that the intentionally fail-closed resource reconciler will not rewrite. | first live-main hosted run |
| Probe neutral init and generated command resources, not retired preview states | Slice F replaced the init showcase with planner output; `/people` is the resource created by Slice G and must exist before the browser gate. | hosted run `33719217078` + owner resume instruction |
| Add the unresolved-app-root regression in the existing command test | The guard already fails before client/procedure/staging; the command-level fixture can prove the entire in-memory filesystem remains byte-identical with zero writes. | #1354 acceptance audit + owner resume instruction |
| Probe the Slice G `PeopleIsland` served surface | Slice F retired `ServiceShowcaseLab`; the public resource verb creates `/people` and its route-local island before the served-surface gate executes. | hosted run `33731170586` + generated resource plan |
| Prove hydration through the generated resource QueryClient | The neutral planner resource has no Rename control or `data-state` list; its browser-only semantic is a hydrated `QueryIsland` with a reachable QueryClient. | Slice F diff + generated resource template |
| Preserve one-refetch behavior on the generated resource | Explicitly invalidating the active generated `users.list` query retains a meaningful cache/refetch assertion without restoring the deferred mutation showcase. | proactive runtime-tail trace + generated `PeopleIsland` query key |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Captured-stdout reachability required item 8; PR #1891 amended the locked plan and the authorized fixture update is complete. | significant, resolved | yes |
| Slice F's remote branch advanced by three harness-evidence commits after the dispatched baseline; product files are disjoint and the PR still targets that branch. | minor | yes |
| Runtime prerequisites were not traced at design time: codegen output and router-alias ownership both blocked the original gate. | high, resolved | yes |
| Existing service-client order regression requires its contract probe immediately after codegen; the resource pair follows that probe within the same ceiling. | significant, resolved | yes |
| Live-main UI data-screen mutation had to move after the resource pair; runtime prerequisites include prior shared-file mutations. | high, resolved | yes |
| Shared-host Aspire/DCP advertised proxy ports diverged from healthy Docker mappings in two exact-head retries. | infrastructure, superseded by green isolated hosted proof | yes |
| Isolated hosted runtime reached a stale `behavior.app-reference` assertion for retired Slice F preview-state DOM. | high, resolved and hosted | yes |
| Owner-authorized hosted amendment reassigned stale browser/runtime probes to Slice G and expanded the final ceiling to eighteen existing files. | significant, resolved and hosted | yes |
| Final matrix found no generator-specific unresolved-app-root negative test in the merged suite. | acceptance, resolved by command-level zero-write regression and full-suite proof | yes |
| Changed-head hosted run exposed the next pre-Slice-F `ServiceShowcaseLab` served-surface assertion. | significant, resolved and hosted | yes |
| The hydration/refetch gates also encoded `ServiceShowcaseLab` Rename/data-state behavior removed by Slice F. | significant, resolved and hosted | yes |
| Private Preact-object traversal was not a stable QueryClient observation seam. | significant, resolved through the public query-client export and hosted in both tiers | yes |

## Gate Results

### Static Gates

Final local evidence below is from product head
`2f0807f254d57a45c690a7b372efd73fd75be008`, after the no-rebase merge of current main. Historical
rows remain below it to preserve earlier receipts.

The later public-singleton observer correction at product head `9cba13fec` was re-proven
proportionally: focused 120/120, full CLI 1,795/1,795, check 1,004 files / 0 diagnostics, lint/fmt
18/18 clean, `arch:check` exit 0 (`FAIL=0`, CLI `WARN=62 INFO=1`), and `quality:gate` exit 0
(0 findings, 7 allowances, 37/37 members, 35 publishable).

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| final focused regressions | structured wrapper over resource, browser-tail, suite reachability/registry/runner, guidance, and app-root tests | PASS, exit 0 | 119 passed, 0 failed, 0 ignored. |
| final full CLI unit suite | structured test wrapper with `TMPDIR=/var/tmp` | PASS, exit 0 | 1,794 passed, 0 failed, 0 ignored. |
| final CLI check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS, exit 0 | 1,004 files, 9 batches, 0 failed batches, 0 diagnostics. |
| final authorized-file lint | structured lint wrapper with no-exclusion config | PASS, exit 0 | 18 selected/processed, 0 findings/refusals. |
| final authorized-file format | structured fmt wrapper with no-exclusion config | PASS, exit 0 | 18 selected/processed, 0 findings/refusals. |
| final `check:assets-barrel` | repository task | PASS, exit 0 | Regeneration left no carrier diff. |
| final `check:publish-assets` | repository task | PASS, exit 0 | Publish-asset freshness passed. |
| final `check:emitted-samples` | repository task | PASS, exit 0 | 48 TypeScript samples from 38 artifact paths. |
| final `check:mcp-export-corpus` | repository task | PASS, exit 0 | 35 packages / 273 subpaths / 7,846 symbols; SHA-256 `ddbc949e…`. |
| final CLI JSR audit | `audit-jsr-package.ts --root packages/cli --text` | PASS, exit 0 | 1,004 files / 134,492 LOC / 280 test files; dry-run OK; 21 existing WARN findings, 0 FAIL. |
| final CLI doc lint | structured full-export-map doc lint | PASS, exit 0 | 3 entrypoints, 0 diagnostics. |
| final CLI publish dry-run | `deno task --cwd packages/cli publish:dry-run` | PASS, exit 0 | Existing dynamic-resolution warnings only; `Success Dry run complete`. |
| final `docs:readme-fences` | repository task | PASS, exit 0 | 36 READMEs, 169 fences, 74 checked; 7 expected type errors, no unattributed failure. |
| final `docs:jsdoc-examples` | repository task | PASS, exit 0 | 35 members, 2,060 files, 359 checked, 0 failures; `unboundName=116`, `typeError=14`. |

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

At product head `2f0807f254d57a45c690a7b372efd73fd75be008`, `arch:check` passed with
`FAIL=0` for every root and CLI `WARN=62 INFO=1` (the new probe-size warning was eliminated).
`quality:gate` passed with 0 scanner findings, 7 allowances, 37/37 workspace members in boundary,
and 35 publishable members.

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
| isolated hosted `scaffold.runtime` (PostgreSQL), original | FAIL, exit 1 | 89 passed, 1 failed (`behavior.app-reference`), cleanup passed | Resource first run/rerun and generated check/lint/fmt passed; browser probe expected retired users-preview `data-state="loading"`. |
| isolated hosted `scaffold.runtime.sqlite`, original | FAIL, exit 1 | 84 passed, 1 failed (`behavior.app-reference`), cleanup passed | Same deterministic browser assertion; resource and generated quality gates passed. |
| isolated hosted failed-jobs retry (PostgreSQL) | FAIL, exit 1 | 89 passed, 1 failed (`behavior.app-reference`), cleanup passed | Job `100532599146`; same exact failure after 24.17 s in the browser probe. |
| isolated hosted failed-jobs retry (SQLite) | FAIL, exit 1 | 84 passed, 1 failed (`behavior.app-reference`), cleanup passed | Job `100532599296`; same exact failure after 25.59 s in the browser probe. |
| changed-head hosted `scaffold.runtime` (PostgreSQL) | FAIL, exit 1 | 90 passed, 1 failed (`behavior.island-served-surface`), cleanup passed | Run `33731170586`, job `100571302293`; `behavior.app-reference` passed, then the served-surface probe required retired `ServiceShowcaseLab`. |
| changed-head hosted `scaffold.runtime.sqlite` | FAIL, exit 1 | 85 passed, 1 failed (`behavior.island-served-surface`), cleanup passed | Run `33731170586`, job `100571302333`; same decisive error; all preceding resource/generated/runtime/browser gates passed. |
| superseded pending hosted run | CANCELED before runtime | Run `33732473476` | Proactive source trace found deterministic stale hydration/refetch assertions; no unchanged failing-head runtime rerun was consumed. |
| first complete-tail hosted run (SQLite) | FAIL, exit 1 | 86 passed, 1 failed (`behavior.island-hydration`), cleanup passed | Run `33735122923`, job `100583852710`; served surface passed, private QueryClient traversal timed out. |
| first complete-tail hosted run (PostgreSQL) | FAIL, exit 1 | 91 passed, 1 failed (`behavior.island-hydration`), cleanup passed | Run `33735122923`, job `100583852866`; same acceptance-observer failure. |
| decisive hosted `scaffold.runtime` (PostgreSQL) | PASS, exit 0 | 103 passed, 0 failed, 0 skipped; cleanup exit 0 | Run `33736497671`, job `100588348258`; 11-write first run, identical 11-skip rerun, generated check/lint/fmt, app reference, served island, hydration, and one-refetch tail all passed. |
| decisive hosted `scaffold.runtime.sqlite` | PASS, exit 0 | 98 passed, 0 failed, 0 skipped; cleanup exit 0 | Run `33736497671`, job `100588348306`; same complete resource/generated/browser proof on SQLite/Garnet. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| generated guidance/resource acceptance | PASS | focused structured tests: 120/120 plus green two-tier hosted run `33736497671` | Runtime proved first write, zero-write rerun, UI ordering, generated project check/lint/fmt, browser hydration/refetch, and cleanup. |
| stock-init resource command | PASS, exit 0 | sqlite init + service generation + database codegen + exact `generate resource people --client users --procedure list --partial --app cycle2-proof-web` twice | First stdout: `Resource slice applied: 11 written, 0 skipped, 0 conflicts.` Rerun stdout: `Resource slice applied: 0 written, 11 skipped, 0 conflicts.` |

### Fresh IMPL-EVAL cycle 4

The fresh separate-session evaluator completed at evidence head
`0e1717dab754a84229b02eee8143138cd4f60fa9` and product head
`9cba13fec997ed4839e95940a4ddc5f0d01ab3ae` with **`PASS_IMPL_WITH_FINDINGS`** (harness class
`PASS`). The observed route was Claude Code transport through OpenRouter using
`z-ai/glm-5.3-flash`; the run's lane-policy binding records `max` effort, which the evaluator could
not independently attest from inside the session. Its independent gates all exited 0: focused
68/68 plus 35/35, full CLI 1,795/1,795, structured check 1,004 files / 0 diagnostics, lint/fmt
18/18 clean, `arch:check` every `FAIL=0`, `quality:gate` green, and review threads 0/0. It
re-downloaded both hosted artifacts and SHA-256 matched them to the local receipts. Its two findings
are informational and non-blocking: a retired pre-existing browser helper remains dead code outside
the accepted ceiling, and the PR body still had the expected pre-verdict pending language. The
verdict authorizes acceptance/body synchronization and `status:ready-merge`, not merging.

### Acceptance synchronization

Issue #1354 now has all 12 acceptance boxes checked and an evidence section naming the unresolved
app-root zero-write regression, hosted run `33736497671`, both raw job totals, exact first-run/rerun
stdout, and fresh cycle-4 evaluator verdict. The issue remains open. Issue #1354 and PR #1958 were
advanced from `status:impl-eval` to `status:ready-merge`; PR #1958 remains open, non-draft, based on
`main`, and uses `Refs #1354`. The final evidence-only push must not consume another unchanged-product
runtime run.

## Handoff Notes

- Inspect the two stable IDs, the `people` command arrays, direct `RUNTIME_GATES` selection, codegen/contract/resource materialized order, and identical guidance sentence first.
- PR #1891 supplied the minimal plan amendment; the authorized item-8 fix is green in both focused and full-suite coverage.
- PR #1958 targets `main`; the corrected eighteen-file head has green exact-head Tier A, green
  two-tier hosted acceptance, and a fresh cycle-4 evaluator PASS. Acceptance/lifecycle metadata is
  synchronized; the final receipt push and close-gate verification remain.
- Do not merge; human merge remains the next lifecycle action after the final close-gate.
